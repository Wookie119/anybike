# AnyBike database-driven publishing — route registry milestone

**4 November 2026 — implementation and verification**

Production Supabase private schema: `anybike_publishing`
Table: `anybike_publishing.editorial_page_routes`

This is the **single internal routing identity registry** for manufacturer, model, country and AnyBike Global pages. It is not a browser API and does not publish by itself.

## Actual current inventory

- 2 manufacturer routes: BMW (ID 15) and Harley-Davidson (ID 28).
- 45 model-guide routes mapped to real `motorcycle_catalog_models.id` records.
- All 47 have `publication_state = 'candidate'`, `source_verified_at` set and `live_verified_at` NULL.
- No route was marked `published` as a side effect of source verification.
- All 45 model files were checked against their actual source canonical URL, sitemap entry, H1, closing main element, noindex and meta-refresh checks.
- No public HTML file was altered or deployed by this registry work.

## Security verified

- Private schema usage denied to `anon` and `authenticated`.
- Table `SELECT` denied to `anon` and `authenticated`; `service_role` can read.
- RLS enabled. No public policies.
- Supabase security advisor reports `rls_enabled_no_policy` INFO, intentional for this private backend registry; it is deny-by-default.
- Editorial publication constraint requires source, live and editorial verification timestamps before `publication_state='published'` is accepted.

## Programmatic flow

1. Backend securely reads registry + canonical catalogue identities using server-side credentials.
2. `scripts/verified-editorial-route-identities.mjs` filters unverified/draft routes and resolves names and entity IDs.
3. `scripts/build-editorial-url-inventory.mjs` checks real repository HTML, sitemap and canonical.
4. `scripts/assemble-public-editorial-graph.mjs` creates approved reciprocal navigation.
5. `scripts/render-editorial-related-links.mjs` produces crawlable, escaped HTML links.
6. `scripts/stage-editorial-navigation.mjs` writes **preview copies only**, preserving approved BMW / Harley / market layouts.
7. Deploy only after tested publishing and live checks; no autonomous overwrite of approved templates.

Source-only matching can now discover additional makes and model pages when their real catalogue identities are supplied. It never authorises publication by filename alone.

## Items still outstanding

- Full Node.js GitHub Actions run and deployment on 123-reg need confirmation.
- Country route population across 217 market pages requires verified country identities and source checks.
- Existing 9 model-country association records have NULL model IDs. They are **not** model-to-country links until resolved.
- Global editorial stories are still drafts; no automatic public links until status and publication checks pass.
- Autotrader taxonomy IDs remain unpopulated pending an authorised source. AnyBike internal IDs stay canonical.
- Broader manufacturer/model source-page coverage is needed; the current sitemap contains 45 uniquely catalogue-matched model guides (27 BMW, 18 Harley) and no matching non-BMW/Harley model guides.
