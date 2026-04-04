import { error } from '@sveltejs/kit';
import { getListing } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const listing = await getListing(params.id);

	if (!listing) {
		error(404, { message: 'Listing not found' });
	}

	return { listing };
};
