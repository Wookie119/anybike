# AnyBike international country source-indexability milestone

**4 November 2026 — verified repository source and private route registry**

## Scope completed

- **217 of 217** distinct market URLs recorded in the repository sitemap.
- **217 of 217** corresponding `markets/<slug>.html` files individually fetched from the AnyBike repository and checked during this session.
- Verified: expected self-canonical, no source `noindex` or `nofollow` meta directive, a main `h1`, page title, description metadata and no meta-refresh redirect.
- `robots.txt` in repository contains `User-agent: *`, `Allow: /`, and the main sitemap declaration. These are **source** rules, not verified live server headers.
- All 217 are in the private `anybike_publishing.editorial_page_routes` registry with `publication_state='candidate'` and `source_verified_at` populated.
- No country route is marked `published` in the registry. All 217 have `live_verified_at` NULL, reflecting that the public host/Googlebot response has not yet been independently verified.
- The two manufacturer and 45 model pilot routes are source-verified too: **264 source-verified routes in all**.
- Source verification and Google indexing are different. Google may choose not to index otherwise eligible pages for quality/duplication reasons.
- These registry operations did **not** change the existing public country HTML layouts and did not deploy new pages.

## Automated checks

- `scripts/audit-country-indexability.mjs` inventories country HTML, expected canonical, robots meta, H1, titles, description, redirects, sitemap and source count.
- It now checks for **exactly 217 distinct listed country URLs and 217 matching source HTML files** when invoked from CLI.
- `.github/workflows/public-link-audit.yml` fails the report stage if any of those pages loses source indexability and preserves detailed artifacts even when failing.
- `scripts/audit-live-country-indexability.mjs` provides a separate normal HTTP audit for live status, redirect, response body canonical, robots meta and `X-Robots-Tag`, explicitly distinguishing network failures.
- `.github/workflows/live-country-indexability.yml` is configured for a recurring audit; its successful execution and production HTTP results are not yet verified through the connected tools.

## Next gated work

1. Verify 123-reg HTTP responses and server-level `X-Robots-Tag`, including Googlebot-specific behaviour.
2. Inspect Google Search Console for indexed vs not indexed pages and actual crawling, if available.
3. Connect verified public page identities to the backend publishing manifest without exposing credentials.
4. Restore meaningful bidirectional navigational links between market pages, manufacturer/model pages and approved AnyBike Global stories, while avoiding automatically generated false model-country associations.
5. Preserve the existing BMW and Harley master designs and UK/international customer separation.
