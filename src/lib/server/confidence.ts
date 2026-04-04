import { json } from '@sveltejs/kit';
import type {
	AIError,
	ConfidenceCacheKey,
	ConfidencePayload
} from '$lib/types/confidence';

export const CONFIDENCE_MODEL = 'gpt-5.4-mini';
export const CONFIDENCE_PROMPT_VERSION = 'confidence-v1';

const CONFIDENCE_CACHE = new Map<ConfidenceCacheKey, ConfidencePayload>();

const QUERY_STOP_WORDS = new Set([
	'a',
	'an',
	'and',
	'car',
	'cars',
	'first',
	'for',
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

export function normalizeString(value: unknown): string | null {
	if (typeof value !== 'string' && !(value instanceof String)) return null;

	const normalized = value
		.toString()
		.replace(/\s+/g, ' ')
		.trim();

	return normalized.length ? normalized : null;
}

export function normalizeStringArray(values: unknown[]): string[] {
	return Array.from(
		new Set(values.map((value) => normalizeString(value)).filter((value): value is string => Boolean(value)))
	);
}

export function normalizeOptionalQuery(query: string | null | undefined): string | null {
	if (!query) return null;

	const normalized = query
		.normalize('NFKC')
		.replace(/\s+/g, ' ')
		.trim();

	return normalized.length ? normalized : null;
}

export function buildConfidenceCacheKey(
	listingId: string,
	query: string | null
): ConfidenceCacheKey {
	return [
		'confidence',
		CONFIDENCE_PROMPT_VERSION,
		CONFIDENCE_MODEL,
		listingId,
		query ? serializeQuerySemantics(query) : 'q:none'
	].join(':');
}

export function getCachedConfidenceAnalysis(
	listingId: string,
	query: string | null
): ConfidencePayload | null {
	return CONFIDENCE_CACHE.get(buildConfidenceCacheKey(listingId, query)) ?? null;
}

export function setCachedConfidenceAnalysis(
	listingId: string,
	query: string | null,
	analysis: ConfidencePayload
): void {
	CONFIDENCE_CACHE.set(buildConfidenceCacheKey(listingId, query), analysis);
}

export function serializeQuerySemantics(query: string): string {
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

export function errorResponse(
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
