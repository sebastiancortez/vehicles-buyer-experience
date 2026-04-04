# Slice 7 Backend Spec: Confidence Chat Route

This document defines the backend/API contract for Slice 7 follow-up Q&A. It is intentionally separate from the frontend drawer spec so Slice 7 can be split across two agents without ambiguity.

Frontend companion spec: `docs/slice-6-7-chat-drawer-spec.md`

## Ownership

Backend owns:

- `src/routes/api/confidence-chat/[id]/+server.ts`
- prompt construction, model calls, caching, and normalization
- reuse of listing data and Slice 5 confidence context
- structured success and error responses

Backend should not edit Svelte UI components.

## Product intent

The chat route is not a generic automotive chatbot. It is a listing-grounded follow-up layer that helps a buyer go deeper on a specific listing after reading the confidence assessment.

Responses should be:

- concise
- grounded in the current listing
- informed by the Slice 5 confidence output when available
- aware of the original buyer query `q` when available
- explicit that this is guidance, not an inspection or mechanic review

## Route

`POST /api/confidence-chat/[id]`

### Path params

- `id`: listing ID

### Request body

Use the existing `ConfidenceChatRequest` contract in `src/lib/types/confidence.ts`.

Expected shape:

```json
{
  "listingId": "lst-001",
  "query": "Reliable under $15k",
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "What are the biggest red flags here?",
      "createdAt": "2026-04-04T12:00:00.000Z"
    }
  ]
}
```

Rules:

- `params.id` and `body.listingId` must match.
- `messages` contains the recent thread context supplied by the client.
- The backend remains stateless with respect to durable chat history. The client sends the context it wants the model to use.
- `query` is optional and should be treated as lightweight buyer-intent context.

### Success response

Use the existing `ConfidenceChatResponse` contract in `src/lib/types/confidence.ts`.

Expected shape:

```json
{
  "ok": true,
  "cacheHit": false,
  "listingId": "lst-001",
  "message": {
    "id": "msg-2",
    "role": "assistant",
    "content": "The biggest risk is ...",
    "createdAt": "2026-04-04T12:00:02.000Z"
  },
  "suggestedPrompts": [
    "What maintenance records should I ask for?",
    "Would you negotiate on price here?"
  ]
}
```

Rules:

- `message.role` is always `assistant`.
- `suggestedPrompts` is optional, but if present it should contain concise next-turn questions.
- The route should never return raw provider payloads.

### Error response

Use the existing `AIError` contract in `src/lib/types/confidence.ts`.

Codes:

- `missing_api_key`
- `invalid_request`
- `listing_not_found`
- `generation_failed`
- `invalid_model_response`

The response must never leak raw model/provider errors, stack traces, or secrets.

## Inputs the route should assemble

The prompt context should include:

- listing facts from the mock data layer
- the buyer's optional query `q`
- the recent chat messages from the request
- the Slice 5 confidence payload when available for the same listing and normalized query semantics

The route may reuse the same prompt versioning and query-normalization strategy as Slice 5 so the intelligence layer stays consistent.

## Reuse of Slice 5 confidence output

The chat route should treat the Slice 5 confidence payload as upstream context, not as a required dependency.

Priority:

1. Listing facts
2. Confidence analysis if available
3. Buyer query if available
4. Recent thread messages

If the confidence payload is unavailable, chat still works using listing facts alone.

## Caching

The chat route may use lightweight in-memory caching, but the cache scope must be explicit.

Recommended cache uses:

- normalized confidence payload lookup reused from Slice 5
- prompt seed material derived from listing ID + query semantics
- optional dedupe of identical consecutive chat requests in the same app instance

Do not rely on server-side session storage for conversation history.

If a response cache is used, the key should include:

- listing ID
- normalized `query` semantics
- a digest of recent message content, not just the last message ID
- prompt version
- model version

## Output guidelines

Assistant answers should:

- answer the buyer's actual question first
- cite concrete listing-specific reasons when possible
- avoid generic filler
- stay reasonably short for drawer readability
- avoid pretending to know facts not supported by the listing or confidence context

Suggested prompts should:

- move the buyer toward a next useful question
- avoid repeating the exact same question
- stay listing-specific when possible

## Validation and normalization

Backend must normalize model output before returning it.

Guarantees to the frontend:

- valid `ConfidenceChatResponse` success payload
- valid `AIError` failure payload
- always-generated `assistant` message metadata on success
- no raw OpenAI objects

If the model output is malformed, return `invalid_model_response`.

## Failure handling

Gracefully handle:

- missing API key
- invalid/mismatched listing ID
- missing or invalid message payload
- listing not found
- invalid model output
- generation failure

Chat failure must not imply confidence failure. The frontend should be able to keep the assessment visible and allow retry.

## Implementation notes

- Keep all OpenAI usage server-side only.
- Use `OPENAI_API_KEY`.
- Prefer non-streaming JSON for the first implementation unless the repo already has a clean streaming route pattern worth reusing.
- Reuse `src/lib/types/confidence.ts` as the contract boundary.
- If shared backend-only helpers are introduced, keep them minimal and server-only.

## Parallelization contract

Frontend and backend can proceed in parallel if they align on:

- `ConfidenceChatRequest`
- `ConfidenceChatResponse`
- `AIError`
- query propagation rules
- session-only per-listing chat behavior on the frontend

Frontend can build against mocked chat fixtures while backend finalizes the actual route.
