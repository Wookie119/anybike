# AnyBike model research rollout — Supabase baseline (12 November 2026)

This is a measured baseline from `public.anybike_public_model_research_coverage_v1`, not a claim of browser-rendered publication.

| Metric | Count | Share of 965 approved models |
| --- | ---: | ---: |
| Approved public model identities | 965 | 100% |
| Models with at least one verified research fact | 154 | 16.0% |
| Models with an approved hero photo | 64 | 6.6% |
| Models with approved gallery photos | 5 | 0.5% |
| Verified facts across all models | 641 | — |

## Priority manufacturers by research gap

| Manufacturer | Approved models | With verified research | Approved hero photos | Approved gallery photos |
| --- | ---: | ---: | ---: | ---: |
| BMW | 93 | 66 | 28 | 1 |
| Yamaha | 89 | 8 | 8 | 0 |
| Honda | 85 | 28 | 6 | 1 |
| Harley-Davidson | 82 | 9 | 14 | 0 |
| Ducati | 59 | 5 | 0 | 0 |
| Kawasaki | 56 | 13 | 4 | 1 |
| Suzuki | 56 | 12 | 4 | 0 |
| Triumph | 54 | 8 | 0 | 2 |
| KTM | 33 | 0 | 0 | 0 |
| Aprilia | 28 | 1 | 0 | 0 |
| Indian Motorcycle | 16 | 0 | 0 | 0 |

## Publication sequence

1. Protect and test the single approved BMW R 1300 GS design and all model-route identities.
2. Reconcile model aliases and exact model-year/generation identities before inserting facts.
3. Research verified primary sources for the largest gaps, starting with approved identities already in the catalogue.
4. Publish facts through the existing Supabase research tables and approved public RPC; do not create competing hardcoded model pages or unreviewed technical claims.
5. Attach only correctly identified, rights-cleared model photographs.
6. Verify data actually renders in the correct section, and separately test UK/international, logged-in/logged-out and dealer/private views.
7. Keep the exact-model Available Stock panel above research for international visitors, with safe fallback when no approved stock feed is available.

**No changes to Supabase records were made when collecting this baseline.** Counts will change as research is approved. Re-query the coverage view for current figures.
