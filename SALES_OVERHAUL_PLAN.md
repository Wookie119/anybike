# AnyBike Bike Sales Overhaul — Protected Implementation Plan

Checkpoint: 26 September 2026

## Non-negotiable protection rules

The existing Supabase schema and live transaction data are protected infrastructure.

During the sales overhaul:
- Do not drop, rename, truncate or repurpose existing tables.
- Do not delete or rename existing columns.
- Do not replace authoritative payment, offer, invoice, messaging, notification, sourcing or operations ledgers.
- Do not weaken RLS, admin guards or protected customer access.
- Do not break Message Centre realtime, header bell notifications or existing customer notifications.
- Do not change a business event merely to make a UI stage look correct.
- Prefer read-only orchestration over schema changes.
- If new persistence is genuinely required later, use additive migrations only and preserve old data/routes.
- Existing records must remain readable throughout the migration.

## Product model

### One Bike Sales workspace
Bike Sales HQ is the operational home for all buyer enquiries and active sales, regardless of origin.

Enquiry origin is metadata, not a separate pipeline:
- Advertised / feed motorcycle enquiry
- Underwrite / Sell Your Motorcycle enquiry
- Single-bike sourcing request
- Multi-bike sourcing request
- Flexible/category sourcing request
- Standing/repeat requirement
- General buying enquiry

### Compact top pipeline
Request → Sourcing → Interested → Seller Check → Offer → Payment → Collection → Invoice → Delivery → Complete

The pipeline is compact navigation only. It must not dominate the page.

### Working tabs
The opened sale/enquiry uses horizontal tabs on the same wide page:
- Request
- Sourcing / Potential Matches
- Buyer Response
- Seller / Viability
- Offer
- Payment
- Collection
- Invoice
- Delivery
- Timeline

AI Matching, Live Source Hub and Used Bike Scanner are sourcing tools inside the Sourcing tab rather than competing CRM destinations.

### Clear next action
At every state the admin and buyer each see:
- Current status
- What just happened
- Who is waiting on whom
- What happens next
- One primary next-action button when action is required

### Timeline
Each motorcycle has a shared journey timeline.
Admin sees internal detail.
Customer sees buyer-safe detail.
Future steps are visible so both sides understand what happens next.

The purchase can contain multiple motorcycles, each with an independent timeline and stage.

### Notifications and Message Centre
Every important outbound event and every meaningful response must create:
1. Bell notification
2. Message Centre entry
3. Exact action/deep-link button

Events include at minimum:
- Potential matches sent
- Buyer interested / not interested / question / offer
- Formal offer sent
- Formal offer accepted/declined
- Deposit/proforma issued
- Payment reported
- Payment verified/allocated
- Balance request
- Invoice issued
- Collection/operations milestone requiring action
- Delivery/handover milestone
- Any customer/admin reply

Generic links to a tool landing page are not acceptable when an exact enquiry, thread, sale, motorcycle or document is known.

## Layout
Admin Bike Sales and sourcing pages are wide working pages.
Use available desktop width; avoid narrow centered content.
Keep pipeline compact and give the main workspace the majority of vertical and horizontal space.

## Migration approach
1. Build the new UI/orchestration on branch `sales-overhaul-2026-09-26`.
2. Reuse existing Supabase RPCs/tables in read-only fashion where possible.
3. Create the unified Bike Sales shell and exact next-action resolver.
4. Consolidate sourcing tools into the Sourcing tab.
5. Add mirrored admin/customer timelines.
6. Audit every lifecycle event for bell + Message Centre + deep link.
7. Test existing live records against the new UI.
8. Only after verification, replace the old Bike Sales presentation on main.


## Preservation rule during overhaul

No existing sales UI section or working code path is to be deleted merely because it is confusing or no longer belongs on the main Bike Sales screen.

Before removing anything from its current location, it must be handled in one of these ways:
1. Relocated into its confirmed new home.
2. Left in place but hidden/collapsed while the new workflow is tested.
3. Copied into a clearly labelled legacy/archive file when it is not yet clear where it belongs.

This applies especially to:
- Existing lead/deal pipeline controls
- KPI/commercial summary blocks
- Task summaries
- Legacy enquiry tables
- Deal/offer/payment panels
- Seller and VAT controls
- Candidate/matching components
- Shipping/operations components
- Message Centre bridges
- Any helper JavaScript used by other admin pages

Do not remove a shared function until repository search confirms it is not used elsewhere.

### Current first-pass status
The initial Bike Sales overhaul does not delete the old UI or old journey implementation. The original sections remain in `admin-enquiries.html` and are currently hidden or superseded at presentation level only.


Preview deployment trigger: 26 September 2026 — sales-overhaul-2026-09-26


## Deferred QA — runtime link and navigation audit

Run this when a wider QA pass is required, before a major release, after large navigation/menu changes, or whenever unexplained 404s appear.

Current static-link audit status (28 September 2026):
- Repository-wide static internal links were checked across the main HTML/JavaScript files, all 217 market pages, and CSS asset URLs.
- Known broken static references found during that audit were corrected.
- Market Intelligence public country links now use canonical `/markets/<slug>.html` paths.

Future runtime QA pass:
1. Crawl the deployed AnyBike site, not only repository source.
2. Open/click internal links generated at runtime from JavaScript, Supabase/database values, menus, cards, notifications and deep links.
3. Check logged-out customer redirects, logged-in customer journeys, admin navigation, Message Centre links, bell notifications, Deal 360 links, invoices/proformas, shipping/operations links and market-page links.
4. Record every 404, redirect loop, wrong-host URL, missing asset and link that lands on the wrong page.
5. Fix links at their source rather than adding one-off redirects where possible.
6. Re-run the crawl after fixes and retain a short QA result/checkpoint.
7. Protect Message Centre realtime, notification bell behaviour, customer auth and Deal 360 while making link fixes.

This is a deferred QA task, not a blocker for current Customer 360 / Buyer Setup work unless a navigation defect is found in the active workflow.


## 28 September 2026 — Customer focus, Dashboard actions and navigation checkpoint

### Customer 360 buyer-intent model
Customer 360 must distinguish browsing from genuine buying intent so staff time is spent on serious buyers.

Buyer stages:
- Registered / Browsing — account exists, but no staff chase.
- Potential Buyer — passive signals such as saved searches, watchlist or repeat interest; suitable for future automated matching, but not a manual Buyer Setup chase by default.
- Buyer Request — buyer has explicitly asked AnyBike to act, including `Interested — Check Availability`.
- Active Purchase — live Deal 360 / payment / operations journey.
- Ready for Review — Buyer Setup 7/7 complete and waiting for admin review.
- Approved Buyer.
- On Hold / Stopped.

Buyer Setup reminders only become staff actions when the buyer has a serious-intent signal or the complete 7/7 setup is waiting for review.

### Sourced motorcycle response semantics
`Interested` is not a casual like.
Customer wording is now `Interested — Check Availability`.

Selecting it means the buyer is asking AnyBike to contact the seller and investigate current availability and purchase terms. It does not commit the buyer to purchase.

Casual interest belongs in Watch / Save for Later and must not create unnecessary staff work.

### Admin Dashboard — Your Next Actions
The main Admin Dashboard is the central action surface. Do not create another separate action-centre page.

`Your Next Actions` is positioned near the top of Admin HQ and combines genuine work from:
- Sales
- Customers
- Accounts
- Operations
- Messages

The queue should be state-driven from the authoritative underlying workflows. Completing the real task removes the action automatically.

Old or casual `New Lead` records must not stay permanently urgent merely because they exist. Sales actions should be driven by genuine buyer requests, Deal 360 state, seller checks, replies or another real obligation.

Customer 360 actions include:
- buyer asked AnyBike to check seller availability
- serious buyer setup incomplete
- 7/7 Buyer Setup ready for review
- account on hold / stopped requiring review

Accounts actions include outstanding deposits and balances where the underlying transaction genuinely requires attention.

Dashboard financial KPI rule:
- `Committed Sales` only counts a sale once a deposit has been received or the sale is completed.
- `Projected Profit` on the Dashboard must use the same committed-sale population.
- Prospective calculator values and uncommitted enquiries must not inflate the headline sales/profit figures.

### Admin navigation
Keep the admin menu aligned with the live operating model:
- Dashboard / Your Next Actions
- Bike Sales HQ
- Message Centre
- Customer 360 / Buyer Setup
- Live Source Hub
- Buyer Match Responses
- Global Buyer Network
- Operations / Logistics / Freight Forwarders
- Accounts
- Market Intelligence
- Project Plan
- Mission Control
- Public Website shortcuts

### Public Brand / Model / Variant navigation hold
Brand → Model → Variant architecture remains an important SEO/product workstream, but the pages are only partially built.

Until the templates, database population, page QA, imagery, contact-to-Message-Centre routing and SEO content are complete:
- do not add Manufacturer / Brand / Model / Variant pages to the main public navigation
- do not advertise them as fully live
- they may remain reachable through controlled internal links used for development and market-page linking where appropriate
- review the public-menu decision only after the taxonomy pages have passed a dedicated QA checkpoint

International Markets is public and may remain in navigation.


### Dashboard simplification follow-up
- Staff Workload has been removed from Admin Dashboard while there is only one active admin user. Reintroduce only when multi-user assignment/workload management is genuinely needed.
- Legacy lead-status breakdown has been removed from the Dashboard. Historical/legacy status reporting must not be presented as current operational truth.
- Headline Dashboard financials use committed-sale logic only: deposit received or completed sale.
- Old prospective enquiry values must not appear as current committed sales or profit.


### Dashboard action-first simplification
- Admin Dashboard is now action-first: **Your Next Actions** sits immediately under the greeting/date and before KPI cards.
- Removed Global Operations Centre, Live World Activity, operations map, country summary and upcoming-deadline map panel from the Dashboard.
- Removed the redundant standalone Bike Sales strip from the Dashboard.
- Dashboard should not act as a pipeline/map reporting page. Reporting/intelligence remains available in the relevant specialist pages (Market Intelligence, Reports, Customer 360, Logistics, Bike Sales HQ).
- Dashboard purpose: tell the admin what needs doing next, then provide concise KPIs and shortcuts.


### Dashboard operating principle — action before information
The Admin Dashboard is an execution surface, not a reporting wall.

Primary rule:
- the first question the Dashboard must answer is **What do I need to do next?**
- actions should be ordered and task-led, e.g. Check Availability, Send Matches, Send Formal Offer, Send Pro-forma, Match Deposit, Request Balance, Raise Invoice, Book Collection, Send to Move, Review Buyer Setup, Reply to Buyer
- category is secondary metadata only
- reporting, maps, pipelines and intelligence belong on specialist pages
- headline business figures are collapsed into a secondary Business Snapshot below the working area
- clearing the action queue should directly move buyers toward purchase and deals toward completion


### Expired Formal Offer — second-chance buyer request
If a Deal 360 Formal Offer expires before the buyer sees or accepts it, the buyer must not be allowed to accept the expired offer automatically.

Customer route:
- show that the offer has expired
- allow **Ask AnyBike for a Second Chance**
- buyer explicitly confirms they are happy with the expired offer price and still want the motorcycle
- buyer may add an optional note
- the request does not accept the offer, reserve the motorcycle or bind either party
- AnyBike must re-check seller availability and whether the previous commercial terms can still be honoured
- if still available/viable, AnyBike issues a fresh valid Formal Offer through the normal Deal 360 route

Admin effect:
- request creates a customer Message Centre message
- request creates an admin notification
- Deal 360 returns to Seller Check / Negotiating
- Dashboard **Your Next Actions** surfaces **Re-check seller availability** under Sales
- once rechecked, the existing Formal Offer workflow is used to send a fresh offer rather than reviving the expired one
