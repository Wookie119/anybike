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

## 10 November follow-on: approved source parity and model hero contract

- Repository source audit inspected **all 27 BMW guide HTML files**: each
  retained the shared header/stock integration, canonical link, research and
  generation containers, indexability and enquiry anchors. Both GS-specific
  gallery/stock-panel anchors were also present. This is **source parity only**,
  not browser rendering or successful UK stock access.
- `scripts/check-bmw-approved-model-route-parity.mjs` is now wired into the
  universal catalogue CI workflow. Shared BMW and Harley page changes trigger
  the existing cross-model integrity checks.
- Shared universal staged renderer now accepts an **optional approved hero
  photograph**, supplied by an authorized caller with exact manufacturer and
  model names, approved status, HTTPS image/source/licence URLs and attribution.
  There is no model-substitution fallback. The current BMW R 1300 GS photo bank
  contains five fully documented approved assets.
- Nested source-verified fact records now also respect explicit editorial
  draft, publication denial, pending copy review and future release timestamps.
  Source verification alone is not authorization to publish editorial facts.
- Tests for both the shared renderer and stage-only integration were executed
  against the fetched current modules and passed. CI run and the real deployed
  page remain unverified.
- **No research has been promoted**: 916 sections still staged and the new
  public universal publication table remains empty.
- Harley-Davidson has 82 catalogue model records and **no universal model
  section staging**, despite its existing preserved HTML guides. This must not
  be represented as completed database migration.

## 10 November continued: research schema and in-flight request QA

- R 1300 GS section JSON was audited against the actual universal renderer.
  The existing draft covers **15 canonical section slots**. An executed
  synthetic-shape regression confirms **14 readable cards** can render,
  deliberately excluding the photography-rights-only section; this test
  does not promote the draft or certify all underlying facts.
- Reviewed customer-copy groups (`uk_selling`, `international_stock`,
  `international_enquiry`, `international_sourcing`) now render their
  existing headings and paragraphs without displaying an imitation form.
  Actual live enquiry forms stay in the approved production pages.
- Inline research references in the documented `[url,label]` shape now
  render as safe links, preserving citation provenance without script URLs.
- Structural staging audit: **40 manufacturer sections** have no supported
  display shape (**29** draft imported-source-only, **11** empty).
  Of **876 model sections**, **846** have potentially displayable shapes
  and **30** are not displayable (**26** rights-only photo references,
  **4** empty). **Structural potential is not editorial approval.**
- New 15-section BMW research-shape regression is wired into GitHub CI;
  renderer and stage-integration tests were executed directly against
  current fetched modules and passed.
- Stage request generation now ignores stale rejected calls after a newer
  model selection, not merely stale successful responses.
- The universal published table remains empty; no existing BMW/Harley HTML
  page was replaced and no buyer stock entitlement changed.

## Still required before production activation

- Explicit editorial signoff with source-section and review references;
  there is no authorization to bulk-promote 916 draft sections.
- Buyer-safe UK and international stock access, tested server-side for
  guest, private and approved dealer views; do not bypass the current
  international-stock geographic restrictions on the client.
- Full CI result and independently verified live deployment.
- Visual parity with the existing R 1300 GS page, including mobile layout,
  exact stock above research, sourced model history, forms and SEO.
