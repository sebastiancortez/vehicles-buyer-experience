<script lang="ts">
	import type { Listing } from '$lib/types/listing';
	import ListingCard from './ListingCard.svelte';
	import { TrendingUp, ArrowRight } from 'lucide-svelte';

	interface Props {
		listings: Listing[];
	}

	let { listings }: Props = $props();
</script>

<section>
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div
				class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-light)]"
			>
				<TrendingUp size={16} class="text-[var(--color-primary)]" />
			</div>
			<div>
				<h2 class="text-[1.1rem] font-bold text-[var(--color-foreground)]">Trending now</h2>
				<p class="text-[0.775rem] text-[var(--color-text-tertiary)]">Most watched this week</p>
			</div>
		</div>
		<a
			href="/vehicles"
			class="group flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.8rem] font-semibold text-[var(--color-primary)] transition-all duration-200 hover:bg-[var(--color-primary-light)]"
		>
			View all
			<ArrowRight
				size={14}
				class="transition-transform duration-200 group-hover:translate-x-0.5"
			/>
		</a>
	</div>

	<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
		{#each listings as listing, i (listing.id)}
			<div style="animation: cardIn 0.45s {80 * i}ms cubic-bezier(0.16, 1, 0.3, 1) both;">
				<ListingCard {listing} showWatcherCount />
			</div>
		{/each}
	</div>
</section>

<style>
	@keyframes cardIn {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
