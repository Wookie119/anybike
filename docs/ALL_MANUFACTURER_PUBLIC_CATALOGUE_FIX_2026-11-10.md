# AnyBike all-manufacturer public catalogue recovery — 10 November 2026

## Trigger

The live generic manufacturer page was reported to show an indefinitely
loading catalogue panel and missing model categories on Suzuki and Honda,
among other manufacturers. The common public HTML had a malformed
`categoryEntries.map` arrow function, so its entire inline script could
not parse. The problem was **shared rendering**, not missing Suzuki or Honda
database rows.

## Completed public-page recovery

1. Corrected the shared JavaScript syntax in `motorcycle-brand.html` without
   replacing the approved layout or editing dedicated BMW/Harley pages.
2. Added `scripts/check-manufacturer-brand-model-rendering.mjs`. It executes
   the actual inline manufacturer page code in an isolated DOM harness for
   every manufacturer label in the public master catalogue; verifies the
   dedicated BMW/Harley redirects and exact-model guide URLs; checks that
   five major brands retain curated model cards when the master JSON fails;
   and checks the linked generic model-guide script syntax.
3. The manufacturer catalogue summary now shows curated-model fallback
   details until the full JSON is ready, and a sensible outage message when
   the request fails. It can no longer remain permanently on
   "Loading catalogue information…" after a failed fetch.
4. `motorcycle-model-guide.html` now treats its deep-research JSON as optional.
   A valid model from the static master directory retains the exact model
   identity and customer sourcing route even when the optional guide file
   fails. It does not invent factory specifications or model years.
5. `scripts/check-generic-model-guide-fallback.mjs` verifies six exact
   models and the customer enquiry links with and without a research guide.

## Large safe catalogue intake

Supabase `public.motorcycle_catalog_models` contained 979 canonical model
IDs under 53 raw manufacturer labels. The old public static master held
785 model records. Exact normalized make+model matching found 192 missing
from the public master; the remaining count difference includes normalized
duplicates and source label variations.

The 192 were classified by **canonical model ID**, not fuzzy name:

| Class | Rows | Outcome |
| --- | ---: | --- |
| Unique models belonging to 18 registered generic manufacturers | 104 | Added |
| Dedicated BMW and Harley-Davidson catalogue rows | 80 | Left to their approved page architecture |
| Manufacturer-name mismatches: Indian, VMoto, Mugen | 8 | Held for independent registry/alias review |

Each of the **104** additions contains only a public model name, make,
conservative category, source canonical model ID, `verification: pending`,
and `production_years: null`. None claims factory specifications,
production totals, available stock, sales eligibility or publication of
private research.

Public master: **889** records after additive, source-ID-preserving update.

- 28 Yamaha
- 13 Triumph
- 9 Suzuki
- 8 Honda
- 8 Ducati
- 7 Benelli
- 6 Kawasaki
- 25 across eleven other generic manufacturers

`scripts/check-public-catalogue-identity-snapshot.mjs` fails on duplicate
normalized make/model labels, repeated source IDs, silently approved research
statuses, finance promotions and identity-mismatch additions. Import
counts are pinned deliberately until another **reviewed** batch changes
the source snapshot and its test.

## Verification

The manufacturer page regression passed against the fetched amended GitHub
HTML and JSON across **48 generic public manufacturer labels**. This
includes **56 Suzuki models** and **85 Honda models** in the updated public
directory, with correct model-card links and fallback behaviour. The model
guide fallback regression passed for Suzuki RM250, Suzuki Hayabusa, Honda
Dream D-Type, Honda Super Cub C100, Yamaha YZM400F and Triumph Speed Twin
900. The canonical-ID audit passed for all 104 new public labels. All three
checks are registered in `universal-catalogue-integrity.yml`.

These are source-level simulated browser/DOM tests, not independently
confirmed GitHub Actions workflow results or a proven live deployment.
The external website fetch checker could not retrieve the refreshed pages,
so do **not** mark live publication verified without a separate browser
check. GitHub commits normally initiate the automatic site deployment;
no manual hosting upload should be done.

## What must not be broken

- Approved BMW R 1300 GS and Harley-Davidson public designs/URLs.
- Buyer-safe exact-model stock, login and dealer/private access rules.
- Manufacturer hero, research cards, mobile layouts and UK sell/sourcing forms.
- Publication rights, photo licences and editorial review status.
- Existing catalogue and stock IDs; no auto-merging near names.

## Next work

1. Independently confirm the automatic live deploy for Suzuki, Honda and a
   few other generic pages, both with and without sign-in where relevant.
2. Review the 80 dedicated BMW/Harley catalogue rows against their distinct
   page master, without generating generic duplicate routes.
3. Resolve Indian/VMoto/Mugen registry identities separately; never treat
   normalised spelling as automatic reparenting.
4. Move toward one safe public database-backed model index with a reviewed
   projection of exact canonical model names and categories; retain the
   static directory as a non-empty fallback, not as a second source of truth.
5. Keep the universal research publication pipeline closed until explicit
   section/fact/photography approval and successful visual parity testing.
