import { getListings } from '$lib/api';
import type {
	Listing,
	Condition,
	SellerType,
	PriceBadge,
	MileageBadge,
	Transmission,
	Drivetrain
} from '$lib/types/listing';
import type { PageServerLoad } from './$types';

/* ── Category aliases for broad text searches ──────────────────────────── */

const CATEGORY_ALIASES: Record<string, string[]> = {
	truck: ['f-150', 'silverado', 'ram 1500', 'supercrew', 'crew cab'],
	trucks: ['f-150', 'silverado', 'ram 1500', 'supercrew', 'crew cab'],
	sedan: ['civic', 'camry', 'accord', '3 series', '330i', 'wrx'],
	sedans: ['civic', 'camry', 'accord', '3 series', '330i', 'wrx'],
	suv: [
		'cr-v',
		'rav4',
		'cx-5',
		'tucson',
		'q5',
		'telluride',
		'cherokee',
		'outback',
		'model y',
		'bronco'
	],
	suvs: [
		'cr-v',
		'rav4',
		'cx-5',
		'tucson',
		'q5',
		'telluride',
		'cherokee',
		'outback',
		'model y',
		'bronco'
	],
	ev: ['tesla', 'model y', 'prius'],
	electric: ['tesla', 'model y'],
	exotic: ['911', 'carrera', 'gt-r', 'r8', 'supra', 'm3'],
	exotics: ['911', 'carrera', 'gt-r', 'r8', 'supra', 'm3'],
	vintage: ['mustang fastback', '325is', 'e30', '1967', '1989', '1994'],
	classic: ['mustang fastback', '325is', 'e30', '1967', '1989', '1994'],
	classics: ['mustang fastback', '325is', 'e30', '1967', '1989', '1994'],
	project: ['project', 'restoration', 'boxed', 'rolling', 'incomplete'],
	projects: ['project', 'restoration', 'boxed', 'rolling', 'incomplete'],
	manual: ['6mt', '5-speed', 'six-speed', 'manual'],
	coupe: ['911', 'mustang', 'gt-r', 'r8', 'supra', 'm3'],
	coupes: ['911', 'mustang', 'gt-r', 'r8', 'supra', 'm3'],
	enthusiast: ['gti', 'wrx', '911', 'gt-r', 'r8', 'supra', 'm3', '325is'],
	enthusiasts: ['gti', 'wrx', '911', 'gt-r', 'r8', 'supra', 'm3', '325is']
};

const NOISE_WORDS = new Set([
	'reliable',
	'first',
	'car',
	'cars',
	'family',
	'budget',
	'weekend',
	'a',
	'the',
	'for',
	'and',
	'or'
]);

/* ── Query parser — extracts structured filters from free-text chips ──── */

interface ParsedQuery {
	text: string;
	maxPrice?: number;
	mileageBadge?: MileageBadge;
}

function parseSearchQuery(q: string): ParsedQuery {
	let text = q;
	let maxPrice: number | undefined;
	let mileageBadge: MileageBadge | undefined;

	// "under $15k", "under $10,000", "under $20k"
	const priceMatch = text.match(/under\s+\$(\d{1,3}),?(\d{0,3})\s*k?/i);
	if (priceMatch) {
		const raw = priceMatch[1] + (priceMatch[2] || '');
		let num = parseInt(raw);
		if (num < 200) num *= 1000;
		maxPrice = num;
		text = text.replace(priceMatch[0], '');
	}

	// "low mileage"
	if (/low\s+mileage/i.test(text)) {
		mileageBadge = 'low';
		text = text.replace(/low\s+mileage/i, '');
	}

	// Strip noise words, collapse whitespace
	text = text
		.split(/\s+/)
		.filter((w) => w && !NOISE_WORDS.has(w.toLowerCase()))
		.join(' ')
		.trim();

	return { text, maxPrice, mileageBadge };
}

/* ── Text matcher — field search + category aliases ───────────────────── */

function textMatchesListing(listing: Listing, query: string): boolean {
	if (!query) return true;
	const words = query.toLowerCase().split(/\s+/).filter(Boolean);

	return words.every((word) => {
		const haystack = [
			listing.title,
			listing.make,
			listing.model,
			listing.trim,
			listing.description,
			String(listing.year)
		].map((f) => f.toLowerCase());

		if (haystack.some((f) => f.includes(word))) return true;

		const aliases = CATEGORY_ALIASES[word];
		if (aliases) {
			return haystack.some((f) => aliases.some((a) => f.includes(a)));
		}
		return false;
	});
}

/* ── Sorting ──────────────────────────────────────────────────────────── */

export type SortKey = 'best' | 'price_asc' | 'price_desc' | 'mileage' | 'newest';

const PRICE_BADGE_RANK: Record<PriceBadge, number> = {
	below_market: 0,
	fair: 1,
	above_market: 2
};

function queryRelevanceScore(listing: Listing, query: string): number {
	if (!query) return 0;

	const normalizedQuery = query.toLowerCase().trim();
	const words = normalizedQuery.split(/\s+/).filter(Boolean);
	const title = listing.title.toLowerCase();
	const make = listing.make.toLowerCase();
	const model = listing.model.toLowerCase();
	const trim = listing.trim.toLowerCase();
	const description = listing.description.toLowerCase();
	const year = String(listing.year);

	let score = 0;

	if (title.includes(normalizedQuery)) score += 120;
	if (`${make} ${model}`.includes(normalizedQuery)) score += 100;
	if (`${year} ${make} ${model} ${trim}`.toLowerCase().includes(normalizedQuery)) score += 90;

	for (const word of words) {
		if (title.includes(word)) score += 30;
		if (make === word) score += 24;
		if (model.includes(word)) score += 24;
		if (trim.includes(word)) score += 14;
		if (description.includes(word)) score += 6;
		if (year === word) score += 18;

		const aliases = CATEGORY_ALIASES[word];
		if (aliases) {
			const aliasHits = aliases.filter(
				(alias) =>
					title.includes(alias) ||
					model.includes(alias) ||
					trim.includes(alias) ||
					description.includes(alias)
			).length;
			score += aliasHits * 10;
		}
	}

	return score;
}

function sortListings(listings: Listing[], sort: SortKey, query = ''): Listing[] {
	const sorted = [...listings];
	switch (sort) {
		case 'best':
			sorted.sort((a, b) => {
				const relevance = queryRelevanceScore(b, query) - queryRelevanceScore(a, query);
				if (relevance !== 0) return relevance;

				const badge = PRICE_BADGE_RANK[a.priceBadge] - PRICE_BADGE_RANK[b.priceBadge];
				if (badge !== 0) return badge;
				return b.watcherCount + b.saveCount - (a.watcherCount + a.saveCount);
			});
			break;
		case 'price_asc':
			sorted.sort((a, b) => a.price - b.price);
			break;
		case 'price_desc':
			sorted.sort((a, b) => b.price - a.price);
			break;
		case 'mileage':
			sorted.sort((a, b) => a.mileage - b.mileage);
			break;
		case 'newest':
			sorted.sort((a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime());
			break;
	}
	return sorted;
}

/* ── Load ─────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const minPrice = Number(url.searchParams.get('minPrice')) || undefined;
	const maxPriceParam = Number(url.searchParams.get('maxPrice')) || undefined;
	const minMileage = Number(url.searchParams.get('minMileage')) || undefined;
	const maxMileage = Number(url.searchParams.get('maxMileage')) || undefined;
	const conditionParam = url.searchParams.get('condition');
	const sellerTypeParam = url.searchParams.get('sellerType') as SellerType | null;
	const transmissionParam = url.searchParams.get('transmission') as Transmission | null;
	const drivetrainParam = url.searchParams.get('drivetrain') as Drivetrain | null;
	const sort = (url.searchParams.get('sort') as SortKey) || 'best';
	const pageNum = Math.max(1, Number(url.searchParams.get('page')) || 1);

	const conditions = conditionParam ? (conditionParam.split(',') as Condition[]) : undefined;

	// Parse embedded filters from query text
	const parsed = parseSearchQuery(q);
	const effectiveMaxPrice = maxPriceParam ?? parsed.maxPrice;

	const allListings = await getListings();

	// Filter
	let filtered = allListings.filter((listing) => {
		if (!textMatchesListing(listing, parsed.text)) return false;
		if (minPrice && listing.price < minPrice) return false;
		if (effectiveMaxPrice && listing.price > effectiveMaxPrice) return false;
		if (minMileage && listing.mileage < minMileage) return false;
		if (maxMileage && listing.mileage > maxMileage) return false;
		if (parsed.mileageBadge && listing.mileageBadge !== parsed.mileageBadge) return false;
		if (conditions?.length && !conditions.includes(listing.condition)) return false;
		if (sellerTypeParam && listing.seller.type !== sellerTypeParam) return false;
		if (transmissionParam && listing.transmission !== transmissionParam) return false;
		if (drivetrainParam && listing.drivetrain !== drivetrainParam) return false;
		return true;
	});

	// Sort
	filtered = sortListings(filtered, sort, parsed.text);

	// Paginate
	const totalResults = filtered.length;
	const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
	const safePage = Math.min(pageNum, totalPages);
	const start = (safePage - 1) * PAGE_SIZE;
	const results = filtered.slice(start, start + PAGE_SIZE);

	return {
		results,
		query: q,
		sort,
		page: safePage,
		totalResults,
		totalPages,
		filters: {
			minPrice: minPrice ?? null,
			maxPrice: maxPriceParam ?? null,
			minMileage: minMileage ?? null,
			maxMileage: maxMileage ?? null,
			condition: conditions ?? null,
			sellerType: sellerTypeParam ?? null,
			transmission: transmissionParam ?? null,
			drivetrain: drivetrainParam ?? null
		},
		parsedFilters: {
			maxPrice: parsed.maxPrice ?? null,
			mileageBadge: parsed.mileageBadge ?? null
		}
	};
};
