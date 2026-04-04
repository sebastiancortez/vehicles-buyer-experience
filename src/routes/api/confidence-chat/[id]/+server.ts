import { createHash, randomUUID } from 'node:crypto';
import OpenAI from 'openai';
import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getListing } from '$lib/api';
import {
	CONFIDENCE_MODEL,
	errorResponse,
	getCachedConfidenceAnalysis,
	normalizeOptionalQuery,
	normalizeString,
	normalizeStringArray,
	serializeQuerySemantics
} from '$lib/server/confidence';
import type {
	ConfidenceChatMessage,
	ConfidenceChatRequest,
	ConfidenceChatResponse,
	ConfidencePayload
} from '$lib/types/confidence';
import type { Listing } from '$lib/types/listing';

const MODEL = CONFIDENCE_MODEL;
const PROMPT_VERSION = 'confidence-chat-v1';
const CHAT_CACHE = new Map<string, CachedChatResponse>();
const MAX_THREAD_MESSAGES = 8;
const MAX_SUGGESTED_PROMPTS = 3;

const CHAT_SCHEMA = {
	name: 'confidence_chat_response',
	strict: true,
	schema: {
		type: 'object',
		additionalProperties: false,
		properties: {
			answer: {
				type: 'string'
			},
			suggestedPrompts: {
				type: ['array', 'null'],
				items: {
					type: 'string'
				}
			}
		},
		required: ['answer', 'suggestedPrompts']
	}
} as const;

type CachedChatResponse = {
	content: string;
	suggestedPrompts?: string[];
};

type ParsedChatRequest = {
	listingId: string;
	query: string | null;
	messages: ConfidenceChatMessage[];
};

const openai = () => new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const POST: RequestHandler = async ({ params, request }) => {
	const routeListingId = normalizeOptionalQuery(params.id);
	if (!routeListingId) {
		return errorResponse(400, 'invalid_request', 'A valid listing ID is required for confidence chat.');
	}

	const parsedRequest = await parseRequestBody(request);
	if (!parsedRequest) {
		return errorResponse(
			400,
			'invalid_request',
			'Confidence chat requests must include a matching listing ID and recent messages.'
		);
	}

	if (parsedRequest.listingId !== routeListingId) {
		return errorResponse(
			400,
			'invalid_request',
			'Route listing ID must match the request body listingId.'
		);
	}

	const listing = await getListing(parsedRequest.listingId);
	if (!listing) {
		return errorResponse(404, 'listing_not_found', 'Listing not found.');
	}

	if (!env.OPENAI_API_KEY) {
		return errorResponse(
			503,
			'missing_api_key',
			'Listing Q&A is unavailable because the server is not configured with an OpenAI API key.'
		);
	}

	const recentMessages = trimRecentMessages(parsedRequest.messages);
	const cacheKey = buildChatCacheKey(parsedRequest.listingId, parsedRequest.query, recentMessages);
	const cached = CHAT_CACHE.get(cacheKey);

	if (cached) {
		return json(successResponse(parsedRequest.listingId, cached, true));
	}

	const confidenceContext = getCachedConfidenceAnalysis(parsedRequest.listingId, parsedRequest.query);

	try {
		const completion = await openai().chat.completions.create({
			model: MODEL,
			temperature: 0.4,
			response_format: {
				type: 'json_schema',
				json_schema: CHAT_SCHEMA
			},
			messages: [
				{
					role: 'system',
					content: buildSystemPrompt()
				},
				{
					role: 'user',
					content: buildUserPrompt(listing, parsedRequest.query, recentMessages, confidenceContext)
				}
			]
		});

		const rawContent = completion.choices[0]?.message?.content;
		if (!rawContent) {
			return errorResponse(
				502,
				'invalid_model_response',
				'Listing Q&A returned an invalid response.'
			);
		}

		const normalized = parseChatResponse(rawContent, recentMessages);
		if (!normalized) {
			return errorResponse(
				502,
				'invalid_model_response',
				'Listing Q&A returned an invalid response.'
			);
		}

		CHAT_CACHE.set(cacheKey, normalized);

		return json(successResponse(parsedRequest.listingId, normalized, false));
	} catch (error) {
		console.error('Confidence chat generation failed', {
			listingId: parsedRequest.listingId,
			cacheKey,
			model: MODEL,
			error
		});

		return errorResponse(
			502,
			'generation_failed',
			'Listing Q&A could not be generated right now. Please try again.'
		);
	}
};

function buildSystemPrompt(): string {
	return [
		'You answer follow-up questions about a specific used vehicle listing.',
		'Return JSON only and follow the schema exactly.',
		'Answer the buyer question first and keep the response concise enough for a drawer UI.',
		'Ground the answer in listing facts and confidence analysis when provided.',
		'Do not invent inspection results, accident history, maintenance proof, or seller statements that are not present in the inputs.',
		'If evidence is limited, say what is unknown and what the buyer should verify.',
		'Frame the answer as guidance, not a mechanic inspection or guarantee.',
		'Suggested prompts should be short, useful next questions and should not repeat the buyer message verbatim.'
	].join(' ');
}

function buildUserPrompt(
	listing: Listing,
	query: string | null,
	messages: ConfidenceChatMessage[],
	confidenceContext: ConfidencePayload | null
): string {
	return JSON.stringify(
		{
			task: 'Answer the latest buyer follow-up question about this listing.',
			outputRequirements: {
				answer:
					'One short, direct answer grounded in the listing and any confidence context. Two short paragraphs or a compact list at most.',
				suggestedPrompts:
					'Return 2 to 3 short next-turn questions when there are clear useful follow-ups. Return null if there are no strong suggestions.'
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
				priceBadge: listing.priceBadge,
				mileage: listing.mileage,
				mileageBadge: listing.mileageBadge,
				condition: listing.condition,
				transmission: listing.transmission,
				drivetrain: listing.drivetrain,
				color: listing.color,
				description: listing.description,
				location: listing.location,
				seller: {
					type: listing.seller.type,
					feedbackScore: listing.seller.feedbackScore,
					feedbackPercent: listing.seller.feedbackPercent,
					location: listing.seller.location,
					memberSince: listing.seller.memberSince
				}
			},
			confidenceContext: confidenceContext
				? {
						buyerIntent: confidenceContext.buyerIntent ?? null,
						knownIssues: confidenceContext.knownIssues,
						priceVerdict: confidenceContext.priceVerdict,
						questionsToAsk: confidenceContext.questionsToAsk
					}
				: null,
			recentMessages: messages.map((message) => ({
				role: message.role,
				content: message.content
			}))
		},
		null,
		2
	);
}

async function parseRequestBody(request: Request): Promise<ParsedChatRequest | null> {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return null;
	}

	if (!body || typeof body !== 'object') return null;

	const candidate = body as Partial<ConfidenceChatRequest> & Record<string, unknown>;
	const listingId = normalizeOptionalQuery(candidate.listingId as string | null | undefined);
	if (!listingId || !Array.isArray(candidate.messages)) {
		return null;
	}

	const messages = candidate.messages
		.map((message) => parseChatMessage(message))
		.filter((message): message is ConfidenceChatMessage => Boolean(message));

	if (!messages.length || !messages.some((message) => message.role === 'user')) {
		return null;
	}

	return {
		listingId,
		query: normalizeOptionalQuery(
			typeof candidate.query === 'string' || candidate.query === null
				? candidate.query
				: undefined
		),
		messages
	};
}

function parseChatMessage(value: unknown): ConfidenceChatMessage | null {
	if (!value || typeof value !== 'object') return null;

	const candidate = value as Record<string, unknown>;
	const id = normalizeString(candidate.id);
	const content = normalizeString(candidate.content);
	const createdAt = normalizeString(candidate.createdAt);
	const role = candidate.role === 'user' || candidate.role === 'assistant' ? candidate.role : null;

	if (!id || !content || !createdAt || !role) {
		return null;
	}

	if (Number.isNaN(Date.parse(createdAt))) {
		return null;
	}

	return {
		id,
		role,
		content,
		createdAt
	};
}

function trimRecentMessages(messages: ConfidenceChatMessage[]): ConfidenceChatMessage[] {
	return messages.slice(-MAX_THREAD_MESSAGES);
}

function parseChatResponse(
	rawContent: string,
	messages: ConfidenceChatMessage[]
): CachedChatResponse | null {
	try {
		const parsed = JSON.parse(rawContent);
		if (!isChatModelShape(parsed)) {
			return null;
		}

		const content = normalizeString(parsed.answer);
		if (!content) {
			return null;
		}

		const lastUserMessage = getLastUserMessageContent(messages);
		const suggestedPrompts = Array.isArray(parsed.suggestedPrompts)
			? normalizeStringArray(parsed.suggestedPrompts)
					.filter((prompt) => prompt !== lastUserMessage)
					.slice(0, MAX_SUGGESTED_PROMPTS)
			: [];

		return {
			content,
			...(suggestedPrompts.length ? { suggestedPrompts } : {})
		};
	} catch {
		return null;
	}
}

function isChatModelShape(value: unknown): value is { answer: unknown; suggestedPrompts: unknown[] | null } {
	if (!value || typeof value !== 'object') return false;

	const candidate = value as Record<string, unknown>;

	return (
		(typeof candidate.answer === 'string' || candidate.answer instanceof String) &&
		(candidate.suggestedPrompts === null || Array.isArray(candidate.suggestedPrompts))
	);
}

function buildChatCacheKey(
	listingId: string,
	query: string | null,
	messages: ConfidenceChatMessage[]
): string {
	return [
		'confidence-chat',
		PROMPT_VERSION,
		MODEL,
		listingId,
		query ? serializeQuerySemantics(query) : 'q:none',
		createMessageDigest(messages)
	].join(':');
}

function createMessageDigest(messages: ConfidenceChatMessage[]): string {
	return createHash('sha256')
		.update(
			JSON.stringify(
				messages.map((message) => ({
					role: message.role,
					content: message.content
				}))
			)
		)
		.digest('hex')
		.slice(0, 16);
}

function getLastUserMessageContent(messages: ConfidenceChatMessage[]): string | null {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		if (messages[index]?.role === 'user') {
			return messages[index].content;
		}
	}

	return null;
}

function successResponse(
	listingId: string,
	response: CachedChatResponse,
	cacheHit: boolean
): ConfidenceChatResponse {
	return {
		ok: true,
		cacheHit,
		listingId,
		message: {
			id: randomUUID(),
			role: 'assistant',
			content: response.content,
			createdAt: new Date().toISOString()
		},
		...(response.suggestedPrompts ? { suggestedPrompts: response.suggestedPrompts } : {})
	};
}
