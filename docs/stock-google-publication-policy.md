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
