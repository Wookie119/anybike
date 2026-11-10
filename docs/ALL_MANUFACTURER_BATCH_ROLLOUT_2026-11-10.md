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

## Follow-on batch — Harley-Davidson exact-model source preservation (10 Nov)

The existing `scripts/audit-harley-model-pages.mjs` covers **21** source
guides. An exact catalogue-make/model audit resolved **18** to one existing
Harley-Davidson canonical ID. Three were intentionally excluded:

- **CVO** is a multi-model factory programme, not one motorcycle model.
- **Hydra-Glide Revival** has no exact catalogue model ID.
- **XR1000** has no exact catalogue model ID.

The 18 exact matches were source-checked against their individual HTML `h1`
and introductory `lead` copy before a single atomic **18-section** import.
The existing conservative `extract-model-section-candidates.mjs` then
captured **40 more** explicit source sections from those 18 pages:
18 buying-guidance, 16 chronology, five technical-reference and one
generation section. A second atomic import copied these into private review
staging with category, source path and exact Git blob revision.

**Verified post-import state:** 58 Harley-Davidson research sections across
18 canonical models, all `draft`, all `pending_review`, with no publication
dates and zero source-review exceptions. These are source captures, **not**
fully fact-checked production specifications.

Global staged state after this batch:

| Measure | Verified |
| --- | ---: |
| Catalogue model IDs | 979 |
| Staged canonical model IDs | 142 |
| Model research sections | 945 |
| Manufacturer research sections | 40 |
| Total universal staged sections | 985 |
| Public universal published sections | 0 |

Identity/research workstreams after the imports: **19** identity review,
**138** existing draft review, **822** need new research. No outstanding
overview-only source-verification queue remains in the current catalogue.

New repeatable controls:

- `scripts/sql/stage-harley-eighteen-model-introductions-draft-only.sql`
- `scripts/sql/stage-harley-research-excerpts-draft-only.sql`
- `scripts/check-harley-source-intake.mjs`
- `scripts/sql/report-all-manufacturer-draft-provenance.sql`

The two import scripts are **one-time** guarded inserts, not scheduled imports.
They will refuse to overwrite existing staging records. GitHub CI now includes
the Harley source-identity and extraction parity check.

**Preservation:** neither BMW nor Harley approved HTML was edited;
stock access, customer enquiries, published content, and catalogue IDs
remained unchanged. The site deploy and complete GitHub Actions run still
require independent verification before any claim of live rollout.

## Primary manufacturer evidence verification — 10 Nov follow-on

The existing manufacturer-wide structured catalogue contains **399 evidence
records**: 194 individual facts, 92 generation records and 113 dated
timeline events. Original source/index dates and exact model IDs are
preserved. The generation and timeline records remain pending editorial
review and MUST NOT be promoted based on their HTTPS links alone.

Implemented one **cross-manufacturer evidence review planner** and one
**independent publication preflight**. The preflight requires a canonical
model ID, a fact marked source-verified, an exact matching HTTPS audit URL,
a documented verification basis and checked date, plus explicit editorial
signoff. A source review is not permission to publish.

The source-review worklist initially identified 64 facts with matching
independent audit trails, 48 verified facts without audit records, and
13 with different URLs between the fact and audit. Among the 13,
three differ only by URL query parameters while ten refer to different
document paths; these have **not** been automatically reconciled.

Directly inspected these original manufacturer sources on 10 Nov 2026:
- Suzuki Global motorcycle digital archive pages for TM125/RM125 and
  TM250/RM250 (15 exact-year facts).
- Honda Global's CB750 FOUR heritage chapter (two factory-location/
  production-transfer facts).
- Yamaha Communication Plaza's original 1974 YZ250/M listing (three
  exact-year engineering facts).
- Honda Global's 1950s history and its 75-year automatic transmission
  chapter (1958 Super Cub C100 introduction and centrifugal clutch).

**22 fact-audit records were inserted, append-only, into
`motorcycle_catalog_fact_verification_audit`**, with exact canonical fact ID,
matching existing source URL, source-document scope, factual verification
basis, and date. All inserts were guarded as atomic transactions that refuse
changed model IDs, changed sources, or pre-existing audits. Related claims
not fully supported by the inspected source were deliberately excluded;
the existing fact rows were never altered.

Verified after both operations:

| Fact-review measure | Current |
| --- | ---: |
| Source-verified catalogue facts | 125 |
| Complete consistent source audits | 86 |
| Missing source-audit records | 26 |
| Fact/audit source URL disagreements | 13 |
| Universal sections staged | 985 |
| Universal sections published | 0 |

The existing **64** previously audited facts were already embedded in
research sections; none was imported twice. The 205 historical generation
and timeline records all have valid canonical model IDs, HTTPS documentary
URLs, titles and plausible dates, but all still await editorial review.

Code/test/report additions:
- `model-template/catalogue-evidence-review-batches.mjs`
- `model-template/catalogue-evidence-publication-preflight.mjs`
- Corresponding unit/regression checks in `scripts/`, wired into the
  universal catalogue CI workflow
- `scripts/sql/report-all-manufacturer-evidence-review.sql`
- `scripts/sql/report-universal-embedded-fact-release-gates.sql`
- `scripts/sql/report-catalogue-history-evidence-readiness.sql`
- `scripts/sql/audit-17-honda-suzuki-primary-source-facts.sql`
- `scripts/sql/audit-five-honda-yamaha-primary-source-facts.sql`

Also extended the one universal renderer's verified-fact field whitelist
to display source-backed documentary text and typed engine layout,
valvetrain, power, gearbox, shaft drive and brake figures. The full
renderer and stage-integration regression scripts passed against the
current fetched GitHub modules. Full GitHub Actions and actual live
deployment remain separately unverified.

**No public pages or publication approvals changed. No manufacturer
or canonical model IDs were renamed. No stock permissions were widened.**


## Independent documentary evidence triage — 10 Nov, 15:50 UK

A fresh read-only Supabase audit checked **all 399** current structured
catalogue evidence records (194 facts + 92 generations + 113 timeline events).
The new repeatable SQL report is
`scripts/sql/report-all-manufacturer-documentary-evidence-triage-2026-11-10.sql`.
It assigns mutually exclusive evidence-review lanes and preserves exact
canonical IDs, audit URLs and source URLs for manual comparison.

| Review lane | Evidence records |
| --- | ---: |
| Missing or unsafe documentary source URL | 2 |
| Verified fact lacking independent audit | 13 |
| Verified fact with conflicting audit URL | 13 |
| Fact still requiring source verification | 67 |
| Historical generations requiring editorial review | 92 |
| Historical timeline entries requiring editorial review | 113 |
| Fact with consistent independent audit (NOT publication approval) | 99 |
| **Total** | **399** |

The missing/unsafe source lane includes two facts; classification intentionally
prioritises missing source links before the fact's other deficiencies.
Do not conflate the 99 audit-consistent entries with publication-ready facts.
No automatic URL reconciliation, source approval, or content release occurred.

A fresh production database count confirmed **979 catalogue model IDs,
985 staged universal sections, and zero public universal sections**.
This follow-on pass created and executed a read-only report and committed it to
GitHub; it did **not** stage additional content or change production permissions.
The current GitHub Actions and live deployment outcomes are not established
by these database checks.


## Larger all-manufacturer review and source-index batch — 10 Nov follow-on

A production read-only inventory confirmed **979 canonical model records**,
**985 staged research sections** and **zero published universal research sections**.
The exact registry/alias/collision/marketing guards from the existing catalogue
intake report were retained in a new deterministic **10-batch, up-to-100-model**
SQL worklist:

- `scripts/sql/report-all-manufacturer-100-model-research-batches-2026-11-10.sql`
- 19 identity-review cases stay separate (4 already have private drafts).
- 138 non-blocked staged models await review (932 sections).
- 822 models require manufacturer primary-source research; none had usable
  unstaged catalogue overview or specification content to copy safely.
- The remaining 13 sections belong to four identity-review models; staged
  total stays 985. All workstreams sum to 979 models exactly.
- The worklist was executed successfully against Supabase after its GitHub
  commit. It did not change tables, publication states, or permissions.

The shared JavaScript research planner and independent publication preflight
were hardened to **reject orphan verification audits**. Two accompanying
regression tests were added to the existing catalogue integrity CI workflow's
already-configured test files. Code was committed, but full GitHub Actions
execution is not independently confirmed.

New source-research intake:
`docs/PRIMARY_MANUFACTURER_RESEARCH_HONDA_DUCATI_2026-11-10.md`
maps **10 Honda and five Ducati** canonical catalogue IDs to original
manufacturer research entry points. These URLs were externally reviewed as
source *locations*, not as 15 completed fact-checked model guides.
Exact trims/years, evidence scope and photo rights require manual verification
before any staging or publication.

Final database integrity recheck: 112 fact-audit records, zero orphan
fact-audit IDs, and zero published universal sections. No live pages,
stock availability, model IDs or source research approval were modified.
