# Slice 5-7 Frontend Spec

Superseded for Slice 6-7 UX by `docs/slice-6-7-chat-drawer-spec.md`. Keep this document only as historical reference for confidence-panel state guidance and query-propagation rules where they are not restated elsewhere.

This document is the frontend/UI contract for the AI confidence surface, embedded follow-up Q&A, and seller-contact handoff.

It is intentionally separate from the backend/API spec so two agents can work in parallel:

- Frontend owns Svelte components, layout, state, and interaction behavior.
- Backend owns routes, prompt generation, caching, and model calls.
- Both sides should respect the same payload shapes.

## Scope

Frontend work covers:

- `src/routes/vehicles/[id]/+page.svelte`
- `src/lib/components/StickyPanel.svelte`
- `src/lib/components/ConfidencePanel.svelte`
- `src/lib/components/ContactModal.svelte`
- any small frontend-only stores or local type helpers needed for panel state

The frontend agent should not edit server routes.

## Product Shape

The listing detail page has three distinct jobs:

1. Show the listing and summary context.
2. Help the buyer evaluate the listing with AI.
3. Help the buyer act on that evaluation by contacting the seller.

The UI must keep those jobs visually connected but behaviorally separate.

- Assessment and follow-up Q&A live in the same panel surface.
- Seller contact is a separate modal or drawer.
- Chat can influence seller questions later, but chat must not be required for seller questions to exist.

## Canonical UI State Model

### 1. Confidence Panel Container State

The confidence surface has two layers of state:

- Container state: `collapsed` | `expanded`
- Data state: `idle` | `loading` | `streaming` | `ready` | `error`

Recommended behavior:

- `collapsed`: only the sticky panel CTA is visible.
- `expanded + idle`: panel is open but fetch has not started yet.
- `expanded + loading`: request sent, no content rendered yet, show skeleton.
- `expanded + streaming`: first content has arrived, render sections incrementally.
- `expanded + ready`: all confidence sections are complete.
- `expanded + error`: show a friendly failure state with retry.

### 2. Q&A State

The embedded follow-up thread has its own independent state:

- `chatIdle`
- `chatComposing`
- `chatSending`
- `chatStreaming`
- `chatReady`
- `chatError`

Rules:

- A chat failure must not collapse or clear the assessment panel.
- A confidence-panel failure must not wipe typed chat input if a thread already exists.
- Chat history is session-only and per listing.

### 3. Contact Flow State

The contact modal is separate from the chat thread and should use its own state model:

- `closed`
- `open`
- `prefilled`
- `editing`
- `readyToSend`
- `fallback`

If AI-generated seller questions are unavailable, the modal still opens with a safe default template.

## Component Responsibilities

### `StickyPanel.svelte`

Owns:

- price context
- price/mileage badges
- sticky CTA placement

Receives:

- `listing`
- `onAnalysisClick`
- optional `onContactSellerClick` if Slice 6 wiring wants a second action later

Rules:

- The sticky panel is summary-only.
- It should not contain the chat UI.
- It can expose the CTA that scrolls to or expands the confidence panel.

### `ConfidencePanel.svelte`

Owns:

- initial fetch for confidence data
- assessment rendering
- embedded follow-up Q&A
- retry and partial-load handling
- handoff data for seller questions

Receives:

- `listing`
- `searchQuery?: string`
- optional `initialOpen?: boolean`
- optional `onContactSeller?: (questions: string[]) => void`

Emits:

- `analysis-loaded`
- `analysis-error`
- `conversation-updated`
- `contact-seller`

Panel layout requirement:

1. Known Issues
2. Price Verdict
3. Questions to Ask the Seller
4. Follow-up Q&A

Important:

- Follow-up Q&A belongs inside the same panel surface as the assessment.
- It should feel like “go deeper on this listing,” not like a generic chatbot.
- The seller-contact action should be a separate button or modal trigger inside the panel, not part of the chat thread composer.

### `ContactModal.svelte`

Owns:

- seller-facing message drafting
- prefilled due-diligence questions
- editable message body
- send workflow UX

Receives:

- `open`
- `listing`
- `seedQuestions: string[]`
- optional `chatSummary?: string`
- optional `buyerIntent?: string`

Rules:

- Use assessment-derived questions by default.
- Optionally refine with chat context when Slice 8 is approved.
- Never require chat to produce a useful seller message.

### `src/routes/vehicles/[id]/+page.svelte`

Owns:

- page-level data glue
- `q` propagation from the URL
- passing `searchQuery` to the confidence panel
- preserving query context in the back-to-results link

Rules:

- If `?q=` exists, pass it through to the confidence surface.
- If no `q` exists, omit it rather than inventing one.
- Back navigation should preserve `q` when returning to `/vehicles`.

## Loading, Error, Retry

### Confidence fetch

Behavior:

- Show a shell immediately on open.
- Render skeleton only until the first chunk or first usable payload arrives.
- Once content starts arriving, progressively replace skeleton sections with real content.
- If the route returns an error, keep the panel open and show an inline retry state.

Retry rules:

- Retry should only reset the failing confidence request.
- Retry must preserve any already-entered chat text.
- Retry should not clear the seller questions if they were already generated.

### Q&A fetch

Behavior:

- Show a lightweight pending state while waiting for the answer.
- Keep the thread visible during failures.
- If the answer fails, preserve the user’s typed message and provide a retry affordance.

### Fallback hierarchy

1. Assessment payload loads.
2. Assessment payload fails but contact modal still opens with defaults.
3. Q&A fails but assessment remains usable.
4. Chat is unavailable, but the page still supports evaluation and seller outreach.

## Seller-Contact Separation

Do not mix seller contact into the chat thread.

Recommended UX:

- Chat composer label: `Ask about this listing`
- Contact trigger label: `Generate seller questions` or `Contact seller`
- Contact modal launches from a separate button or action row

Why this matters:

- The buyer is doing research in chat.
- The buyer is doing outreach in the contact modal.
- Keeping those flows separate reduces confusion and makes the product feel trustworthy.

The contact modal may consume:

- assessment questions
- optional chat summary
- optional buyer intent from `q`

But the modal must still function if none of those inputs exist.

## Responsive Behavior

### Desktop

- Two-column detail layout remains intact.
- Sticky summary panel stays in the right rail.
- Confidence panel expands in the main content column.
- Q&A should remain single-column within the panel for readability.

### Mobile

- Sticky panel becomes the bottom bar.
- Confidence panel expands in the main flow under the listing content.
- Chat composer and buttons must be thumb-friendly.
- Maintain enough bottom padding so the sticky bar does not cover the panel.

### Accessibility

- All panel toggles must be keyboard reachable.
- Chat input, retry, and contact buttons need clear focus states.
- Use semantic headings for the three assessment sections.
- Keep labels explicit; avoid icon-only controls for primary actions.

## Route / Query Propagation

This is the query flow the frontend must preserve:

1. Homepage chips or search submit navigate to `/vehicles?q=...`.
2. Results page links to a listing detail route while preserving `q`.
3. Detail page reads `q` from the current URL.
4. Confidence panel passes `q` into its fetch.
5. Back-to-results navigation preserves `q` when present.

Rules:

- Query intent is optional context, not a required dependency.
- If the user arrived directly on a listing, the panel still works.
- If `q` is present, use it as lightweight buyer intent context, not as the sole source of truth.

## Parallelization Contract

Frontend and backend can proceed in parallel if they agree on these payloads:

- confidence payload
- chat message payload
- seller-contact seed payload
- error payload

Frontend can build against mocked JSON fixtures while backend finalizes the actual route implementation.

Recommended order:

1. Lock the payload shapes.
2. Build the confidence panel shell and states against mocks.
3. Build the embedded Q&A thread against mocks.
4. Build the contact modal against assessment output.
5. Wire the real routes in once the backend track is ready.
