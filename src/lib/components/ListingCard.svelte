<script lang="ts">
	import type { Listing } from '$lib/types/listing';
	import SignalBadge from './SignalBadge.svelte';
	import { Eye, MapPin, Gauge } from 'lucide-svelte';

	interface Props {
		listing: Listing;
		showWatcherCount?: boolean;
	}

	let { listing, showWatcherCount = false }: Props = $props();

	const formatPrice = (n: number) =>
		new Intl.NumberFormat('en-CA', {
			style: 'currency',
			currency: 'CAD',
			maximumFractionDigits: 0
		}).format(n);

	const formatMileage = (n: number) =>
		new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 }).format(n) + ' km';
</script>

<a
	href="/vehicles/{listing.id}"
	class="group block rounded-2xl transition-all duration-300 ease-out hover:shadow-[0_4px_24px_-4px_oklch(15%_0.01_260/0.08)] focus-visible:outline-2 focus-visible:outline-offset-4"
>
	<!-- Photo -->
	<div
		class="relative overflow-hidden rounded-2xl bg-[var(--color-secondary)]"
		style="aspect-ratio: 3/2;"
	>
		<img
			src={listing.photos[0]}
			alt="{listing.year} {listing.make} {listing.model}"
			class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
			loading="lazy"
		/>

		{#if showWatcherCount && listing.watcherCount > 0}
			<div
				class="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-[oklch(10%_0.005_260/0.65)] px-2.5 py-1 text-[0.7rem] font-semibold text-white backdrop-blur-md"
			>
				<Eye size={11} />
				{listing.watcherCount} watching
			</div>
		{/if}
	</div>

	<!-- Details -->
	<div class="px-0.5 pt-3.5">
		<!-- Year + trim -->
		<p class="text-[0.8rem] font-medium text-[var(--color-text-secondary)]">
			{listing.year} · {listing.trim}
		</p>

		<!-- Make / Model -->
		<h3
			class="mt-0.5 text-[0.95rem] leading-snug font-semibold text-[var(--color-foreground)] transition-colors duration-150 group-hover:text-[var(--color-primary)]"
		>
			{listing.make}
			{listing.model}
		</h3>

		<!-- Price -->
		<p class="mt-2 text-xl font-bold tracking-tight text-[var(--color-foreground)] tabular-nums">
			{formatPrice(listing.price)}
		</p>

		<!-- Badges -->
		<div class="mt-2.5 flex flex-wrap gap-1.5">
			<SignalBadge variant={listing.priceBadge} compact />
			<SignalBadge variant={listing.mileageBadge} compact />
		</div>

		<!-- Meta -->
		<div class="mt-3 flex items-center gap-3.5 text-[0.775rem] text-[var(--color-text-tertiary)]">
			<span class="flex items-center gap-1">
				<Gauge size={13} />
				{formatMileage(listing.mileage)}
			</span>
			<span class="flex items-center gap-1">
				<MapPin size={13} />
				{listing.location}
			</span>
		</div>
	</div>
</a>
