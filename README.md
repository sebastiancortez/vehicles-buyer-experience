# eBay Vehicles — Buyer Experience Prototype

A prototype about building buyer confidence across the vehicle purchase journey. Built for the eBay Vehicles PM role interview.

---

## Why this problem

Buying a vehicle online is a $10k-$50k decision, and the tooling is bad. eBay has the inventory and the traffic, but it loses buyers at every stage of the funnel because they don't feel confident enough to commit.

Buyers spend 14+ hours researching before purchasing a vehicle (Cox Automotive). Most of that time is spent reducing anxiety, not browsing inventory. CarGurus got big by doing one thing well: telling buyers whether a price is fair. CarFax and AutoCheck exist because people worry about vehicle history. General marketplaces haven't really addressed any of this.

eBay already offers vehicle history reports as an add-on, so they clearly know trust is a barrier. But trust isn't one feature you bolt on. It has to build up across the journey.

## Goal

Close the trust gap and conversions go up. This prototype tests whether addressing buyer confidence at each stage of the journey makes a difference.

That only holds if the diagnosis is right. You'd want to check whether listing-page abandonment is mostly about confidence or mostly about price, using funnel data (drop-off by price band) and a survey of people who viewed listings but didn't buy. My read is it's mostly confidence, not price.

## The idea

Trust compounds. A buyer who felt in control during discovery is more willing to engage with an AI analysis during due diligence. You can't solve this with one feature at checkout. Small improvements at each stage add up.

## What I built

A buyer journey organized around four stages:

1. **Search with social discovery.** A search bar plus shortcut chips ("Reliable under $15k", "Family SUVs") and trending listings based on watchers and saves. The homepage works as both utility and destination.
2. **Trust signals on results cards.** Price and mileage badges (Below Market / Fair / Above Market) that answer the top two buyer worries before they click into a listing.
3. **An AI Confidence Panel on the listing page.** This got the most work. It tries to replace the multi-tab research spiral with a single view:
  - Known issues for this specific year/make/model/trim (nobody else surfaces this at the listing level)
  - A price verdict in plain language, not a numeric score
  - Questions to ask the seller, specific to the listing and pre-populated into the contact modal
4. **Save and contact seller.** The AI-generated questions carry forward into the contact modal, so the buyer doesn't start from a blank message.

```
Stage 1          Stage 2          Stage 3            Stage 4
DISCOVERY   →   EVALUATION   →   DUE DILIGENCE  →   COMMITMENT

Search bar +     Results with      AI Confidence       Save +
shortcut chips   price/mileage     Panel               Contact Seller
+ trending       badges                                (AI questions
listings                                               pre-populated)
```

## Scope and caveats

This is a product thinking prototype, not a production app.

- Stage 3 (due diligence) got the most attention. That's where buyer anxiety is least addressed and the product problem is hardest.
- Stages 1 and 2 are built enough to show the thesis but got less design investment.
- The AI Confidence Panel and listing detail page got the real work: visual design, UX, solution thinking.
- All vehicle listings are mock data designed around two buyer personas. No live API.
- AI responses are cached per listing for the running instance only. No persistent storage.

### Out of scope

- Seller features, listing creation, seller dashboard
- Payment or checkout
- Vehicle history report integration (CarFax / AutoCheck)
- Account creation or auth
- Persistent saved listings (session only)
- Numeric confidence scores (excluded on purpose, plain language verdicts instead)

## Users


| Persona                           | Profile                                                                          | Top fears                                                  | How this helps                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Anxious first-time online buyer   | Has bought cars before, never online. Opens 8 tabs, asks friends, abandons cart. | Overpaying. Hidden mechanical issues. Seller fraud.        | Guided discovery lowers the barrier to start. AI panel replaces the 8-tab research spiral. |
| Enthusiast / specific-model buyer | Knows exactly what they want. Cross-shopping 3-4 listings nationally.            | Missing a better listing. Hidden rust or accident history. | Fast search gets them to results. AI known-issues summary saves hours of forum reading.    |


## What to measure


| Metric              | What we expect                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| AI panel engagement | A meaningful share of listing page visitors open the panel                                     |
| Seller contact rate | Higher among users who engage with the AI panel vs. those who don't                            |
| Overall conversion  | Buyers who contact more sellers convert more, not necessarily with that seller, but in general |


Without baseline data these are directional, not targets. The point is knowing which metrics to watch and running the right comparisons (panel users vs. non-users, contacted vs. didn't).

## Tradeoffs


| Decision                                    | Rationale                                                                                                                              |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Plain language verdicts over numeric scores | Scores are gameable, hard to defend, and confuse buyers. "Below Market" with 2 sentences of reasoning is more useful than "Score: 73". |
| Search bar over cascading selectors         | eBay already has search. Buyers know how to use it. Shortcut chips serve the needs-first buyer without rebuilding discovery.           |
| No listing completeness label               | Protects sellers. The AI panel works with whatever data the seller provides and never penalizes sparse listings.                       |
| Session-only saves, no auth                 | Good enough for the demo. Auth adds complexity without new product thinking.                                                           |
| Cached AI responses, not real time          | First open streams from OpenAI; every view after that is instant. Keeps costs down without hurting UX.                                 |


## Supporting data


| Source             | Insight                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- |
| Cox Automotive     | Buyers spend 14+ hours researching, mostly reducing anxiety, not browsing               |
| J.D. Power         | Price validation is the #1 concern for used car buyers                                  |
| CarGurus           | Got big on one feature: telling buyers if a price is good, fair, or overpriced          |
| CarFax / AutoCheck | Two companies that exist because people worry about vehicle history                     |
| eBay Motors        | Already offers history reports as add-ons, a clear signal that trust is a known barrier |


## Tech stack


| Layer     | Technology                       |
| --------- | -------------------------------- |
| Framework | SvelteKit (Svelte 5, runes mode) |
| UI        | shadcn-svelte + Tailwind CSS v4  |
| AI        | OpenAI API (server-side only)    |
| Data      | Structured mock layer            |


---

*Full product requirements, specs, and user flows are in `[ebay_vehicles_prd.md](./ebay_vehicles_prd.md)`.*