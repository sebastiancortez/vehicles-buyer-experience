# eBay Vehicles — Buyer Experience POC

## Product Requirements Document


|                      |                                          |
| -------------------- | ---------------------------------------- |
| **Status**           | Draft — POC Scope                        |
| **Author**           | Sebastian                                |
| **Date**             | April 2025                               |
| **Version**          | 0.2                                      |
| **Interview Target** | Product Manager, eBay Vehicles — Toronto |


> **Scope:** This PRD defines the requirements for a proof-of-concept prototype built to demonstrate product thinking for the eBay Vehicles PM role. It covers the full buyer journey — from discovery through to commitment — with the AI Confidence Panel as the centrepiece differentiator. Not every stage requires deep investment; the principle is **progressive trust**: small, intentional UX improvements at each stage compound into a cohesive experience.

---

## 1. Executive Summary

eBay is one of the largest vehicle marketplaces in the world, yet the buyer experience lags behind category-specific competitors like CarGurus, AutoTrader, and Cars.com in one critical dimension: **confidence**. Buyers on eBay Vehicles face a high-consideration, high-anxiety purchase — often $10,000–$50,000, frequently from private sellers, sometimes shipped sight-unseen — without the structured guidance they need to commit.

The core strategic insight is that **trust must be built progressively across the entire journey, not just at the final decision point**. A buyer who arrives via a guided selector already feels more in control than one who typed keywords into a box. A results page with clear condition badges already reduces cognitive load before they click a listing. By the time they reach the AI Confidence Panel, they're primed to engage with it rather than dismiss it.

This POC proposes a buyer experience built on three principles:

- **Search-first with social discovery** — a fast, familiar search bar enhanced with shortcut chips for needs-first buyers and trending listings surfaced by social proof (watchers, saves), so the homepage is both a utility and a destination
- **Progressive trust across every stage** — small, high-ROI UX improvements from homepage through to listing detail that reduce anxiety before the AI panel even appears
- **Confidence as a feature** — AI-powered analysis at the listing level that collapses hours of external research into a 10-second interaction; responses are cached per listing so every buyer gets instant results

The prototype is built with SvelteKit, shadcn-svelte, and the OpenAI API. Vehicle data is served from a structured mock layer designed around the POC's two buyer personas: needs-first buyers entering through shortcut chips and model-specific buyers comparing exact vehicles.

---

## 2. Problem Statement

### 2.1 The Buyer's Journey Is Broken at Every Stage

Vehicle buyers arrive at eBay in two distinct modes. Some know exactly what they want — a specific year, make, model, trim — and need the platform to get out of their way and surface the right listing fast. But many, particularly first-time online buyers, arrive with something far fuzzier: a budget, a vague need ("reliable commuter"), and no strong model preference. They're looking to see what's available before they can even form a specific query. The current experience serves neither buyer well.

The problem doesn't end at search. At every stage of the journey, the current experience asks buyers to do cognitive work that the platform could be doing for them:

- **Discovery:** A bare keyword box with no shortcuts, no social signals, and no sense of what's popular or available right now
- **Results:** Undifferentiated listing cards make comparison difficult; condition and price context are buried
- **Evaluation:** No framework for assessing whether a specific listing is worth pursuing
- **Due diligence:** Buyers leave eBay to research known issues, price fairness, and what questions to ask — and many don't come back

### 2.2 Supporting Evidence


| Source                | Insight                                                                                                                                                           | Anxiety Type    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Cox Automotive        | Buyers spend 14+ hours researching before purchase — most of this is anxiety-reduction, not discovery                                                             | Trust gap       |
| CarGurus Growth       | Built a multi-billion dollar business on one insight: showing buyers whether a price is Good, Fair, or Overpriced. Price transparency directly drives conversion. | Price anxiety   |
| CarFax / AutoCheck    | Two companies exist entirely to address vehicle history anxiety — and both charge for it. Unmet need at scale.                                                    | History anxiety |
| eBay Motors           | eBay already offers vehicle history reports as an add-on — internal validation that trust is a known conversion problem.                                          | Platform signal |
| J.D. Power (Used Car) | Price validation is the #1 concern for used car buyers, followed by vehicle condition confidence.                                                                 | Primary barrier |


> **PM Validation Plan:** If in the role, the first action would be to pull listing-page drop-off rates segmented by vehicle price range, and run a post-session survey with buyers who viewed but did not complete a purchase. The prototype hypothesis is that >40% of abandonment is confidence-related, not price-related.

### 2.3 Competitive Gap


| Competitor              | Gap                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| CarGurus                | Price analysis badge, but no AI guidance, no seller coaching, no comparison tool                                  |
| AutoTrader              | Strong filtering UX, but no confidence layer, dealer-heavy inventory skews trust                                  |
| Cars.com                | Review-based trust signals, but weak on price analysis, no AI features                                            |
| eBay Vehicles (current) | Largest private-party inventory, vehicle history add-on, but search-first UX and no confidence layer at any stage |


---

## 3. Goals & Success Metrics

### 3.1 POC Goals

- Demonstrate a full buyer journey — from guided discovery through to AI-assisted due diligence
- Show that progressive trust improvements at each stage compound into a meaningfully better experience
- Demonstrate an AI confidence layer on the listing page that addresses the top 3 buyer anxieties
- Validate the technical feasibility of layering LLM-powered features onto eBay's existing API data
- Produce a prototype sufficient for PM interview demonstration and discussion

### 3.2 Production Success Metrics (Hypothetical)


| Metric                          | Target / Hypothesis                                                       |
| ------------------------------- | ------------------------------------------------------------------------- |
| Listing-page conversion rate    | +15% among users who engage with AI panel vs. control                     |
| Discovery-to-listing click rate | +10% for guided-selector users vs. keyword-search users                   |
| Time-to-first-relevant-listing  | Reduction of >30% for guided-selector users                               |
| AI panel engagement rate        | >25% of listing page visitors open and interact with the confidence panel |
| Buyer satisfaction (CSAT)       | Meaningful improvement in post-purchase survey for guided-flow users      |
| Return visit / save rate        | % of buyers who save a vehicle and return within 7 days                   |


---

## 4. User Personas

### 4.1 The Anxious First-Time Online Buyer


| Attribute        | Detail                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Profile**      | 28–40 years old, has bought cars before but never online. Comfortable researching on desktop, hesitant to commit without seeing the car in person. |
| **Primary Goal** | Find a reliable used car at a fair price without getting burned                                                                                    |
| **Top Fears**    | Overpaying. Hidden mechanical issues. Seller fraud. Shipping damage.                                                                               |
| **Behaviour**    | Reads every review. Opens 8 tabs. Asks friends. Abandons cart.                                                                                     |
| **How We Help**  | Guided selector reduces early friction. Key signals on results page reduce cognitive load. AI panel replaces the 8-tab research spiral.            |


### 4.2 The Enthusiast / Specific-Model Buyer


| Attribute        | Detail                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Profile**      | 25–45 years old, knows exactly what they want. Searching for a specific year/trim. May be cross-shopping 3–4 listings nationally. |
| **Primary Goal** | Find the best specimen of a specific vehicle at the best price, even if it requires shipping                                      |
| **Top Fears**    | Missing a better listing. Paying over market. Buying one with hidden rust or accident history.                                    |
| **Behaviour**    | Searches by VIN, filters aggressively, reads forums for known issues before buying                                                |
| **How We Help**  | Trim-level filtering gets them to relevant results faster. AI known-issues summary saves hours of forum research.                 |


---

## 5. The Full Buyer Journey

This POC covers all four stages. Stages 1–2 are addressed with high-ROI UX improvements that require minimal dev effort. Stage 3 is the centrepiece. Stage 4 is a lightweight stretch goal.

```
Stage 1          Stage 2          Stage 3           Stage 4
DISCOVERY   →   EVALUATION   →   DUE DILIGENCE  →   COMMITMENT

Guided           Results +        AI Confidence      Save /
Selector         Key Signals      Panel              Contact Seller
```

### Design Principle: Progressive Trust

Trust is not a single moment — it's built incrementally. Each stage should leave the buyer slightly more confident than when they arrived. A buyer who felt in control during discovery is more likely to engage with the AI panel during due diligence. The stages are not independent features; they are a compounding system.

---

## 6. Scope — Features by Stage

### Stage 1: Discovery

#### Feature 1: Smart Search Homepage

A fast, familiar search bar as the primary entry point — no cascading selector. The homepage serves two buyer types: those who know what they want (type it in) and those who don't yet (shortcut chips + trending listings give them a starting point).

**Search bar:**

- Single input, full-width, prominent
- Handles natural language queries: "2019 Honda CR-V under $20k", "reliable SUV", "cheap F-150"
- "Search Vehicles" CTA leads to results with query pre-applied

**Shortcut chips (below search bar):**

- 4–5 pre-built need-based queries: "Reliable under $15k", "Low mileage sedans", "Family SUVs", "First car under $10k"
- Tap to populate search and go directly to results
- Serves the needs-first buyer who doesn't know what make or model they want

**Trending listings (below shortcuts):**

- A curated row of listings surfaced by social proof: watcher count + save count, weighted over the past 7 days
- Cards show photo, year/make/model, price, price badge, and watcher count ("47 watching")
- Gives the undecided buyer something to browse before they've formed a query
- "Hot" ranking is a back-end sort on mock data — no ML required for POC

> **Design Priority:** The homepage should feel like a destination, not just a search box. The trending listings signal inventory depth and social activity — both of which reduce the anxiety of buying on a marketplace.

**Dev effort:** Low–Medium. Search bar and chips are trivial. Trending listings row is a sorted slice of mock data rendered as listing cards.

---

### Stage 2: Evaluation

#### Feature 2: Results Page with Key Signals

A results page that surfaces enough context on each listing card to allow meaningful triage without clicking through.

**Listing cards:**

- Photo, year/make/model/trim, price, mileage, location, condition
- **Price badge:** Below Market / Fair / Above Market (deterministic, based on mock market average)
- **Mileage badge:** Low / Average / High (deterministic, year/mileage thresholds)
- Seller feedback score as a visible trust signal

**Filters:**

- Price range, mileage, condition (new/used/salvage), distance, seller type (private/dealer)
- Sort: Best Match, Price Low–High, Price High–Low, Mileage, Newest
- Sidebar on desktop, bottom sheet on mobile

> **Note:** The price and mileage badges are the highest-ROI addition to this page. Deterministic logic, no AI needed, cheap to build, and directly address the #1 and #2 buyer anxieties before the buyer has even clicked a listing. CarGurus built a company on this insight.

**Dev effort:** Low–Medium. Badge logic is simple rule-based computation. Layout is standard Tailwind grid.

---

### Stage 3: Due Diligence *(centrepiece)*

#### Feature 3: Vehicle Detail Page

**Core content:**

- Photo gallery with swipe (mobile) and keyboard nav (desktop)
- Spec table: year, make, model, trim, mileage, condition, transmission, drivetrain, colour, VIN (masked)
- Seller info: username, feedback score, location, member since
- Price in market context: "X below / above market average for this year/make/model/trim"

**Sticky summary panel:**

- Persists as the user scrolls through the full listing
- Shows: price verdict, mileage context, and a one-line AI teaser
- "See full analysis" CTA expands the AI Confidence Panel
- Ensures the confidence layer is discoverable without requiring the user to hunt for it

**Dev effort:** Low–Medium. Sticky panel is CSS + small Svelte store. Gallery is the most complex piece.

---

#### Feature 4: AI Confidence Panel *(key differentiator)*

An expandable panel powered by the OpenAI API. Three sections, generated on first open and streamed progressively so the first uncached interaction feels responsive, then **cached per listing ID** within the same running app instance.

**Section 1 — Known issues for this vehicle**
The lead section. A synthesis of common reliability concerns for this specific year/make/model/trim. Grounds the buyer in what they need to know about the car itself before evaluating the price. Includes a disclaimer that this is AI-generated context, not a vehicle inspection. Leading with reliability is deliberate — it's the primary anxiety for first-time online buyers, and it's the section no other platform offers at the listing level.

**Section 2 — Is this a good deal?**
Plain-language price analysis comparing the listing against market average for this year/make/model/trim. Output is one of three verdicts — **Below Market / Fair / Above Market** — with 2–3 sentences of reasoning. Not a numeric score; a verdict with explanation. (Numeric scores are gameable, hard to defend, and confuse buyers.) Intentionally placed after known issues — a price verdict means more once the buyer understands the vehicle's reliability profile.

**Section 3 — Questions to ask the seller**
4–6 specific questions generated from the listing details. High mileage → ask about service records. Condition "good" not "excellent" → ask what the specific issues are. Sparse description → ask for more detail. Not generic boilerplate. These questions carry forward into the Contact Seller modal.

> **Design Voice:** The AI panel should feel like a knowledgeable friend reviewing the listing with you — not a chatbot, not a legal disclaimer. It speaks plainly, flags concerns without being alarmist, and gives the buyer a clear next step.

> **Caching:** Responses are cached server-side by listing ID for the duration of the running app instance. The first open triggers generation and streaming; subsequent opens in that instance return the cached result instantly.

> **Intent-aware analysis:** The panel should incorporate the buyer's original search query when available (for example "reliable family SUV" or "first car under $10k") so the analysis can emphasize what the buyer cares about most without skipping the core due-diligence checks.

**Dev effort:** Medium. API integration is straightforward (server-side SvelteKit route + OpenAI API). Effort is in prompt engineering for consistently useful output across varied listing data quality while balancing user intent against general due diligence.

---

### Stage 4: Commitment *(stretch goal)*

#### Feature 5: Save & Contact

- **Save button** — saves listing to session memory only; no persistence, no auth required. If the user refreshes, saves are cleared. Sufficient for POC demo purposes.
- **Contact Seller CTA** — sticky on mobile, opens a modal with the AI-generated seller questions from Section 3 of the Confidence Panel pre-populated in the message body

> The pre-populated seller questions in the contact modal are the bridge between analysis and action. The buyer doesn't need to remember what to ask — the questions are right there when they open the contact form. This is the most memorable moment in the demo: a direct, visible payoff from the AI panel.

**Cut from scope:** Saved listings view (nav item, persistent list) — adds dev effort without demonstrating new product thinking. Session-only save is sufficient for the POC.

**Dev effort:** Low. Session state save is trivial. The pre-populated questions pass state from the AI panel to the modal.

---

### Out of Scope (POC)

- Seller-side features (listing creation, seller dashboard)
- Real payment / checkout flow
- Full messaging system
- Vehicle history report integration (CarFax / AutoCheck)
- Parts & Accessories category
- Account creation / authentication
- Numeric confidence score (0–100) — deliberately excluded; plain-language verdicts are more defensible
- Saved listings view and persistent save (session-only save is sufficient)
- Listing completeness score or label — protects seller experience in a two-sided marketplace
- Cascading Year / Make / Model / Trim guided selector — replaced by smart search bar

---

## 7. User Flows

### 7.1 Primary Flow: Search → AI Due Diligence

1. User lands on homepage
  2a. **Knows what they want:** Types query into search bar (e.g. "2019 Honda CR-V under $20k") → taps Search
   2b. **Doesn't know yet:** Taps a shortcut chip (e.g. "Reliable under $15k") → goes to results with query pre-applied
   2c. **Just browsing:** Scrolls trending listings on homepage → taps a listing directly
2. Results page: scans listing cards — price badge, mileage badge, watcher count enable quick triage
3. Taps a listing → Vehicle Detail page
4. Sticky summary panel visible immediately (no scrolling required) — shows price verdict + "See full analysis" CTA
5. Taps "See full analysis" → AI Confidence Panel expands
6. Reads known issues → price verdict → seller questions
7. Taps "Contact Seller" → modal opens with AI questions pre-populated in the message body
8. Sends message or saves listing (session only) — end of POC flow

### 7.2 Secondary Flow: Trending → Detail

1. User lands on homepage, doesn't search
2. Scrolls trending listings row
3. Taps a listing → goes directly to Vehicle Detail page
4. AI panel flow identical to primary flow from step 5 above

---

## 8. Functional Requirements

### Stage 1: Discovery


| ID    | Requirement                                                                                       | Priority |
| ----- | ------------------------------------------------------------------------------------------------- | -------- |
| VS-01 | Search bar must be the primary entry point on the homepage                                        | P0       |
| VS-02 | Shortcut chips (4–5 need-based queries) must be displayed below the search bar                    | P0       |
| VS-03 | Tapping a shortcut chip must pre-populate the search and navigate to results                      | P0       |
| VS-04 | Trending listings row must display below shortcuts, ranked by watcher + save count (7-day window) | P0       |
| VS-05 | Listing cards in trending row must show watcher count as social proof signal                      | P1       |
| VS-06 | Search query must persist on browser back navigation from results                                 | P1       |


### Stage 2: Evaluation


| ID    | Requirement                                                                      | Priority |
| ----- | -------------------------------------------------------------------------------- | -------- |
| RP-01 | Results must render within 800ms of navigation (mock data)                       | P0       |
| RP-02 | Each card must show: photo, year/make/model, price, mileage, location, condition | P0       |
| RP-03 | Price badge (Below Market / Fair / Above Market) on every card                   | P0       |
| RP-04 | Mileage badge (Low / Average / High) on every card                               | P0       |
| RP-05 | Filter changes must update results without full page reload                      | P0       |
| RP-06 | Empty state must be handled gracefully with suggested actions                    | P1       |
| RP-07 | Results must paginate or infinite scroll — max 20 per page                       | P1       |


### Stage 3: Due Diligence


| ID    | Requirement                                                                              | Priority |
| ----- | ---------------------------------------------------------------------------------------- | -------- |
| VD-01 | Sticky summary panel must be visible on page load without scrolling                      | P0       |
| VD-02 | Photo gallery must support swipe (mobile) and keyboard nav (desktop)                     | P0       |
| VD-03 | All vehicle specs must be in a structured table, not prose                               | P0       |
| VD-04 | Price must be shown with market context ("$X below market average")                      | P0       |
| VD-05 | Seller feedback score must be prominently displayed                                      | P1       |
| VD-06 | Page must be shareable via URL — state in route, not session                             | P1       |
| AI-01 | AI panel must call OpenAI API on first expand; response cached server-side by listing ID  | P0       |
| AI-02 | API call must be server-side — key never exposed to client                               | P0       |
| AI-03 | Panel must stream on first uncached open, with loading state only until content begins   | P0       |
| AI-04 | Panel must handle API errors gracefully — no broken UI                                   | P0       |
| AI-05 | Section order: (1) Known Issues, (2) Price Verdict, (3) Questions to Ask                 | P0       |
| AI-06 | Price analysis must output one of three verdicts: Below Market / Fair / Above Market     | P0       |
| AI-07 | Known issues must include disclaimer: AI-generated, not a vehicle inspection             | P1       |
| AI-08 | Seller questions must be specific to the listing — not generic boilerplate               | P1       |
| AI-09 | Cached responses must be served instantly on subsequent opens in the same running instance | P1      |
| AI-10 | When a search query is present, the AI output must reflect that buyer intent lightly but visibly | P1 |


### Stage 4: Commitment


| ID    | Requirement                                                                                          | Priority |
| ----- | ---------------------------------------------------------------------------------------------------- | -------- |
| SV-01 | Save button must store listing in session memory (cleared on refresh — no persistence required)      | P1       |
| SV-02 | Contact modal must pre-populate message body with AI-generated seller questions from panel Section 3 | P1       |
| SV-03 | Saved listings view and nav item are out of scope for POC                                            | —        |


---

## 9. Non-Functional Requirements


| Requirement    | Detail                                                                                |
| -------------- | ------------------------------------------------------------------------------------- |
| Performance    | Core Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms on 4G mobile                      |
| Accessibility  | WCAG 2.1 AA: keyboard navigable, screen reader compatible, sufficient colour contrast |
| Responsiveness | Fully functional on mobile (375px+), tablet (768px+), desktop (1280px+)               |
| Security       | OpenAI API key stored server-side only, never in client bundle or network requests    |
| Data           | Mock data layer should cover both buyer personas: needs-first chip journeys and model-specific comparison journeys |
| Environment    | `OPENAI_API_KEY` stored in the repo-root `.env` file                                  |


---

## 10. Technical Architecture

### 10.1 Stack


| Layer                | Technology                                                     |
| -------------------- | -------------------------------------------------------------- |
| Framework            | SvelteKit (SSR for results/detail pages)                       |
| UI Components        | shadcn-svelte (bits-ui v2)                                     |
| Styling              | Tailwind CSS                                                   |
| AI                   | OpenAI API (`gpt-5.4-mini`) — server-side only                 |
| Data                 | Mock layer tailored to the two buyer personas and search-entry patterns |
| Deployment           | Vercel (adapter-vercel)                                        |


### 10.2 Data Layer

```
src/lib/api/
  mock.ts      ← realistic vehicle listings for needs-first and model-specific buyer journeys
  index.ts     ← mock-backed listing accessors
```

### 10.3 Component Map

```
routes/
  +page.svelte                  ← Homepage: search bar + shortcut chips + trending listings
  vehicles/
    +page.svelte                ← Results: listing grid + filters
    [id]/
      +page.svelte              ← Detail: gallery, specs, sticky panel
      +page.server.ts           ← Load: fetch listing data

lib/components/
  SearchBar.svelte              ← Search input with shortcut chips
  TrendingListings.svelte       ← Homepage trending row (sorted by watcherCount + saveCount)
  ListingCard.svelte            ← Card with price badge, mileage badge, watcher count
  SignalBadge.svelte            ← Reusable Below Market / Fair / Above Market badge
  StickyPanel.svelte            ← Persistent summary on detail page
  ConfidencePanel.svelte        ← AI panel with 3 sections (known issues → price → questions)
  ContactModal.svelte           ← Pre-populated seller questions from panel Section 3

routes/api/
  confidence/[id]/+server.ts    ← Server-side OpenAI call; streams first response and caches by listing ID
```

### 10.4 AI Panel Architecture

1. User expands confidence panel on detail page
2. Client fetches `/api/confidence/[listingId]`, carrying the current search query when available
3. Server-side route assembles structured prompt from listing data plus buyer intent from the search query
4. Route calls the OpenAI API — key is server-side only
5. Response streams back and renders progressively
6. Error state handled at route level with graceful fallback

---

## 11. Open Questions & Risks


| Risk                 | Detail                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| eBay API Approval    | Production credentials pending. POC runs on mock data. Risk: low — mock is interview-sufficient.              |
| OpenAI API Latency   | AI panel response ~1–3s. Streaming mitigates perceived wait. Loading state must be polished.                  |
| AI Hallucination     | Known issues could surface inaccurate info. Mitigation: disclaimer, structured prompt, no speculative claims. |
| Mock Data Realism    | Listings must feel real and map cleanly to both personas: needs-first search chips and exact-model shoppers.  |
| Badge Logic Accuracy | Price/mileage badges depend on realistic mock market averages. Seed mock data carefully.                      |


---

## 12. POC Timeline


| When               | Deliverable                                                                      |
| ------------------ | -------------------------------------------------------------------------------- |
| Saturday AM        | Scaffold: SvelteKit + shadcn-svelte + Tailwind, persona-aligned mock data layer   |
| Saturday PM        | Homepage (guided selector) + Results page (cards + badges + filters)             |
| Sunday AM          | Vehicle Detail page: gallery, spec table, sticky summary panel                   |
| Sunday PM          | AI Confidence Panel: OpenAI API, streaming, loading/error states + Contact modal |
| Monday AM          | Polish: responsive testing, copy review, demo rehearsal, narrative prep          |
| Monday (interview) | Live prototype + PM narrative                                                    |


---

## 13. Appendix — PM Interview Framing

### The Problem Framing

> "eBay has a trust problem in Vehicles — not just at the listing page, but across the entire journey. Buyers can find cars, but they can't confidently evaluate them. We lose them at every stage: at search because there's no sense of what's popular or available, at results because there's no triage signal, and at the listing because there's no framework for making a decision. The fix isn't one big feature — it's progressive trust built at each stage."

### The Product Decision

> "I deliberately chose not to rebuild discovery from scratch. eBay already has search — buyers know how to use it. What it's missing is context: social proof on the homepage so buyers can see what's trending, shortcut chips so needs-first buyers don't need to know the year and make before they can start, and price and mileage signals on every card so triage happens before you click. Those are low-effort, high-ROI interventions. The AI Confidence Panel is the centrepiece, but it only lands if the buyer already feels oriented by the time they get there."

### The AI Justification

> "AI isn't a novelty here — it's the right tool for a specific job. The panel leads with known issues because that's the first question a first-time buyer actually has — not 'is the price fair?' but 'is this car going to break on me?' No other platform answers that at the listing level. Price verdict follows naturally, and the seller questions give the buyer a clear action. We're collapsing hours of forum research into a 10-second interaction at the moment it matters most. And we cache the result per listing — so the second buyer to view it gets it instantly."

### The Two-Sided Marketplace Acknowledgement

> "This is a buyer-side prototype, but every decision is made with the seller in mind. We deliberately didn't surface listing completeness scores or penalise sellers for sparse descriptions. The AI panel works with whatever data the seller provides — more detail produces more specific questions, but it never labels a seller as 'incomplete'. Seller participation is the inventory side of this marketplace, and we protect it."

### The Data Acknowledgement

> "I don't have eBay's internal conversion data. What I have is strong public signal — Cox Automotive, J.D. Power, CarFax's entire business model — all pointing to trust and confidence as the primary barrier. If I were in the role, the first thing I'd do is pull drop-off rates at each stage of the funnel and run a buyer survey. The prototype is built on that hypothesis, and I'd want to invalidate it fast if the data said otherwise."

### What I'd Do Next

- Instrument every stage with analytics: shortcut chip usage, trending listing click rate, badge interaction, panel open rate, contact CTA click
- Run a usability study with 5 vehicle buyers — specifically recruit a mix of Persona 1 (needs-first) and Persona 2 (model-specific) buyers
- Define a clear A/B test: search + confidence layer vs. current eBay Vehicles experience
- V2 investment: stronger personalization and memory beyond the current lightweight search-query-aware analysis
- Align with the Selling team — better buyer confidence signals could directly improve seller listing quality and description completeness
