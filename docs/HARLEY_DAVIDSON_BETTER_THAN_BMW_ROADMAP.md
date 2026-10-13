# Harley-Davidson — surpass BMW quality standard
Updated 13 October 2026. Status: significant work outstanding.

## Objective
The Harley-Davidson manufacturer index and every model guide must be **more useful to UK-sourced international trade buyers than the established BMW implementation**, not merely visually similar. The existing sixteen model guides are early drafts, not finished reference pages.

## Required features — manufacturer page
- Maintain stable navigation, compact full-width black/white/AnyBike red presentation, usable mobile model cards and A–Z links.
- Verified correct motorcycle image per card, with creator, source, licence and accurate year/variant caption. Never substitute a lookalike or use rights-restricted press imagery.
- Group touring, cruiser/Softail, Sportster, adventure, CVO and historical/heritage accurately. CVO is a programme of variants, not one standalone motorcycle model.
- Clear highlights of key Harley generations (Evolution, Twin Cam, Milwaukee-Eight, Evolution Sportster, Revolution Max) with date/range and market qualifications.
- Destination links prioritised on evidence of relevant Harley communities and UK export relevance; no unsupported sales rankings or suggestions that importing is automatically permitted.
- UK trade sourcing explanation, model enquiry, port delivery and freight caveats; no exposure of private stock.

## Required features — EACH model page
1. Model-specific title and natural headline, e.g. “Interested in this Harley-Davidson Fat Boy?” — spell **Fat Boy** as two words; preserve Road Glide, Street Glide, Low Rider S, Pan America 1250, Sportster S and model naming.
2. Substantive introduction, origins and development, not a repeated generic sourcing paragraph.
3. **Verified production years and model-year timeline** including launch, revisions and any discontinuation; pending claims must be marked unverified rather than invented.
4. **Generation cards** showing chassis/engine family, model/trim codes, market and exact model year, source URL. Never imply all years share current specifications.
5. **Comparative technical tables** for multiple documented generations: displacement, power and torque (with units), gearbox, dimensions, wet/running weight versus dry weight, tank, brakes, suspension, seat height, and electronics, where verified. Display “Not yet verified” rather than guesses.
6. **Actual versions/colours** by year with manufacturer sources, trim differences and official factory naming.
7. Relevant correct photos of multiple versions where permissions permit; credit, source and licence included; image sizes and lazy loading.
8. Related models and previous/next navigation; no dead links or duplicate headings/IDs.
9. UK trade buyer checks: condition, mileage, service, modifications, VIN, market homologation, export paperwork and country-specific import caveats.
10. Correct SEO: unique page title and description, canonical, structured data, internal links, sitemap and mobile performance.
11. One clear enquiry action preselects the right make/model without disrupting onboarding or transaction flows.

## Research workflow
Use docs/HARLEY_DAVIDSON_RESEARCH_SOURCES.md. Prioritise Harley-Davidson media archives, serviceinfo, UK brochures and museum archives; secondary technical databases must be cross-checked. For each spec save year, version, market, exact source, verification state, and measurement method.
**Do not reproduce press photos without commercial-use permission.**

## Execution batches
- Batch A — Touring: Road Glide, Street Glide, Road King, Electra Glide, Ultra Limited. Deep variant comparison tables and chronological generations; distinguish FLH/FLHR/FLHX/FLTR and CVO.
- Batch B — Softail/Cruiser: Fat Boy, Breakout, Street Bob, Low Rider S, Heritage Classic, Softail Standard. Clarify Dyna versus Softail and the 2018 redesign.
- Batch C — Sport/Adventure: Iron 883, Sportster S, Nightster, Pan America 1250 and the cross-model CVO variants.
- Batch D — polished manufacturer index, model-specific photographic coverage, SEO/data quality checks, mobile, accessibility and live links.

## Release / quality gates
- Never call a page complete because its HTML exists, a generic summary is present or it is indexed.
- Verify all internal links and all image URLs/attributions; test at mobile and desktop widths.
- Confirm GitHub changes actually appear on 123-reg live site; a commit alone is not deployment validation.
- Do not alter Supabase, login, Available Stock, payments or shipping workflows as part of editorial page improvements.
- User wants **large coordinated batches**, not incremental small edits.
