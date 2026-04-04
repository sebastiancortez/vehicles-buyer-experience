<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search, ArrowRight } from 'lucide-svelte';

	interface Props {
		initialQuery?: string;
	}

	let { initialQuery: query = '' }: Props = $props();
	let focused = $state(false);

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const trimmed = query.trim();
		if (trimmed) {
			goto(`/vehicles?q=${encodeURIComponent(trimmed)}`);
		} else {
			goto('/vehicles');
		}
	}
</script>

<form onsubmit={handleSubmit} class="relative w-full">
	<div
		class="relative flex items-center rounded-full border bg-[var(--color-surface)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] {focused
			? 'border-[var(--color-primary)] shadow-[0_0_0_3px_oklch(52%_0.24_264/0.1),0_4px_24px_-4px_oklch(52%_0.24_264/0.08)]'
			: 'border-[var(--color-border)] shadow-[0_2px_12px_-2px_oklch(18%_0.015_258/0.06)]'}"
	>
		<Search
			size={18}
			class="ml-5 shrink-0 text-[var(--color-text-tertiary)] transition-colors duration-200 {focused
				? 'text-[var(--color-primary)]'
				: ''}"
		/>
		<input
			type="text"
			bind:value={query}
			onfocus={() => (focused = true)}
			onblur={() => (focused = false)}
			placeholder="What are you looking for?"
			class="h-13 flex-1 bg-transparent px-3.5 text-[0.925rem] font-medium text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-text-tertiary)] sm:h-14 sm:text-[0.975rem]"
		/>
		<button
			type="submit"
			class="group mr-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--color-primary-hover)] active:scale-90 sm:mr-2 sm:h-10 sm:w-10"
		>
			<ArrowRight size={18} class="transition-transform duration-200 group-hover:translate-x-0.5" />
		</button>
	</div>
</form>
