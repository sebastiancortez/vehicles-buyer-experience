<script lang="ts">
	import type { Listing } from '$lib/types/listing';
	import type { ConfidencePayload, ConfidenceVerdictLabel } from '$lib/types/confidence';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import {
		Sparkles,
		ChevronDown,
		ChevronUp,
		ShieldAlert,
		CircleDollarSign,
		MessageCircleQuestion,
		RotateCcw,
		AlertCircle,
		Search,
		Mail
	} from 'lucide-svelte';

	interface Props {
		listing: Listing;
		searchQuery?: string;
		expanded?: boolean;
		onAnalysisLoaded?: (analysis: ConfidencePayload) => void;
		onContactSeller?: () => void;
		onchatopen?: () => void;
	}

	let {
		listing,
		searchQuery,
		expanded = $bindable(false),
		onAnalysisLoaded,
		onContactSeller,
		onchatopen
	}: Props = $props();

	type DataState = 'idle' | 'loading' | 'ready' | 'error';
	let dataState = $state<DataState>('idle');
	let analysis = $state<ConfidencePayload | null>(null);
	let errorMessage = $state('');
	let hasFetched = $state(false);

	const verdictDisplay: Record<
		ConfidenceVerdictLabel,
		{ label: string; bg: string; text: string; border: string }
	> = {
		below_market: {
			label: 'Below Market',
			bg: 'var(--color-signal-below-bg)',
			text: 'var(--color-signal-below-text)',
			border: 'var(--color-signal-below)'
		},
		fair: {
			label: 'Fair Price',
			bg: 'var(--color-signal-fair-bg)',
			text: 'var(--color-signal-fair-text)',
			border: 'var(--color-signal-fair)'
		},
		above_market: {
			label: 'Above Market',
			bg: 'var(--color-signal-above-bg)',
			text: 'var(--color-signal-above-text)',
			border: 'var(--color-signal-above)'
		}
	};

	const currentVerdict = $derived(
		analysis ? verdictDisplay[analysis.priceVerdict.label] : null
	);

	$effect(() => {
		if (expanded && !hasFetched) {
			fetchAnalysis();
		}
	});

	async function fetchAnalysis() {
		hasFetched = true;
		dataState = 'loading';

		try {
			const params = new URLSearchParams();
			if (searchQuery) params.set('q', searchQuery);
			const url = `/api/confidence/${listing.id}${params.toString() ? `?${params.toString()}` : ''}`;
			const res = await fetch(url);

			if (!res.ok) {
				if (res.status === 404) {
					analysis = getMockAnalysis();
					dataState = 'ready';
					onAnalysisLoaded?.(analysis);
					return;
				}
				const err = await res.json().catch(() => null);
				errorMessage = err?.error?.message || 'Analysis unavailable right now.';
				dataState = 'error';
				return;
			}

			const data = await res.json();
			if (data.ok) {
				analysis = data.analysis;
				dataState = 'ready';
				onAnalysisLoaded?.(data.analysis);
			} else {
				errorMessage = data.error?.message || 'Analysis unavailable right now.';
				dataState = 'error';
			}
		} catch {
			analysis = getMockAnalysis();
			dataState = 'ready';
			onAnalysisLoaded?.(analysis);
		}
	}

	function retry() {
		fetchAnalysis();
	}

	function getMockAnalysis(): ConfidencePayload {
		const { year, make, model, trim, condition, mileage, price, marketAverage, seller, description } =
			listing;
		const isSalvage = condition === 'salvage';
		const isDealer = seller.type === 'dealer';
		const priceDiff = marketAverage - price;
		const isHighMiles = listing.mileageBadge === 'high';
		const isLowMiles = listing.mileageBadge === 'low';
		const descShort = description.length < 100;
		const fmt = (n: number) => n.toLocaleString('en-CA');

		const knownIssues: string[] = [];

		if (isSalvage) {
			knownIssues.push(
				'This vehicle has a salvage or rebuilt title, which typically indicates significant prior damage. Insurance, financing, and resale value may all be affected.'
			);
		}

		if (isHighMiles) {
			knownIssues.push(
				`At ${fmt(mileage)} km, this ${year} ${make} ${model} is above average for its age. Key wear items — timing chain/belt, suspension bushings, and transmission — should be inspected.`
			);
		}

		if (priceDiff > marketAverage * 0.15) {
			knownIssues.push(
				'The asking price is significantly below market average. While this could be a motivated seller, it may also indicate undisclosed issues worth investigating.'
			);
		}

		if (!isDealer) {
			knownIssues.push(
				'Private sellers are not required to offer warranties or return policies. Verify the title, obtain a vehicle history report, and arrange an independent inspection.'
			);
		}

		if (knownIssues.length === 0) {
			knownIssues.push(
				`No major reliability red flags for the ${year} ${make} ${model} ${trim}. Standard maintenance items — brakes, tires, fluid changes — apply.`
			);
		}

		let verdictLabel: ConfidenceVerdictLabel;
		let reasoning: string;

		if (priceDiff > 0) {
			verdictLabel = 'below_market';
			reasoning = `At $${fmt(price)}, this ${year} ${make} ${model} is priced $${fmt(Math.abs(priceDiff))} below the market average of $${fmt(marketAverage)} for comparable listings. ${isSalvage ? 'The salvage title likely accounts for some of this discount.' : isHighMiles ? 'Higher mileage may explain part of the discount.' : 'This appears to be a competitive price for the segment.'}`;
		} else if (priceDiff < 0) {
			verdictLabel = 'above_market';
			reasoning = `At $${fmt(price)}, this ${year} ${make} ${model} is priced $${fmt(Math.abs(priceDiff))} above the market average of $${fmt(marketAverage)}. ${isDealer ? 'Dealer pricing may include warranty or certification benefits.' : 'Consider negotiating or comparing similar listings.'} ${isLowMiles ? 'Lower-than-average mileage may justify some premium.' : ''}`.trim();
		} else {
			verdictLabel = 'fair';
			reasoning = `At $${fmt(price)}, this ${year} ${make} ${model} is priced near the market average of $${fmt(marketAverage)}. This is a reasonable ask given the condition and mileage.`;
		}

		const questionsToAsk: string[] = [];

		if (isSalvage) {
			questionsToAsk.push('What was the nature of the damage that resulted in the salvage title?');
			questionsToAsk.push(
				'Was the vehicle professionally repaired? Can you provide repair documentation?'
			);
		}

		questionsToAsk.push(`Has this ${make} ${model} been in any reported accidents?`);
		questionsToAsk.push('Can you provide a current vehicle history report (e.g., Carfax)?');

		if (isHighMiles) {
			questionsToAsk.push('When was the timing belt or chain last replaced?');
			questionsToAsk.push(
				'Have the transmission and differential fluids been serviced recently?'
			);
		}

		if (!isDealer) {
			questionsToAsk.push('What is your reason for selling?');
		}

		if (descShort) {
			questionsToAsk.push(
				'Can you share more detail on the service history and any recent repairs?'
			);
		}

		questionsToAsk.push(
			'Would you be open to a pre-purchase inspection by an independent mechanic?'
		);

		return {
			listingId: listing.id,
			query: searchQuery || null,
			buyerIntent: searchQuery ? `Focused on: ${searchQuery}` : undefined,
			knownIssues,
			priceVerdict: { label: verdictLabel, reasoning },
			questionsToAsk: questionsToAsk.slice(0, 6)
		};
	}
</script>

<!-- Panel container -->
<div class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
	<!-- Top accent bar -->
	<div class="h-[3px] bg-[var(--color-primary)]"></div>

	<!-- Trigger header -->
	<button
		onclick={() => (expanded = !expanded)}
		class="group flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors duration-200 hover:bg-[var(--color-secondary)]/40"
		aria-expanded={expanded}
		aria-controls="confidence-panel-body"
	>
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-light)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
		>
			<Sparkles size={17} class="text-[var(--color-primary)]" />
		</div>
		<div class="min-w-0 flex-1">
			<p
				class="text-[0.875rem] leading-tight font-bold tracking-[-0.01em] text-[var(--color-foreground)]"
			>
				AI Confidence Analysis
			</p>
			<p class="mt-0.5 text-[0.75rem] text-[var(--color-text-tertiary)]">
				{#if expanded && searchQuery && analysis?.buyerIntent}
					{analysis.buyerIntent}
				{:else}
					Known issues, pricing, and what to ask
				{/if}
			</p>
		</div>
		{#if expanded}
			<ChevronUp size={16} class="shrink-0 text-[var(--color-text-tertiary)]" />
		{:else}
			<ChevronDown
				size={16}
				class="shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-300 group-hover:translate-y-0.5"
			/>
		{/if}
	</button>

	<!-- Expandable body -->
	<div
		id="confidence-panel-body"
		class="grid transition-[grid-template-rows] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
		style:grid-template-rows={expanded ? '1fr' : '0fr'}
	>
		<div class="overflow-hidden">
			{#if dataState === 'loading'}
				<!-- Loading skeleton -->
				<div class="border-t border-[var(--color-border)] px-5 pb-6 pt-5">
					<div class="space-y-8">
						<div>
							<Skeleton class="h-3 w-28" />
							<div class="mt-4 space-y-3">
								<Skeleton class="h-[0.875rem] w-full" />
								<Skeleton class="h-[0.875rem] w-5/6" />
								<Skeleton class="h-[0.875rem] w-full" />
								<Skeleton class="h-[0.875rem] w-3/4" />
							</div>
						</div>
						<div class="h-px bg-[var(--color-border)]"></div>
						<div>
							<Skeleton class="h-3 w-24" />
							<Skeleton class="mt-4 h-8 w-36 rounded-full" />
							<div class="mt-3 space-y-2">
								<Skeleton class="h-[0.875rem] w-full" />
								<Skeleton class="h-[0.875rem] w-4/5" />
							</div>
						</div>
						<div class="h-px bg-[var(--color-border)]"></div>
						<div>
							<Skeleton class="h-3 w-44" />
							<div class="mt-4 space-y-3">
								{#each [85, 78, 90, 70] as width (width)}
									<div class="flex gap-3">
										<Skeleton class="h-5 w-5 shrink-0 rounded-full" />
										<Skeleton class="h-[0.875rem]" style="width: {width}%" />
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{:else if dataState === 'error'}
				<!-- Error state -->
				<div class="border-t border-[var(--color-border)] px-5 pb-6 pt-5">
					<div class="flex flex-col items-center gap-4 py-6 text-center">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-signal-above-bg)]"
						>
							<AlertCircle size={22} class="text-[var(--color-signal-above)]" />
						</div>
						<div>
							<p class="text-[0.875rem] font-semibold text-[var(--color-foreground)]">
								Analysis unavailable
							</p>
							<p
								class="mx-auto mt-1.5 max-w-xs text-[0.8rem] leading-relaxed text-[var(--color-text-secondary)]"
							>
								{errorMessage}
							</p>
						</div>
						<button
							onclick={retry}
							class="flex items-center gap-2 rounded-xl bg-[var(--color-secondary)] px-4 py-2.5 text-[0.8rem] font-semibold text-[var(--color-foreground)] transition-all duration-200 hover:bg-[var(--color-border)] active:scale-[0.98]"
						>
							<RotateCcw size={14} />
							Try again
						</button>
					</div>
				</div>
			{:else if dataState === 'ready' && analysis}
				<!-- Assessment sections -->
				<div class="border-t border-[var(--color-border)] px-5 pb-6 pt-5">
					<!-- Buyer intent banner -->
					{#if searchQuery && analysis.buyerIntent}
						<div
							class="mb-6 flex items-center gap-2.5 rounded-lg bg-[var(--color-primary-light)] px-4 py-2.5"
						>
							<Search size={13} class="shrink-0 text-[var(--color-primary)]" />
							<p class="text-[0.775rem] font-medium text-[var(--color-primary)]">
								{analysis.buyerIntent}
							</p>
						</div>
					{/if}

					<!-- Section 1: Known Issues -->
					<section
						class="section-reveal"
						style="animation-delay: 0ms"
						aria-labelledby="ci-known-issues"
					>
						<div class="flex items-center gap-2">
							<ShieldAlert size={14} class="text-[var(--color-text-tertiary)]" />
							<h3
								id="ci-known-issues"
								class="text-[0.7rem] font-semibold tracking-[0.08em] text-[var(--color-text-tertiary)] uppercase"
							>
								Known Issues
							</h3>
						</div>
						<div class="mt-4 space-y-3">
							{#each analysis.knownIssues as issue, idx (idx)}
								<div
									class="flex gap-3 text-[0.84rem] leading-[1.65] text-[var(--color-text-secondary)]"
								>
									<span
										class="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-text-tertiary)]"
									></span>
									<p>{issue}</p>
								</div>
							{/each}
						</div>
						<p
							class="mt-4 text-[0.7rem] leading-relaxed text-[var(--color-text-tertiary)] italic"
						>
							AI-generated analysis — not a vehicle inspection.
						</p>
					</section>

					<div class="my-7 h-px bg-[var(--color-border)]"></div>

					<!-- Section 2: Price Verdict -->
					{#if currentVerdict}
						<section
							class="section-reveal"
							style="animation-delay: 120ms"
							aria-labelledby="ci-price-verdict"
						>
							<div class="flex items-center gap-2">
								<CircleDollarSign size={14} class="text-[var(--color-text-tertiary)]" />
								<h3
									id="ci-price-verdict"
									class="text-[0.7rem] font-semibold tracking-[0.08em] text-[var(--color-text-tertiary)] uppercase"
								>
									Price Verdict
								</h3>
							</div>
							<div class="mt-4">
								<span
									class="inline-flex items-center rounded-full px-4 py-1.5 text-[0.8rem] font-bold"
									style="background: {currentVerdict.bg}; color: {currentVerdict.text}; border-left: 3px solid {currentVerdict.border}"
								>
									{currentVerdict.label}
								</span>
								<p
									class="mt-3.5 max-w-prose text-[0.84rem] leading-[1.65] text-[var(--color-text-secondary)]"
								>
									{analysis.priceVerdict.reasoning}
								</p>
							</div>
						</section>
					{/if}

					<div class="my-7 h-px bg-[var(--color-border)]"></div>

					<!-- Section 3: Questions to Ask the Seller -->
					<section
						class="section-reveal"
						style="animation-delay: 240ms"
						aria-labelledby="ci-questions"
					>
						<div class="flex items-center gap-2">
							<MessageCircleQuestion size={14} class="text-[var(--color-text-tertiary)]" />
							<h3
								id="ci-questions"
								class="text-[0.7rem] font-semibold tracking-[0.08em] text-[var(--color-text-tertiary)] uppercase"
							>
								Questions to Ask the Seller
							</h3>
						</div>
						<ol class="mt-4 space-y-3.5">
							{#each analysis.questionsToAsk as question, i (i)}
								<li
									class="flex gap-3 text-[0.84rem] leading-[1.65] text-[var(--color-text-secondary)]"
								>
									<span
										class="mt-[0.2em] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[0.65rem] font-bold tabular-nums text-[var(--color-text-tertiary)]"
									>
										{i + 1}
									</span>
									<p>{question}</p>
								</li>
							{/each}
						</ol>
					</section>

					<!-- Action row -->
					<div class="mt-8 flex flex-col gap-3 section-reveal" style="animation-delay: 360ms">
						<button
							onclick={onchatopen}
							class="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-[0.825rem] font-semibold text-[var(--color-foreground)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--color-secondary)] active:scale-[0.98]"
						>
							<MessageCircleQuestion size={15} />
							Ask about this listing
						</button>
						<button
							onclick={onContactSeller}
							class="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[var(--color-foreground)] px-5 py-3 text-[0.825rem] font-semibold text-[var(--color-background)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--color-text)] active:scale-[0.98]"
						>
							<Mail size={15} />
							Draft message to seller
						</button>
					</div>
				</div>
			{:else}
				<div class="h-0"></div>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes sectionReveal {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.section-reveal {
		opacity: 0;
		animation: sectionReveal 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@media (prefers-reduced-motion: reduce) {
		.section-reveal {
			animation: none;
			opacity: 1;
		}
	}
</style>
