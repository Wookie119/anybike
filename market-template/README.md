# Country master preview

One renderer reads reviewed market records from the existing Supabase project. It preserves the order and content of each market's source sections. The exporter covers 217 legacy pages and keeps local content even when it does not fit a standard section category.

- Run `python scripts/export-country-master.py --audit` with Python and lxml to inventory the source sections.
- Install `country-master-schema.sql` in a development database that has the existing Global and advert schema. Generate reviewed seed SQL with `python scripts/export-country-master.py --sql sweden reunion afghanistan`. Imports start unpublished.
- To verify using the preview entry point, serve the checkout and point its country-master RPC at the review database. Approve the three test records there, then open `country-master-preview.html?market=sweden`, `?market=reunion&lang=fr`, and `?market=afghanistan`. The English record is preferred when the requested translation is absent. Where a legacy page has only French content, its primary French record is the fallback.
- AnyBike Global uses the published story assigned to that market, then published worldwide cards, then a direct link to Global. The Silverpilen record needs its live article, Sweden assignment and credited media set before it appears as the local example.
- Commercial positions are hidden until a future service supplies eligible content. The inline advert position refers to the existing planned `AB-COUNTRY-CONTENT` named space. Register a central advertising slot before activating the footer. Connect classifieds to the approved country inventory when its launch is authorised.
- Keep the existing country URLs in service until each market's data and rendering have passed review. This preview entry point is excluded from indexing.
