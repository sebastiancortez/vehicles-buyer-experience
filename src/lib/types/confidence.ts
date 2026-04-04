import type { Listing } from './listing';

export type ConfidenceVerdictLabel = 'below_market' | 'fair' | 'above_market';

export interface ConfidencePriceVerdict {
	label: ConfidenceVerdictLabel;
	reasoning: string;
}

export interface ConfidencePayload {
	listingId: string;
	query: string | null;
	buyerIntent?: string;
	knownIssues: string[];
	priceVerdict: ConfidencePriceVerdict;
	questionsToAsk: string[];
}

export interface ConfidenceResponse {
	ok: true;
	cacheHit: boolean;
	listing: Pick<
		Listing,
		'id' | 'title' | 'year' | 'make' | 'model' | 'trim' | 'price' | 'marketAverage' | 'condition' | 'seller'
	>;
	analysis: ConfidencePayload;
}

export type AIErrorCode =
	| 'missing_api_key'
	| 'invalid_request'
	| 'listing_not_found'
	| 'generation_failed'
	| 'invalid_model_response';

export interface AIError {
	ok: false;
	error: {
		code: AIErrorCode;
		message: string;
	};
}

export interface ConfidenceChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	createdAt: string;
}

export interface ConfidenceChatRequest {
	listingId: string;
	query?: string | null;
	messages: ConfidenceChatMessage[];
}

export interface ConfidenceChatResponse {
	ok: true;
	cacheHit: boolean;
	listingId: string;
	message: ConfidenceChatMessage;
	suggestedPrompts?: string[];
}

export interface ContactDraftContext {
	listingId: string;
	confidence: ConfidencePayload;
	relevantChatSummary?: string;
}

export type ConfidenceCacheKey = string;

