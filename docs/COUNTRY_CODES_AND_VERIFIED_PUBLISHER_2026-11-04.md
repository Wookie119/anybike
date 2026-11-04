# AnyBike country-code and private publisher progress — 4 November 2026

## Confirmed in the production Supabase database

Private registry: `anybike_publishing.editorial_page_routes`.

- 217 country routes, 9 regions, all source-verified; no live-verified or newly published routes.
- 216 unique ISO 3166-1 alpha-2 country/territory codes stored with explicit evidence.
- 184 code records: exact match to approved AnyBike market metadata country name.
- 25 code records: named country flag on approved country page cross-checked with standard code references.
- 7 code records: reviewed aliases (Antigua & Barbuda/AG, Bahamas/BS, France/FR, Saint Kitts & Nevis/KN, Saint Vincent & the Grenadines/VC, Trinidad & Tobago/TT, United States/US) supported by existing market metadata and country code references.
- Kosovo has **no assigned ISO 3166-1 alpha-2 code**. `XK` is a user-assigned operational code, not a standard ISO code. Keep `country_code` NULL rather than misrepresenting its status. For future operational integrations, handle this as an explicit separately typed exception.
- Constraints validate 2-letter uppercase ISO codes (excluding XK), explicit evidence, 9 approved regions, country names, and canonical market paths.
- RLS private; no browser access to the registry.

Reference for ISO 2-letter code mapping: https://www.ripe.net/community/internet-governance/internet-technical-community/the-rir-system/list-of-country-codes-and-rirs/
Additional US Census code table: https://www.census.gov/foreign-trade/schedules/c/countrycodes.html
Kosovo code exception: https://op.europa.eu/en/web/eu-vocabularies/countries-and-territories

## Code integrated in GitHub main

- `scripts/verified-editorial-route-identities.mjs` maps registered published and live-verified country slug identities safely.
- `scripts/regional-market-navigation.mjs` builds 217-country staging graph; 1,292 valid same-region navigation links checked in a focused run.
- `scripts/catalogue-link-adapter.mjs` consumes those published relationships and country ISO codes; no fabricated motorcycle-country relationship.
- `scripts/assemble-public-editorial-graph.mjs` accepts verified regional country routes.
- `scripts/build-verified-editorial-navigation.mjs` provides end-to-end **server-side preview only** from an authorised private DB export through source eligibility, graph generation, and staged crawlable HTML.
- `scripts/audit-country-code-crosswalk.mjs` validates the private registry's codes against approved AnyBike market sources, requiring evidence for aliases.
- `scripts/check-country-code-sources.mjs` evaluates the current 217-country staging snapshot, with 216 unique codes, one unassigned ISO code and zero audit issues in focused execution.
- `.github/workflows/public-link-audit.yml` includes the new test suite and country source verification reports.

The integrated source-level simulation checked 4 published hypothetical pages (manufacturer, model, 2 countries), 6 reciprocal link edges, 4 unchanged originals and the candidate-only block. All seven focused assertions passed. This does not establish that a full Node test suite ran successfully or that the live 123-reg site was updated.

## Outstanding

1. Complete actual Node test suite / CI verification; no confirmed GitHub Actions status was returned.
2. Run live 123-reg HTTP / Google Search Console eligibility and server header checks.
3. Review editorials before promoting any candidate route to published, keeping BMW / Harley protected layouts.
4. Actual public HTML deployment has NOT occurred.
5. The 9 existing `motorcycle_model_country_links` records currently have NULL `model_id`, so there are no backed model-to-country edges from those records.
6. AnyBike Global draft stories must remain outside published cross-links until editorial approval.

No new sitemap upload was required or performed.
