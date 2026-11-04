# AnyBike — protected editorial publishing hardening batch

Date: 4 November 2026

## Purpose
Make the existing database-driven manufacturer, motorcycle model, country, and AnyBike Global publishing pipeline safe for future large-scale rollout without modifying approved BMW / Harley templates or live 123-reg pages.

## Changes made

1. `scripts/match-catalogue-guides.mjs`: Once two or more catalogue rows normalize to the same make/model identity, the name remains quarantined even if a third record follows. Avoid arbitrarily matching an RS 660, Z900 RS, BMW variant, or another ambiguous guide.
2. `scripts/catalogue-link-adapter.mjs`: Manufacturer name duplicates no longer become valid again when a third record follows. A model must have both verified public endpoints before a link is created.
3. `scripts/public-editorial-manifest.mjs`: Duplicate source URLs stay quarantined regardless of count. Conflicting published identity IDs or canonical URLs now quarantine all conflicting claims, not simply the second one.
4. `scripts/stage-editorial-navigation.mjs`: Preflight all proposed pages before writing any preview files. A missing page, unsafe path, duplicate destination, or stale existing preview prevents a partial batch from being written.
5. Staged output inside a repository checkout is restricted to `reports/*preview*` (already in `.gitignore`); a separate external staging directory is also allowed.
6. Regression tests added or updated for three-way collisions, duplicate source URLs, conflicting manifest IDs/paths, failed preview batches, reused preview files, and attempts to stage inside public site folders.
7. The current test workflow references these regression files. A successful real Node/GitHub Actions run is **not confirmed**: connected GitHub status returned no statuses, and workflow-run lookup returned no runs.
8. Direct focused checks of the new pure matching and manifest logic passed. The updated staging guard passed a small in-memory simulation, including preflight failure and recovery to a clean preview.
9. Public host checks via HTTP still did not produce accessible live pages through the current browsing environment. Do not mark `live_verified_at` or `editorial_verified_at` on the basis of repository-only results.

## Database state carried forward

- 217 source-verified country routes, 45 model routes, two manufacturer routes.
- 216 standard country/territory codes with recorded evidence; Kosovo remains an explicit operational exception with NULL ISO alpha-2 code.
- All 264 editorial registry routes remain candidates; live verification and editorial publication approval are unconfirmed.
- Existing `motorcycle_model_country_links` rows have no model IDs. No model-country relationship may be inferred from regional proximity.
- Approved BMW, Harley-Davidson, R 1300 GS V2 and country page layouts were not rewritten by this batch.

## Remaining release gates

- Confirm successful real Node regression suite in CI.
- Confirm deployed 123-reg headers, self canonicals, redirects and crawlability at HTTP level.
- Obtain Google Search Console indexing data.
- Create an authorised private backend export for the registry, then stage and review only approved pages with the existing protected preview builder.
- Deploy only via a separately verified and authorised 123-reg process. Do not upload reports, fixtures, credentials, or preview files to the public site.
