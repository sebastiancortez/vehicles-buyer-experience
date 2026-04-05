<script lang="ts">
	import SearchBar from '$lib/components/SearchBar.svelte';
	import TrendingListings from '$lib/components/TrendingListings.svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const chips = [
		'Reliable under $15k',
		'Family SUVs',
		'Manual enthusiast cars',
		'Exotic weekend cars',
		'Vintage project cars'
	];

	function navigateChip(chip: string) {
		goto(`/vehicles?q=${encodeURIComponent(chip)}`);
	}
</script>

<svelte:head>
	<title>Vehicles — Find your next car with confidence</title>
</svelte:head>

<!-- Hero -->
<section class="px-5 pt-20 pb-16 sm:px-6 sm:pt-32 sm:pb-24 lg:px-8">
	<div class="mx-auto max-w-2xl">
		<div class="text-center">
			<h1
				class="text-[clamp(1.85rem,5vw,3rem)] leading-[1.08] font-extrabold tracking-[-0.025em] text-[var(--color-foreground)]"
			>
				Find your next car
			</h1>
			<p
				class="mt-3.5 text-[clamp(0.9rem,2vw,1.05rem)] leading-relaxed text-[var(--color-text-secondary)]"
			>
				AI-powered insights on pricing, reliability, originality, and what to ask the seller.
			</p>
		</div>

		<!-- Search — Shop-style floating pill -->
		<div class="mt-10">
			<SearchBar />
		</div>

		<!-- Chips -->
		<div class="mt-5 flex flex-wrap items-center justify-center gap-2">
			{#each chips as chip, i (chip)}
				<button
					onclick={() => navigateChip(chip)}
					class="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[0.8rem] font-medium text-[var(--color-text-secondary)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] active:scale-[0.97]"
					style="animation: chipIn 0.4s {60 * i}ms cubic-bezier(0.16, 1, 0.3, 1) both;"
				>
					{chip}
				</button>
			{/each}
		</div>
	</div>
</section>

<!-- Trending -->
<section class="px-5 py-16 sm:px-6 sm:py-24 lg:px-8">
	<div class="mx-auto max-w-6xl">
		<TrendingListings listings={data.trending} />
	</div>
</section>

<style>
	@keyframes chipIn {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
