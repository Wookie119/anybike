# AnyBike universal manufacturer/model publication release gates

Audit date: **10 November 2026**. Checked against connected GitHub and Supabase.
This is an implementation and verification record, **not authorization to publish**.

## Non-negotiable product contract

- ONE database, ONE shared up-to-20-section framework, one approved BMW/Harley visual baseline.
- Exact-model Available Stock precedes research for UK/international, guest/dealer/private where authorized.
- Do not show a different model, trim or photograph in place of the requested model.
- No unpublished research, draft candidate facts, unlicensed images or model-title fallback.
- Keep the approved BMW R 1300 GS and existing Harley layouts, SEO URLs, enquiry flows and regional access checks intact.
- GitHub commits trigger automatic deployment; do not manually upload to hosting. Verify deployment separately.

## Observed database and integration state

| System | Observed | What it proves / does not prove |
| --- | --- | --- |
| Existing BMW public model-history RPC | 27/27 known BMW routes return BMW identity, generations, specifications, related links | A live-serving research interface exists; does not prove universal publication approval or visual parity |
| Country navigation RPC | 217 unique safe market URLs with names/regions | Navigation routes exist; **all 217 are candidate state** in editorial_page_routes, not approved article publication |
| Universal staged research | 916 draft sections | Staged only, no automatic public release |
| Universal published research | 0 records | New shared public loader cannot yet replace approved model content |
| Private stock-catalogue identity staging | 7 mappings: 6 verified, 1 candidate | Verification does not itself grant publication/entitlement |
| Buyer-safe catalogue RPC v2 (database-side result) | 90 BMW items spanning 28 canonical models; all 90 have verified identity / eligible flags; zero checked make-model mismatches | Demonstrates RPC data shape only; does **not** show that UK guests can request these items |
| R 1300 GS in sampled buyer-safe RPC v2 | 3 exact-model items; F 900 GS 2, S 1000 RR 11 | Source inventory is not a guarantee of live stock/price or UK browsing rights |
| Approved central editorial photo bank | 5 R 1300 GS images with HTTPS source/rights and attribution | Other BMW models have no approved assets in this particular shared bank |

## Critical stock-access dependency

The deployed `international-public-stock` Edge Function (version 4 at audit)
gets visitor country from IP geolocation and returns **403 for UK/GB**
unless the current trusted-account/admin exception allows access.
It delegates buyer-safe inventory to `international_vq_public_catalog_v2()`,
whose model-ID and publication-eligible fields are present in the returned JSON.

**Do not** replace the UK/GB rule with a client-only bypass, expose the
privileged RPC or reuse a service role key in the browser. Obtain an approved
buyer-safe UK stock read contract first, validate its visibility restrictions
and all user roles, and only then connect the shared model-page stock component
to an all-visitor endpoint. UK stock availability is a product requirement,
but it is not implemented by the current international endpoint.

## Public research and country-link release dependencies

- The existing BMW RPC `public_bmw_model_history_v1` has a 27-route allowlist
  and is an existing, separate **legacy integration**. Its editorial source
  uses `motorcycle_model_v2_editorial`; its `preview_visible` flag is
  not equivalent to the universal publication review reference.
- The universal public table requires valid publication provenance,
  approval status, release time and correct model/manufacturer identity.
  Stage-only integration intentionally does **not** automatically activate
  any existing public page while this table is empty.
- `public_anybike_country_navigation_v1` is a navigation feed only. It
  exposes candidate routes because the 217 market guide routes are discoverable.
  Never interpret these as approved country editorial or population/sales facts.
  Do not remove working country navigation merely to clear candidate counts;
  instead create an explicit reviewed editorial release process.

## Before the first actual rollout

1. Finish R 1300 GS published review/rights and compare the 20-slot framework's applicable sections with the approved R 1300 GS layout.
2. Verify a buyer-safe exact-model feed for each target audience: UK guest, UK private, UK dealer, international guest/private/dealer, using server-side checks.
3. Confirm hero, genuine authorized stock above research, year/spec/edition/engineering/source links, actions, forms, SEO and layout on mobile + desktop.
4. Run the universal catalogue CI suite; verify GitHub Actions completion and independently verify the automatic live deployment.
5. Roll out only after equivalence tests pass, retaining the existing approved public BMW and Harley pages until then.

Repeatable read-only database audit: `scripts/sql/report-universal-catalogue-staging-readiness.sql`.
Stage regression: `scripts/check-universal-page-stage-integration.mjs`.
Country navigation regression: `scripts/check-country-navigation-integrity.mjs`.
