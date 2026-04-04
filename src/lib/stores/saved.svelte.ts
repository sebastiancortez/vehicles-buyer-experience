import { SvelteSet } from 'svelte/reactivity';

/**
 * Session-only saved listings store.
 * Persists across navigation within the current tab.
 * Clears on page refresh — no localStorage, no persistence.
 */
const savedIds = new SvelteSet<string>();

export function isSaved(id: string): boolean {
	return savedIds.has(id);
}

export function toggleSaved(id: string): void {
	if (savedIds.has(id)) {
		savedIds.delete(id);
	} else {
		savedIds.add(id);
	}
}

export function savedCount(): number {
	return savedIds.size;
}
