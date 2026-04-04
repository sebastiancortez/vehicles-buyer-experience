import type { Listing } from '$lib/types/listing';
import { mockListings } from './mock.js';

export async function getListings(query?: string): Promise<Listing[]> {
	if (!query) return mockListings;
	const q = query.toLowerCase();
	return mockListings.filter(
		(l) =>
			l.title.toLowerCase().includes(q) ||
			l.make.toLowerCase().includes(q) ||
			l.model.toLowerCase().includes(q) ||
			l.trim.toLowerCase().includes(q) ||
			l.description.toLowerCase().includes(q) ||
			String(l.year).includes(q)
	);
}

export async function getListing(id: string): Promise<Listing | null> {
	return mockListings.find((l) => l.id === id) ?? null;
}
