# AnyBike: controlled Google indexing for individual motorcycle stock

Status: foundation installed on 2026-11-03; **no stock publication or SEO switch has been enabled**.

## Why this exists

Manufacturer, model, country and editorial content should be indexable, but private seller data, trade opportunities and non-public dealer stock must never enter Google indexing. The existing `bike-details.html` and `available-stock.html` currently use `noindex`; do not remove this until the complete public publication pathway has been built and verified.

## Private database foundation (Supabase)

`public.stock_google_publication_approvals` (primary key `stock_id` referencing `public.available_stock.id`) is an editorial review record, **not** publication authority by itself.

- Decision: `not_approved` (default), `approved`, or `revoked`.
- A decision of `approved` requires `reviewed_at`, `reviewed_by`, and all four true checks: `content_verified`, `photo_rights_verified`, `stock_visibility_verified`, `publication_permission_verified`.
- RLS enabled, no public policies, and grants revoked from `PUBLIC`, `anon`, `authenticated`.
- No rows created or pre-approved during installation. Admin workflow has not yet been connected.
- The record must never be read or written directly from a public browser using elevated credentials.

## Additional required gates (not implemented yet)

Before a motorcycle is eligible for an indexable page, verify **all** conditions server-side:
1. It has explicit editorial Google approval, and each check remains valid.
2. It is within the correct approved public stock channel; the dealer/seller has granted publication permission. Trade auction, confidential underwrite, seller contact and internal price data remain private.
3. Stock status is Active; lifecycle is live; not withdrawn, reserved, sold or expired; source removal date is null. Recheck before each publication.
4. It has a correct public make, model, year, mileage, public description, usable rights-cleared photos and current public price/offer policy.
5. Public rendering uses a strict whitelist of approved fields; never serialize whole `available_stock` rows or `raw_data` / `private_*` / `seller_*` / `cost_*` fields.
6. An indexable unique HTML page has a server-rendered title, description, canonical, meaningful body content and structured data; `bike-details.html?id=...` is not currently suitable merely by removing noindex.
7. A generated stock sitemap includes **only** currently approved listings; removed stock is dropped promptly. Do not use the manufacturer/model/country sitemap to enumerate arbitrary IDs.
8. Withdrawn pages stop showing offers and return appropriate 404/410 or a deliberately maintained substantive page, not a blanket 301 to unrelated stock.

## Validation before release

- Test as an anonymous visitor, logged-in buyer and an excluded dealer, and test each privacy boundary.
- Verify production Apache redirects and HTTP robots tags; static GitHub changes do not prove 123-reg deployment.
- Inspect the rendered HTML as Google would see it, canonical tags and sitemap.
- Test null/non-numeric/nonexistent stock IDs, withdrawn inventory, missing consent and photos, double-check external stock-provider permission.
- Verify no confidential dealer stock, customer details, phone numbers, postcodes or internal margins are exposed.
- Keep approved BMW and Harley-Davidson page designs untouched.

## 2026-11-03 baseline

- `available_stock`: 10 rows; 9 Active/live and unremoved.
- No Active/live records have a populated `public_description` (0 of 9).
- `dealer_stock_channel_eligibility`: international available-stock 14 disabled; international sourcing 14 enabled. Do not conflate a sourcing permission with publication.
- `stock_google_publication_approvals`: 0 rows; anon/authenticated cannot SELECT/INSERT/UPDATE this private table.
- The public sitemap currently contains 359 URL entries. No need to resubmit solely because of the private foundation table.

## Recommended implementation order

1. Dedicated admin-only review screen with audit trail; never allow client direct table access.
2. Correct stock consent/content/photo workflow and enforce publication channels at the data source.
3. Public safe-field projection/API with server-side gate; RLS tests.
4. Search-engine-ready detail pages and generated approved-stock sitemap, with lifecycle removals.
5. Small pilot, verified in production, then gradual rollout and Search Console review.

**Never remove noindex globally or index every `bike-details.html?id=` URL.**

## 2026-11-03 update: trusted stock-source automation foundation installed

The preferred workflow **does not require the owner to approve every motorcycle**. An authorised administrator verifies a stock provider/feed once, then an automatic eligibility check evaluates incoming listings. Manual review is only for exceptions.

New private `public.stock_source_google_permissions`:
- One permission record per real `stock_sources.id`; `pending` by default, then `approved`, `suspended`, or `revoked`.
- Approval requires affirmative public advertising consent, permission to republish photographs, verified price/availability authority, verified identity, evidence reference, reviewer UUID and timestamp.
- `anon`/`authenticated` permissions revoked; RLS enabled; no public policies. A service-side review process is still needed to set approvals. **Do not store elevated database keys in browser scripts**.
- Revoking or suspending a source immediately fails eligibility checks; publication and sitemap removals still require a future deployment pipeline.

New private `public.admin_stock_google_eligibility` view:
- `security_invoker=true` and explicitly no anon/authenticated access. Returns only stock ID, source ID, readiness status and boolean; no seller contacts or internal prices.
- Enforces source approval and active source, active/live/unremoved/unexpired stock, no per-bike hold, valid make/model/year/public price, at least 50 characters of public description and a normal photo URL.
- The existing per-stock `stock_google_publication_approvals` table remains an **exception gate**: an explicitly recorded non-approved item prevents it from being eligible; new stock without an override is evaluated from source approval.
- Source-level permission does not substitute for verified seller-specific restrictions, rights, or channel conditions; the future public pipeline must enforce these at the point of publication.

Verified immediately after installation:
- Exactly **one existing stock source**, with 10 stock entries; 9 Active/live, 1 removed.
- **Zero** source permission records, zero approved sources, zero Google-eligible stock entries.
- Neither `anon` nor `authenticated` can SELECT the source permissions, per-bike approvals, or eligibility view.
- All 10 currently lack sufficient `public_description` for Google publication.
- Website `noindex` state, live inventory permissions and **359-entry sitemap** unchanged.

### Remaining work — do not claim auto-publishing is live yet
1. Secure administrator-facing source-approval controls, evidence upload/audit, and exception queue.
2. Provider-specific consent and dealer-channel mapping including confidential/auction exclusions.
3. Production publishing process to generate *sanitised*, server-rendered public bike pages with immediate removal/withdrawal.
4. Search-ready stock sitemap with safe incremental reconciliation and production HTTP tests.
5. Test one approved provider in a small pilot; never bulk-enable existing stock simply because it has a source ID.
