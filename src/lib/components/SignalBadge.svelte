<script lang="ts">
	import type { PriceBadge, MileageBadge } from '$lib/types/listing';

	type BadgeVariant = PriceBadge | MileageBadge;

	interface Props {
		variant: BadgeVariant;
		compact?: boolean;
	}

	let { variant, compact = false }: Props = $props();

	const config: Record<BadgeVariant, { label: string; bg: string; text: string }> = {
		below_market: {
			label: 'Below Market',
			bg: 'bg-[var(--color-signal-below-bg)]',
			text: 'text-[var(--color-signal-below-text)]'
		},
		fair: {
			label: 'Fair Price',
			bg: 'bg-[var(--color-signal-fair-bg)]',
			text: 'text-[var(--color-signal-fair-text)]'
		},
		above_market: {
			label: 'Above Market',
			bg: 'bg-[var(--color-signal-above-bg)]',
			text: 'text-[var(--color-signal-above-text)]'
		},
		low: {
			label: 'Low Miles',
			bg: 'bg-[var(--color-signal-low-bg)]',
			text: 'text-[var(--color-signal-low-text)]'
		},
		average: {
			label: 'Avg Miles',
			bg: 'bg-[var(--color-signal-average-bg)]',
			text: 'text-[var(--color-signal-average-text)]'
		},
		high: {
			label: 'High Miles',
			bg: 'bg-[var(--color-signal-high-bg)]',
			text: 'text-[var(--color-signal-high-text)]'
		}
	};

	const { label, bg, text } = $derived(config[variant]);
</script>

<span
	class="inline-flex items-center rounded-full leading-none font-semibold {bg} {text} {compact
		? 'px-2.5 py-1 text-[0.65rem] tracking-wide'
		: 'px-3 py-1.5 text-xs tracking-wide'}"
>
	{label}
</span>
