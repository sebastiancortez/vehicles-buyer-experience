<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { Compass } from 'lucide-svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<!-- Nav -->
	<header
		class="sticky top-0 z-40 bg-[var(--color-background)]/[0.88] backdrop-blur-2xl"
	>
		<div
			class="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-6 lg:h-16 lg:px-8"
		>
			<!-- Wordmark — eBay-colored -->
			<a href="/" class="flex items-baseline gap-1 text-[1.1rem] font-extrabold tracking-[-0.02em]">
				<span aria-label="Vehicles"><span class="text-[#E53238]">V</span><span class="text-[#0064D2]">e</span><span class="text-[#F5AF02]">h</span><span class="text-[#86B817]">i</span><span class="text-[#E53238]">c</span><span class="text-[#0064D2]">l</span><span class="text-[#F5AF02]">e</span><span class="text-[#86B817]">s</span></span>
			</a>

			<!-- Right actions -->
			<div class="flex items-center gap-2">
				<a
					href="/vehicles"
					class="inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-[0.8rem] font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] {$page.url.pathname.startsWith('/vehicles')
						? 'bg-[var(--color-secondary)] text-[var(--color-foreground)]'
						: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]'}"
				>
					<Compass size={14} />
					Explore
				</a>
			</div>
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="py-12">
		<div class="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between">
				<div>
					<span class="text-sm font-bold" aria-label="Vehicles"><span class="text-[#E53238]">V</span><span class="text-[#0064D2]">e</span><span class="text-[#F5AF02]">h</span><span class="text-[#86B817]">i</span><span class="text-[#E53238]">c</span><span class="text-[#0064D2]">l</span><span class="text-[#F5AF02]">e</span><span class="text-[#86B817]">s</span></span>
					<p class="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
						Buyer Experience POC — mock data only
					</p>
				</div>
			</div>
		</div>
	</footer>
</div>
