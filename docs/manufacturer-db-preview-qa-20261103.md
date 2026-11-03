# Manufacturer database-derived preview QA — 3 November 2026

**Development only. Not published. Not browser-approved.**

## Grounded implementation
- Private Supabase draft tables: `motorcycle_manufacturer_sections_v1`, `motorcycle_manufacturer_source_blocks_v1`.
- 20 numbered section records per manufacturer (40 total).
- 11 BMW static source blocks and 21 Harley-Davidson static source blocks, imported unchanged from the numbered approved backups.
- Two code-generated photograph credit sections retain separate handling.
- Captured development-only editorial export: `development-data/manufacturer-supabase-draft-snapshot-20261103.json`.
- Generated database-derived files: `development-preview/manufacturer-bmw-db-20-section-preview.html` and `development-preview/manufacturer-harley-davidson-db-20-section-preview.html`.
- Rebuild utility: `tools/build-manufacturer-from-snapshot.mjs`.

## Checks performed
1. Fetched both generated database-derived HTML files from GitHub after saving.
2. Verified each contains exactly 20 ordered section containers.
3. Verified every non-null Supabase source HTML block is contained verbatim in its respective output.
4. Verified both files have `noindex,nofollow` and no canonical tag.
5. Verified model family mount, Global story connector, and manufacturer credit mounting points remain present.
6. Verified category links refer to IDs created by existing page scripts.
7. No duplicate markup IDs detected in the static outputs (CSS selector references are not IDs).
8. Separate 2026-11-03 snapshot and development source files verified in GitHub.

## Remaining gates — DO NOT PUBLISH
- Browser execution/console tests and desktop/mobile screenshots at representative widths.
- Actual gallery/image loading and rights audit for each photograph; the photo bank currently holds five approved assets, but these do not automatically license all the previously embedded images.
- Check all current links, canonical and JSON-LD rewriting for eventual public URLs.
- Verify clean migration of original section heading text, anchors and navigation, not merely existence of each section wrapper.
- Verify all 20 sections contain substantial accurate, brand-specific content. Several slots remain intentionally incomplete. No placeholder may ship as finished editorial.
- Build a public published-only query surface with RLS, rights filtering and appropriate cache/index strategy. The draft tables must remain private.
- Browser-level parity with the two approved live pages before replacement or rollout to other manufacturers.

## Security
All new staging tables have RLS enabled and no anon/authenticated grants. Browser previews use a static content export and no private service key. No production website changes were made in this batch.
