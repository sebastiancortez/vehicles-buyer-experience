<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { Search, Menu, X } from 'lucide-svelte';

	let { children } = $props();

	let mobileMenuOpen = $state(false);

	function closeMenu() {
		mobileMenuOpen = false;
	}
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

			<!-- Desktop nav -->
			<nav class="hidden items-center gap-0.5 md:flex">
				<a
					href="/vehicles"
					class="rounded-full px-4 py-2 text-[0.825rem] font-medium transition-all duration-200 {$page.url.pathname.startsWith(
						'/vehicles'
					)
						? 'bg-[var(--color-secondary)] text-[var(--color-foreground)]'
						: 'text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]'}"
				>
					Browse
				</a>
				<a
					href="/vehicles?q=Reliable+under+%2415k"
					class="rounded-full px-4 py-2 text-[0.825rem] font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:text-[var(--color-foreground)]"
				>
					Under $15k
				</a>
				<a
					href="/vehicles?q=Family+SUVs"
					class="rounded-full px-4 py-2 text-[0.825rem] font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:text-[var(--color-foreground)]"
				>
					Family SUVs
				</a>
			</nav>

			<!-- Right actions -->
			<div class="flex items-center gap-2">
				<a
					href="/vehicles"
					class="hidden items-center gap-2 rounded-full bg-[var(--color-primary)] px-4.5 py-2 text-[0.8rem] font-semibold text-[var(--color-primary-foreground)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--color-primary-hover)] active:scale-[0.97] sm:inline-flex"
				>
					<Search size={14} />
					Search
				</a>

				<!-- Mobile hamburger -->
				<button
					class="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-secondary)] md:hidden"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					aria-label="Toggle menu"
					aria-expanded={mobileMenuOpen}
				>
					{#if mobileMenuOpen}
						<X size={18} />
					{:else}
						<Menu size={18} />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if mobileMenuOpen}
			<nav
				class="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 pt-2 pb-4 md:hidden"
			>
				<a
					href="/vehicles"
					onclick={closeMenu}
					class="block rounded-xl px-3 py-2.5 text-[0.9rem] font-medium text-[var(--color-foreground)]"
				>
					Browse All
				</a>
				<a
					href="/vehicles?q=Reliable+under+%2415k"
					onclick={closeMenu}
					class="block rounded-xl px-3 py-2.5 text-[0.9rem] font-medium text-[var(--color-text-secondary)]"
				>
					Under $15k
				</a>
				<a
					href="/vehicles?q=Family+SUVs"
					onclick={closeMenu}
					class="block rounded-xl px-3 py-2.5 text-[0.9rem] font-medium text-[var(--color-text-secondary)]"
				>
					Family SUVs
				</a>
			</nav>
		{/if}
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
