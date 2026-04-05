import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Component, ComponentProps } from 'svelte';
import type { Listing } from '$lib/types/listing';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

function escapeSvgText(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function buildVehicleImageFallback(listing: Listing) {
	const title = `${listing.year} ${listing.make} ${listing.model}`;
	const subtitle = listing.trim;
	const meta = [
		listing.transmission === 'cvt'
			? 'CVT'
			: listing.transmission.charAt(0).toUpperCase() + listing.transmission.slice(1),
		listing.drivetrain.toUpperCase(),
		listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)
	].join(' • ');

	const palette =
		listing.condition === 'salvage'
			? { start: '#f3e4de', end: '#ddb4a6', accent: '#7f3b2e', surface: '#f7f1ec' }
			: listing.transmission === 'manual'
				? { start: '#ece6d8', end: '#cbb58c', accent: '#6b4f1d', surface: '#f8f4ed' }
				: listing.drivetrain === 'awd' || listing.drivetrain === '4wd'
					? { start: '#dde8e2', end: '#9bb9a5', accent: '#2f5a47', surface: '#f3f7f4' }
					: { start: '#e8eaee', end: '#bcc6d5', accent: '#3f556f', surface: '#f5f7fa' };

	return `data:image/svg+xml;utf8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640" role="img" aria-label="${escapeSvgText(title)} image placeholder">
			<defs>
				<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color="${palette.start}" />
					<stop offset="100%" stop-color="${palette.end}" />
				</linearGradient>
			</defs>
			<rect width="960" height="640" fill="url(#bg)" />
			<rect x="56" y="40" width="848" height="560" rx="34" fill="${palette.surface}" opacity="0.5" />
			<rect x="116" y="404" width="728" height="16" rx="8" fill="${palette.accent}" opacity="0.22" />
			<path d="M248 386h60l84-112h196l90 31 64 81h40c34 0 62 28 62 62v12H186v-14c0-33 28-60 62-60zm160-76-42 52h334l-34-42-57-20H452z" fill="${palette.accent}" opacity="0.9" />
			<circle cx="322" cy="446" r="46" fill="#2e3135" />
			<circle cx="322" cy="446" r="20" fill="#ece7dd" />
			<circle cx="670" cy="446" r="46" fill="#2e3135" />
			<circle cx="670" cy="446" r="20" fill="#ece7dd" />
			<text x="120" y="138" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#1b1f24">${escapeSvgText(title)}</text>
			<text x="120" y="188" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="${palette.accent}">${escapeSvgText(subtitle)}</text>
			<text x="120" y="234" font-family="Arial, sans-serif" font-size="22" fill="#4d5560">${escapeSvgText(meta)}</text>
			<text x="120" y="542" font-family="Arial, sans-serif" font-size="22" fill="#4d5560">Photo pending for this mock listing</text>
		</svg>`
	)}`;
}

export function resolveListingPhoto(photo: string | undefined, listing: Listing) {
	if (!photo || photo.includes('picsum.photos/seed/lst-')) {
		return buildVehicleImageFallback(listing);
	}

	return photo;
}

// Utility types used by shadcn-svelte components
export type WithElementRef<T, E extends Element = Element> = T & {
	ref?: E | null;
};

export type WithoutChildren<T> = Omit<T, 'children'>;

export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'>;

export type WithChild<
	T,
	TChild extends Component = Component,
	TChildProps extends Record<string, unknown> = ComponentProps<TChild>
> = Omit<T, 'child' | 'children'> & {
	child?: TChild;
	children?: import('svelte').Snippet;
	childProps?: TChildProps;
};
