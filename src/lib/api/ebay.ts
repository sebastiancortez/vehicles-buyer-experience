/**
 * Stub eBay API client — same response shape as mock.ts.
 * Swap in real Browse API credentials via USE_MOCK_API=false + EBAY_API_KEY env vars.
 */
import type { Listing } from '$lib/types/listing';

export async function getListings(_query?: string): Promise<Listing[]> {
	throw new Error('eBay API client not yet implemented. Set USE_MOCK_API=true to use mock data.');
}

export async function getListing(_id: string): Promise<Listing | null> {
	throw new Error('eBay API client not yet implemented. Set USE_MOCK_API=true to use mock data.');
}
