<script lang="ts">
	import type { Listing } from '$lib/types/listing';
	import SignalBadge from './SignalBadge.svelte';
	import { Gauge, Sparkles, Mail, Bookmark, BookmarkCheck } from 'lucide-svelte';

	interface Props {
		listing: Listing;
		onAnalysisClick?: () => void;
		analysisReady?: boolean;
		onContactSellerClick?: () => void;
		saved?: boolean;
		onSaveToggle?: () => void;
	}

	let {
		listing,
		onAnalysisClick,
		analysisReady = false,
		onContactSellerClick,
		saved = false,
		onSaveToggle
	}: Props = $props();

	const formatPrice = (n: number) =>
		new Intl.NumberFormat('en-CA', {
			style: 'currency',
			currency: 'CAD',
			maximumFractionDigits: 0
		}).format(n);

	const formatMileage = (n: number) =>
		new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 }).format(n) + ' km';

	const priceDiff = $derived(listing.marketAverage - listing.price);
	const priceDiffAbs = $derived(Math.abs(priceDiff));
	const priceContext = $derived(
		priceDiff > 0
			? `${formatPrice(priceDiffAbs)} below market`
			: priceDiff < 0
				? `${formatPrice(priceDiffAbs)} above market`
				: 'At market average'
	);
</script>

<!-- Desktop: right-aligned sticky sidebar panel -->
<div class="hidden lg:sticky lg:top-24 lg:block lg:self-start">
	<div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
		<!-- Price -->
		<p
			class="text-[1.75rem] leading-none font-extrabold tracking-tight text-[var(--color-foreground)] tabular-nums"
		>
			{formatPrice(listing.price)}
		</p>
		<p class="mt-2 text-[0.8rem] font-medium text-[var(--color-text-secondary)]">
			{priceContext} for {listing.year}
			{listing.make}
			{listing.model}
		</p>

		<!-- Badges -->
		<div class="mt-4 flex flex-wrap gap-2">
			<SignalBadge variant={listing.priceBadge} />
			<SignalBadge variant={listing.mileageBadge} />
		</div>

		<!-- Mileage context -->
		<div class="mt-5 flex items-center gap-2 text-[0.8rem] text-[var(--color-text-secondary)]">
			<Gauge size={14} class="shrink-0 text-[var(--color-text-tertiary)]" />
			<span>{formatMileage(listing.mileage)}</span>
		</div>

		<!-- Divider -->
		<div class="my-5 h-px bg-[var(--color-border)]"></div>

		{#if analysisReady}
			<!-- Post-analysis: Contact Seller is primary -->
			<button
				onclick={onContactSellerClick}
				class="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-foreground)] px-5 py-3 text-[0.825rem] font-semibold text-[var(--color-background)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--color-text)] active:scale-[0.98]"
			>
				<Mail size={15} />
				Contact seller
			</button>
			<button
				onclick={onAnalysisClick}
				class="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[0.775rem] font-semibold text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-foreground)]"
			>
				<Sparkles size={13} />
				View analysis
			</button>
		{:else}
			<!-- Pre-analysis: See full analysis is primary -->
			<p class="text-[0.775rem] leading-relaxed text-[var(--color-text-secondary)]">
				Get AI-powered insights on known issues, pricing, and what to ask the seller.
			</p>
			<button
				onclick={onAnalysisClick}
				class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-foreground)] px-5 py-3 text-[0.825rem] font-semibold text-[var(--color-background)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--color-text)] active:scale-[0.98]"
			>
				<Sparkles size={15} />
				See full analysis
			</button>
		{/if}

		<!-- Save toggle -->
		<button
			onclick={onSaveToggle}
			class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-[0.775rem] font-semibold transition-all duration-200 active:scale-[0.98] {saved
				? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/20'
				: 'text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-foreground)]'}"
			aria-label={saved ? 'Remove from saved' : 'Save listing'}
			aria-pressed={saved}
		>
			{#if saved}
				<BookmarkCheck size={14} />
				Saved
			{:else}
				<Bookmark size={14} />
				Save listing
			{/if}
		</button>
	</div>
</div>

<!-- Mobile: fixed bottom bar -->
<div
	class="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-xl lg:hidden"
>
	<div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
		<!-- Left: price + badge -->
		<div class="min-w-0 flex-1">
			<div class="flex items-baseline gap-2.5">
				<span
					class="text-lg font-extrabold tracking-tight text-[var(--color-foreground)] tabular-nums"
				>
					{formatPrice(listing.price)}
				</span>
				<SignalBadge variant={listing.priceBadge} compact />
			</div>
			<p class="mt-0.5 truncate text-[0.7rem] text-[var(--color-text-tertiary)]">
				{priceContext}
			</p>
		</div>

		<!-- Right: save + primary CTA -->
		<button
			onclick={onSaveToggle}
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] transition-all duration-200 active:scale-[0.95] {saved
				? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/20'
				: 'text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)]'}"
			aria-label={saved ? 'Remove from saved' : 'Save listing'}
			aria-pressed={saved}
		>
			{#if saved}
				<BookmarkCheck size={16} />
			{:else}
				<Bookmark size={16} />
			{/if}
		</button>

		{#if analysisReady}
			<button
				onclick={onContactSellerClick}
				class="flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--color-foreground)] px-4 py-2.5 text-[0.775rem] font-semibold text-[var(--color-background)] transition-all duration-200 active:scale-[0.97]"
			>
				<Mail size={13} />
				Contact
			</button>
		{:else}
			<button
				onclick={onAnalysisClick}
				class="flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--color-foreground)] px-4 py-2.5 text-[0.775rem] font-semibold text-[var(--color-background)] transition-all duration-200 active:scale-[0.97]"
			>
				<Sparkles size={13} />
				Analysis
			</button>
		{/if}
	</div>
</div>
