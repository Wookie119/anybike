# AnyBike private editorial research layer — 4 November 2026

## Completed in production Supabase

Private schema: `anybike_publishing`.

**Research categories, NOT HTML layout sections:** 13 model research categories and 20 manufacturer research categories now exist in `editorial_content_categories`. These organise future research; they do not replace, reorder or simplify the approved manufacturer 20-section visual template or model 13-section visual template. Approved BMW/Harley designs are untouched.

**Source-backed content:** `editorial_content_evidence` contains **106** records from the existing approved model guides. All are `review_state='source_captured'`, with zero promoted to fact checked, editorial approved or public published.

| Research category | Source excerpts | Distinct models |
| --- | ---: | ---: |
| Introduction | 45 | 45 |
| Buying guidance | 19 | 19 |
| Chronology | 17 | 17 |
| Generations | 17 | 17 |
| Technical specifications | 6 | 6 |
| Equipment | 1 | 1 |
| Factory colours | 1 | 1 |
| **Total** | **106** | **45 models overall** |

- 45 introductions + 15 generation paragraphs were copied from the previously captured approved model source records and cross-checked to the registered, source-verified URLs.
- A further 40 text sections were captured from 18 Harley-Davidson source guides by an explicit heading whitelist, and 6 from the existing BMW R 1250 GS source page.
- Source page paths, original Git blob hashes and exact normalized source excerpts are preserved.
- None of this modifies the 979 canonical model records' existing overview, specification JSON, gallery, production or pricing fields. Real source material and the existing approved layouts remain the source of truth until factual/editorial review.
- Source record integrity view distinguishes the **60 existing source-extract matches** from the **46 separately repository-rechecked HTML sections**, which have now been independently re-extracted from current repository HTML and matched exactly to the stored text, section labels and Git blob hashes. It does not falsely claim all 106 were independently fact verified.

**Coverage and QA:** backend-only `model_research_category_coverage` reports 979 × 13 = **12,727** model/research-category combinations, 106 with source captures; `manufacturer_research_category_coverage` reports 50 × 20 = **1,000** manufacturer/category combinations. This is an editorial backlog, NOT a public page-completion percentage.

The 12 approved BMW manufacturer heading sources and 22 Harley-Davidson heading sources remain separately preserved in `manufacturer_source_sections`. They have not been automatically mislabelled as content buckets.

**Research prioritisation:** private `model_research_priority_by_manufacturer` groups the source-preservation and structured-field backlog by brand. Mugen/Indian alias handling is retained from the previous database batch.

## Safeguards

- `editorial_content_evidence` contains two mutually exclusive foreign-key entity references and only accepts known category keys.
- Each evidence row has a valid source page path, 40-character Git blob hash, source label, evidence text, review stage and optional review timestamp.
- Source inserts do not automatically set `reviewed_at`, publish pages or update canonical research.
- `editorial_content_categories` and `editorial_content_evidence` have RLS enabled and no anonymous/signed-in browser grants. Backend `service_role` access remains available.
- New research coverage views use `security_invoker=true` and are not readable to ordinary visitors.
- Existing approved BMW, Harley, Fat Boy, R1250 GS, R1300 GS V2 source files and the 217 country pages are unchanged by this batch.
- There is **no 123-reg deployment** or Google indexing confirmation from these schema changes.

## Reusable source tools committed

- `scripts/extract-model-section-candidates.mjs`: conservative H2 whitelist for existing approved model sections; no hallucinated data or silent promotion.
- `scripts/stage-model-content-evidence.mjs`: trusted, private route export → source Git blob → source-only candidate JSON under ignored reports.
- New Node regression tests for both scripts added to the publishing CI workflow. A completed and successful GitHub Actions workflow is not yet independently verified.

## Next substantial database batches

1. Begin separate factual/technical verification for documented year-specific claims; the 46 directly captured sections have passed exact-source rechecking but not factual or editorial approval.
2. Extract additional approved, high-quality BMW engineering and ownership text as nonpublishing evidence where source headings/sections allow reliable parsing.
3. Populate manufacturer categories from factory and official references with proper dates, rights and per-field citations; do not infer production or registration figures.
4. Build formal evidence-review workflow in admin only when its access controls and existing model IDs have been verified.
5. Roll out only when real HTTP/CI checks pass and a separately approved deployment process for 123-reg is established.
