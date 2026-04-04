<script lang="ts">
	import type { Listing } from '$lib/types/listing';
	import SignalBadge from './SignalBadge.svelte';
	import { Eye, MapPin, Gauge } from 'lucide-svelte';

	interface Props {
		listing: Listing;
		showWatcherCount?: boolean;
	}

	let { listing, showWatcherCount = false }: Props = $props();

	const imageFallback = `data:image/svg+xml;utf8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640" role="img" aria-label="Vehicle photo unavailable">
			<defs>
				<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color="#f2ede4" />
					<stop offset="100%" stop-color="#d7c4a8" />
				</linearGradient>
			</defs>
			<rect width="960" height="640" fill="url(#bg)" />
			<rect x="96" y="392" width="768" height="20" rx="10" fill="#b28b52" opacity="0.35" />
			<path d="M236 374h72l64-126h216l84 32 54 94h32c29 0 54 24 54 54v24H180v-24c0-30 24-54 56-54zm150-92-38 76h334l-31-54-57-22z" fill="#6f5733" opacity="0.9" />
			<circle cx="318" cy="448" r="54" fill="#2f2c27" />
			<circle cx="318" cy="448" r="25" fill="#d6d3cc" />
			<circle cx="666" cy="448" r="54" fill="#2f2c27" />
			<circle cx="666" cy="448" r="25" fill="#d6d3cc" />
			<text x="480" y="168" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#503f28">Vehicle photo unavailable</text>
		</svg>`
	)}`;

	const formatPrice = (n: number) =>
		new Intl.NumberFormat('en-CA', {
			style: 'currency',
			currency: 'CAD',
			maximumFractionDigits: 0
		}).format(n);

	const formatMileage = (n: number) =>
		new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 }).format(n) + ' km';

	const handleImageError = (e: Event) => {
		const img = e.currentTarget as HTMLImageElement;
		if (img.src !== imageFallback) {
			img.src = imageFallback;
		}
	};
</script>

<a
	href="/vehicles/{listing.id}"
	class="group block rounded-2xl bg-[var(--color-surface)] p-2.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_8px_32px_-8px_oklch(52%_0.24_264/0.1)] focus-visible:outline-2 focus-visible:outline-offset-4"
>
	<!-- Photo -->
	<div class="relative overflow-hidden rounded-xl bg-[var(--color-secondary)]" style="aspect-ratio: 3/2;">
		<img
			src={listing.photos[0] ?? imageFallback}
			alt="{listing.year} {listing.make} {listing.model}"
			class="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
			loading="lazy"
			onerror={handleImageError}
		/>

		{#if showWatcherCount && listing.watcherCount > 0}
			<div
				class="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-[oklch(10%_0.005_260/0.6)] px-2.5 py-1 text-[0.7rem] font-semibold text-white backdrop-blur-xl"
			>
				<Eye size={11} />
				{listing.watcherCount} watching
			</div>
		{/if}
	</div>

	<!-- Details -->
	<div class="px-1 pt-3.5 pb-1">
		<!-- Year + trim -->
		<p class="text-[0.775rem] font-medium text-[var(--color-text-tertiary)]">
			{listing.year} · {listing.trim}
		</p>

		<!-- Make / Model -->
		<h3
			class="mt-0.5 text-[0.925rem] leading-snug font-semibold text-[var(--color-foreground)] transition-colors duration-200 group-hover:text-[var(--color-primary)]"
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
		<div class="mt-3 flex items-center gap-3.5 text-[0.75rem] text-[var(--color-text-tertiary)]">
			<span class="flex items-center gap-1">
				<Gauge size={12} />
				{formatMileage(listing.mileage)}
			</span>
			<span class="rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--color-text-secondary)] capitalize">
				{listing.condition}
			</span>
			<span class="flex items-center gap-1">
				<MapPin size={12} />
				{listing.location}
			</span>
		</div>
	</div>
</a>
