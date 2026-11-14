# Universal V2 database-driven rollout — 14 November 2026

Approved visual master: /motorcycle-v2-master.html?make=BMW&model=R%201300%20GS
All public catalogue models: /motorcycle-model-guide.html?make=...&model=...
Single shared renderer: model-template/approved-v2-universal-preview.mjs
Same approved CSS: model-template/approved-v2-preview-style.css
Single read-only Supabase index: public.public_anybike_universal_model_index_v1()

## Completed in this batch
- Published the read-only all-manufacturer model index function in Supabase and recorded the SQL definition in supabase/sql/public_anybike_universal_model_index_v1.sql.
- The index returns **965 clean public model identities**. The underlying motorcycle_catalog_models table contains 979 rows; 14 are excluded by the existing clean public catalogue. Never bypass those checks or silently call all 979 published.
- The model library now uses the live Supabase index and falls back to existing site JSON only during database outages. Model guides are reached through the same dynamic V2 renderer. Library has 'show more' pagination rather than an artificial first-150 limit.
- Public model library is indexable (index,follow), following the owner's earlier SEO direction.
- Shared related-model navigation no longer replaces published model entries with BMW/Harley legacy dedicated URLs; links point to the universal V2 model guide. Legacy dedicated files remain online and existing SEO canonical logic remains.
- Shared-model-catalogue.js routes all related model links, including BMW, to the universal V2 model guide.
- BMW manufacturer's 27 curated model cards now open the universal model guide rather than a second model-page design.
- Harley manufacturer's dynamically generated model cards now link to V2 **only when their exact make+model name resolves through the approved public Supabase catalogue**; unmatched special/legacy pages retain their existing URLs.
- All eight published riding-category navigation routes appear in the shared renderer even when a model's optional editorial is not yet released.
- Both universal HTML routes load the updated renderer and navigation via cache-busted shared module references.
- Verified manufacturer facts, approved photos, model-specific published editorial, canonical URL handling and stock permissions remain subject to their existing publication protections; no other model-specific HTML layouts were introduced.

## Data-publication facts, not promises
- 979 catalogue model records / 965 clean published model identities.
- The verified model research public coverage view has 965 entries, **156 with published source-verified research** and 809 currently without public verified research.
- 673 research facts appear across the public-coverage aggregation (may include authorised aliases); motorcycle_catalog_facts contains 669 verified source facts.
- There are 102 model V2 editorial records, but only **1** currently has preview_visible=true. The other 101 are not to be released simply to fill empty sections.
- The model-generation records (92) and timeline events (113) are all pending_review. They are **not** approved facts and must not be misrepresented as published manufacturer research.
- All displayable source-verified facts continue to use public_anybike_verified_model_facts_v1 and source verification audit. New approved facts automatically flow to the existing renderer without new page templates.

## Next engineering stage
Finish publication approval of remaining reviewed data, correct mapping for any blocked/missing source-verified records, and implement automatic publication after explicit source approval. Then fill the approved 20-section framework with additional verified facts and licensing-approved media across the 809 models with no currently published research. No more cosmetic redesign.

This file is a development checkpoint, not evidence that every research record is approved or that live 123-reg deployment has been independently verified. GitHub commits deploy automatically under the existing AnyBike pipeline; do not manually upload to 123-reg.
