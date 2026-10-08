# Future plan: Live Source Hub AI Matching across all channels

Status: **Planned for later — not authorised for implementation now**
Recorded: 9 October 2026

## Goal
A buyer may request 3–4 different makes and models. Instead of manually preparing matches from 3–4 different dealer/manufacturer channels, AnyBike should be able to search all currently connected Live Source Hub sourcing channels for all their requested models in one operation.

## Intended workflow
1. Use buyer requirements already recorded in onboarding / Customer Database / motorcycle requests.
2. Click **Find Matches Across All Channels** in **Live Source Hub → Buyer Requests & AI Matching**.
3. Search the current `live_source_items` sourcing pool across all enabled connected channels, covering multiple makes/models per buyer.
4. Apply correct make/model, year, mileage, budget, and other buyer constraints; group candidates by requested motorcycle and show source, listing URL, last successful refresh / last seen and data completeness. Flag stale, missing, unverifiable, duplicate, and unconnected sources clearly.
5. Admin reviews and selects candidates, then uses the **existing** buyer-safe image preparation, availability check, match sending, buyer responses and Deal 360 workflow. Avoid separate competing sending systems.
6. Do not rely on historical `available_stock` bulk imports as though they are verified live listings. Keep them separate as historical reference only.

## Possible later integration
Investigate an authorised, reliable **Auto Trader** sourcing connection/API or partner feed when available. Do not assume the existing old Auto Trader import is live, and do not compromise other source adapters to make this work.

## Do not break
Existing BMW Approved Used and other sourcing adapters, current Live Source Hub functionality, buyer hand-picked batches (including prior selections for Quentin), images, messages, and Deal 360 must remain intact. Build and test incrementally; no changes requested today.
