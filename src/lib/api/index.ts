import type { Listing } from '$lib/types/listing';
import { mockListings } from './mock.js';
import * as ebay from './ebay.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';

export async function getListings(query?: string): Promise<Listing[]> {
	if (USE_MOCK) {
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
	return ebay.getListings(query);
}

export async function getListing(id: string): Promise<Listing | null> {
	if (USE_MOCK) {
		return mockListings.find((l) => l.id === id) ?? null;
	}
	return ebay.getListing(id);
}
