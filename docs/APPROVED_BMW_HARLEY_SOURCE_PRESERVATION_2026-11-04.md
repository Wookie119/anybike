# AnyBike — 4 November 2026: BMW + Harley approved research and media source preservation

## Work completed in Supabase

Protected schema: `anybike_publishing`.

**Approved HTML introductions (not live rewriting)**

- `model_source_extracts` contains **45 source-only records**: **27 BMW** + **18 Harley-Davidson** model guides.
- Model IDs are matched to the 45 source-verified model route records.
- Each record retains the original introduction text, canonical source page, and Git blob SHA.
- 15 of the Harley guides additionally had an easily captured generation note (not every page uses the same section structure).
- `extraction_status='source_capture_only'` on these records; no content was automatically written into `public.motorcycle_catalog_models.overview`.
- The rich BMW and Harley source HTML stays approved and protected; no live file was changed by this batch.

**Static photo source references**

- `model_photo_source_candidates` contains **14 photo-reference rows**: **1 BMW** + **13 Harley-Davidson**.
- Only already-embedded static Wikimedia Commons `Special:FilePath` images were considered; dynamic gallery content and private seller photos were deliberately excluded.
- Each candidate retains the public guide URL, source SHA, photo URL, displayed image alt text and a detected Commons credit link.
- All have `rights_review_status='requires_review'` and `year_accuracy_status='unverified'`; there are **zero** approved library photos as a result of this extraction.
- No image binaries were downloaded, licensed by inference, or republished.

**Private catalogue reporting**

- `editorial_route_export` is a security-invoker, backend-restricted read-only view: 264 routes, all titled, zero approved for new publication.
- `model_editorial_coverage`, `model_editorial_readiness` and `model_editorial_media_coverage` provide internal counts and distinguish HTML source research from populated structured fields.
- Of 979 model records, 45 have registered source-verified model guide routes; the other **934 have no registered guide route** yet. This does not mean they have no content on any other website surface.
- Only 92 model overviews and 71 specification JSON fields were populated at the time of inspection; database gallery fields were empty. Existing page images are not assessed by that field.
- Both new source/photo tables have RLS enabled, with no SELECT access for `anon` or `authenticated`. Only backend `service_role` is granted access.

## Build scripts committed

- `scripts/sql/export-private-editorial-navigation.sql`: backend-only current-data export of route identities/catalogue metadata.
- `scripts/export-private-editorial-from-postgres.mjs`: protected psql export to local ignored reports, no credentials committed.
- `scripts/extract-approved-model-hero.mjs`
- `scripts/stage-approved-model-source-extracts.mjs`
- `scripts/extract-approved-model-photo-references.mjs`
- `scripts/stage-approved-model-photo-references.mjs`
- Test files for these tools were committed and included in `.github/workflows/public-link-audit.yml`.

A focused JavaScript check verified the photo-extraction function. The complete Node test suite and scheduled workflow have not yet been independently confirmed successful. The active execution container cannot reach the GitHub public host, so tests run in GitHub Actions remain the authoritative full-suite gate.

## Next large development batch

1. Run and confirm full Node CI suite and correct failures.
2. Expand from the 45 confirmed source-verified guides to more existing public source pages where genuinely approved.
3. Extract further sections from the rich guides with stable, source-verifiable text and individual field provenance, keeping the manufacturer 20-section and model 13-section design requirements.
4. Check image rights, motorcycle/year accuracy and original approved image bank before populating the public `gallery` field.
5. Keep live 123-reg deployment, Googlebot HTTP and Google Search Console verification separate from source checks. No sitemap resubmission is needed without a sitemap change.
