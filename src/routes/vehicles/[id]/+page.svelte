<script lang="ts">
	import type { PageData } from './$types';
	import type { ConfidencePayload } from '$lib/types/confidence';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import SignalBadge from '$lib/components/SignalBadge.svelte';
	import StickyPanel from '$lib/components/StickyPanel.svelte';
	import ConfidencePanel from '$lib/components/ConfidencePanel.svelte';
	import ConfidenceDrawer from '$lib/components/ConfidenceDrawer.svelte';
	import ContactModal from '$lib/components/ContactModal.svelte';
	import { isSaved, toggleSaved } from '$lib/stores/saved.svelte';
	import { buildVehicleImageFallback, resolveListingPhoto } from '$lib/utils';
	import {
		ChevronLeft,
		ChevronRight,
		MapPin,
		Calendar,
		Star,
		User,
		Eye,
		Heart,
		ArrowLeft,
		Share2
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const listing = $derived(data.listing);
	const searchQuery = $derived(page.url.searchParams.get('q') || undefined);
	let panelExpanded = $state(false);

	/* ── Slice 6: contact + save state ── */
	let isContactModalOpen = $state(false);
	let currentAnalysis = $state<ConfidencePayload | null>(null);
	const analysisReady = $derived(currentAnalysis !== null);
	const listingSaved = $derived(isSaved(listing.id));

	function handleAnalysisLoaded(a: ConfidencePayload) {
		currentAnalysis = a;
	}

	function openContactModal() {
		isContactModalOpen = true;
	}

	/* ── Slice 7: chat drawer state ── */
	let isDrawerOpen = $state(false);

	function openDrawer() {
		isDrawerOpen = true;
	}

	function closeDrawer() {
		isDrawerOpen = false;
	}

	/* ── Gallery state ── */
	let activeIndex = $state(0);
	let galleryFocused = $state(false);
	let touchStartX = 0;
	let touchStartY = 0;

	const imageFallback = $derived(buildVehicleImageFallback(listing));
	const galleryPhotos = $derived(
		listing.photos.map((photo) => resolveListingPhoto(photo, listing))
	);

	function nextPhoto() {
		activeIndex = (activeIndex + 1) % galleryPhotos.length;
	}
	function prevPhoto() {
		activeIndex = (activeIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
	}
	function goToPhoto(i: number) {
		activeIndex = i;
	}

	function handleGalleryKeydown(e: KeyboardEvent) {
		if (!galleryFocused || galleryPhotos.length <= 1) return;
		if (e.key === 'ArrowRight') nextPhoto();
		else if (e.key === 'ArrowLeft') prevPhoto();
	}

	function handleTouchStart(e: TouchEvent) {
		const touch = e.changedTouches[0];
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		if (galleryPhotos.length <= 1) return;

		const touch = e.changedTouches[0];
		const deltaX = touch.clientX - touchStartX;
		const deltaY = touch.clientY - touchStartY;

		if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;

		if (deltaX < 0) nextPhoto();
		else prevPhoto();
	}

	function handleImageError(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		if (img.src !== imageFallback) {
			img.src = imageFallback;
		}
	}

	/* ── Formatters ── */
	const fmt = {
		price: (n: number) =>
			new Intl.NumberFormat('en-CA', {
				style: 'currency',
				currency: 'CAD',
				maximumFractionDigits: 0
			}).format(n),
		mileage: (n: number) =>
			new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 }).format(n) + ' km',
		date: (s: string) => new Date(s).toLocaleDateString('en-CA', { year: 'numeric', month: 'long' })
	};

	const priceDiff = $derived(listing.marketAverage - listing.price);
	const priceDiffAbs = $derived(Math.abs(priceDiff));
	const priceDirection = $derived(priceDiff > 0 ? 'below' : priceDiff < 0 ? 'above' : 'at');

	/* ── Spec rows ── */
	const specs = $derived([
		{ label: 'Year', value: String(listing.year) },
		{ label: 'Make', value: listing.make },
		{ label: 'Model', value: listing.model },
		{ label: 'Trim', value: listing.trim },
		{ label: 'Mileage', value: fmt.mileage(listing.mileage) },
		{
			label: 'Condition',
			value: listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)
		},
		{
			label: 'Transmission',
			value:
				listing.transmission === 'cvt'
					? 'CVT'
					: listing.transmission.charAt(0).toUpperCase() + listing.transmission.slice(1)
		},
		{ label: 'Drivetrain', value: listing.drivetrain.toUpperCase() },
		{ label: 'Color', value: listing.color },
		{ label: 'VIN', value: listing.vin }
	]);

	function scrollToAnalysis() {
		panelExpanded = true;
		tick().then(() => {
			document.getElementById('confidence-panel')?.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});
		});
	}
</script>

<svelte:head>
	<title>{listing.title} — Vehicles</title>
	<meta
		name="description"
		content="{listing.year} {listing.make} {listing.model} {listing.trim} — {fmt.price(
			listing.price
		)} — {listing.location}"
	/>
</svelte:head>

<svelte:window onkeydown={handleGalleryKeydown} />

<!-- Back bar -->
<div class="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6 lg:px-8">
		<a
			href="/vehicles{searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}"
			class="flex items-center gap-1.5 text-[0.8rem] font-medium text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-foreground)]"
		>
			<ArrowLeft size={15} />
			Back to results
		</a>
		<div class="flex items-center gap-4 text-[0.75rem] text-[var(--color-text-tertiary)]">
			{#if listing.watcherCount > 0}
				<span class="flex items-center gap-1">
					<Eye size={13} />
					{listing.watcherCount} watching
				</span>
			{/if}
			{#if listing.saveCount > 0}
				<span class="flex items-center gap-1">
					<Heart size={13} />
					{listing.saveCount} saved
				</span>
			{/if}
			<button
				class="flex items-center gap-1 transition-colors hover:text-[var(--color-foreground)]"
				aria-label="Share listing"
			>
				<Share2 size={13} />
				Share
			</button>
		</div>
	</div>
</div>

<!-- Main content -->
<div class="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
	<div class="grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-12">
		<!-- Left column: gallery + details -->
		<div class="min-w-0">
			<!-- Gallery -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<section
				aria-label="Photo gallery"
				aria-roledescription="carousel"
				tabindex="0"
				onfocus={() => (galleryFocused = true)}
				onblur={() => (galleryFocused = false)}
				ontouchstart={handleTouchStart}
				ontouchend={handleTouchEnd}
				class="relative overflow-hidden rounded-2xl bg-[var(--color-secondary)] focus-visible:outline-2 focus-visible:outline-offset-4"
			>
				<!-- Main image -->
				<div style="aspect-ratio: 16/10;" class="relative">
					{#each galleryPhotos as photo, i (i)}
						<img
							src={photo}
							alt="{listing.title} — photo {i + 1} of {galleryPhotos.length}"
							class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] {i ===
							activeIndex
								? 'opacity-100'
								: 'pointer-events-none opacity-0'}"
							loading={i === 0 ? 'eager' : 'lazy'}
							onerror={handleImageError}
							aria-hidden={i !== activeIndex}
						/>
					{/each}

					<!-- Nav arrows -->
					{#if galleryPhotos.length > 1}
						<button
							onclick={prevPhoto}
							class="absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[oklch(10%_0.005_260/0.4)] text-white backdrop-blur-md transition-all duration-200 hover:bg-[oklch(10%_0.005_260/0.6)]"
							aria-label="Previous photo"
						>
							<ChevronLeft size={20} />
						</button>
						<button
							onclick={nextPhoto}
							class="absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[oklch(10%_0.005_260/0.4)] text-white backdrop-blur-md transition-all duration-200 hover:bg-[oklch(10%_0.005_260/0.6)]"
							aria-label="Next photo"
						>
							<ChevronRight size={20} />
						</button>
					{/if}

					<!-- Counter -->
					<div
						class="absolute right-3 bottom-3 rounded-full bg-[oklch(10%_0.005_260/0.5)] px-3 py-1 text-[0.7rem] font-medium text-white backdrop-blur-md"
					>
						{activeIndex + 1} / {galleryPhotos.length}
					</div>
				</div>
			</section>

			<!-- Thumbnail strip -->
			{#if galleryPhotos.length > 1}
				<div
					class="mt-3 flex gap-2 overflow-x-auto pb-1"
					role="tablist"
					aria-label="Photo thumbnails"
				>
					{#each galleryPhotos as photo, i (i)}
						<button
							role="tab"
							aria-selected={i === activeIndex}
							aria-label="View photo {i + 1}"
							onclick={() => goToPhoto(i)}
							class="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg transition-all duration-200 {i ===
							activeIndex
								? 'ring-2 ring-[var(--color-primary)] ring-offset-2'
								: 'opacity-60 hover:opacity-90'}"
						>
							<img
								src={photo}
								alt=""
								class="h-full w-full object-cover"
								loading="lazy"
								onerror={handleImageError}
							/>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Title + price (mobile only — desktop shows in StickyPanel) -->
			<div class="mt-6 lg:hidden">
				<h1
					class="text-[clamp(1.4rem,4vw,1.75rem)] leading-tight font-extrabold tracking-[-0.02em] text-[var(--color-foreground)]"
				>
					{listing.title}
				</h1>
				<div class="mt-3 flex items-baseline gap-3">
					<span
						class="text-2xl font-extrabold tracking-tight text-[var(--color-foreground)] tabular-nums"
					>
						{fmt.price(listing.price)}
					</span>
					<SignalBadge variant={listing.priceBadge} />
				</div>
				<p class="mt-1.5 text-[0.8rem] text-[var(--color-text-secondary)]">
					{#if priceDirection === 'below'}
						{fmt.price(priceDiffAbs)} below market average
					{:else if priceDirection === 'above'}
						{fmt.price(priceDiffAbs)} above market average
					{:else}
						At market average
					{/if}
					<span class="text-[var(--color-text-tertiary)]">
						for {listing.year}
						{listing.make}
						{listing.model}
					</span>
				</p>
			</div>

			<!-- Title (desktop only) -->
			<div class="mt-6 hidden lg:block">
				<h1
					class="text-[1.65rem] leading-tight font-extrabold tracking-[-0.02em] text-[var(--color-foreground)]"
				>
					{listing.title}
				</h1>
				<div class="mt-2 flex items-center gap-3 text-[0.8rem] text-[var(--color-text-secondary)]">
					<span class="flex items-center gap-1">
						<MapPin size={13} />
						{listing.location}
					</span>
					<span class="text-[var(--color-border)]">|</span>
					<span>Listed {fmt.date(listing.listedAt)}</span>
				</div>
			</div>

			<!-- Price in market context (desktop) -->
			<div class="mt-5 hidden rounded-xl bg-[var(--color-secondary)]/50 px-5 py-4 lg:block">
				<div class="flex items-baseline justify-between">
					<div>
						<span
							class="text-[0.75rem] font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase"
						>
							Market comparison
						</span>
						<p class="mt-1 text-[0.875rem] text-[var(--color-foreground)]">
							{#if priceDirection === 'below'}
								<span class="font-bold text-[var(--color-signal-below)]">
									{fmt.price(priceDiffAbs)} below
								</span> market average
							{:else if priceDirection === 'above'}
								<span class="font-bold text-[var(--color-signal-above)]">
									{fmt.price(priceDiffAbs)} above
								</span> market average
							{:else}
								At market average
							{/if}
						</p>
					</div>
					<div class="text-right">
						<span class="text-[0.7rem] text-[var(--color-text-tertiary)]">Avg.</span>
						<p
							class="text-[0.925rem] font-semibold text-[var(--color-text-secondary)] tabular-nums"
						>
							{fmt.price(listing.marketAverage)}
						</p>
					</div>
				</div>
			</div>

			<!-- Description -->
			<div class="mt-8">
				<h2
					class="text-[0.75rem] font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase"
				>
					Description
				</h2>
				<p class="mt-3 text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)]">
					{listing.description}
				</p>
			</div>

			<!-- Spec table -->
			<div class="mt-8">
				<h2
					class="text-[0.75rem] font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase"
				>
					Specifications
				</h2>
				<div class="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)]">
					{#each specs as spec, i (spec.label)}
						<div
							class="flex items-center justify-between px-4 py-3 text-[0.84rem] {i % 2 === 0
								? 'bg-[var(--color-surface)]'
								: 'bg-[var(--color-secondary)]/30'} {i < specs.length - 1
								? 'border-b border-[var(--color-border)]'
								: ''}"
						>
							<span class="font-medium text-[var(--color-text-secondary)]">{spec.label}</span>
							<span class="text-right font-semibold text-[var(--color-foreground)]"
								>{spec.value}</span
							>
						</div>
					{/each}
				</div>
			</div>

			<!-- Seller info -->
			<div class="mt-8">
				<h2
					class="text-[0.75rem] font-semibold tracking-wide text-[var(--color-text-tertiary)] uppercase"
				>
					Seller
				</h2>
				<div
					class="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
				>
					<div class="flex items-start gap-4">
						<!-- Avatar placeholder -->
						<div
							class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)]"
						>
							<User size={20} class="text-[var(--color-text-tertiary)]" />
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="font-semibold text-[var(--color-foreground)]">
									{listing.seller.username}
								</span>
								<span
									class="rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-[0.65rem] font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase"
								>
									{listing.seller.type}
								</span>
							</div>
							<div
								class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.775rem] text-[var(--color-text-secondary)]"
							>
								<span class="flex items-center gap-1">
									<Star size={12} class="text-[var(--color-signal-fair)]" />
									{listing.seller.feedbackScore} feedback ({listing.seller.feedbackPercent}%)
								</span>
								<span class="flex items-center gap-1">
									<MapPin size={12} />
									{listing.seller.location}
								</span>
								<span class="flex items-center gap-1">
									<Calendar size={12} />
									Member since {fmt.date(listing.seller.memberSince)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- AI Confidence Panel -->
			<div id="confidence-panel" class="mt-10">
				<ConfidencePanel
					{listing}
					{searchQuery}
					bind:expanded={panelExpanded}
					onAnalysisLoaded={handleAnalysisLoaded}
					onContactSeller={openContactModal}
					onchatopen={openDrawer}
				/>
			</div>

			<!-- Bottom spacer for mobile sticky bar -->
			<div class="h-20 lg:hidden"></div>
		</div>

		<!-- Right column: StickyPanel (desktop) -->
		<StickyPanel
			{listing}
			onAnalysisClick={scrollToAnalysis}
			{analysisReady}
			onContactSellerClick={openContactModal}
			saved={listingSaved}
			onSaveToggle={() => toggleSaved(listing.id)}
		/>
	</div>
</div>

<!-- Contact Modal (Slice 6) -->
<ContactModal
	bind:open={isContactModalOpen}
	{listing}
	analysis={currentAnalysis}
	buyerIntent={searchQuery}
/>

<!-- Chat Drawer (Slice 7) -->
<ConfidenceDrawer
	open={isDrawerOpen}
	{listing}
	analysis={currentAnalysis}
	{searchQuery}
	onclose={closeDrawer}
/>
