# AnyBike V2 model content — direct database audit (15 November 2026)

Source: read-only SQL against AnyBike Supabase project `tuehtnezhdnkqbbhttgp`. These figures are **database-wide**, not yet the intersection of the 978 published route IDs. No editorial content was invented or modified.

| Measure | Count |
|---|---:|
| Catalogue model rows | 979 |
| V2 editorial rows | 102 |
| Public research coverage view rows | 965 |
| Coverage rows with verified research facts | 156 |
| Coverage rows with approved hero photos | 64 |
| Catalogue rows with null/blank/Other/Unknown motorcycle type | 536 |
| Catalogue rows with null/blank overview | 887 |

## Verified examples
- BMW R 1300 GS: Adventure category, overview present, 21 verified research facts, 1 approved hero, V2 editorial present.
- BMW R 1300 GS Adventure: category missing, overview present, 1 verified fact, no approved hero, V2 editorial present.
- BMW R 1300 GS TE: Adventure category, overview absent, 0 verified facts, no approved hero, V2 editorial present.
- Honda CBR650R: Sports category, overview absent, 7 verified facts, 1 approved hero, no V2 editorial row.
- Honda CRF250L: category and overview absent, 0 verified facts, no hero, no V2 editorial row.
- Honda CRF250R: Off-road category, overview absent, 0 verified facts, no hero, no V2 editorial row.
- KTM 390 Duke: Roadsters category, overview absent, 0 verified facts, no hero, no V2 editorial row.
- Yamaha MT-09: category and overview absent, 5 verified facts, no hero, no V2 editorial row.
- Yamaha MT-09 SP / MT-09 Y-AMT: category and overview absent, 0 verified facts, no hero, no V2 editorial row.

## Work order
1. Match the 978 route model IDs to catalogue, editorial and coverage rows; investigate the 979 vs 978 discrepancy before modifying routes.
2. Separate **template/rendering failures** from **unpublished/missing verified content**; do not mislabel absent research as broken rendering.
3. Apply shared presentation fixes in the single V2 renderer only; do not introduce per-model templates.
4. Improve categories from approved taxonomy, preserving source-verified facts and model/variant identity. Never invent overviews, specs, years or images.
5. Run the 978-page source audit and a live browser text audit. Do not archive legacy templates until dependencies and live pages are verified.

GitHub Actions audit workflow: `.github/workflows/universal-v2-copy-audit.yml`; audit source: `scripts/audit-universal-v2-model-copy.mjs`. GitHub workflow execution and live page results have **not** been confirmed in this audit.
