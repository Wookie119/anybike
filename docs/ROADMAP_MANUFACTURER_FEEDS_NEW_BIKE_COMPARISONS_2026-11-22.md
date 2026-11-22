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

## Paid and affiliate advertising on buyer-guide and comparison pages — confirmed requirement
- Both the UK New Motorcycle Buyers Guide and all shareable bike-comparison templates must expose **named, responsive Mega System ad slots** from day one; no hardcoded individual-page adverts.
- Support **paid brand/dealership campaigns** and **affiliate adverts** for relevant clothing, helmets, luggage, accessories, protection, insurance and approved motorcycle finance partners. Country, page type, manufacturer, exact model, comparison category and customer targeting are controlled centrally.
- Each advertisement resolves from the existing advertiser client file and approved format artwork (five standard sizes), with independent destination, impression/click tracking, campaign dates, commercial reporting and replacement artwork. Quotation, invoice and package upsell use the existing workflow.
- Advertising should sit **between major comparison sections and beneath useful content**, not over specifications, pricing evidence, the comparison table or share controls. Keep a readable mobile experience and cap density.
- Paid and affiliate links must carry `rel="sponsored"` and clear **Advertisement** disclosure; affiliate commissions must be accounted for. No paid influence on specification facts, objective rankings, model suggestions or alleged manufacturer endorsements.
- Prefer relevant advertising: touring luggage on adventure comparisons, equipment on sports-bike guides, and verified UK dealer promotions for UK new-bike searches. Do not assume rights to manufacturer logos/creative without permission.


## Future country-by-country rollout (deferred)
**Future phase only — not to be implemented during the UK launch.**

- Prove the UK new-motorcycle buyers guide, manufacturer data feeds, authorised-dealer directory, cross-brand comparisons and paid/affiliate advertising model first.
- Keep one universal template and Supabase data architecture with a **market/country identifier** on model prices, equipment, homologation, available variants, dealers, permitted manufacturer feeds, language, currency and advertising targeting. Never assume that UK model ranges, prices or dealer franchise permissions apply internationally.
- For each future country, seek local manufacturer/importer data permissions and verified official dealer feeds, then launch localised model guides, impartial comparisons and a local dealer locator only after data quality is sufficient.
- Use the existing Advertising Mega System for country-specific paid advertising, local affiliate programmes, sponsorship, client creative variants and commercial reporting; do not create separate advertising backends.
- Each country should have its own useful localised content and search experience, not a duplicated UK page with the currency converted.
- **Do not implement new international buyer guides, comparison pages or dealer locators now.** First finish the UK platform, feed reliability, advertising workflow and real-world validation.
