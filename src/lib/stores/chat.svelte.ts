import type { ConfidenceChatMessage } from '$lib/types/confidence';

export interface ChatSession {
	messages: ConfidenceChatMessage[];
	draftText: string;
	suggestedPrompts: string[];
	sending: boolean;
	error: string | null;
}

function createSession(): ChatSession {
	return {
		messages: [],
		draftText: '',
		suggestedPrompts: [],
		sending: false,
		error: null
	};
}

class ChatSessionStore {
	sessions = $state<Record<string, ChatSession>>({});

	get(listingId: string): ChatSession {
		if (!this.sessions[listingId]) {
			this.sessions[listingId] = createSession();
		}
		return this.sessions[listingId];
	}

	addMessage(listingId: string, message: ConfidenceChatMessage) {
		this.get(listingId).messages.push(message);
	}

	setDraft(listingId: string, text: string) {
		this.get(listingId).draftText = text;
	}

	setSending(listingId: string, val: boolean) {
		this.get(listingId).sending = val;
	}

	setError(listingId: string, err: string | null) {
		this.get(listingId).error = err;
	}

	setSuggestedPrompts(listingId: string, prompts: string[]) {
		this.get(listingId).suggestedPrompts = prompts;
	}
}

export const chatSessions = new ChatSessionStore();

export function generateMessageId(): string {
	return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
