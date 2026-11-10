# AnyBike — one-database, all-manufacturer batch rollout

Date: 10 November 2026. Scope: **49 currently described public manufacturers,
50 current registry entries, 53 raw manufacturer labels and 979 catalogue
model IDs**. These are **different counts**, not interchangeable totals.
No manufacturer records or canonical model IDs are renamed or merged.

## Source-of-truth and safety

- One canonical model catalogue and manufacturer registry; IDs never inferred
  from similar spelling or marketing names.
- One approved up-to-20-section universal page framework, preserving current
  BMW R 1300 GS and Harley-Davidson live layouts.
- Exact model stock above reviewed research where the server grants access.
- Zero public research without editorial approval and documented source/rights.
- Existing SEO routes, UK enquiries, international navigation and stock
  permissions must remain working. No manual upload to 123-reg; commits trigger
  automatic deployment, which still needs independent live verification.

## Completed all-brand audit and staging

The actual Supabase catalogue was loaded into the read-only JavaScript planners:
all **979 model IDs** were assigned once and only once, grouped into **13
workstream batches** of at most 100 records, with no duplicate or missing IDs.

Initial queues before this batch's draft imports:

| Workstream | Models | Treatment |
| --- | ---: | --- |
| Identity review | 19 | Do not alias, rename or merge without approval |
| Existing draft review | 110 | Verify evidence and applicability before publishing |
| Source verification | 9 | Preserve original text and provenance as private drafts |
| New research required | 841 | Research in manufacturer-wide batches, do not invent facts |

The private draft-only work performed in this batch:

- Suzuki TM250, RM85, RM-Z250; Yamaha TY250, YZ400F, YZ426F, YA-1,
  YZM400F (0WH2), YZE750 Ténéré (0W94): **nine** existing catalogue
  summaries copied to stage slot 01, source status `pending_review`.
- Ducati Panigale V4 (catalogue ID **107**): **two** legacy guide sections
  (introduction and chronology) staged under the one exact model ID;
  source remains `pending_review`. Ducati V4 S/R/Speciale specifications
  were NOT attributed to the base model.
- Existing Honda `Africa Twin` family guide does not identify one
  canonical CRF1000L/CRF1100L variant, so it is **not** automatically staged.
- Post-write verification: **927 staged sections**, made up of 887 model
  sections across **124 models** and 40 manufacturer sections.
  **Zero universal published sections** after both imports.

## Evidence currently available

- `motorcycle_catalog_editorial_source_index`: 160 pending-review URLs
  covering 70 BMW models; no verified entries in this index. URLs alone
  do NOT prove the facts have been checked.
- Legacy `data/motorcycle-model-guides.json`: 29 guides. Exactly 28
  match one canonical model identity; Honda's family-wide guide is
  unresolved and deliberately excluded.
- Current central model-photo bank rights must be checked per exact model
  and per photo; approved R 1300 GS assets do not authorize reuse on
  other BMWs or other makes.
- Current international stock Edge Function has distinct UK access
  restrictions: do not bypass with direct RPC or client-side workarounds.

## Repeatable commands / checks

- SQL: `scripts/sql/report-all-manufacturer-catalogue-intake.sql`
- SQL: `scripts/sql/report-all-manufacturer-intake-priority.sql`
- SQL: `scripts/sql/report-all-manufacturer-research-dashboard.sql`
- JS: `model-template/catalogue-intake-contract.mjs`
- JS: `model-template/catalogue-research-batches.mjs`
- JS: `model-template/legacy-guide-identity-audit.mjs`
- Tests: `scripts/check-all-manufacturer-intake.mjs`,
  `scripts/check-all-manufacturer-research-batches.mjs`,
  `scripts/check-legacy-guide-identity-audit.mjs`
- Controlled import SQL: `scripts/sql/stage-nine-existing-catalogue-overviews-draft-only.sql`
  and `scripts/sql/stage-ducati-panigale-v4-legacy-draft-only.sql`.
  Both are one-time and fail on unexpected existing sections.

## Large-batch next actions

1. Resolve 19 identity-review entries separately from factual research,
   retaining original dealer-feed labels until approved.
2. Systematically verify the 160 BMW source URLs, then expand documentary
   sourcing to Honda, Ducati, Yamaha, Suzuki, Harley-Davidson and other
   manufacturers in reusable batches.
3. Review the existing 120 non-blocked staged models after the new draft
   imports. Confirm sources, technical facts and exact-model rights.
4. Populate additional private drafts only where source provenance and
   canonical model identity are trustworthy. Never create 20 filler cards.
5. Keep BMW R 1300 GS as the first visual publication gate, not a separate
   database system. Do not activate any new universal page without reviewed
   content, correct stock entitlement and tested mobile/desktop parity.

## Verification

Direct local JavaScript checks passed for the all-brand intake planner,
research-batch planner and legacy-guide identity matcher. SQL dashboard
queries executed against the real Supabase project. The private draft
imports were verified after execution. GitHub Actions full completion
and live deployment remain unverified.
