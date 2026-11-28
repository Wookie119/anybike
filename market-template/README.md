# Country master preview

One renderer reads reviewed market records from the existing Supabase project. It preserves the content of each market’s source sections and places related sections together. The exporter covers 217 legacy pages and keeps local content even when it does not fit a standard section category.

- Run `python scripts/export-country-master.py --audit` with Python and lxml to inventory the source sections.
- Install `country-master-schema.sql` in a development database that has the existing Global and advert schema. Generate reviewed seed SQL with `python scripts/export-country-master.py --sql sweden reunion afghanistan`. Imports start unpublished. To retain sections added by the legacy scripts, capture the rendered public <main> for each market as <slug>.html, then pass the snapshots with `--rendered-dir`. This restores destination planning, buying services, UK handover and manufacturer heritage where present.
- To verify using the preview entry point, serve the checkout and point its country-master RPC at the review database. Approve the three test records there, then open `country-master-preview.html?market=sweden`, `?market=reunion&lang=fr`, and `?market=afghanistan`. The English record is preferred when the requested translation is absent. Where a legacy page has only French content, its primary French record is the fallback.
- AnyBike Global uses the published story assigned to that market, then published worldwide cards, then a direct link to Global. The Silverpilen record needs its live article, Sweden assignment and credited media set before it appears as the local example.
- Commercial positions stay hidden until the public advertising service supplies eligible content. The inline advert position refers to the existing planned `AB-COUNTRY-CONTENT` named space. The footer template accepts up to three square creatives from the central `AB-COUNTRY-FOOTER` slot. Registration and delivery of that slot remain a separate deployment. Connect classifieds to the approved country inventory when its launch is authorised.
- Keep the existing country URLs in service until each market's data and rendering have passed review. This preview entry point is excluded from indexing.

## Search demand

Install `country-search-schema.sql` after the master schema. The shared search reads the published model-route registry. A clear model match or a chosen search result contributes a signal for the market page being browsed. Free text stays in the browser. Supabase stores only the market slug, catalogue model ID and hour. Repeats for the same model and market within an hour collapse into one signal. Public rankings use the last 30 days and require three observed hours across at least two dates. Reviewed model guides stay visible as suggestions while a market builds up enough signals.

The ranked models also show matching listings from the existing public Available Stock feed. Cards require an eligible, verified canonical model match. A market with signals but no matching listings still shows its ranked model guides.

## Indexable language URLs

Run `python scripts/build-country-locales.py sweden en-SE sv-SE --output-dir <staging-directory>` against an output directory that contains the site's sitemap. The first locale keeps the current market URL. Other locales use their language prefix. The build serves the reviewed Supabase sections in the initial HTML, links the two language URLs, and lists both pages with their own canonical URLs. The build stops if an exact locale is unavailable or the translation lacks sections in the primary record.

Deploy the generated pages, sitemap and International Markets directory together after reviewing both versions. Build in a full site checkout to refresh the directory links automatically. To refresh the directory after separate market-list or sitemap changes, run `python scripts/build-market-directory.py`. Rebuild after publishing a translation in Supabase to refresh the crawlable HTML. Currency selection is independent of the language URL. `--fixtures <records.json>` creates offline `noindex` examples in a separate folder for testing the routes and language links.
