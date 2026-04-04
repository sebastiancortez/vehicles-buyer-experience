<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import ListingCard from '$lib/components/ListingCard.svelte';
	import {
		SlidersHorizontal,
		X,
		ChevronLeft,
		ChevronRight,
		SearchX,
		Sparkles
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Condition, SellerType } from '$lib/types/listing';
	import type { SortKey } from './+page.server';

	let { data }: { data: PageData } = $props();

	let filtersOpen = $state(false);

	/* ── URL-driven filter helpers ──────────────────────────────────────── */

	function updateParams(changes: Record<string, string | null>) {
		const url = new URL($page.url);
		for (const [key, value] of Object.entries(changes)) {
			if (value === null || value === '') {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, value);
			}
		}
		url.searchParams.delete('page');
		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	function setSort(key: SortKey) {
		updateParams({ sort: key === 'best' ? null : key });
	}

	function setPriceRange(min: number | null, max: number | null) {
		updateParams({
			minPrice: min ? String(min) : null,
			maxPrice: max ? String(max) : null
		});
	}

	function setMileageRange(min: number | null, max: number | null) {
		updateParams({
			minMileage: min ? String(min) : null,
			maxMileage: max ? String(max) : null
		});
	}

	function toggleCondition(cond: Condition) {
		const current = data.filters.condition ?? [];
		const next = current.includes(cond)
			? current.filter((c) => c !== cond)
			: [...current, cond];
		updateParams({ condition: next.length ? next.join(',') : null });
	}

	function setSellerType(type: SellerType | null) {
		updateParams({ sellerType: type });
	}

	function clearAllFilters() {
		const url = new URL($page.url);
		['minPrice', 'maxPrice', 'minMileage', 'maxMileage', 'condition', 'sellerType', 'sort', 'page'].forEach((k) =>
			url.searchParams.delete(k)
		);
		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	function goToPage(p: number) {
		const url = new URL($page.url);
		if (p <= 1) {
			url.searchParams.delete('page');
		} else {
			url.searchParams.set('page', String(p));
		}
		goto(url.toString(), { noScroll: false });
	}

	/* ── Derived state ─────────────────────────────────────────────────── */

	const hasActiveFilters = $derived(
		data.filters.minPrice !== null ||
			data.filters.maxPrice !== null ||
			data.filters.minMileage !== null ||
			data.filters.maxMileage !== null ||
			(data.filters.condition !== null && data.filters.condition.length > 0) ||
			data.filters.sellerType !== null
	);

	const activePricePreset = $derived.by(() => {
		const min = data.filters.minPrice;
		const max = data.filters.maxPrice;
		if (!min && !max) return 'any';
		if (!min && max === 10000) return '0-10';
		if (min === 10000 && max === 20000) return '10-20';
		if (min === 20000 && max === 35000) return '20-35';
		if (min === 35000 && !max) return '35+';
		return 'custom';
	});

	const activeMileagePreset = $derived.by(() => {
		const min = data.filters.minMileage;
		const max = data.filters.maxMileage;
		if (!min && !max) return 'any';
		if (!min && max === 50000) return '0-50';
		if (min === 50000 && max === 100000) return '50-100';
		if (min === 100000 && !max) return '100+';
		return 'custom';
	});

	const sortOptions: { key: SortKey; label: string }[] = [
		{ key: 'best', label: 'Best Match' },
		{ key: 'price_asc', label: 'Price \u2191' },
		{ key: 'price_desc', label: 'Price \u2193' },
		{ key: 'mileage', label: 'Low Mileage' },
		{ key: 'newest', label: 'Newest' }
	];

	const conditionOptions: { value: Condition; label: string }[] = [
		{ value: 'new', label: 'New' },
		{ value: 'excellent', label: 'Excellent' },
		{ value: 'good', label: 'Good' },
		{ value: 'fair', label: 'Fair' },
		{ value: 'salvage', label: 'Salvage' }
	];

	const chips = [
		'Reliable under $15k',
		'Low mileage sedans',
		'Family SUVs',
		'First car under $10k',
		'Trucks under $20k'
	];
</script>

<svelte:head>
	<title>{data.query ? `${data.query} — Vehicles` : 'Browse Vehicles'}</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
	<!-- Search bar -->
	<div class="pt-6 pb-2 sm:pt-8">
		<div class="mx-auto max-w-xl">
			<SearchBar initialQuery={data.query} />
		</div>
	</div>

	<!-- Results header -->
	<div class="flex flex-wrap items-end justify-between gap-3 pt-6 pb-5 sm:pt-8 sm:pb-6">
		<div>
			{#if data.query}
				<p class="text-[0.8rem] font-medium text-[var(--color-text-tertiary)]">
					{data.totalResults} result{data.totalResults !== 1 ? 's' : ''} for
				</p>
				<h1
					class="mt-0.5 text-[clamp(1.25rem,3vw,1.6rem)] leading-tight font-bold tracking-[-0.015em] text-[var(--color-foreground)]"
				>
					{data.query}
				</h1>
			{:else}
				<h1
					class="text-[clamp(1.25rem,3vw,1.6rem)] leading-tight font-bold tracking-[-0.015em] text-[var(--color-foreground)]"
				>
					All Vehicles
				</h1>
				<p class="mt-0.5 text-[0.8rem] font-medium text-[var(--color-text-tertiary)]">
					{data.totalResults} listing{data.totalResults !== 1 ? 's' : ''}
				</p>
			{/if}

			{#if data.parsedFilters.maxPrice || data.parsedFilters.mileageBadge}
				<div class="mt-2 flex flex-wrap gap-1.5">
					{#if data.parsedFilters.maxPrice}
						<span
							class="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-light)] px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--color-primary)]"
						>
							<Sparkles size={10} />
							Under ${(data.parsedFilters.maxPrice / 1000).toFixed(0)}k detected
						</span>
					{/if}
					{#if data.parsedFilters.mileageBadge}
						<span
							class="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-light)] px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--color-primary)]"
						>
							<Sparkles size={10} />
							Low mileage filter applied
						</span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Mobile filter toggle + sort -->
		<div class="flex items-center gap-2">
			<button
				onclick={() => (filtersOpen = !filtersOpen)}
				class="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-2 text-[0.8rem] font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] lg:hidden {filtersOpen
					? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
					: ''}"
			>
				<SlidersHorizontal size={14} />
				Filters
				{#if hasActiveFilters}
					<span
						class="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[0.6rem] font-bold text-white"
					>!</span
					>
				{/if}
			</button>
		</div>
	</div>

	<!-- Main layout: sidebar + grid -->
	<div class="flex gap-8 pb-16 lg:gap-10">
		<!-- Filter sidebar -->
		<aside
			class="fixed inset-x-0 top-14 z-30 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-[var(--color-border)] bg-[var(--color-background)] px-5 pb-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-6 lg:sticky lg:top-20 lg:z-auto lg:block lg:w-[240px] lg:shrink-0 lg:self-start lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto lg:border-none lg:bg-transparent lg:p-0 {filtersOpen
				? 'translate-y-0 opacity-100'
				: 'pointer-events-none -translate-y-2 opacity-0 lg:pointer-events-auto lg:translate-y-0 lg:opacity-100'}"
		>
			<!-- Mobile close -->
			<div class="flex items-center justify-between pt-4 pb-3 lg:hidden">
				<span class="text-[0.85rem] font-bold text-[var(--color-foreground)]">Filters</span>
				<button
					onclick={() => (filtersOpen = false)}
					class="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-text-tertiary)] hover:bg-[var(--color-secondary)]"
				>
					<X size={16} />
				</button>
			</div>

			{#if hasActiveFilters}
				<button
					onclick={clearAllFilters}
					class="mb-4 text-[0.75rem] font-semibold text-[var(--color-primary)] underline decoration-[var(--color-primary)]/30 underline-offset-2 transition-colors hover:text-[var(--color-primary-hover)]"
				>
					Clear all filters
				</button>
			{/if}

			<!-- Price -->
			<div class="border-b border-[var(--color-border)]/60 pb-5">
				<h3 class="mb-3 text-[0.7rem] font-bold tracking-widest text-[var(--color-text-tertiary)] uppercase">
					Price
				</h3>
				<div class="flex flex-wrap gap-1.5">
					{#each [
						{ key: 'any', label: 'Any', min: null, max: null },
						{ key: '0-10', label: 'Under $10k', min: null, max: 10000 },
						{ key: '10-20', label: '$10k–20k', min: 10000, max: 20000 },
						{ key: '20-35', label: '$20k–35k', min: 20000, max: 35000 },
						{ key: '35+', label: '$35k+', min: 35000, max: null }
					] as preset (preset.key)}
						<button
							onclick={() => setPriceRange(preset.min, preset.max)}
							class="rounded-full px-3 py-1.5 text-[0.725rem] font-semibold transition-all duration-150 {activePricePreset ===
							preset.key
								? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
								: 'bg-[var(--color-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
						>
							{preset.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Mileage -->
			<div class="border-b border-[var(--color-border)]/60 pt-5 pb-5">
				<h3 class="mb-3 text-[0.7rem] font-bold tracking-widest text-[var(--color-text-tertiary)] uppercase">
					Mileage
				</h3>
				<div class="flex flex-wrap gap-1.5">
					{#each [
						{ key: 'any', label: 'Any', min: null, max: null },
						{ key: '0-50', label: 'Under 50k', min: null, max: 50000 },
						{ key: '50-100', label: '50k–100k', min: 50000, max: 100000 },
						{ key: '100+', label: '100k+', min: 100000, max: null }
					] as preset (preset.key)}
						<button
							onclick={() => setMileageRange(preset.min, preset.max)}
							class="rounded-full px-3 py-1.5 text-[0.725rem] font-semibold transition-all duration-150 {activeMileagePreset ===
							preset.key
								? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
								: 'bg-[var(--color-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
						>
							{preset.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Condition -->
			<div class="border-b border-[var(--color-border)]/60 pt-5 pb-5">
				<h3 class="mb-3 text-[0.7rem] font-bold tracking-widest text-[var(--color-text-tertiary)] uppercase">
					Condition
				</h3>
				<div class="flex flex-wrap gap-1.5">
					{#each conditionOptions as opt (opt.value)}
						{@const active = data.filters.condition?.includes(opt.value) ?? false}
						<button
							onclick={() => toggleCondition(opt.value)}
							class="rounded-full px-3 py-1.5 text-[0.725rem] font-semibold transition-all duration-150 {active
								? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
								: 'bg-[var(--color-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Seller type -->
			<div class="pt-5">
				<h3 class="mb-3 text-[0.7rem] font-bold tracking-widest text-[var(--color-text-tertiary)] uppercase">
					Seller
				</h3>
				<div class="flex flex-wrap gap-1.5">
					{#each [
						{ value: null, label: 'All' },
						{ value: 'private', label: 'Private' },
						{ value: 'dealer', label: 'Dealer' }
					] as opt (opt.label)}
						<button
							onclick={() => setSellerType(opt.value as SellerType | null)}
							class="rounded-full px-3 py-1.5 text-[0.725rem] font-semibold transition-all duration-150 {data
								.filters.sellerType === opt.value
								? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
								: 'bg-[var(--color-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}"
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
		</aside>

		<!-- Results area -->
		<div class="min-w-0 flex-1">
			<!-- Sort bar -->
			<div class="mb-5 flex items-center gap-1 overflow-x-auto pb-0.5">
				{#each sortOptions as opt (opt.key)}
					<button
						onclick={() => setSort(opt.key)}
						class="shrink-0 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold transition-all duration-150 {data.sort ===
						opt.key
							? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
							: 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}"
					>
						{opt.label}
					</button>
				{/each}
			</div>

			{#if data.results.length > 0}
				<!-- Listing grid -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{#each data.results as listing, i (listing.id)}
						<div style="animation: cardIn 0.4s {40 * i}ms cubic-bezier(0.16, 1, 0.3, 1) both;">
							<ListingCard {listing} showWatcherCount />
						</div>
					{/each}
				</div>

				<!-- Pagination -->
				{#if data.totalPages > 1}
					<nav
						class="mt-10 flex items-center justify-center gap-1"
						aria-label="Pagination"
					>
						<button
							onclick={() => goToPage(data.page - 1)}
							disabled={data.page <= 1}
							class="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-secondary)] disabled:pointer-events-none disabled:opacity-30"
							aria-label="Previous page"
						>
							<ChevronLeft size={16} />
						</button>

						{#each Array.from({ length: data.totalPages }, (_, i) => i + 1) as p (p)}
							<button
								onclick={() => goToPage(p)}
								class="flex h-9 min-w-9 items-center justify-center rounded-full px-1 text-[0.8rem] font-semibold transition-all duration-150 {p ===
								data.page
									? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
									: 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-secondary)]'}"
								aria-current={p === data.page ? 'page' : undefined}
							>
								{p}
							</button>
						{/each}

						<button
							onclick={() => goToPage(data.page + 1)}
							disabled={data.page >= data.totalPages}
							class="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-secondary)] disabled:pointer-events-none disabled:opacity-30"
							aria-label="Next page"
						>
							<ChevronRight size={16} />
						</button>
					</nav>
				{/if}
			{:else}
				<!-- Empty state -->
				<div class="flex flex-col items-center px-4 pt-16 pb-24 text-center">
					<div
						class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-secondary)]"
					>
						<SearchX size={28} class="text-[var(--color-text-tertiary)]" />
					</div>
					<h2
						class="mt-5 text-[1.1rem] font-bold tracking-tight text-[var(--color-foreground)]"
					>
						No vehicles found
					</h2>
					<p
						class="mt-2 max-w-sm text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)]"
					>
						{#if data.query}
							Nothing matched <strong>"{data.query}"</strong> with your current filters.
							Try broadening your search or picking a different category.
						{:else}
							No listings match your current filters. Try removing some filters.
						{/if}
					</p>

					{#if hasActiveFilters}
						<button
							onclick={clearAllFilters}
							class="mt-5 rounded-full bg-[var(--color-foreground)] px-5 py-2.5 text-[0.8rem] font-semibold text-[var(--color-background)] transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
						>
							Clear all filters
						</button>
					{/if}

					<div class="mt-8">
						<p class="mb-3 text-[0.75rem] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
							Try a popular search
						</p>
						<div class="flex flex-wrap justify-center gap-2">
							{#each chips as chip (chip)}
								<a
									href="/vehicles?q={encodeURIComponent(chip)}"
									class="rounded-full border border-[var(--color-border)] px-3.5 py-2 text-[0.775rem] font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
								>
									{chip}
								</a>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Backdrop for mobile filters -->
{#if filtersOpen}
	<button
		class="fixed inset-0 z-20 bg-black/20 backdrop-blur-[2px] lg:hidden"
		onclick={() => (filtersOpen = false)}
		aria-label="Close filters"
	></button>
{/if}

<style>
	@keyframes cardIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
