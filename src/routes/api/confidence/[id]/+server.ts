import OpenAI from 'openai';
import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getListing } from '$lib/api';
import type {
	AIError,
	ConfidenceCacheKey,
	ConfidencePayload,
	ConfidenceResponse
} from '$lib/types/confidence';
import type { Listing } from '$lib/types/listing';

const MODEL = 'gpt-5.4-mini';
const PROMPT_VERSION = 'confidence-v1';
const CACHE = new Map<ConfidenceCacheKey, ConfidencePayload>();

const QUERY_STOP_WORDS = new Set([
	'a',
	'an',
	'and',
	'car',
	'cars',
	'for',
	'first',
	'me',
	'my',
	'of',
	'or',
	'reliable',
	'the',
	'to',
	'under',
	'with'
]);

const QUERY_ALIASES: Record<string, string> = {
	sedans: 'sedan',
	suvs: 'suv',
	trucks: 'truck',
	evs: 'ev'
};

const CONFIDENCE_SCHEMA = {
	name: 'confidence_analysis',
	strict: true,
	schema: {
		type: 'object',
		additionalProperties: false,
		properties: {
			knownIssues: {
				type: 'array',
				items: { type: 'string' }
			},
			priceVerdict: {
				type: 'object',
				additionalProperties: false,
				properties: {
					label: {
						type: 'string',
						enum: ['below_market', 'fair', 'above_market']
					},
					reasoning: {
						type: 'string'
					}
				},
				required: ['label', 'reasoning']
			},
			questionsToAsk: {
				type: 'array',
				items: { type: 'string' }
			},
			buyerIntent: {
				type: ['string', 'null']
			}
		},
		required: ['knownIssues', 'priceVerdict', 'questionsToAsk', 'buyerIntent']
	}
} as const;

const openai = () => new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const GET: RequestHandler = async ({ params, url }) => {
	const listingId = params.id?.trim();
	if (!listingId) {
		return errorResponse(
			400,
			'invalid_request',
			'A valid listing ID is required for confidence analysis.'
		);
	}

	const listing = await getListing(listingId);
	if (!listing) {
		return errorResponse(404, 'listing_not_found', 'Listing not found.');
	}

	if (!env.OPENAI_API_KEY) {
		return errorResponse(
			503,
			'missing_api_key',
			'AI analysis is unavailable because the server is not configured with an OpenAI API key.'
		);
	}

	const query = normalizeOptionalQuery(url.searchParams.get('q'));
	const cacheKey = buildCacheKey(listingId, query);
	const cached = CACHE.get(cacheKey);

	if (cached) {
		return json(successResponse(listing, cached, true));
	}

	try {
		const completion = await openai().chat.completions.create({
			model: MODEL,
			temperature: 0.3,
			response_format: {
				type: 'json_schema',
				json_schema: CONFIDENCE_SCHEMA
			},
			messages: [
				{
					role: 'system',
					content: buildSystemPrompt()
				},
				{
					role: 'user',
					content: buildUserPrompt(listing, query)
				}
			]
		});

		const rawContent = completion.choices[0]?.message?.content;
		if (!rawContent) {
			return errorResponse(
				502,
				'invalid_model_response',
				'AI analysis returned an invalid response.'
			);
		}

		const parsed = parseConfidencePayload(rawContent, listingId, query);
		if (!parsed) {
			return errorResponse(
				502,
				'invalid_model_response',
				'AI analysis returned an invalid response.'
			);
		}

		CACHE.set(cacheKey, parsed);

		return json(successResponse(listing, parsed, false));
	} catch (error) {
		console.error('Confidence generation failed', {
			listingId,
			cacheKey,
			model: MODEL,
			error
		});

		return errorResponse(
			502,
			'generation_failed',
			'AI analysis could not be generated right now. Please try again.'
		);
	}
};

function buildSystemPrompt(): string {
	return [
		'You are generating buyer-facing used vehicle due diligence summaries.',
		'Return JSON only and follow the schema exactly.',
		'Ground every point in the listing facts plus common used-car risk patterns for this vehicle.',
		'Known issues should be concise, specific, and practical.',
		'Price reasoning should compare the ask against the market average and condition.',
		'Questions to ask should be concrete and seller-ready, not generic filler.',
		'If buyer intent is present, reflect it briefly without ignoring general due diligence.'
	].join(' ');
}

function buildUserPrompt(listing: Listing, query: string | null): string {
	return JSON.stringify(
		{
			task: 'Generate a normalized confidence analysis for a used vehicle listing.',
			outputRequirements: {
				knownIssues:
					'2 to 5 concise bullet-style strings about likely reliability, condition, title/history, maintenance, or seller-transparency concerns.',
				priceVerdict:
					'Choose below_market, fair, or above_market based on the ask, marketAverage, condition, mileage, and listing details.',
				questionsToAsk:
					'Provide 4 to 6 highly specific seller questions tailored to this listing.',
				buyerIntent:
					query
						? 'Optional short phrase summarizing what this buyer likely cares about.'
						: 'Return null.'
			},
			buyerQuery: query,
			listing: {
				id: listing.id,
				title: listing.title,
				year: listing.year,
				make: listing.make,
				model: listing.model,
				trim: listing.trim,
				price: listing.price,
				marketAverage: listing.marketAverage,
				mileage: listing.mileage,
				condition: listing.condition,
				transmission: listing.transmission,
				drivetrain: listing.drivetrain,
				description: listing.description,
				location: listing.location,
				sellerType: listing.seller.type,
				sellerFeedbackScore: listing.seller.feedbackScore,
				sellerFeedbackPercent: listing.seller.feedbackPercent,
				sellerMemberSince: listing.seller.memberSince
			}
		},
		null,
		2
	);
}

function parseConfidencePayload(
	rawContent: string,
	listingId: string,
	query: string | null
): ConfidencePayload | null {
	try {
		const parsed = JSON.parse(rawContent);
		if (!isConfidenceModelShape(parsed)) {
			return null;
		}

		const knownIssues = normalizeStringArray(parsed.knownIssues);
		const questionsToAsk = normalizeStringArray(parsed.questionsToAsk);
		const reasoning = normalizeString(parsed.priceVerdict.reasoning);
		const buyerIntent = normalizeOptionalQuery(parsed.buyerIntent);

		if (!knownIssues.length || !questionsToAsk.length || !reasoning) {
			return null;
		}

		return {
			listingId,
			query,
			...(buyerIntent ? { buyerIntent } : {}),
			knownIssues,
			priceVerdict: {
				label: parsed.priceVerdict.label,
				reasoning
			},
			questionsToAsk
		};
	} catch {
		return null;
	}
}

function isConfidenceModelShape(value: unknown): value is {
	knownIssues: unknown[];
	priceVerdict: { label: ConfidencePayload['priceVerdict']['label']; reasoning: string };
	questionsToAsk: unknown[];
	buyerIntent: string | null;
} {
	if (!value || typeof value !== 'object') return false;

	const candidate = value as Record<string, unknown>;
	if (!Array.isArray(candidate.knownIssues) || !Array.isArray(candidate.questionsToAsk)) {
		return false;
	}

	if (!candidate.priceVerdict || typeof candidate.priceVerdict !== 'object') {
		return false;
	}

	const verdict = candidate.priceVerdict as Record<string, unknown>;

	return (
		(verdict.label === 'below_market' ||
			verdict.label === 'fair' ||
			verdict.label === 'above_market') &&
		(typeof verdict.reasoning === 'string' || verdict.reasoning instanceof String) &&
		(candidate.buyerIntent === null ||
			typeof candidate.buyerIntent === 'string' ||
			candidate.buyerIntent instanceof String)
	);
}

function normalizeStringArray(values: unknown[]): string[] {
	return Array.from(
		new Set(values.map((value) => normalizeString(value)).filter((value): value is string => Boolean(value)))
	);
}

function normalizeString(value: unknown): string | null {
	if (typeof value !== 'string' && !(value instanceof String)) return null;

	const normalized = value
		.toString()
		.replace(/\s+/g, ' ')
		.trim();

	return normalized.length ? normalized : null;
}

function normalizeOptionalQuery(query: string | null | undefined): string | null {
	if (!query) return null;

	const normalized = query
		.normalize('NFKC')
		.replace(/\s+/g, ' ')
		.trim();

	return normalized.length ? normalized : null;
}

function buildCacheKey(listingId: string, query: string | null): ConfidenceCacheKey {
	return [
		'confidence',
		PROMPT_VERSION,
		MODEL,
		listingId,
		query ? serializeQuerySemantics(query) : 'q:none'
	].join(':');
}

function serializeQuerySemantics(query: string): string {
	const lowered = query.toLowerCase();
	const maxPrice = extractMaxPrice(lowered);
	const lowMileage = /\blow\s+mileage\b/.test(lowered);
	const normalizedTerms = Array.from(
		new Set(
			lowered
				.replace(/[^a-z0-9$\s]/g, ' ')
				.split(/\s+/)
				.map((token) => QUERY_ALIASES[token] ?? token)
				.filter((token) => token && !QUERY_STOP_WORDS.has(token))
		)
	).sort();

	return JSON.stringify({
		maxPrice,
		lowMileage,
		terms: normalizedTerms
	});
}

function extractMaxPrice(query: string): number | null {
	const match = query.match(/under\s+\$(\d{1,3})(?:,?(\d{3}))?\s*(k)?/i);
	if (!match) return null;

	const whole = match[1];
	const suffix = match[2] ?? '';
	let value = Number.parseInt(`${whole}${suffix}`, 10);

	if (match[3] && value < 1000) {
		value *= 1000;
	}

	return Number.isFinite(value) ? value : null;
}

function successResponse(
	listing: Listing,
	analysis: ConfidencePayload,
	cacheHit: boolean
): ConfidenceResponse {
	return {
		ok: true,
		cacheHit,
		listing: {
			id: listing.id,
			title: listing.title,
			year: listing.year,
			make: listing.make,
			model: listing.model,
			trim: listing.trim,
			price: listing.price,
			marketAverage: listing.marketAverage,
			condition: listing.condition,
			seller: listing.seller
		},
		analysis
	};
}

function errorResponse(
	status: number,
	code: AIError['error']['code'],
	message: string
) {
	return json(
		{
			ok: false,
			error: {
				code,
				message
			}
		} satisfies AIError,
		{ status }
	);
}
