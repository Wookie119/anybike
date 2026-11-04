# AnyBike — manufacturer-wide data quality and safe link routing
Date: 4 November 2026

## Implemented in Supabase and repository

### A–Z directory — existing approved design preserved
- Original `motorcycle-manufacturers.html` contains the existing A–Z design and classes. No stylesheet or approved BMW/Harley manufacturer page redesign.
- Added MGB (canonical public manufacturer ID 21) in alphabetic position.
- Corrected description count from 49 to 50.
- Retained dedicated approved BMW and Harley links.
- Replaced the 47 links to previously rejected `motorcycle-brand.html?make=...` with canonical existing `bulk-buying-request.html?make=...` sourcing requests, accurately relabelling the cards.
- Result is 50 manufacturer cards: 2 approved guide destinations + 48 sourcing destinations.
- The older unapproved generic brand page is marked `noindex,follow` in source and points its canonical to the approved manufacturer A–Z. This does NOT demonstrate updated live HTTP behaviour until a 123-reg deployment is verified.

### Private data identity
- Production catalogue: 50 manufacturer records and 979 model records.
- Model make names: 972 exact matches to canonical manufacturer records, 4 `Indian` aliases resolved to `Indian Motorcycle` (ID 20), and 3 `Mugen` models awaiting an explicitly reviewed classification.
- Mugen is a distinct Honda-related motorsport/engineering identity and is **not** automatically relabelled as Honda. The record remains intact.
- Backend-only `manufacturer_name_resolution` table with RLS and explicit verified/review-required status.
- Model/manufacturer graph accepts only `verified_alias` records with verified timestamps and canonical IDs, never guesses Mugen or missing/ambiguous makes.
- Private SQL publisher export includes only those verified aliases.

### Manufacturer research and completeness
- Private `manufacturer_source_sections` captures the approved source h2 outlines with source Git blob IDs: 12 BMW sections and 22 Harley-Davidson sections.
- These outlines are protected source reference data, **not** new layout templates or proof that the universal 20-section manufacturer template is finished.
- Backend-only `manufacturer_editorial_readiness` and `manufacturer_content_gap_summary` views provide current evidence of all 50 manufacturers and their model research gaps.
- Registered manufacturer guides: 2. Manufacturer records without verified dedicated guides: 48.
- Model count across canonical manufacturers after verified aliases: 976. Mugen review queue: 3.
- Largest catalogue gaps include Yamaha 89 models, Honda 85, Ducati 59, Kawasaki 57, Suzuki 56, Triumph 54. Existing rich page research must be preserved before generating new sections.

### Automated safeguards
- `scripts/audit-manufacturer-directory.mjs` checks source A–Z cards against canonical 50-make fixture, correct sourcing links, approved BMW/Harley guide paths, canonical, indexability and legacy generic noindex.
- Direct audit check passed: 50 records, 50 cards, 2 approved guide links, 48 sourcing links, zero issues.
- `scripts/audit-catalogue-manufacturer-resolution.mjs` and `scripts/check-private-catalogue-manufacturers.mjs` audit exact / verified alias / unresolved identities against a secure backend catalogue export.
- Tests added for directory and aliases, and test scripts added to the existing GitHub publishing CI workflow.
- Focused JavaScript graph check passed: Indian links when both endpoints are approved, Mugen stays unlinked, missing verification blocks linking, conflicting aliases are quarantined.
- Export SQL validated in production Supabase: 264 registered editorial routes, 50 manufacturers, 979 models, 1 verified manufacturer alias, 0 approved model-to-country relationships.

### Security and deployment
- Private tables and views are restricted to the backend role; anonymous/signed-in website visitors cannot read the private research and alias tables.
- No live manufacturer pages were created, no universal template replaced, no model data rewritten, and no new routes marked published.
- Full successful Node/GitHub Actions run and live 123-reg deployment / Google Search Console indexing are **not confirmed**.
- Existing country / BMW / Harley SEO source checks remain independent of live Google indexing.

## Next development priority
1. Bring the 50 manufacturers' structured research coverage higher, starting with the largest source-supported gaps.
2. Expand the model 13-section and manufacturer 20-section protected database field schema only where existing approved research or authoritative sources support each field.
3. QA photos and provenance before authorising factory production images and motorcycle model-year images.
4. Verify GitHub Actions and the real hosting response before releasing generated navigation or submitting a changed sitemap.
