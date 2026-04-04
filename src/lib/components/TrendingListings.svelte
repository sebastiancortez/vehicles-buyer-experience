<script lang="ts">
	import type { Listing } from '$lib/types/listing';
	import ListingCard from './ListingCard.svelte';
	import { TrendingUp } from 'lucide-svelte';

	interface Props {
		listings: Listing[];
	}

	let { listings }: Props = $props();
</script>

<section>
	<div class="mb-6 flex items-center gap-2.5">
		<div
			class="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-primary-light)]"
		>
			<TrendingUp size={16} class="text-[var(--color-primary)]" />
		</div>
		<h2 class="text-lg font-bold text-[var(--color-foreground)]">Trending now</h2>
	</div>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		{#each listings as listing (listing.id)}
			<ListingCard {listing} showWatcherCount />
		{/each}
	</div>
</section>
