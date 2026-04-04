<script lang="ts">
	import type { Listing } from '$lib/types/listing';
	import type { ConfidencePayload } from '$lib/types/confidence';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Mail, ClipboardCheck, Clipboard, Sparkles, PenLine } from 'lucide-svelte';

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

	const lineCount = $derived(Math.max(messageBody.split('\n').length + 2, 12));
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="sm:max-w-lg p-0 gap-0 overflow-hidden border-[var(--color-border)] bg-[var(--color-surface)]"
	>
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
				class="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30 px-4 py-3.5 text-[0.84rem] leading-[1.7] text-[var(--color-foreground)] transition-colors duration-200 placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
				placeholder="Write your message..."
				aria-label="Seller message"
			></textarea>
		</div>

		<!-- Footer -->
		<div
			class="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-secondary)]/30 px-6 py-4"
		>
			<p class="text-[0.7rem] text-[var(--color-text-tertiary)]">
				Draft only — customize before sending
			</p>
			<button
				onclick={copyToClipboard}
				class="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[0.8rem] font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] {copied
					? 'bg-[var(--color-signal-below)] text-white'
					: 'bg-[var(--color-foreground)] text-[var(--color-background)] hover:bg-[var(--color-text)]'}"
			>
				{#if copied}
					<ClipboardCheck size={14} />
					Copied
				{:else}
					<Clipboard size={14} />
					Copy message
				{/if}
			</button>
		</div>
	</Dialog.Content>
</Dialog.Root>
