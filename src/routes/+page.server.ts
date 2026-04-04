import { getListings } from '$lib/api/index.js';

export async function load() {
	const listings = await getListings();

	// Sort by social proof (watchers + saves), take top 8
	const trending = [...listings]
		.sort((a, b) => b.watcherCount + b.saveCount - (a.watcherCount + a.saveCount))
		.slice(0, 8);

	return { trending };
}
