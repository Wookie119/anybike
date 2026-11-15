# Universal V2 publication readiness — 15 November 2026

## Verified Supabase snapshot

- 978 permanent model routes in the approved route manifest; 979 catalogue rows, including one finance-promotion identity not on a permanent model route.
- `motorcycle_universal_page_sections_v1`: **1,306 model section records for 318 distinct models**, all `editorial_status='draft'`; 40 manufacturer section records for two manufacturers, also drafts.
- All 1,346 universal section records have nonempty `source_reference`, but none has `published_at`. A source reference alone is not evidence of reviewed publication.
- `motorcycle_universal_published_sections_v1`: **zero rows**. The universal renderer reads this reviewed-only projection and must not substitute draft rows.
- `motorcycle_model_v2_editorial`: 102 model records, only BMW R 1300 GS (model ID 77) has `preview_visible=true`; 25 records have nonempty legacy `editorial.sections`. The BMW preview record itself has zero entries in that legacy sections array. Preview visibility is not publication approval.
- `anybike_public_model_research_coverage_v1`: 965 models, 156 with verified research facts, 64 with approved hero photos. This is a separate public facts/image pathway, not proof of universal section publication.

## Release gates — preserve ONE template

1. Keep the 20-section V2 HTML/renderer shared across all 978 permanent URLs. Do not generate per-model layouts or invent absent research.
2. Audit the 1,306 draft model section records in batches for identity, section number/key, source relevance, content and publication review reference.
3. Obtain and record actual publication approval before changing any draft to published. Do not infer approval from `source_reference`, `preview_visible`, or verified-facts counts.
4. Confirm the public published projection returns only approved rows, then verify the shared V2 renderer maps them to the correct canonical model IDs and headings.
5. Run `scripts/check-universal-v2-fallback-catalogue.mjs`, `scripts/check-universal-v2-rollout.mjs`, and `scripts/audit-universal-v2-model-copy.mjs` in the GitHub Actions universal V2 audit.
6. Test a sample across Honda, Yamaha, BMW, Harley-Davidson, UK and international roles before retiring any legacy template. Preserve BMW/Harley manufacturer styling.

## Important distinction

A model can have a fully functional, indexable permanent URL and shared V2 layout even when its reviewed research sections are not yet published. The remedy is the approved data pipeline, not another template.

This snapshot is a database audit, not a claim that publication or live browser verification has completed.

## Batch audit results — 15 November 2026

A read-only SQL audit of all 1,306 model draft sections found:

- **0** missing canonical model identities (all model IDs resolve to `motorcycle_catalog_models.id`).
- **0** invalid section numbers (all within 1–20).
- **0** malformed `section_XX` keys.
- **0** duplicate model/section-number pairs.
- **0** empty JSON content objects.
- **41** rows explicitly containing `editorial_review_required` in the source reference.
- **320** rows with a source URL in the content and **175** with `verified_catalogue_facts` payloads; these are overlapping groups, not additive publication approvals.
- **0** rows in the public published-sections projection. None of the 1,306 drafts was automatically published.

The reusable SQL file `scripts/audit-universal-v2-publication-readiness.sql` checks these invariants and lists the draft editorial review queue. Its execution is read-only and cannot approve or publish content.

**Important:** Valid section structure is necessary but does not establish that the factual claims or media rights are reviewed. The publication reviewer must approve each section and record the required provenance before its status changes.
