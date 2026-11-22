# AnyBike Global Roadmap — Recurring Motorcycle Events and Evergreen SEO

**Added:** 22 November 2026
**Status:** Approved for long-term roadmap; do not displace current advertising, dealer feeds, stock reliability, and universal templates priorities.

## Commercial purpose

Build evergreen, international, search-driven traffic to AnyBike throughout the year (offset UK seasonality), introduce new riders and enthusiasts to model pages and available stock, and create recurring, centrally managed advertising inventory. Prioritize helpful visitor content over thin or duplicative SEO pages.

## Architecture

- ONE Supabase-backed universal motorcycle-event template, not manually maintained individual HTML pages.
- Permanent canonical event URLs (e.g. `/events/motorcycle-live/`) retain value year on year. Event dates, tickets, programme, exhibitors and visitor logistics update by edition; retain previous editions as historical information.
- Event content managed centrally with verified sources, annual review dates, draft/review/publish states and country/language support when warranted.
- Accurate event schema.org structured data only where supported, XML sitemap and internal links, readable mobile design, no hard-coded year-specific URLs as the only canonical property.
- Build internal links from relevant manufacturer/model/category/country pages where genuinely useful; link events to Available Stock and advertiser offers.
- Separate organizer claims from AnyBike-owned editorial guides. Verify date, venue, admission, official links before publishing or refreshing.

## Initial priority events (research and validate search demand)

1. Motorcycle Live (UK): tickets, exhibitors, launches, NEC travel, parking.
2. Isle of Man TT: official schedules, visitor transport, racing history.
3. ABR Festival: adventure motorcycling, camping and bikes.
4. EICMA Milan: new-model announcements, global coverage.
5. Sturgis Motorcycle Rally: Harley-related experiences, travel.
6. Goodwood Festival of Speed: relevant motorcycle heritage and displays.

Expand later to MotoGP, WorldSBK, classics, local rallies, significant auctions, training and rider events. Start with a curated set of **20 high-quality, recurring pages**, rather than publishing hundreds of thin pages.

## Content standards

Every event page should serve real visitor search intent: confirmed dates, venue and access, official tickets, travel, exhibitor highlights, activities, FAQ, relevant motorcycles and previous-year summaries. Use helpful, fact-checked content, avoid fabricated schedules and duplicate organizer text. Google Search Console should guide future topics and expansion.

## Advertising integration

- All event adverts via existing AnyBike Advertising Mega System: named placements, campaign and creative records, country targeting, official destinations, 'Advertisement' disclosure and rel=sponsored where applicable.
- Offer event sponsorship and relevant gear, travel/accommodation, insurance, accessories and finance campaigns subject to approval and compliance.
- Record impressions, clicks, and commercially relevant outcomes using supported tracking rather than invented figures.
- Preserve the approved **4:3 Available Stock advert size** as a core format, alongside square, slim, landscape and portrait.

## Immediate follow-ups

- Existing `motorcycle-live.html` is a starter guide; migrate eventually into universal event template without losing the existing URL/SEO equity (redirect/canonical strategy).
- Verify current ABR Festival 2027 dates on the official site before updating creatives; earlier AnyBike artwork contained conflicting dates.
- Evaluate planned events for demand and commercial fit with Search Console; avoid over-prioritizing research when advertising/dealer feed tasks remain active.


## Expansion approved — Global motorcycle community and local event network (22 November 2026)

AnyBike events must go far beyond headline exhibitions. Worldwide demand also includes:

- **Dealer open days** (UK and international) and **open houses** (especially US terminology), demo days, new-model launches, showroom anniversaries, dealership charity days.
- **Owners' clubs**, chapter meetings, club rallies, classics clubs, marque/model gatherings and recurring monthly club nights.
- **Ride-outs and motorcycle meets**, organised scenic rides, charity rides, breakfast meets, regular bike nights, supported tours.
- **Classic motorcycle events**: historic rallies, shows, autojumbles, swap meets, collectors' events, specialist auctions and restoration exhibitions.
- **Racing, major motorcycle shows, festivals and manufacturer events** remain part of the same global calendar.

### Global discovery and search

- One world calendar with searchable filters: country, region/state, city, date/month, event type, motorcycle category, manufacturer/model, free/paid (when verified), and nearby geography when location permission is provided.
- Permanent, crawlable **country/region/city hubs**, marque/club directories and recurring event profiles when there is enough original, useful content; avoid generating endless near-empty city/date pages.
- Support regional vocabulary and localisation: **open house** in the US, **open day** in the UK; **ride-out**, **group ride**, **bike night**, **swap meet**, **autojumble**, and equivalents elsewhere.
- For weekly/monthly recurring gatherings, model the **event series** separately from actual occurrences, with clear cancellation, seasonal, confirmed and last-verified status.
- Calendar views and curated city guides should link naturally to AnyBike's existing international markets, manufacturers, model library and Available Stock.

### Community submissions and trust

- Dealer, club and organiser accounts can propose events for free using a structured form; require an identifiable organiser, official event link or supporting evidence, location, date/time/timezone and contact route.
- **Admin review before publication**; duplicate detection, expiry and rescheduling, user reports, event cancellation handling, scam/spam safeguards, club profile ownership verification, and edit audit trail.
- Admin may mark claimed/verified organiser but avoid implying AnyBike endorses the organiser or guarantees safety.
- Never republish personal home addresses, private club-member contacts, private meetup locations or unpublished events.
- Distinguish official organiser postings, third-party directory listings, free listings and paid sponsorship. Payment never implies verification.

### Monetisation and connecting AnyBike businesses

- Keep **basic events listings free** to build audience and encourage worldwide contributions.
- Paid **featured placements** or sponsored event adverts, country/region/manufacturer targeting and event-sponsored campaigns through the **single Advertising Mega System**; disclose clearly, do not sell manipulated organic rankings disguised as neutral results.
- Integrate with planned **classic motorcycle adverts, free classifieds, parts wanted, restoration parts, motorcycles wanted, and private/dealer advertising**. Contextual links from events and club pages should help visitors discover those services naturally.
- Relevant affiliate offers may include riding kit, tyres, security, accommodation, ferries, tours and travel where available and compliant; localise destinations, images, links and disclosures.
- Retain the approved **4:3 Available Stock card** format, alongside square and other creatives, with shared centrally named placements.
- Track useful results (page views, referral clicks, conversions and advertiser revenue) using properly validated measurement; do not fabricate results.

### Implementation order

1. Stabilise the **global motorcycle events calendar** and its public read/query model. Add taxonomy to support dealer open days/open houses, ride-outs, clubs, meetups, classics, swap meets and charity rides.
2. Build the **admin-reviewed event submission and editing system**, then dealer/club claim and profile workflow.
3. Grow useful country and city collections in measured batches, prioritising trustworthy, repeatable and geographically diverse events.
4. Add event/club-linked classifieds, free adverts and parts-wanted experiences when those marketplace systems are ready, sharing existing AnyBike accounts and Supabase identities.
5. Add **Mega System** advertiser packages, placements and reporting when the audience/placement availability is verified.

**Protect ongoing priorities:** Do not interrupt existing DealerWebs feed onboarding, advertising controls, stock integrity or approved universal model-page designs.

**Core rule:** One database, one event template, many useful recurring event pages, centrally maintained and monetized.
