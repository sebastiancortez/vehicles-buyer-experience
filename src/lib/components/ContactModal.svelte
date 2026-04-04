<script lang="ts">
	import type { Listing } from '$lib/types/listing';
	import type { ConfidencePayload } from '$lib/types/confidence';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		Mail,
		ClipboardCheck,
		Clipboard,
		Sparkles,
		PenLine,
		Send,
		Loader2,
		CircleCheck,
		ArrowLeft
	} from 'lucide-svelte';

	interface Props {
		open: boolean;
		listing: Listing;
		analysis?: ConfidencePayload | null;
		buyerIntent?: string;
	}

	let { open = $bindable(false), listing, analysis = null, buyerIntent }: Props = $props();

	let messageBody = $state('');
	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | undefined;

	type ModalPhase = 'draft' | 'sending' | 'sent';
	let modalPhase = $state<ModalPhase>('draft');

	const isAiPopulated = $derived(!!analysis?.questionsToAsk?.length);

	const sellerFirstName = $derived(
		listing.seller.username.includes(' ')
			? listing.seller.username.split(' ')[0]
			: listing.seller.username
	);

	function buildAiTemplate(a: ConfidencePayload): string {
		const lines: string[] = [];
		lines.push(`Hi ${sellerFirstName},`);
		lines.push('');
		lines.push(
			`I'm interested in your ${listing.year} ${listing.make} ${listing.model} ${listing.trim} listed at $${listing.price.toLocaleString('en-CA')}. After reviewing the listing, I have a few questions:`
		);
		lines.push('');
		a.questionsToAsk.forEach((q, i) => {
			lines.push(`${i + 1}. ${q}`);
		});
		lines.push('');
		lines.push("I'd appreciate any information you can share. Thank you!");
		return lines.join('\n');
	}

	function buildFallbackTemplate(): string {
		const lines: string[] = [];
		lines.push(`Hi ${sellerFirstName},`);
		lines.push('');
		lines.push(
			`I'm interested in your ${listing.year} ${listing.make} ${listing.model} ${listing.trim} listed at $${listing.price.toLocaleString('en-CA')}. I'd love to learn more before making a decision.`
		);
		lines.push('');
		lines.push('Could you help me with the following?');
		lines.push('');
		lines.push(`1. Has this ${listing.make} ${listing.model} been in any reported accidents?`);
		lines.push('2. Can you provide a vehicle history report (e.g., Carfax)?');
		lines.push('3. What is the recent service history?');
		lines.push('4. Would you be open to a pre-purchase inspection by an independent mechanic?');
		lines.push('');
		lines.push('Thank you for your time!');
		return lines.join('\n');
	}

	$effect(() => {
		if (open) {
			messageBody = analysis?.questionsToAsk?.length
				? buildAiTemplate(analysis)
				: buildFallbackTemplate();
			copied = false;
			modalPhase = 'draft';
		}
	});

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(messageBody);
			copied = true;
			if (copyTimeout) clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => (copied = false), 2400);
		} catch {
			/* clipboard API unavailable in some contexts */
		}
	}

	async function mockSend() {
		if (!messageBody.trim()) return;
		modalPhase = 'sending';
		await new Promise((r) => setTimeout(r, 1400));
		modalPhase = 'sent';
	}

	function handleDone() {
		open = false;
	}

	function backToDraft() {
		modalPhase = 'draft';
	}

	const lineCount = $derived(Math.max(messageBody.split('\n').length + 2, 12));
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="sm:max-w-lg p-0 gap-0 overflow-hidden border-[var(--color-border)] bg-[var(--color-surface)]"
	>
		{#if modalPhase === 'sent'}
			<!-- Success state -->
			<div class="flex flex-col items-center px-8 py-12 text-center">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-signal-below-bg)]"
				>
					<CircleCheck size={28} class="text-[var(--color-signal-below)]" />
				</div>
				<Dialog.Title class="mt-5 text-[1.05rem] font-bold text-[var(--color-foreground)]">
					Message sent
				</Dialog.Title>
				<Dialog.Description
					class="mt-2 max-w-xs text-[0.825rem] leading-relaxed text-[var(--color-text-secondary)]"
				>
					Your message to {listing.seller.username} about the {listing.year}
					{listing.make}
					{listing.model} has been delivered.
				</Dialog.Description>
				<div class="mt-8 flex gap-3">
					<button
						onclick={backToDraft}
						class="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-[0.8rem] font-semibold text-[var(--color-foreground)] transition-all duration-200 hover:bg-[var(--color-secondary)] active:scale-[0.97]"
					>
						<ArrowLeft size={14} />
						Edit & resend
					</button>
					<button
						onclick={handleDone}
						class="flex items-center gap-2 rounded-xl bg-[var(--color-foreground)] px-6 py-2.5 text-[0.8rem] font-semibold text-[var(--color-background)] transition-all duration-200 hover:bg-[var(--color-text)] active:scale-[0.97]"
					>
						Done
					</button>
				</div>
			</div>
		{:else}
			<!-- Header -->
			<div class="px-6 pt-6 pb-4">
				<div class="flex items-start gap-3.5">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-light)]"
					>
						<Mail size={17} class="text-[var(--color-primary)]" />
					</div>
					<div class="min-w-0 flex-1">
						<Dialog.Title class="text-[0.925rem] font-bold text-[var(--color-foreground)]">
							Message to {listing.seller.username}
						</Dialog.Title>
						<Dialog.Description
							class="mt-1 text-[0.775rem] text-[var(--color-text-secondary)]"
						>
							{listing.year}
							{listing.make}
							{listing.model}
							{listing.trim}
							<span class="mx-1.5 text-[var(--color-border)]">&middot;</span>
							{listing.seller.type === 'dealer' ? 'Dealer' : 'Private seller'}
						</Dialog.Description>
					</div>
				</div>

				{#if isAiPopulated}
					<div
						class="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-primary-light)] px-3 py-2"
					>
						<Sparkles size={12} class="shrink-0 text-[var(--color-primary)]" />
						<p class="text-[0.7rem] font-medium text-[var(--color-primary)]">
							Pre-filled with AI-suggested questions from the analysis
						</p>
					</div>
				{/if}
			</div>

			<!-- Compose area -->
			<div class="px-6 pb-2">
				<div class="flex items-center gap-1.5 pb-2">
					<PenLine size={11} class="text-[var(--color-text-tertiary)]" />
					<span
						class="text-[0.65rem] font-semibold tracking-[0.08em] text-[var(--color-text-tertiary)] uppercase"
					>
						Your message
					</span>
				</div>
				<textarea
					bind:value={messageBody}
					rows={lineCount}
					disabled={modalPhase === 'sending'}
					class="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 px-4 py-3.5 text-[0.84rem] leading-[1.7] text-[var(--color-foreground)] transition-colors duration-200 placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 disabled:opacity-50"
					placeholder="Write your message..."
					aria-label="Seller message"
				></textarea>
			</div>

			<!-- Footer -->
			<div
				class="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-secondary)]/30 px-6 py-4"
			>
				<button
					onclick={copyToClipboard}
					disabled={modalPhase === 'sending'}
					class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.75rem] font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)] disabled:opacity-40 {copied
						? 'text-[var(--color-signal-below)]'
						: ''}"
				>
					{#if copied}
						<ClipboardCheck size={13} />
						Copied
					{:else}
						<Clipboard size={13} />
						Copy
					{/if}
				</button>
				<button
					onclick={mockSend}
					disabled={!messageBody.trim() || modalPhase === 'sending'}
					class="flex items-center gap-2 rounded-xl bg-[var(--color-foreground)] px-5 py-2.5 text-[0.8rem] font-semibold text-[var(--color-background)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--color-text)] active:scale-[0.97] disabled:opacity-40"
				>
					{#if modalPhase === 'sending'}
						<Loader2 size={14} class="animate-spin" />
						Sending&hellip;
					{:else}
						<Send size={14} />
						Send message
					{/if}
				</button>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
