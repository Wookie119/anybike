# Harley-Davidson manufacturer audit — 14 October 2026

## Scope and outcome
- Manufacturer catalogue: 21 distinct routes across Grand American Touring, Cruiser & Softail, Sport & Sportster, Adventure Touring and CVO/specialist.
- Direct GitHub file inspection on all 21 model/range guides: canonical URL, UK selling link, dealer sourcing link, 21-guide return navigation, JSON-LD, AnyBike Global connection, embedded image tag, and absence of a public `/available-stock.html` link all present.
- The manufacturer footnote now says 21 guides; photo credits were moved after editorial sections.
- CVO model range remains distinct from individual CVO variants. CVO Pan America has its own guide, supplied photograph with edited-background disclosure, and Pan America family navigation.
- All six dedicated Harley audit scripts were updated to cover 21 guides and the current credited artwork/photo conventions. Their syntax was checked against the latest committed source.

## Repairs committed during final audit
1. CVO Pan America structured article data, Global research link and model-generation context.
2. Catalogue image credit position, count and captions.
3. Audit scripts: check-harley-complete-gallery.mjs, check-harley-library-seo.mjs, audit-harley-model-pages.mjs, check-harley-editorial-photographs.mjs, check-harley-bmw-parity.mjs, check-harley-model-essentials.mjs.
4. Gallery audit image-alt matching corrected.

## Verification limits / future backlog
- **Not a claim that all automated scripts have passed**: the remote repository could not be mounted or cloned into a Node runner in this session. The six scripts are syntactically valid and updated, but have **not** been executed against the repository as a complete local working tree.
- Live cross-browser and mobile navigation, form submission/model preselection, runtime JavaScript, and third-party image availability require browser-based checking.
- **Photography:** Sportster S gallery picture is busy and may obscure the subject; Pan America 1250 photo is dark. They remain unchanged to avoid incorrect substitutions. Model identity and licensing of externally hosted photos should be visually and legally checked against their source pages.
- AnyBike-generated CVO range artwork and edited user-supplied model photos are labelled separately from unedited third-party photographs.
- This report is a technical repository inspection, not a formal certification of historical facts, international homologation, or all external destinations.

## Release safety
- No Supabase schema, login, Deal 360, live-stock visibility, public header or BMW manufacturer template changes were made during this final audit.
- Keep Available Stock visibility as currently configured until its separate access-control review.
