<script lang="ts">
	import SearchBar from '$lib/components/SearchBar.svelte';
	import TrendingListings from '$lib/components/TrendingListings.svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const chips = [
		'Reliable under $15k',
		'Low mileage sedans',
		'Family SUVs',
		'First car under $10k',
		'Trucks under $20k'
	];

	function navigateChip(chip: string) {
		goto(`/vehicles?q=${encodeURIComponent(chip)}`);
	}
</script>

<svelte:head>
	<title>Vehicles — Find your next car with confidence</title>
</svelte:head>

<!-- Hero -->
<section class="px-5 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20 lg:px-8">
	<div class="mx-auto max-w-2xl text-center">
		<h1
			class="text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.1] font-extrabold tracking-tight text-[var(--color-foreground)]"
		>
			Find your next car<br />with confidence
		</h1>
		<p class="mt-4 text-[clamp(0.9rem,2vw,1.05rem)] text-[var(--color-text-secondary)]">
			AI-powered insights on pricing, reliability, and what to ask the seller.
		</p>

		<!-- Search -->
		<div class="mt-8">
			<SearchBar />
		</div>

		<!-- Chips -->
		<div class="mt-5 flex flex-wrap items-center justify-center gap-2">
			{#each chips as chip (chip)}
				<button
					onclick={() => navigateChip(chip)}
					class="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[0.8rem] font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-hover)] hover:text-[var(--color-foreground)] active:scale-[0.97]"
				>
					{chip}
				</button>
			{/each}
		</div>
	</div>
</section>

<!-- Trending -->
<section
	class="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-14 sm:px-6 sm:py-20 lg:px-8"
>
	<div class="mx-auto max-w-6xl">
		<TrendingListings listings={data.trending} />
	</div>
</section>
