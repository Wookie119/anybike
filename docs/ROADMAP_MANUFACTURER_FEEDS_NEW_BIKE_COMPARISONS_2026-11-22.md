# AnyBike — Manufacturer Feeds, UK New Motorcycle Buyers Guide and Shareable Comparisons
**Proposed 22 November 2026**  
**Status:** Strategic development workstream. Do not disrupt current DealerWebs feed, advertising, approved universal V2 model design or UK-only dealer locator.

## Purpose
Build a UK-facing guide for buyers of **new motorcycles**, grounded in manufacturer-supplied official data where possible. Compare multiple brands/models in a single readable, mobile-friendly, shareable page. Offer useful pathways to verified UK authorised dealers, model pages, current model availability and finance (subject to approval).

## Manufacturer data partnerships
- Approach manufacturers/importers for permissioned **current model range feed** and **authorised UK dealer network feed** (API, CSV, XML or scheduled JSON).
- Confirm contact, permissible use, attribution, update frequency, image rights, model-year/trim/market identifiers and removal/correction process before ingesting.
- Keep **one central Supabase manufacturer/model dataset**, with provenance, source/version, last verified time, effective dates and update logs. Feed imports stage changes for validation and do not override approved editorial or historic model facts automatically.
- Existing `motorcycle_catalog_manufacturers`, universal V2 model identity and approved template remain the canonical foundation; map external manufacturer variants into verified canonical records, not parallel model universes.
- For dealer feeds track official franchise(s), address, website, service/new/used permissions, outlet details, verification dates and status. Publish **UK-only Find a Dealer** records after source confirmation/approval. Withdraw stale/ceased franchises promptly.

## UK New Bike Buyers Guide
- Use UK-market current **model years, exact trim/variant**, manufacturer list price and pricing date, category, engine configuration, capacity, power/torque with units, wet/kerb weight (label method), seat height, luggage/comfort/electronics and licence suitability where verified.
- Label missing/unknown facts rather than guessing. Show distinctions between claimed manufacturer specifications, market pricing and AnyBike editorial commentary; don't compare incompatible units or model-year generations.
- Offer category pages: adventure, touring, naked, sports, scooter, retro, electric etc. Universal buyer guide templates; links to existing AnyBike motorcycle research pages.
- UK retailer/finance CTAs only where appropriate; never imply manufacturer endorsement or guaranteed pricing.

## Shareable motorcycle comparison
- Pick **2–4 distinct bikes**, including cross-manufacturer rivals, and share one stable comparison URL preserving canonical model/variant IDs and UK market/model-year context.
- Example (variants must be selected explicitly): a **Triumph Tiger** variant vs a **Ducati Multistrada** variant vs **BMW R 1300 GS**. Avoid treating all Tigers or Multistradas as one specification.
- Table of source-verified specifications, meaningful differences, optional "what matters to me" preferences (touring, pillion, price, seat height, weight), strengths/limitations with clear citations/sources and update timestamps.
- Share via URL/copy, native mobile sharing where supported, link previews and print-friendly page. Canonical SEO strategy should avoid indexing millions of thin parameter combinations; index curated high-quality editorial comparisons and noindex arbitrary user-generated combinations as necessary.
- Comparison pages use their own shared renderer with approved V2 model identity; no hand-editing individual model pages.

## Commercial and advertising
- Link each compared motorcycle to authorised UK dealer results, dealer offer/enquiry, relevant Available Stock, accessories and approved Q-Finance offers when compliance is complete.
- A manufacturer or dealer can buy **clearly disclosed sponsor placements**, paid featured listings and launch packages using existing Advertising Mega System. Paid placement must never influence specification accuracy or unbiased comparison order/rankings.
- Maintain approved advert sizes and independent client artwork file/quote/invoice/upsell workflow. No duplicated client database.

## Staged delivery
1. Identify and approach a small set of UK manufacturer/importer contacts for feeds and authorised use (Triumph, BMW Motorrad, Ducati as initial example, not assumed partners).
2. Establish ingestion contract, mappings, provenance, editorial overrides and feed health reports in Supabase.
3. Build universal UK New Motorcycle Buyers Guide and current-model range filters.
4. Build responsive two-to-four-bike comparison with shareable URLs, meaningful differences and verified sources.
5. Connect to UK-only verified dealer locator and Advertising Mega System, then expand brands.

**Commercial goal:** repeated organic buyer research traffic, customer sharing and dealer/advertising leads. One database, one comparison system, no manually duplicated pages.
