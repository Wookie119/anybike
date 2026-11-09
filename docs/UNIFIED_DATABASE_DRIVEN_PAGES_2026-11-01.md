# AnyBike unified database-driven pages — implementation contract
Date: 2026-11-01
Status: architecture baseline; implementation and production verification pending

## Non-negotiable objective
One database-driven content platform powering manufacturer, model, country/market and AnyBike Global editorial pages. Do not create hundreds of independent hand-maintained model HTML pages, or ask the owner to review every generated page.

## Existing baseline verified 1 November 2026
- Supabase project: tuehtnezhdnkqbbhttgp.
- motorcycle_catalog_manufacturers: 50 rows.
- motorcycle_catalog_models: 979 rows.
- motorcycle_catalog_generations: 4 rows.
- motorcycle_catalog_facts: 58 rows.
- motorcycle_catalog_timeline_events: 4 rows.
- motorcycle_catalog_market_metrics: 0 rows.
- motorcycle_racing_riders: 30 rows.
- Shared manufacturer entry point: motorcycle-brand.html; model entry point motorcycle-model.html currently focuses on stock.
- Approved visual references: bmw-motorcycles.html, BMW R 1300 GS, Harley-Davidson and Honda examples.
- Existing manufacturer template protection: docs/MANUFACTURER_TEMPLATE_STANDARD.md and scripts/check-manufacturer-template.mjs.
- UK gallery regression protection: scripts/check-r1300gs-uk-gallery.mjs (not yet executed in this audit).
- AnyBike Global is anybike-global.html, with manufacturer story linking already present.

## Four template contracts
1. Manufacturer: hero, identity/history, timeline, factories/engine plants, innovation and AI, models by family/type, production where verified, racing disciplines, works riders, rights-cleared media, countries/markets, related brands, and AnyBike Global stories.
2. Model: model-year gallery, introduction/end, generations, variants, technical and engine changes by year, paint schemes, full specification, production totals, sales/registration values with provenance, valuation placeholders, timeline, racing achievements/riders, buying guide, related models/type pills, editorial links, UK selling or international sourcing and permitted stock.
3. Country: market identity, local manufacturer/model links, year-specific registration/sales metrics where verified, country market stories, buying/import/export information with jurisdiction/date caveats, shipping and sourcing pathways, and Global editorial links.
4. AnyBike Global: structured stories linked by IDs to manufacturers, models, generations, riders, events and countries; automatic reverse-links displayed on relevant public pages.

## Data model and publishing rules
Reuse existing motorcycle_catalog_* tables; inspect dependencies and constraints before migrations. Add only missing normalized entities, such as manufacturer profiles, model-year variants/colours, photo licenses and placements, countries, story relations, and racing associations, after a schema review.
Separate research drafts from approved published claims. Every fact with numerical/historical content should carry source, scope, verification status and applicable years/country. Never invent production or registrations. Avoid presenting AnyBike listing counts as sales.
For media, record provenance, rights/credit, exact subject, year/variant and orientation. Missing approved media should use neutral placeholders, not a wrong bike.
Do not expose incomplete editorial drafts or unverified numeric metrics.

## Rendering and SEO
Use shared renderers/components and structured data. Preserve branded red #ed1c24 styling and approved BMW layouts. Stable readable canonical URLs and indexable content are required; validate whether client-only content is adequately crawlable, and prefer statically generated or server-rendered pages where necessary given 123-reg hosting. Build automated sitemap and internal-link integrity checks.
Country/visitor location controls contextual CTAs; it must never grant access to protected stock or confidential commercial data. Treat UK/international customer permissions as separate from country editorial content.

## Quality gates before broad rollout
- Baseline layout snapshots for desktop and mobile, with approved BMW R1300GS gallery regression.
- Automated schema/data validation, uniqueness and alias resolution, facts/country/year consistency, missing media rights, dead internal links, missing essential template fields, sitemap/canonical checks.
- Permission tests for UK/private seller and overseas buyer flows.
- Sample deep tests per template and representative manufacturer/model/country/rider datasets; broad smoke tests of ALL rendered records.
- No edits to auction bidding, dealer approvals, email digest, messaging, authentication, deal 360, invoice, stock feeds or protected stock access.
- Rollout via feature-gated shared templates, measured in batches; retain legacy fallback until verified.

## Implementation sequence
A. Review current files, complete schema and published data interfaces and preserve approved reference HTML.
B. Develop shared manufacturer/model/country/article rendering and linking layer; benchmark against approved pages.
C. Populate source-backed content in large validation batches; editorial/admin review gates.
D. Generate and test all published page variants, including UK/international modes.
E. Activate country pages and AnyBike Global two-way relationships, indexation and sitemap with validated production rollout.

This contract supersedes the earlier strategy of manually reviewing every individual model page; it does not claim that the implementation is complete.

## Owner-confirmed unified layout rule — 9 November 2026
**One template. One database. One consistent system. No alternative layouts.**

This supersedes the prior wording that describes manufacturer/model templates as separate visual implementations. Implement ONE shared page component/rendering system with the approved BMW/Harley design language, and up to 20 relevant research/content sections driven by typed Supabase section data. A manufacturer and a motorcycle model are different entity types in the SAME framework: choose the applicable data and actions without redesigning or inventing sections to reach a count. Preserve all content and visual details of already-approved BMW/Harley pages until parity is established.

Stock always precedes research on model pages. Only buyer-safe, permitted, actually-published stock may be displayed. Match stock by canonical model IDs verified server-side; no page-title, substring, range, or trim fallback is allowed for publication. A missing hero gets a neutral placeholder, never another model's photograph. Do not block research on photo gaps.

Source-of-truth status (9 November): private public.motorcycle_stock_catalogue_identity_v1 has candidate and verified states, with RLS and no anon/authenticated grants. Initial exact unique name matching staged 7 candidates, 4 of them BMW, zero verified. This staging table alone does NOT change the existing international-public-stock endpoint or public pages. A strict shared client matcher exists at model-template/canonical-public-stock-identity.mjs and expects catalogue_identity_status='verified' and publication_eligible=true FROM A TRUSTED BUYER-SAFE ENDPOINT. Do not wire it into existing pages until the endpoint includes those fields and access/visibility checks are verified; otherwise approved stock would disappear.

Validation requirements: verify manufacturer and model canonical identities, 20-slot section contract with conditional applicability, stock-before-research DOM order, photo rights/identity, all catalogue references and reciprocal Global/country links, SEO URLs, all catalogue rows and UK/international/guest scenarios. Preserve protected design baseline and all enquiry actions. GitHub commit does not itself prove live deployment.

