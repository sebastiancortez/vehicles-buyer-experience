<script lang="ts">
	import type { Listing } from '$lib/types/listing';
	import type {
		ConfidencePayload,
		ConfidenceChatRequest,
		ConfidenceChatMessage
	} from '$lib/types/confidence';
	import { chatSessions, generateMessageId } from '$lib/stores/chat.svelte';
	import { tick, untrack } from 'svelte';
	import { X, Send, MessageCircleQuestion, RotateCcw, Loader2 } from 'lucide-svelte';

	interface Props {
		open: boolean;
		listing: Listing;
		analysis: ConfidencePayload | null;
		searchQuery?: string;
		onclose: () => void;
	}

	let { open, listing, analysis, searchQuery, onclose }: Props = $props();

	let threadContainer: HTMLDivElement | undefined = $state(undefined);
	let inputRef: HTMLTextAreaElement | undefined = $state(undefined);
	let drawerRef: HTMLDivElement | undefined = $state(undefined);
	let previouslyFocused: HTMLElement | null = null;
	let isMobile = $state(false);

	type DrawerPhase = 'closed' | 'opening' | 'open' | 'closing';
	let phase = $state<DrawerPhase>('closed');

	const inDOM = $derived(phase !== 'closed');
	const isShown = $derived(phase === 'open');

	const session = $derived(chatSessions.get(listing.id));
	const hasMessages = $derived(session.messages.length > 0);

	let localDraft = $state('');

	const defaultStarters = [
		'What are the biggest red flags here?',
		'What should I confirm with the seller?',
		'Is this price justified?'
	];

	const starterPrompts = $derived(
		session.suggestedPrompts.length > 0
			? session.suggestedPrompts
			: analysis
				? contextualPrompts(analysis)
				: defaultStarters
	);

	const verdictMap: Record<string, { label: string; cls: string }> = {
		below_market: {
			label: 'Below Market',
			cls: 'bg-[var(--color-signal-below-bg)] text-[var(--color-signal-below-text)]'
		},
		fair: {
			label: 'Fair Price',
			cls: 'bg-[var(--color-signal-fair-bg)] text-[var(--color-signal-fair-text)]'
		},
		above_market: {
			label: 'Above Market',
			cls: 'bg-[var(--color-signal-above-bg)] text-[var(--color-signal-above-text)]'
		}
	};

	function contextualPrompts(a: ConfidencePayload): string[] {
		const out: string[] = [];
		if (a.knownIssues.length > 0) out.push('What are the biggest red flags here?');
		if (a.priceVerdict.label === 'below_market') out.push('Why is this priced so low?');
		else if (a.priceVerdict.label === 'above_market') out.push('Is this price justified?');
		else out.push('Is there room to negotiate?');
		out.push('Would this work as a daily driver?');
		out.push('What should I confirm with the seller?');
		return out.slice(0, 4);
	}

	$effect(() => {
		const mql = window.matchMedia('(max-width: 1023px)');
		isMobile = mql.matches;
		const handler = (e: MediaQueryListEvent) => {
			isMobile = e.matches;
		};
		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	});

	$effect(() => {
		const id = listing.id;
		untrack(() => {
			localDraft = chatSessions.get(id).draftText;
		});
	});

	$effect(() => {
		const isOpen = open;
		let rafId: number | undefined;
		let timerId: ReturnType<typeof setTimeout> | undefined;

		untrack(() => {
			if (isOpen && (phase === 'closed' || phase === 'closing')) {
				previouslyFocused = document.activeElement as HTMLElement;
				phase = 'opening';
				if (isMobile) document.body.style.overflow = 'hidden';
				rafId = requestAnimationFrame(() => {
					rafId = requestAnimationFrame(() => {
						phase = 'open';
						tick().then(() => inputRef?.focus());
					});
				});
			} else if (!isOpen && (phase === 'open' || phase === 'opening')) {
				phase = 'closing';
				timerId = setTimeout(() => {
					phase = 'closed';
					document.body.style.overflow = '';
					previouslyFocused?.focus();
				}, 380);
			}
		});

		return () => {
			if (rafId !== undefined) cancelAnimationFrame(rafId);
			if (timerId !== undefined) clearTimeout(timerId);
		};
	});

	function handleKeydown(e: KeyboardEvent) {
		if (phase !== 'open') return;
		if (e.key === 'Escape') {
			e.preventDefault();
			onclose();
			return;
		}
		if (e.key === 'Tab' && drawerRef) {
			const focusable = drawerRef.querySelectorAll<HTMLElement>(
				'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			);
			if (focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	function handleDraftInput(e: Event) {
		const val = (e.target as HTMLTextAreaElement).value;
		localDraft = val;
		chatSessions.setDraft(listing.id, val);
	}

	async function sendMessage(text: string) {
		const trimmed = text.trim();
		if (!trimmed || session.sending) return;

		const userMsg: ConfidenceChatMessage = {
			id: generateMessageId(),
			role: 'user',
			content: trimmed,
			createdAt: new Date().toISOString()
		};

		chatSessions.addMessage(listing.id, userMsg);
		localDraft = '';
		chatSessions.setDraft(listing.id, '');
		chatSessions.setError(listing.id, null);
		chatSessions.setSending(listing.id, true);

		await tick();
		scrollToBottom();

		try {
			const payload: ConfidenceChatRequest = {
				listingId: listing.id,
				query: searchQuery || undefined,
				messages: session.messages.slice(-10)
			};

			const res = await fetch(`/api/confidence-chat/${listing.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const err = await res.json().catch(() => null);
				chatSessions.setError(
					listing.id,
					err?.error?.message || 'Something went wrong. Try again.'
				);
				return;
			}

			const data = await res.json();

			if (data.ok) {
				chatSessions.addMessage(listing.id, data.message);
				if (data.suggestedPrompts?.length) {
					chatSessions.setSuggestedPrompts(listing.id, data.suggestedPrompts);
				}
			} else {
				chatSessions.setError(
					listing.id,
					data.error?.message || 'Failed to get a response.'
				);
			}
		} catch {
			chatSessions.setError(listing.id, 'Connection failed. Please try again.');
		} finally {
			chatSessions.setSending(listing.id, false);
			await tick();
			scrollToBottom();
		}
	}

	function handlePromptClick(prompt: string) {
		sendMessage(prompt);
	}

	function handleComposerKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage(localDraft);
		}
	}

	function handleRetry() {
		const lastUser = [...session.messages].reverse().find((m) => m.role === 'user');
		if (lastUser) {
			chatSessions.setError(listing.id, null);
			sendMessage(lastUser.content);
		}
	}

	function scrollToBottom() {
		threadContainer?.scrollTo({ top: threadContainer.scrollHeight, behavior: 'smooth' });
	}

	function splitParagraphs(text: string): string[] {
		return text
			.split(/\n{2,}/)
			.map((p) => p.trim())
			.filter(Boolean);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if inDOM}
	<!-- Backdrop: transparent on desktop (listing stays readable), tinted on mobile -->
	<button
		class="fixed inset-0 z-40 transition-opacity duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] {isShown ? 'opacity-100' : 'opacity-0'}
			{isMobile ? 'drawer-backdrop-mobile' : 'drawer-backdrop-desktop'}"
		onclick={onclose}
		tabindex="-1"
		aria-label="Close drawer"
	></button>

	<!-- Drawer panel -->
	<div
		bind:this={drawerRef}
		role="dialog"
		aria-modal="true"
		aria-label="Ask about this listing"
		class="drawer-panel fixed z-50 flex flex-col bg-[var(--color-surface)] shadow-[0_0_60px_oklch(18%_0.015_258/0.12)]
			{isMobile
			? 'inset-0'
			: 'top-0 right-0 h-full w-[440px] border-l border-[var(--color-border)]'}
			{isMobile
			? isShown
				? 'translate-y-0'
				: 'translate-y-full'
			: isShown
				? 'translate-x-0'
				: 'translate-x-full'}"
	>
		<!-- Header -->
		<header
			class="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] px-5 py-3.5"
		>
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-light)]"
			>
				<MessageCircleQuestion size={15} class="text-[var(--color-primary)]" />
			</div>
			<div class="min-w-0 flex-1">
				<h2
					class="text-[0.84rem] leading-tight font-bold tracking-[-0.01em] text-[var(--color-foreground)]"
				>
					Ask about this listing
				</h2>
				<p class="truncate text-[0.68rem] text-[var(--color-text-tertiary)]">
					{listing.year}
					{listing.make}
					{listing.model}
					{listing.trim}
				</p>
			</div>
			<button
				onclick={onclose}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
				aria-label="Close drawer"
			>
				<X size={16} />
			</button>
		</header>

		<!-- Mobile: compact assessment reference bar -->
		{#if isMobile && analysis}
			{@const v = verdictMap[analysis.priceVerdict.label]}
			<div
				class="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-secondary)]/30 px-5 py-2"
			>
				{#if v}
					<span class="rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold {v.cls}">
						{v.label}
					</span>
				{/if}
				<span class="text-[0.68rem] text-[var(--color-text-tertiary)]">
					{analysis.knownIssues.length} issue{analysis.knownIssues.length !== 1 ? 's' : ''}
				</span>
				<span class="text-[0.68rem] text-[var(--color-text-tertiary)]">
					{analysis.questionsToAsk.length} seller question{analysis.questionsToAsk.length !== 1
						? 's'
						: ''}
				</span>
			</div>
		{/if}

		<!-- Chat thread -->
		<div bind:this={threadContainer} class="flex-1 overflow-y-auto px-5 py-5">
			{#if !hasMessages && !session.sending}
				<!-- Empty state -->
				<div class="flex h-full flex-col items-center justify-center px-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-secondary)]"
					>
						<MessageCircleQuestion size={22} class="text-[var(--color-text-tertiary)]" />
					</div>
					<p
						class="mt-5 max-w-[280px] text-center text-[0.8rem] leading-[1.6] text-[var(--color-text-tertiary)]"
					>
						Ask follow-up questions grounded in this listing{analysis
							? ' and its analysis'
							: ''}.
					</p>
					<div class="mt-6 flex flex-wrap justify-center gap-2">
						{#each starterPrompts as prompt (prompt)}
							<button
								onclick={() => handlePromptClick(prompt)}
								class="rounded-full border border-[var(--color-border)] px-3.5 py-2 text-[0.75rem] font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-hover)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)] active:scale-[0.97]"
							>
								{prompt}
							</button>
						{/each}
					</div>
					<p class="mt-8 text-center text-[0.62rem] text-[var(--color-text-tertiary)] italic">
						AI guidance only — not a vehicle inspection or mechanic review.
					</p>
				</div>
			{:else}
				<!-- Thread -->
				<div class="space-y-6">
					{#each session.messages as message (message.id)}
						{#if message.role === 'user'}
							<div class="thread-msg">
								<span
									class="mb-1.5 block text-[0.6rem] font-semibold tracking-[0.1em] text-[var(--color-text-tertiary)] uppercase"
								>
									You
								</span>
								<div
									class="rounded-xl bg-[var(--color-secondary)] px-4 py-3 text-[0.84rem] leading-[1.65] text-[var(--color-foreground)]"
								>
									{message.content}
								</div>
							</div>
						{:else}
							<div class="thread-msg">
								{#each splitParagraphs(message.content) as para, pi (pi)}
									<p
										class="text-[0.84rem] leading-[1.65] text-[var(--color-text-secondary)] [&+p]:mt-3"
									>
										{para}
									</p>
								{/each}
							</div>
						{/if}
					{/each}

					{#if session.sending}
						<div
							class="flex items-center gap-2.5 py-2 text-[0.775rem] text-[var(--color-text-tertiary)]"
						>
							<Loader2 size={14} class="animate-spin" />
							<span>Thinking&hellip;</span>
						</div>
					{/if}

					{#if session.error}
						<div
							class="rounded-xl border border-[var(--color-signal-above)]/20 bg-[var(--color-signal-above-bg)] px-4 py-3"
						>
							<p class="text-[0.8rem] text-[var(--color-signal-above-text)]">
								{session.error}
							</p>
							<button
								onclick={handleRetry}
								class="mt-2 flex items-center gap-1.5 text-[0.75rem] font-semibold text-[var(--color-signal-above)] transition-colors hover:text-[var(--color-signal-above-text)]"
							>
								<RotateCcw size={12} />
								Try again
							</button>
						</div>
					{/if}

					{#if hasMessages && !session.sending && !session.error && starterPrompts.length > 0}
						<div class="flex flex-wrap gap-1.5 pt-1">
							{#each starterPrompts.slice(0, 3) as prompt (prompt)}
								<button
									onclick={() => handlePromptClick(prompt)}
									class="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[0.68rem] font-medium text-[var(--color-text-tertiary)] transition-all duration-200 hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)]"
								>
									{prompt}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Composer -->
		<div
			class="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3.5"
			style:padding-bottom={isMobile ? 'max(0.875rem, env(safe-area-inset-bottom))' : undefined}
		>
			<div class="flex items-end gap-2.5">
				<label class="sr-only" for="chat-composer">Ask about this listing</label>
				<textarea
					id="chat-composer"
					bind:this={inputRef}
					value={localDraft}
					oninput={handleDraftInput}
					onkeydown={handleComposerKeydown}
					placeholder="Ask about this listing…"
					rows={1}
					disabled={session.sending}
					class="flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-[0.84rem] leading-[1.5] text-[var(--color-foreground)] placeholder:text-[var(--color-text-tertiary)] transition-colors duration-200 focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-40"
				></textarea>
				<button
					onclick={() => sendMessage(localDraft)}
					disabled={!localDraft.trim() || session.sending}
					aria-label="Send message"
					class="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[var(--color-foreground)] text-[var(--color-background)] transition-all duration-200 hover:bg-[var(--color-text)] active:scale-[0.96] disabled:opacity-25 disabled:hover:bg-[var(--color-foreground)]"
				>
					<Send size={15} />
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.drawer-backdrop-desktop {
		background: oklch(18% 0.015 258 / 0.06);
	}

	.drawer-backdrop-mobile {
		background: oklch(18% 0.015 258 / 0.35);
		backdrop-filter: blur(2px);
	}

	.drawer-panel {
		transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.thread-msg {
		animation: threadReveal 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes threadReveal {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.drawer-backdrop-desktop,
		.drawer-backdrop-mobile,
		.drawer-panel {
			transition-duration: 0ms;
		}
		.thread-msg {
			animation: none;
		}
	}
</style>
