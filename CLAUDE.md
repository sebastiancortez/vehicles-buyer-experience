# [CLAUDE.md](http://CLAUDE.md)

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vehicles Buyer Experience — a SvelteKit application for vehicle purchasing. Built with Svelte 5 (runes mode enforced), SvelteKit, TypeScript, and Tailwind CSS v4.

## Commands

- **Dev server**: `pnpm dev` (or `pnpm dev --open` to auto-open browser)
- **Build**: `pnpm build`
- **Preview production build**: `pnpm preview`
- **Type checking**: `pnpm check` (one-shot) or `pnpm check:watch` (watch mode)
- **Lint**: `pnpm lint` (runs prettier --check then eslint)
- **Format**: `pnpm format` (prettier --write)

## Tech Stack

- **Framework**: SvelteKit with `adapter-auto`
- **Svelte version**: 5 — runes mode is enforced project-wide via `svelte.config.js` (use `$state`, `$derived`, `$effect`, `$props`, etc.)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin. Global styles in `src/routes/layout.css` with `@import 'tailwindcss'`
- **TypeScript**: Strict mode enabled
- **Package manager**: pnpm (enforced via `.npmrc`)

## Code Style

- Tabs for indentation, single quotes, no trailing commas, 100 char print width (see `.prettierrc`)
- Prettier plugins: `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`
- ESLint: recommended configs for JS, TypeScript, and Svelte; `no-undef` is off (TypeScript handles this)

## Architecture

Standard SvelteKit file-based routing:

- `src/routes/` — pages and layouts (`+page.svelte`, `+layout.svelte`, `+server.ts`, etc.)
- `src/lib/` — shared code, importable via `$lib` alias
- `src/app.html` — HTML shell with `data-sveltekit-preload-data="hover"`
- `src/app.d.ts` — App-level type declarations (Error, Locals, PageData, etc.)
- `static/` — static assets served at root

## MCP Tools

The Svelte MCP server is configured (`.mcp.json`) at `https://mcp.svelte.dev/mcp`. Use these tools when working with Svelte/SvelteKit code:

1. **list-sections** — Call FIRST to discover available documentation sections
2. **get-documentation** — Fetch full docs for relevant sections (check `use_cases` field to select)
3. **svelte-autofixer** — MUST run on all Svelte code before presenting to user; repeat until no issues remain
4. **playground-link** — Only generate after user confirms; never use when code was written to project files