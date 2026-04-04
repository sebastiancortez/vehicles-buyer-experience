<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search } from 'lucide-svelte';

	let query = $state('');

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
	<div class="relative">
		<Search
			size={20}
			class="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-text-tertiary)]"
		/>
		<input
			type="text"
			bind:value={query}
			placeholder="Search by make, model, or keyword..."
			class="h-13 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3.5 pr-28 pl-12 text-[0.95rem] font-medium text-[var(--color-foreground)] shadow-[0_2px_12px_-2px_oklch(15%_0.01_260/0.06)] transition-all duration-200 outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:shadow-[0_2px_20px_-2px_oklch(48%_0.115_160/0.12)] sm:h-14 sm:text-base"
		/>
		<button
			type="submit"
			class="absolute top-1/2 right-2 -translate-y-1/2 rounded-xl bg-[var(--color-primary)] px-5 py-2 text-[0.8rem] font-semibold text-[var(--color-primary-foreground)] transition-all duration-200 hover:opacity-90 active:scale-[0.97] sm:px-6 sm:py-2.5 sm:text-[0.85rem]"
		>
			Search
		</button>
	</div>
</form>
