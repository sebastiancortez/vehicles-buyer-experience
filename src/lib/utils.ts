import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Component, ComponentProps } from 'svelte';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
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
