# International Available Stock rebuild — safety contract (14 October 2026)

Status: implementation gated; legacy public stock remains OFF. Do not switch on `public_get_public_stock_visibility_v1` to launch this project.

## Verified in main
- `available-stock.html`: `noindex,nofollow,noarchive`, canonical to its own URL; redirects when stock visibility RPC is disabled; reads `public_available_stock` including `price_gbp` and renders prices; also supports buying-requirement matches.
- `bike-details.html`: fetches `available_stock` including `price_gbp` and `raw_data`; also uses bike images and customer watchlist.
- `index.html`: `public_homepage_stock_v1` and fallback `public_available_stock` return prices to the homepage.
- `public-header.js`: one global switch controls homepage, market, model and detail visibility; redirects stock and detail pages when OFF.
- `bike-details.html` calls `get_country_motorcycle_interest_v1`. This is not proof of real demand.
- Supabase database inspection timed out on 14 October 2026; schema, policies and privileges NOT verified.

## Mandatory architecture
1. Leave legacy `available_stock`, `public_available_stock`, `bike-details.html`, Deal 360 and existing UK journeys unchanged until migration is verified.
2. Build a dedicated reviewed publication dataset. Fields visible to anonymous clients: publication ID (not supplier stock ID), approved images, make, model, year, buyer-safe specification, verified VAT qualifying state, publish/expire status and timestamps, manufacturer/model links. **No supplier name, registration, cost, raw_data, stock-source URL, confidential ID, pricing or customer details.**
3. A separate verified international dealer endpoint returns approved selling price and extended approved details. Enforce authorization in the DB/API using server-trusted account approval, not browser-selected country, customer-editable metadata or JavaScript hiding.
4. UK-blocking must use a trusted country assessment on the service side for restricted routes. A country dropdown or localStorage country hint is navigation context, not access control. Resolve unknown/proxy countries conservatively; reject UK including territories appropriately; do not treat geolocation as identity proof.
5. Weekly Live Source Hub flow: select -> verify actual VAT status, current availability and image permission -> remove supplier details / QR codes -> review -> publish -> expire/unpublish. No bulk auto-publication. Log reviewer and dates.
6. Public country interest aggregates require rate controls, bot filtering, deduplication, privacy and thresholds; do not use unverified repeated visits as popularity.
7. Public stock cards must remain absent when empty/expired; details must not expose expired listings. Manufacturer/model/country links should degrade to evergreen guide and sourcing pages.
8. SEO: keep existing noindex until safe gallery works; index only useful public international landing pages with consistent canonical and sitemap, never priced/account pages; avoid user-agent-based Googlebot cloaking.

## Release gates
- Inspect existing Supabase tables/views/RLS/grants and RPC definitions; ensure views use security_invoker or explicit locked-down grants.
- Test anonymous, unapproved international, approved international, UK private, UK dealer, admin, unknown country, and expired-stock requests against *actual API responses*.
- Verify that anonymous and UK sessions cannot fetch restricted price or supplier data by network requests or direct IDs.
- Check routes and header across desktop/mobile, and manufacturer models, markets, login, sourcing, watchlist, Deal 360, UK selling, search console.
- Only then enable the new international gallery feature independently of the old global stock switch.

## Immediate blocker
Supabase connector SQL returned 'Connection terminated due to connection timeout' on repeated attempts. No DB mutations were made. This document records the safe implementation boundaries; it does NOT claim that the new gallery has launched.
