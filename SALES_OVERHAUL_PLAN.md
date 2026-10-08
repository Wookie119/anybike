## Deal 360 next-action UX invariant

- Every Deal 360 working section must place its **Your next action** panel at the **bottom of that section**, after the user has reviewed the section contents.
- A next-action button must take the user directly to the exact control, section, or page needed to continue. It must not land at the top of a long page or require the user to hunt for the next step.
- Cross-page next actions must stay on the AnyBike origin and reuse the existing authenticated browser session. Never route an already signed-in admin/customer through login again just because the workflow continues on another AnyBike page.
- Completed historic sections must never send the user backwards in the Deal journey. They may show completion state, but the live action must point to the next genuine incomplete step.
- Do not present multiple competing primary next actions inside one section.

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

### Platform-wide Your Next Action standard
**Baked-in rule:** every operational admin page and every signed-in customer workflow page must show a clear **Your next action** near the top of the working area.

The component must answer:
- what needs to happen next;
- who is currently expected to act / who the process is waiting for;
- one primary action to continue.

Shared fallbacks are now provided by `admin.js` for admin pages and `public-header.js` for customer workflow pages, so a new page cannot silently ship without guidance. Page-specific workflows should override the fallback with authoritative live state where available.

Use clear ownership wording such as:
- Waiting for: AnyBike
- Waiting for: You
- Waiting for: Buyer
- Waiting for: Seller
- Waiting for: Shipper
- Waiting for: Payment confirmation

Do not show multiple competing primary actions. Secondary controls may still exist below, but the next-action component should identify the one action that moves the workflow forward.

Pages that already have a workflow-specific Your Next Action keep their specialist logic rather than receiving a duplicate shared card.

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


### Second-chance expired offer — seller confirmation now leads to deposit
Refined the expired-offer recovery route so it does not waste a genuine sale by forcing the buyer through another full offer cycle.

Agreed journey:
1. Formal Offer expires before the buyer acts.
2. Buyer clicks **Ask AnyBike to Buy This Motorcycle** and confirms they still want the motorcycle at the expired offer price.
3. Deal returns to Seller Check.
4. AnyBike confirms seller availability and current seller price/terms.
5. If the previous customer price is still commercially viable, AnyBike automatically creates/issues the Proforma and sends the buyer a deposit request.
6. Buyer opens Accounts & Documents, confirms the current trade-sale/legal declarations, pays/reports the requested deposit.
7. AnyBike verifies/allocates the deposit and continues the normal motorcycle-securing workflow.

Important protections:
- the expired offer itself is not revived
- seller availability must be Available/Reserved and current
- commercial viability is rechecked using the seller-confirmed price before the deposit request is sent
- if the old customer price is no longer viable, an admin price-review notification is created instead of sending a deposit request
- the second-chance deposit route requires fresh confirmation of Terms & Conditions, Trade & Export Sale Policy, trade-buyer status and visual-inspection basis
- server-side payment allocation is blocked if that second-chance legal confirmation has not been recorded
- customer receives both Message Centre and customer-notification deposit instructions


## 1 October 2026 — Deal 360 authoritative-state correction

Live testing of AB-000023 exposed contradictory workflow state: the £540 customer deposit was Verified and Posted, the motorcycle was genuinely secured and a Purchase Order existed, while the Deal 360 next-action card still sent staff backwards to Seller / Viability and Sale Financials showed a £16,750 customer balance by omitting the £250 delivery charge.

Implemented on main:
- Deal 360 next-action logic now treats genuine motorcycle security as stronger evidence than an expired/stale seller-availability flag.
- Accepted motorcycle/offer facts now take precedence over stale stored stage labels when determining progress.
- Sale Financials displays the authoritative motorcycle customer balance from accepted customer terms and active allocations, so AB-000023 resolves to £17,540 accepted total less £540 allocated = £17,000 outstanding.
- Supplier full-payment controls are hidden/locked until Buyer Onboarding / Purchase Clearance is approved and the customer balance is clear. Seller deposits remain a separate controlled case.
- Admin Dashboard no longer creates the old generic converted-deal "Payment or deposit needs attention" card.
- Dashboard payment work now comes from the authoritative Payment Advice workflow and deep-links directly to the exact advice:
  - Match / Verify Payment while awaiting verification.
  - Post verified payment when bank verified and Ready to Post.
  - no action after ledger status Posted.
- Customer-level deposit/balance Dashboard actions are suppressed until purchase clearance is approved, so Buyer Setup review can correctly take priority.
- Posted payment advice PA-AB-000023-01 remains authoritative evidence: £540 Verified, Posted and allocated to AB-000023.

Guardrail:
- A stored `deal_stage` is a summary label, not the sole workflow truth. Stronger transactional facts (accepted terms, active allocations, purchase clearance, motorcycle security, PO, operations state) must drive the next action and self-clear completed tasks.


## 1 October 2026 — Dashboard action engine continuation

Further live changes:
- Added a database trigger guard on Deal-linked outgoing supplier payments. Buyer Onboarding / Purchase Clearance must be Approved or Approved with Exceptions; On Hold / Stopped accounts are blocked. Full supplier payments are rejected while the authoritative accepted customer balance is still outstanding.
- Deal 360 supplier payments now always use the Deal-native supplier ledger path even where a promoted motorcycle still carries a legacy buyer_match_id.
- Dashboard Message actions now require a live Deal or genuine buyer request. Casual browsing/watch/unlinked chat remains in Message Centre but does not create staff work. Serious message cards deep-link to the exact Message Centre thread.
- Added authoritative Deal 360 Dashboard actions for Complete Final Seller Check, Secure Motorcycle / Raise PO, Request Customer Balance, Complete Collection Readiness, and Book Collection / Send to Move.
- Zero-motorcycle Deals do not generate transactional Deal 360 work from this action layer.
- Pending Payment Advice suppresses downstream Deal payment actions until verification/posting is resolved.
- Removed duplicate customer-level deposit/balance cards; payment work is owned by the Deal-specific ledger/action engine.
- Buyer purchase-clearance waiting now stays visually in the Payment/clearance phase rather than highlighting a completed Seller Check again.


## 1 October 2026 — Screenshot review follow-up

Screenshots of AB-000023 confirmed the authoritative-state corrections:
- Your next action now correctly shows Review Buyer Onboarding instead of sending staff back to Seller / Viability.
- Deal Journey shows Request, Sourcing, Interested, Seller Check and Offer complete.
- Motorcycle is shown Secured, Purchase Order PO-AB-000023-15 exists, supplier balance is £15,000 and supplier payment is locked pending purchase clearance.
- Sale Financials now shows the authoritative £17,000 customer balance after the £540 posted allocation against the £17,540 accepted total.

Additional corrections made from screenshot review:
- Removed the legacy Private Consumer option from Deal 360 Export & Tax Identity.
- Export & Tax Identity now uses the agreed trade-only buyer types and loads the saved Customer Profile buyer_type.
- Business/customs fields remain visible for all AnyBike buyers.
- Buyer EORI / Customs ID validation applies to all trade buyer types when confirming export/tax identity.
- Once a motorcycle is genuinely secured, the redundant Save Final Seller Check button is replaced by a completed status.


## 1 October 2026 — VAT-inclusive delivery charge

Business rule confirmed:
- AnyBike customer delivery charges are VAT-inclusive.
- Deal 360 financial calculations must use the full accepted customer total, not motorcycle price alone.
- For AB-000023 the accepted terms are £17,290 motorcycle + £250 VAT-inclusive delivery = £17,540 total.
- With £15,000 seller cost and no delivery cost entered, gross margin before VAT is £2,540.
- At 20% Margin Scheme calculation on the VAT-inclusive margin, estimated VAT liability is £423.33 and net margin after VAT is £2,116.67.
- The posted £540 customer payment leaves £17,000 customer balance.

Live database change:
- Replaced admin_get_deal_financial_status so customer balance, gross margin and VAT calculations use accepted customer terms including delivery_charge_gbp.
- Full VAT output calculation now also uses the full accepted customer total.
- Existing VAT-status guardrails remain in place.


## 1 October 2026 — Export VAT Clearance gate

Built a live Deal 360 control for UK export zero-rating.

Workflow states:
- Not Assessed
- Pending Export
- Awaiting Evidence
- Evidence Received
- Zero Rate Confirmed

Deal-level evidence fields:
- zero-rate intention
- Direct Export vs Indirect Export
- evidence due date
- actual UK export / departure date
- customs / export declaration reference
- transport / shipping evidence reference
- proof motorcycle left UK
- proof links export to overseas destination
- V5C permanent export notification dealt with
- evidence / audit notes
- evidence received and final confirmation timestamps / admin identity

Hard controls:
- Zero Rated VAT cannot be marked Verified until Export VAT Clearance is Zero Rate Confirmed.
- A zero-rated Final Invoice cannot be issued until Export VAT Clearance is Zero Rate Confirmed.
- Export & Tax Identity must be Confirmed, the destination must be non-UK, and export method must be recorded before the clearance can progress.
- Evidence Received / Zero Rate Confirmed require actual departure plus customs and transport references and both proof checks.
- Backend Export & Tax Identity now accepts only the agreed trade-only buyer types; legacy Private Consumer / generic Business validation removed.

Dashboard:
- Awaiting Evidence creates an Accounts action: Collect Export VAT Evidence.
- Evidence Received creates an Accounts action: Confirm Export VAT Clearance.
- Actions deep-link back to Deal 360.

Verification:
- Deliberate attempt to set AB-000023 to Zero Rated / Verified before clearance was blocked by the database trigger.


## 1 October 2026 — Export VAT evidence documents

The Export VAT Clearance gate now has a real private evidence-document workflow:
- multi-file click-to-upload and drag/drop area in Deal 360
- stored privately in the existing deal-files bucket under the Deal
- document types: Customs Declaration / MRN, CMR / Road Consignment, Bill of Lading, Freight Forwarder Confirmation, Port / Ferry Evidence, V5C Export Evidence, Other
- optional evidence reference per upload
- uploaded files are listed in the gate with View and Delete actions
- 50 MB maximum per document
- dedicated anybike_export_vat_documents metadata/audit table with RLS enabled and no direct customer table access
- admin-only RPCs register, list and soft-delete evidence records

Clearance rule tightened:
- Evidence Received and Zero Rate Confirmed now require at least one active uploaded Export VAT evidence document in addition to the customs reference, transport reference, actual departure date and proof checkboxes.
- The database enforces this, not just the Deal 360 screen.


## 1 October 2026 — Live Source buyer-safe image gate

Live Source / Used Bike Scanner image handling has been hardened.

Rules:
- raw supplier/dealer source images are internal only
- Live Source buyer presentations may use only approved buyer-safe image URLs
- the old Scanner control that copied/approved the first raw source image has been removed
- every Live Source motorcycle must have at least one approved buyer-safe image before a batch can be shared
- database trigger rejects raw/unapproved supplier image URLs being written into buyer_image_urls
- buyer Interest on Live Source records is blocked when no approved buyer-safe image exists
- Deal 360 candidate creation already takes images from buyer_image_urls, preserving the buyer-safe image set into the deal

Image preparation:
- BMW advert scanner now extracts additional HTML image candidates instead of relying only on structured metadata
- new prepare-live-source-buyer-safe-images Edge Function examines source photos with Google Vision
- photos showing dealer identity, dealer-name text, phone/email/website contact data or matched dealer logos are blocked
- only clean approved photos are copied into AnyBike's own motorcycles/live-source-buyer-safe storage path
- blocked supplier-branded photos stay internal and are never sent to the buyer
- if no clean photo is available, the bike remains blocked from buyer presentation rather than exposing the seller

Scanner:
- each Live Source scan now has Prepare buyer-safe images
- prepared clean images can be refreshed into the scan via admin_refresh_scan_buyer_safe_images_v1
- Live Source batch creation automatically reuses existing approved clean images when already available


## 1 October 2026 — Public Live Source pool concept

Future direction saved:
- Live Source can power country pages and future Make / Model / Variant pages.
- Public motorcycles must be presented only as available to source through AnyBike / current UK motorcycles AnyBike can source.
- Public and buyer-facing cards must use approved clean AnyBike buyer-safe images only.
- Never expose dealer name, dealer logo, dealer phone/email, source URL or raw supplier-branded imagery.
- Every public Live Source motorcycle card must route back into AnyBike: motorcycle detail / Interested / Check Availability / buyer request / Deal 360.
- Raw supplier source details remain internal for AnyBike staff.
- Only fresh live source records should be public; stale/ended bikes should automatically disappear from public pages.
- Use curated examples rather than dumping the whole source pool onto a page.
- Country demand and make/model relevance should influence which motorcycles surface.

Live Source usability direction:
- add model-specific refresh for urgent buyer searches instead of forcing a full catalogue refresh
- keep full catalogue/channel refreshes for overnight/background operation
- add dealer preference management such as Preferred / Normal / Avoid with internal notes (relationship, discount potential, logistics)
- rank buyer shortlists using buyer requirement fit, dealer preference, price, year, mileage, condition/spec and collection practicality
- keep Show all matches / manual override
- send buyers a curated shortlist rather than the entire matching pool


## 1 October 2026 — BMW Live Source reconnected to proven buyer-safe cleaner

The new BMW Live Source route now feeds the established Junction Stock buyer-safe image pipeline rather than using a separate detection-only cleaner.

Implemented:
- BMW source/dealer records are bridged into Junction Stock for image processing.
- BMW dealer names and identity tokens are registered as internal dealer aliases so dealer-wall branding/signage can be detected.
- BMW source images are queued through the existing process-buyer-safe-image engine.
- Existing Vision + Gemini local-repair workflow remains the canonical cleaner.
- The cleaner preserves the motorcycle and framing, removes seller/dealer identity where detected, and QA checks the result.
- A targeted buyer-safe claim lets an admin clean the exact Live Source motorcycle being prepared rather than waiting behind unrelated image jobs.
- Cleaned buyer-safe output syncs back into anybike_live_source_buyer_safe_images so Live Source / Scanner / Deal 360 gates continue to use only approved clean images.
- Raw BMW photos remain internal and are labelled as source photos in the admin UI.
- Buyer/public use still requires a real approved clean image; source placeholders and branded/raw images are not eligible.


## 1 October 2026 — Smooth automated AnyBike Sourcing Fee

The old stepped Buyer Fee bands have been replaced with one consistent sourcing-fee rule:

- AnyBike Sourcing Fee = 8% of the Motorcycle Sale Price.
- Fee is rounded to the nearest £5.
- Minimum Sourcing Fee is £395.
- UK collection / delivery is charged separately and does not change the Sourcing Fee calculation.
- The stepped-price cliff has therefore been removed: £14,999 and £15,000 both calculate to £1,200.
- Existing sent / accepted Formal Offers are not rewritten.

Automation:
- Commercial Setup recalculates the Sourcing Fee automatically when Motorcycle Sale Price changes.
- Staff can deliberately override the automatic fee for an exceptional deal and can reset it back to the calculated fee.
- Deal 360 Formal Offer inherits the Commercial Setup fee and recalculates when the motorcycle price changes unless staff has deliberately overridden it.
- Database fallback applies the automatic fee when Commercial Setup or Formal Offer is submitted with no fee.
- Used Bike Scanner / Live Source indicative pricing uses the same 8% / nearest £5 / £395 minimum rule.
- AI commercial viability and the Global Buyer offer workspace use the same rule.
- Public Services & Fees has been changed from bands to the same proportional calculation.

Backend helper:
- `public.anybike_sourcing_fee_gbp(price)` is the canonical database calculation for the automatic default.


## 1 October 2026 — First-order purchase, UK handover and consolidation redesign

Business rule clarified during AB-000026 testing:
- Seller availability / a temporary seller hold is not the same as AnyBike purchasing the motorcycle.
- The misleading early “Motorcycle genuinely secured with seller” control has been removed from the Deal 360 Seller Position panel.
- Deal 360 now records seller availability, agreed seller purchase price and hold details separately.
- A Formal Offer has its own customer expiry. Seller availability is rechecked again immediately before supplier payment.
- AnyBike only pays the seller after the customer has paid AnyBike in full.
- Full supplier payment automatically changes the motorcycle to Purchased / Secured; staff no longer uses an availability-stage checkbox to create that state.

Export purchase gate:
- buyer freight forwarder is separate from the UK shipping / receiving company;
- UK receiver can be a different business nominated by the overseas freight forwarder;
- exact UK delivery / handover address and postcode are required;
- port / terminal remains useful route context;
- Deal 360 and the customer dashboard now store and display these separately;
- supplier payment is database-blocked until the export handover route is confirmed.

First-order onboarding:
- first accepted Formal Offer starts one seven-day Buyer Verification / Export & Tax Identity grace period;
- additional motorcycles in the same first order do not reset that verification deadline;
- account On Hold / Stopped still blocks progression;
- customer funds and the shipping route remain hard purchase requirements.

First-order consolidation:
- the first motorcycle entering depot storage starts a seven-day free consolidation window;
- a genuinely accepted additional motorcycle during the active window can extend the consolidation deadline;
- an intention to buy another bike does not stop storage;
- after the free consolidation period, normal storage charges apply;
- live standard rate aligned to the published Services & Fees rate of £6.95 per motorcycle/day inc. VAT;
- paid motorcycles should move to the nominated UK receiver promptly unless the buyer is actively consolidating a first multi-bike order.

No freight carrier, container size or destination-specific shipping method has been hard-coded. The platform records the actual nominated route for each Deal.


## 1 October 2026 — Delivery separated from motorcycle commercial margin

Commercial rule confirmed during AB-000026 testing:
- UK Collection & Delivery remains a customer-facing charge and remains inside Customer Total.
- The transport line is accounted for separately and is not assumed to be VAT-free.
- Motorcycle commercial revenue is Motorcycle Sale Price + AnyBike Sourcing Fee.
- Motorcycle / Deal Cost Basis is Agreed Seller Purchase Price plus genuine motorcycle/deal-specific costs such as prep/rectification, export documentation, deal administration and other genuine deal costs.
- AnyBike and Move Motorcycles are trading styles of Giffords Empire Ltd. Move Motorcycles does not invoice AnyBike for its jobs, so do not create a Move supplier invoice, supplier payable, intercompany charge or artificial internal transport cost in Deal 360.
- UK Collection & Delivery does not increase motorcycle commercial profit or motorcycle commercial margin.
- Motorcycle VAT estimates exclude delivery; the final invoice VAT review remains authoritative for the transport line.

Frontend alignment completed:
- Deal 360 Commercial Setup no longer asks staff for an invented internal collection/delivery cost and explicitly describes the transport charge as separate from motorcycle margin.
- Deal 360 Commercial Setup, Formal Offer and pre-sale summaries use “Motorcycle / Deal Cost Basis”, “Motorcycle Commercial Profit” and “Motorcycle Commercial Margin”.
- Formal Offer preview calculates Customer Total including delivery, while profit/margin use only motorcycle price + sourcing fee against the motorcycle/deal cost basis.
- The saved-offer fallback display was corrected so delivery cannot re-enter displayed commercial profit.
- Global Buyer Deal Viability / AnyBike Offer uses the same separate transport treatment and clearer labels.
- AI Matching Deal Viability keeps delivery out of the staff cost-entry workflow, saves delivery cost as zero and now explains that transport is handled separately.


## 1 October 2026 — Two-Sided AnyBike Sales Architecture

- AnyBike now has two distinct customer-facing sales routes sharing one platform:
  - **Used Bike Export — B2B**: used motorcycles for genuine trade/business buyers only, with the headline proposition **AnyBike Delivered to Any UK Port Price**.
  - **New Motorcycle Retail — B2C**: UK consumer retail for selected new motorcycles, beginning with VMoto electric motorcycles and scooters, with the headline proposition **Delivered to Your Door**.
- Do not reintroduce private/consumer buyers into the existing used/export buyer type. Consumer retail must be route-specific.
- The used/export first motorcycle communication must show the commercial proposition from the outset: Motorcycle Sale Price + AnyBike Sourcing Fee + UK Collection & Delivery = **AnyBike Delivered to Any UK Port Price**.
- The VMoto retail route is model-led: Model → Battery/Specification → Colour → Stock Availability → Retail Order → VMoto Preparation/PDI → Move Collection → Home Delivery.
- VMoto stock should be connector/API-ready so live availability can replace manual/imported availability later without redesigning the catalogue.
- Initial VMoto virtual dealer pilot areas agreed with VMoto UK: South Wales; North East England; Sheffield / South Yorkshire; Liverpool / Merseyside.
- VMoto model, county and town pages should be generated from shared catalogue/location data rather than maintained as independent hard-coded pages.
- Reuse existing Message Centre, notifications, matching responses and Deal 360 foundations where safe, but keep B2B export legal/commercial gates separate from B2C retail terms and aftersales obligations.
- Deposit automation remains a separate business-rule decision and must not be hard-coded until the percentage/minimum/rounding rule is agreed.


### 1 October 2026 — Deal 360 Sale Route foundation implemented

- Supabase migration `add_deal_sale_route_foundation` applied live.
- `anybike_deals.sale_route` now stores one of:
  - `USED_EXPORT_B2B` — default for all existing Deals and the existing used/export workflow.
  - `NEW_RETAIL_B2C` — separate UK new-motorcycle consumer retail workflow.
- Existing live Deals were preserved and defaulted to `USED_EXPORT_B2B`; no existing payment, offer, Message Centre, notification or operations records were rewritten.
- Admin-only RPCs now read/change the route with an admin guard.
- Deal 360 now displays the route and lets staff deliberately switch a Deal between the two routes.
- A `NEW_RETAIL_B2C` Deal shows the retail journey foundation instead of presenting export-only freight-forwarder/port steps as if they applied to a consumer order.
- Retail journey foundation: Customer Order → Stock Confirmation → Customer Payment → Order VMoto → VMoto PDI → Move Collection → Home Delivery.
- Retail checkout/actions remain intentionally controlled until VMoto pricing, warranty/aftersales, B2C servicing and retail terms are confirmed.
- VMoto retail delivery proposition: **Nationwide Delivery from £99** with a **Full handover at your home or place of work**.
- Retail delivery remains a separate charge in Deal 360 so the final amount can vary by customer location/postcode rather than assuming a flat nationwide £99.


### 1 October 2026 — VMoto retail enquiry and Deal 360 order workspace

- Added API-ready VMoto catalogue tables for Models → Variants/Battery → Colours → Stock Availability. No live model records were fabricated; official VMoto media/model/price data is still required before catalogue publication.
- Added `anybike_retail_orders` as the route-specific retail order record behind `NEW_RETAIL_B2C` Deals.
- VMoto public enquiry flow now creates a genuine Deal 360 retail Deal automatically rather than relying on staff to switch a used/export Deal manually.
- The enquiry captures: VMoto model, version/specification, battery choice, colour choice, customer name/email/phone, home/place-of-work handover choice, postcode/town/address and notes.
- VMoto enquiry creation also creates the Deal motorcycle row, Deal origin, Message Centre thread/message and admin notification, all linked to the retail Deal.
- Retail motorcycle VAT defaults to **Full VAT / 20%** for the new-machine route, while final supplier invoice treatment still requires confirmation.
- Retail pricing is componentised: motorcycle price, First Registration Fee, road tax and delivery remain separate lines; FRF and road tax have their own VAT-treatment fields instead of being forced into the motorcycle VAT line.
- Delivery proposition remains **Nationwide Delivery from £99** with **Full handover at your home or place of work**. The actual delivery charge is confirmed per customer/location and then included in the final customer total.
- Deal 360 retail workspace now allows staff to manage retail stage, VMoto stock status/location, VMoto order reference, motorcycle price, FRF, road tax, delivery charge, delivery postcode and internal notes.
- Retail Deal 360 queue uses retail-specific next actions rather than the used/export seller-check next-action engine.
- Current retail stages: Customer Order → Stock Confirmation → Customer Payment → Order VMoto → VMoto PDI → Move Collection → Home Delivery → Completed.


### 1 October 2026 — VMoto approved FAQ knowledge base

- Added a dynamic VMoto FAQ knowledge base to the VMoto World page.
- Public FAQ answers are database-driven and only records marked **Approved** are shown publicly.
- Product, warranty, servicing, registration, charging, licence, battery, insurance and ownership answers should come from confirmed VMoto UK guidance rather than AnyBike guessing or generating unsupported claims.
- FAQ records can be general or later scoped to a specific VMoto model or territory.
- Customers can submit unanswered VMoto questions directly from the FAQ area. Each submitted question creates an admin notification and enters the VMoto FAQ question queue.
- Repeated real customer questions should be sent to VMoto UK for an approved answer, then converted into the public FAQ so the knowledge base improves over time.
- Source name/reference is stored internally with each FAQ answer so AnyBike can retain where the approved wording came from.
- The public FAQ starts empty until Cameron/VMoto UK provides approved questions and answers; no VMoto product answers should be fabricated just to populate the section.

- VMoto FAQ scoping rule: the main VMoto hub shows only general approved FAQs. Individual model pages show the general approved FAQs plus FAQs specifically assigned to that model. Model-specific answers must never leak onto unrelated model pages.


### 1 October 2026 — VMoto Admin HQ and generated model pages

- Added **VMoto HQ** as the staff workspace for new motorcycle retail catalogue management.
- VMoto HQ manages Models, Versions/Batteries, Colours, Stock Availability and FAQ/Customer Questions in one admin page.
- Model records remain Draft/hidden until staff deliberately mark them Active/Public. This prevents incomplete Cameron/VMoto data from appearing publicly.
- Model fields include model name, public slug, vehicle type, description, base retail price, hero image and sort order.
- Variant fields include version name, battery description/capacity, quoted range, charging information, retail price, first-registration fee and road tax/ VED.
- Colour records sit under a specific model variant rather than creating duplicate model cards.
- VMoto stock supports variant, colour, stock location, source stock ID, quantity, status, expected date and source method. It remains manual/import-ready while VMoto API access is still to be confirmed.
- Public `/vmoto.html` now reads the managed catalogue automatically. Until models are entered, it retains a safe media-pack-awaiting placeholder rather than inventing products.
- Added dynamic `/vmoto-model.html?model=<slug>` pages. A published model automatically receives a model page showing its versions, battery details, colours, known stock status and approved general + model-specific FAQs.
- Clicking a model/version enquiry carries the chosen model/version into the VMoto retail enquiry form, which creates the existing `NEW_RETAIL_B2C` Deal 360 flow.
- Added **VMoto HQ** to the shared admin navigation and admin search routing.


### Public website wording rule — 1 October 2026

- Every public AnyBike page must read as a finished customer-facing service, not as a development diary, roadmap or internal project note.
- Do not expose internal terms such as Deal 360, admin workflows, launch controls, API plans, media-pack status, placeholder/development language, internal route names or statements about what AnyBike may build later.
- Where data is not yet available, use useful customer wording such as **Contact AnyBike for current availability**, **Enquiries welcome**, **No current models to show**, or a relevant call to action.
- Public pages should explain what the customer can do now, what AnyBike currently provides, what information AnyBike will confirm for the transaction and any genuine limitations that matter to the customer.
- Future product ideas, development status, platform architecture and internal implementation details belong only in admin/project documentation.


### 3 October 2026 — Customer sourced-match filtering
- Customer sourced-match selections are no longer intentionally limited to a small shortlist solely for ease of review.
- Where a larger set of motorcycles genuinely matches the buyer requirement, AnyBike may send the full qualifying selection.
- `customer-sourced-matches.html` now lets the buyer filter by:
  - maximum AnyBike price;
  - minimum year;
  - maximum mileage;
  - colour.
- Buyers can sort by lowest/highest price, newest/oldest and lowest/highest mileage.
- Filtering only changes the visible cards. On **Save my choices**, every live motorcycle in the full selection that is not ticked **Interested — Check Availability** is recorded as **Not Interested**.
- The page-specific **Your next action** updates as the buyer selects motorcycles and clearly explains that unticked motorcycles in the full selection will be treated as Not Interested.


### 3 October 2026 — Multi-photo buyer-safe galleries and staff preview
- Sourced-match cards should not be limited to one photograph when the source provides additional usable images.
- Buyer-safe image preparation now targets up to **6 approved buyer-safe photos per sourced motorcycle** where the source advert provides enough suitable images.
- Existing approved buyer-safe images are preserved; preparation fills the gallery rather than replacing clean images unnecessarily.
- Admin Used Bike Scanner now shows buyer-safe image thumbnails and provides **Preview as buyer** for each match before it is sent.
- The sourcing **Your next action** now prioritises preparing galleries where a match has no buyer-safe image or fewer than 3 approved images, then tells staff to preview each match as the buyer will see it.
- A batch-level **Prepare buyer-safe photos for all matches** control prepares the galleries across the sourcing batch.
- Customer sourced-match cards show a photo count and **View all photos** gallery when more than one approved buyer-safe image is available.
- Only approved buyer-safe images are exposed to the customer; source/dealer originals remain internal.
- Current automated image-cleaning bridge is proven on BMW Approved Used. The customer gallery and preview UI are source-neutral, and additional source adapters must feed their source images through the same buyer-safe approval pipeline before customer display.


### 3 October 2026 — Buyer-safe image processing gate
- Saved sourcing batches now show a visible buyer-safe image processing progress bar.
- While automatic buyer-safe image preparation is running, **Share selected motorcycles** is disabled.
- Sharing is also blocked if any selected Live Source motorcycle has no approved buyer-safe image.
- If processing finishes with a match still needing attention, the progress panel identifies that manual retry/review is required.
- The gate is based on approved buyer-safe images only; raw supplier/dealer images never satisfy the customer-share requirement.


### 3 October 2026 — Multi-request buyer sourcing rule
- A buyer may have multiple active motorcycle request items across different makes/models/brands.
- Completing, preparing or sending matches for one request **must never imply that the buyer's other requests are complete**.
- Every sourcing workspace must treat the buyer's full request set as a **Buyer Sourcing Plan**.
- Staff must be shown all saved motorcycle requests for the buyer with a clear per-request status:
  - **Not Started**
  - **Matches Prepared**
  - **Sent to Buyer**
  - **Buyer Responded**
- Live Source Hub now shows the full Buyer Sourcing Plan when a buyer is selected and gives a direct **Source this request →** action for each Not Started requirement.
- Used Bike Scanner now reminds staff about the buyer's other motorcycle requirements while reviewing/sending a batch and links directly to the next unsourced request.
- A batch for one brand/model is only completion of that request, not completion of the buyer.
- **Your Next Action** must continue to point staff to remaining Not Started requests until every request has been worked, explicitly closed, or otherwise resolved.


### 3 October 2026 — Message Centre interest clues
- The Buyer Sourcing Plan must also check the buyer's linked Message Centre history for motorcycle models they have discussed.
- Message Centre mentions are **suggestions, not confirmed sourcing requests**.
- The system should use structured Message Centre motorcycle context and customer-authored message text to identify known make/model mentions.
- A discussed model already present in the sourcing plan must not be duplicated.
- Staff see **Discussed · not yet in sourcing plan** and may deliberately choose **Add to sourcing plan →**.
- Adding a Message Centre mention creates a normal buyer request with an audit note linking it back to the relevant Message Centre thread(s).
- A batch created from such a request uses customer wording along the lines of: **“You did mention that you may also be interested in this model…”** rather than implying the customer formally requested it.
- Do not automatically source or send a model merely because it was mentioned in conversation; staff confirmation is required.


### 3 October 2026 — Source channel setup guidance and BMW refresh quality gate
- Live Source Hub source cards with no working adapter now use **Set up channel →** rather than a passive “Adapter needed” label.
- Selecting an unadapted source changes **Your Next Action** to **Set up [source] as a live sourcing channel** and opens an on-page setup guide.
- Staff guidance is:
  1. open/check the saved source and confirm live used-bike stock is visible;
  2. use Scanner immediately for individual adverts while the automated adapter is pending;
  3. build/verify a source-specific adapter before enabling automatic catalogue refresh.
- This allows staff to continue sourcing a buyer even when the requested brand/channel is not yet automated.
- BMW full-source refresh now has a strict quality gate: a scanned record is only allowed back into the Live pool when it is a ready BMW detail record with a valid model, positive realistic price, valid BMW Bike ID/detail URL and no known placeholder/test seller data.
- Invalid BMW refresh results are counted as failed/review work rather than overwriting good Live Source data.
- Existing BMW live rows with zero price, blank model or test placeholder seller were moved from **Live** to **Review**; they are not deleted and may return to Live after a later valid refresh.


### 3 October 2026 — Buyer landed-cost and margin calculator
- Customer sourced-match cards now include a collapsible **Buyer margin calculator**.
- The AnyBike motorcycle price remains fixed in GBP and cannot be edited by the buyer.
- Buyers can model their own downstream commercial costs in their preferred currency, including:
  - exchange rate from GBP to preferred currency
  - international shipping / freight
  - import duty %
  - import VAT / local tax %
  - collection from local destination port
  - preparation / workshop cost
  - warranty provision
  - other local landed costs
- The calculator shows:
  - converted AnyBike price
  - estimated duty
  - estimated import tax
  - estimated landed cost
  - minimum retail price required for the buyer's target gross margin
  - expected gross profit and gross margin when the buyer enters an expected retail price
- Duty estimate uses converted AnyBike price + shipping as the calculation base; import tax is estimated after duty. The UI clearly states that customs valuation rules vary by country and the tool is a buyer commercial estimate, not an AnyBike customs/tax calculation.
- Buyers may save calculator defaults to their customer profile so future match calculators auto-fill them.
- Customer profile now includes optional **Margin Calculator Defaults** covering currency conversion rate, duty, import tax, target margin and normal local costs.


### 3 October 2026 — Explicit commercial-target sharing and pricing guardrail
- Buyer margin-calculator values are **not exposed to AnyBike sales staff merely because the buyer types them into a calculator**.
- Each match calculator now has a deliberate **Share my buying target with AnyBike** action.
- Before sharing, the buyer is told exactly what will be sent and that sharing:
  - helps AnyBike prioritise motorcycles that fit the buyer's commercial requirements;
  - does not change the AnyBike price;
  - does not commit the buyer to purchase.
- Shared commercial targets snapshot the buyer's chosen:
  - currency and GBP conversion rate
  - freight/shipping cost
  - duty and import/local-tax rates
  - destination-port collection
  - preparation/workshop cost
  - warranty provision
  - other costs
  - target gross margin
  - expected local retail price, when supplied
- When both expected retail price and target margin are supplied, AnyBike calculates:
  - maximum viable AnyBike price in GBP under the buyer's assumptions;
  - commercial headroom versus the current AnyBike price.
- Customer 360 → Motorcycle Interests now contains **Buyer Commercial Intelligence** showing only deliberately shared targets plus descriptive Interested / Not Interested price history.
- Permanent pricing guardrail:
  - use shared commercial intelligence to understand fit and avoid unnecessary discounting;
  - do **not** increase a buyer's price merely because their shared/private economics indicate extra headroom;
  - unshared calculator defaults are not shown in Customer 360 sales intelligence.


### 3 October 2026 — Buyer questions, sourcing-process explanation and deposit flexibility
- Sourced-match selection now keeps the buyer workflow simple: the buyer ticks only the motorcycles they want AnyBike to check. Unticked motorcycles are recorded as **Not Interested at this time**.
- Each Interested motorcycle now exposes one optional free-text field: **Anything you’d like us to ask the seller?** There is no suggested checklist, so the UI does not encourage buyers to create unnecessary inspection work.
- Buyer questions are stored with the sourced-bike response and carried into the automatically created Deal 360 candidate / seller-check context. They are answered as part of the existing seller availability check rather than creating a separate workflow.
- The customer sourced-match page now explains the full journey: seller availability and questions → Formal AnyBike Offer → minimum deposit → motorcycle secured → remaining balance cleared before seller collection → Move Motorcycles collection → collection photographs → secure custody → UK port / freight-forwarder handover.
- Storage wording is customer-facing: storage charges can apply where onward shipping / handover is delayed; buyers are directed to My Messages to discuss delays.
- Buyers can acknowledge the sourcing-process explanation and choose not to see the full explanation on future sourcing selections; it remains reopenable.
- The trade landed-cost / margin calculator is now promoted as a visible buyer tool on the sourced-match page rather than being easy to miss inside a motorcycle card.
- Formal offers now treat the deposit as a **minimum deposit**. Current default: **10% of the customer offer total, rounded to the nearest £50, minimum £500**, capped at the offer total. Staff can still review the saved offer deposit.
- Buyers may pay the minimum deposit, a larger amount, or the full remaining purchase balance. Any remaining balance must be received in cleared funds before collection from the seller.
- A seller-side negotiated saving does not automatically reduce the buyer-facing AnyBike price; buyer price changes remain an explicit AnyBike commercial decision.


### 3 October 2026 — Seller availability handoff and sourced-price protection
- After a seller availability check is saved, Deal 360 now shows a local **Your next action** telling staff to select the confirmed motorcycle for the Deal.
- **Select for Deal** is a single action: no extra confirmation click. After selection it opens the motorcycle's Commercial Setup directly.
- When a candidate originated from a customer-visible sourced match, Deal 360 now carries the original buyer-facing price components into the Deal motorcycle: motorcycle price, AnyBike sourcing fee and UK collection/delivery allowance.
- Those buyer-facing sourced-match components are treated as a protected quote snapshot in Commercial Setup so staff cannot accidentally add the sourcing fee or UK collection/delivery a second time.
- Already-shown legacy sourced-match prices are preserved exactly even if the fee rule has since changed. New sourced matches continue to use the current automatic sourcing-fee rule upstream.
- Current test Deal AB-000029 was repaired to its original sourced-match breakdown: £15,990 motorcycle + £1,295 sourced-match fee + £250 UK collection/delivery = £17,535 customer price; seller purchase price remains £15,000.


## 3 October 2026 — Giffords Empire trading-style accounting rule
- Legal entity: **Giffords Empire Ltd**.
- Trading styles: **AnyBike** and **Move Motorcycles**.
- Move Motorcycles is the internal specialist transport operation used by AnyBike, not a separate supplier entity.
- No Move Motorcycles invoice is raised to AnyBike for AnyBike jobs.
- The buyer's UK Collection & Delivery Charge remains part of the AnyBike customer deal and must not generate a matching Move supplier payable.
- Internal transport performance/cost reporting may be tracked operationally, but it must not be represented as an invoice between AnyBike and Move Motorcycles.


## 8 October 2026 — Deferred: Shipper Matching in Operations HQ / Deal 360

**Status: Planned; do not implement until the user asks to resume.**

1. Suggest suitable freight forwarders for a deal using destination countries, UK delivery ports/handover points, shipping methods, and motorcycle-handling capability.
2. Prioritise Preferred AnyBike Partners without hiding other suitable shippers. Keep Preferred Partner and Motorcycle Specialist as separate statuses.
3. Display rolling/crated motorcycle capabilities, crating facilities and indicative prices such as "Motorcycle Crating from £350.00"; do not represent estimates as confirmed quotes.
4. Let AnyBike staff request quotations from selected shippers using the established shipper communication workflow.
5. Record quotations against the correct Deal 360 transaction (route, amount/currency, validity, terms and lead time), visible to authorised staff in Operations HQ.
6. Present buyer-safe shipping options for buyer approval while keeping internal staff notes private.
7. Record the buyer's chosen shipper, AnyBike operational approval and confirmed handover arrangements in Deal 360 / Operations HQ.

**Safeguards:** Customers can bring their own freight forwarder. Never automatically appoint or commit to a shipper. Preserve existing authorisation, communications, audit trails, permissions and transaction records.


## 8 October 2026 — International manufacturer and model pages: design and SEO requirements

**Status: Planned.** Purpose: help international trade/dealer buyers discover motorcycles and submit sourcing enquiries for UK motorcycles using the **existing AnyBike funnel**, without building another enquiry configurator.

- Build initial major-manufacturer pages (BMW, Honda, Yamaha, Kawasaki, Suzuki, Ducati, Triumph, Harley-Davidson, KTM and other selected established brands), followed by historical and current model pages; every model is always *available to request for sourcing* even when no live UK listing has been found.
- **Wide layouts on desktop**: use available screen width (approximately 1,700–1,800px maximum), small but comfortable side margins, compact vertical spacing, restrained card padding and responsive layouts on mobile. Avoid tall empty hero sections, excessive white space and narrow text columns.
- **Image-rich, genuine content**: manufacturer history, historic motorcycles, models, factory/manufacturing sites and production partnerships, plus applicable UK marketplace imagery. Only use images with suitable rights and accurate attribution as required; use responsive images, compression and lazy loading below the fold for performance.
- **Image SEO**: descriptive, truthful and specific file names, descriptive HTML alt text, clear visible captions where helpful, and structured image context. Keep descriptive information in accessible HTML, not hidden keyword blocks or deceptive hidden text. No keyword stuffing. Each image must actually depict what its description says.
- Every page has distinct editorial content, accurate metadata, canonical URLs and internal links; don't create thin near-duplicate manufacturer/country permutations.
- Cross-link relevant models, motorcycle categories (adventure, learner-legal, sports etc), engine capacities (cc), manual/automatic/DCT, generation/model production start and end dates, related brands and genuine country-specific buyer interest.
- The main manufacturer/model pages are stable and indexable; country-specific popular search links may refresh dynamically from genuine visitor/search activity.
- Prominent **Source [Manufacturer/Model] from the UK** uses existing sourcing registration, customer 360, Live Source Hub, notifications and Deal 360, with brand/model/variant/source page/destination country prefilled or captured. Do not create a separate enquiry system.
- Buyer messaging must distinguish *available to source* from a *currently advertised UK listing* and *seller-confirmed availability*.

## 8 October 2026 — Manufacturer/model logos and international sourcing calls to action

- Use official manufacturer logos and official model logos/badges where applicable and permitted; preserve authentic proportions/colours. Never invent a model logo when none exists. Keep manufacturer marks distinct from AnyBike branding.
- Manufacturer primary CTA: **Request a Motorcycle from the UK**. Model page primary CTA: **Request This Motorcycle from the UK**. Preselect the brand/model/generation and use the existing AnyBike sourcing enquiry funnel.
- Supporting copy: **Source motorcycles from UK sellers through AnyBike. UK collection and delivery to your chosen UK port or approved handover point. Shipping and crating options can be arranged or quoted where available.**
- Do not imply international shipping or crating is automatically included in the motorcycle offer, guaranteed everywhere, or necessarily undertaken directly by AnyBike. State availability, quote, and third-party arrangements accurately.

## 8 October 2026 — Manufacturer enquiry continuity and seamless onboarding (mandatory before launch)

- Never lose a visitor's motorcycle requirements when crossing registration, login, email confirmation or customer onboarding. Preserve the request securely before authentication where feasible and attach it exactly once to the authenticated customer record when identity is established; use an expiry-controlled server-side draft/claim mechanism or equivalent secure persistence, not only a volatile page form.
- One canonical Customer 360 profile. Reuse existing signed-in profile values; prompt only for missing required details, allow buyers to return to incomplete onboarding, and keep previous enquiries intact.
- Record trade eligibility (international export buyers must be trade/dealer), one-off vs occasional vs regular purchasing, and approximate monthly purchasing volume. Make these editable customer preferences rather than overwriting historical enquiries.
- Preserve motorcycle maker, model, variant, requested year range, mileage, engine capacity, transmission, specification, preferred UK handover port, destination country, buyer notes and origin page throughout onboarding. Avoid duplicate account/enquiry creation across retries and sessions; use stable identifiers and idempotent submission.
- Enquiry flows to the existing sourcing funnel, Customer 360, notifications, Live Source Hub and Deal 360; never create a parallel manufacturer enquiry system.
- Show a visible saved/received confirmation and the buyer's next action. Admin should see buyer qualification and enquiry-source context and receive an actionable notification.
- Before launch, test the full sequence with new visitor, registered incomplete user, approved buyer, interrupted/returning onboarding and retry/duplicate submission, including row-level access controls and protection of unclaimed drafts.
