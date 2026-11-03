# AnyBike Global pilot: first database relationships

Date: 3 November 2026. Applied to Supabase project tuehtnezhdnkqbbhttgp, **draft only**.

## Existing story source
Source: `anybike-global.html` in GitHub `Wookie119/anybike`.
Selection method: explicit `data-manufacturer` attribute with BMW or Harley-Davidson, plus either a stable `/global/...` article URL or an existing `anybike-global.html#...` anchor. No invented article titles or external links.

## New private tables
- `public.motorcycle_global_stories_v1`: stable story_url, headline, summary, original source_article_html, source page, editorial_status (draft default).
- `public.motorcycle_global_story_manufacturers_v1`: real foreign keys from the above to `motorcycle_catalog_manufacturers`; composite primary key prevents duplicate relationships.

Both tables have RLS enabled and no anon or authenticated table grants/policies. They are deliberately *not* accessed by the live public website.

## Verified first import
- 6 story records, all draft.
- BMW: 2 manufacturer relationships.
- Harley-Davidson: 4 manufacturer relationships.
- 0 published records.
- Live manufacturer/global page code unchanged.

## Important limitation
These are six original Global story tiles directly associated with the two manufacturers by declared metadata. This is not yet a comprehensive index of all editorial pages. A future import should also inspect individual `/global/*.html` files for additional model/manufacturer relationships, check canonical URLs and copyright, then use structured relationships, not text matching.
Some records point to anchored summaries on `anybike-global.html`, not standalone long-form articles. Do not invent or claim standalone article pages for them.

## Correct import ordering
1. Upsert story records by stable `story_url` and commit.
2. Insert story-to-manufacturer links by joining committed story IDs to existing manufacturer IDs.
The first combined SQL CTE produced the six story rows but no relationship rows due to same-statement visibility; a separate link statement fixed this. Final verification returned BMW=2 and Harley-Davidson=4.

## Preview integration gate
Do not expose this private draft table via an anonymous browser key. Later provide a published-only read model after rights, content QA and publication workflow checks. The approved public `global-manufacturer-stories.js` remains unchanged until an equivalent safe replacement has passed all tests.

## Separate pending security item
The pre-existing warnings for public.customer_profile_schema, public.anybike_invoice_delivery_events and public.anybike_quotes_automation_test_20261028 are not addressed by this migration and require a separate access audit.
