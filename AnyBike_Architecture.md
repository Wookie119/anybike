# AnyBike Architecture

## Project Status Tracker

| Area | Status | Notes |
|---|---|---|
| Dashboard | ✅ Complete | Shared shell working |
| Bike Sales CRM | ✅ Complete | CRM, messaging, deal calculator working |
| Stock HQ | ✅ Complete | Stock admin foundation working |
| Global Buyer Network | ✅ Complete | Foundation in place |
| Logistics HQ | 🟡 In Progress | Shell/foundation built, workflow to expand |
| Customer 360 | 🟡 In Progress | Needs full workspace tabs |
| Message Centre | 🟡 In Progress | New central inbox started |
| Motorcycle Requests 360 | ⏳ Planned | First major Phase 2 feature |
| Market Intelligence | 🟡 Placeholder | Needs data and reporting |
| AI Matching | 🟡 Placeholder | Shell working, feature planned |
| Export Documents | 🟡 Placeholder | Needs document workflow |
| Reports | ✅ Foundation Complete | Expand later |
| Mission Control | 🟡 In Progress | Platform audit and health checks |
| Administration | 🟡 In Progress | Settings/users/permissions to finish |
| Finance HQ | ⏳ Planned | ROI, invoices, payments, export costs |

---

## Current Immediate Work

Finish AnyBike Admin Platform v1.0 by standardising the remaining admin pages onto the shared shell:

- admin-export-documents.html
- admin-market-intelligence.html
- admin-settings.html
- admin-stock-import.html

Then run final QA and freeze the admin shell.

---

## Next Major Feature

Message Centre becomes the front door for all enquiries:

- Bike enquiries
- Multi-bike requests
- Contact Us
- Sell Your Motorcycle
- Shipping questions
- Buyer registrations
- Dealer enquiries
- Export document questions

Every message must keep links to the correct customer, bike, enquiry, request, department and timeline.

---

## 20 September 2026 — Trade / Export Sales, Inspection & Account Direction

### Locked commercial direction
- AnyBike motorcycle sales are to be built around a **trade / business sale basis**, including international sales.
- Do not rely on the fact of export alone to remove legal obligations; buyer status and the transaction contract must support the trade sale basis.
- No automatic AnyBike mechanical warranty is included on used motorcycles sold on a trade/export basis unless expressly agreed in writing for a specific transaction.
- Do not describe a trade sale as eliminating every legal right. Terms must preserve liabilities that cannot lawfully be excluded.
- Accurate motorcycle description and disclosure of known material issues remain required.

### Inspection model
- **Collection Condition Check** = visual/handover record only.
- AnyBike staff, drivers and collection partners are not acting as mechanics or engineers when completing the collection check.
- Collection check can record visible appearance/damage, mileage, identity details, keys, available documents, photographs/video and handover state.
- It does **not** verify hidden/internal mechanical condition, authenticate complete service history, or predict future reliability.
- A buyer wanting mechanical assurance must request an **independent third-party mechanical inspection** before purchase/commitment.
- Third-party inspection cost is payable by the buyer unless AnyBike expressly agrees otherwise in writing.
- Deal 360 should ultimately store an Inspection Basis:
  - Visual Collection Check Only
  - Independent Mechanical Inspection Requested
  - Independent Mechanical Inspection Completed
  - Buyer Arranged Own Inspection
  - Buyer Declined Additional Inspection

### Account / dashboard direction
- **My AnyBike** remains the universal account home.
- **My Sales** will be the seller workspace for anyone selling motorcycles to AnyBike, whether private seller, regular supplier or dealer.
- **My Dealership** remains the verified dealer workspace for stock/feed/trade prices and should later surface Buying from AnyBike, Selling to AnyBike and Accounts routes.
- Accounts use capabilities rather than one rigid type: buyer, seller, dealer, supplier.
- A person selling multiple bikes should not automatically become a dealer; repeated supply can trigger an internal potential-trade/supplier review.
- Buyer capability means trade/business buyer for purchases from AnyBike. Seller capability may still be private or trade.
- All new customer/dealer/seller dashboards and workspaces should use the agreed **wide desktop layout** (approximately 94–96vw, up to about 1960px) and collapse responsively.

### Seller dashboard workstream
- Build `my-sales.html` after the authenticated seller-to-account database relationship is established.
- Seller dashboard must show all motorcycles being sold to AnyBike, agreed purchase price, amount paid, balance, sale status, collection/handover, documents/messages and payment history.
- Supplier-payment history must display the bank snapshot actually used for that payment; later changes to current bank details must not rewrite history.
- Never expose AnyBike resale price, buyer identity, customer payments, margin or other confidential Deal 360 commercial data to the seller.

### Public policy work
- Trade & Export Sale Policy page added.
- Motorcycle Inspection page to distinguish visual collection checks from independent mechanical inspection.
- Buying / Available Stock / Export / Formal Offer pages to be aligned with the trade/export sale basis.
- Next database work: auditable Trade Buyer Declaration and auditable Inspection Basis captured at offer acceptance / Deal 360.


### Buyer legal acceptance rule
- All AnyBike account registrations must explicitly accept the current Terms & Conditions and Privacy Policy.
- Account registration acceptance does **not** replace the transaction-level trade declaration.
- A buyer must not be able to accept a motorcycle Formal Offer until they explicitly confirm all of the following:
  1. current AnyBike Terms & Conditions;
  2. current Trade & Export Sale Policy;
  3. that the purchase is wholly or mainly for purposes relating to their trade, business, craft or profession;
  4. that AnyBike's collection/condition check is visual only and is not a mechanical or engineering inspection, and that any required independent mechanical inspection must be requested before purchase and paid for by the buyer unless otherwise agreed.
- These transaction acceptances must ultimately be stored as a permanent audit record with user ID, offer/deal ID, acceptance timestamp and policy/version identifiers.
- Future Formal Offer acceptance must fail closed if the required legal acceptance record cannot be created.
- Current policy version introduced 20 September 2026.


### Buyer change-of-mind / resale-on-behalf policy
- Once a Buyer has accepted a Formal Offer and AnyBike has purchased or secured the motorcycle in reliance on that acceptance, the transaction is not treated as a normal refundable reservation.
- If the Buyer later changes their mind, fails to complete, fails to provide shipping/handover instructions, or fails to take delivery, the matter is treated as **Buyer Default / Buyer-Initiated Resale**, subject to the agreed contract terms and applicable law.
- If the Buyer has **fully paid** and then changes their mind, the standard AnyBike remedy is **not an automatic refund**.
- The only commercial exit route offered by AnyBike in that situation is for AnyBike to **resell the motorcycle on the Buyer's behalf / for the Buyer's account** through one or more reasonable channels, which may include:
  - AnyBike;
  - AnyBike's verified UK dealer network;
  - international trade buyers;
  - other appropriate trade/commercial resale channels.
- AnyBike may retain possession of the motorcycle pending resale and may require the Buyer to provide any documents or authority reasonably needed to complete the resale.
- AnyBike must account for the resale proceeds against the Buyer's transaction account.
- Before any surplus is returned, AnyBike may deduct all reasonable sums due under the original transaction and all reasonable costs/losses arising from the Buyer's change of mind/default.
- Deductible amounts may include, where applicable:
  - the **original AnyBike fees and charges that the Buyer was due to pay under the original purchase**;
  - motorcycle purchase price / supplier commitment already incurred by AnyBike;
  - original collection, transport, preparation, documentation, inspection coordination, export handling or delivery charges already incurred;
  - storage and insurance;
  - additional collection, redelivery or repositioning costs;
  - remarketing and resale administration;
  - dealer/trade selling costs or commissions;
  - third-party cancellation or handling charges;
  - any shortfall between the original transaction value and the eventual resale proceeds;
  - other directly attributable and properly evidenced costs caused by the Buyer's default/change of mind.
- The resale is to be handled as an account reconciliation, not a simple refund:
  - **Resale proceeds**
  - less **original AnyBike fees/charges due under the original deal**
  - less **additional resale/default costs**
  - less **any other sums properly due**
  - equals **final Buyer surplus or shortfall**.
- If a shortfall remains after resale, the Buyer may remain liable for that shortfall under the contract.
- If a genuine surplus remains after all properly due amounts have been deducted and the account is fully reconciled, that surplus is handled in accordance with the contract and applicable law.
- AnyBike should take reasonable steps to mitigate loss and should keep a clear audit trail of:
  - Buyer default / change-of-mind date;
  - notice given;
  - original transaction value;
  - original fees and charges;
  - additional storage/transport/resale costs;
  - resale channel(s);
  - offers received;
  - resale price achieved;
  - final reconciliation;
  - any Buyer shortfall or surplus.
- Deal 360 should ultimately support a dedicated **Buyer Default / Resale on Behalf** workflow:
  1. Buyer change of mind / failure to complete;
  2. Notice to Buyer;
  3. Remedy period where appropriate;
  4. Resale authorised / initiated;
  5. Motorcycle offered on AnyBike and/or to dealer/trade network;
  6. Resale agreed;
  7. Costs and original fees deducted;
  8. Buyer account reconciled;
  9. Shortfall collected or surplus dealt with;
  10. Deal closed with full audit history.
- Customer-facing Terms & Conditions and Formal Offer wording should make clear before acceptance that:
  - deposits and full payments are not automatically refundable after AnyBike has committed to or purchased the motorcycle;
  - if a fully paid Buyer later changes their mind, AnyBike's standard commercial remedy is resale of the motorcycle on the Buyer's behalf/for their account, not cancellation with an immediate refund;
  - the original AnyBike fees remain payable and are deducted as part of the resale reconciliation;
  - additional reasonable resale/default costs may also be deducted.


### Site-wide public language rule
- The language selected in the shared public header is the **authoritative language for the entire public AnyBike page**, not only the navigation/header.
- Every customer-facing public page must translate its visible page content when the header language changes.
- Supported shared-header languages currently are: **English, German, French, Spanish and Arabic**.
- The selected language must persist across public-page navigation using the existing AnyBike language preference/local storage and logged-in profile preference.
- Public page translation must include, where applicable:
  - headings, paragraphs and explanatory copy;
  - buttons, CTAs and links;
  - form labels, placeholders, help text, validation and success/error messages;
  - FAQs, notices, policy text and legal acceptance wording;
  - dynamically rendered stock/search/market UI labels;
  - modal/dialogue text;
  - footer copy;
  - page title / browser title.
- Do not translate motorcycle makes, model names, VINs, registrations, customer-entered text, dealer-entered text, prices, proper supplier names or other factual identifiers unless there is a deliberate display rule.
- Do not rely on the browser's automatic translation or an unapproved external translation service for contractual/legal text.
- Legal/policy translations must retain the same meaning and version as the English master. The English version remains the drafting source of truth until professionally reviewed translations are adopted.
- Market/country pages must obey the header selection even if their default content was originally written in the destination country's local language.
- Use a **shared translation controller/page-family architecture**, not separate one-off language selectors on individual pages.
- Translation rollout is a HIGH-PRIORITY public-site workstream. A page is not considered language-complete until its full visible content responds to the shared header selector.


## 20 September 2026 — Public Language Rollout Checkpoint

### Locked public-language rule
- The shared public header language selector is the authoritative language for the **entire public page**, not just the header/navigation.
- Supported public languages are now:
  - English
  - German
  - French
  - Spanish
  - Arabic
  - Bahasa Indonesia
  - Bahasa Melayu
  - Chinese
- A public page is not considered language-complete while visible English copy remains after another language is selected.
- Motorcycle makes/models, registrations, VINs, prices, customer-entered text and other factual identifiers should not be translated unless there is a deliberate display rule.
- English remains the drafting/source-of-truth language for legal/commercial text until professionally reviewed translations are adopted.

### Translation architecture now proven
- `about-us.html` is the reference implementation for full-page translation behaviour.
- Shared page-family translation logic has been introduced so page groups do not need independent language systems.
- The country-market family under `/markets/*.html` now uses shared structural translation logic across all eight supported languages.
- Tested successfully by the user on `/markets/indonesia.html`.
- Full/major translation coverage has also been added for:
  - Home page
  - Available Stock
  - Bike Details UI
  - Terms & Conditions
  - Trade & Export Sale Policy
  - Motorcycle Collection
  - Motorcycle Inspection
  - Export Crating
  - Shipping Advice
- Available Stock initially developed a flashing/repaint loop because both the generic language observer and the stock-specific observer were reacting to the same DOM changes.
- This has been fixed: `available-stock.html` now uses its dedicated translation observer without the generic observer competing with it.
- User confirmed the Available Stock flashing issue is fixed.

### Current Bike Details checkpoint
- Bike Details static/dynamic UI labels are translating, including Purchase Details / Optional Services and other interface copy.
- **Known remaining defect:** the motorcycle description text itself is still English when another language is selected.
- Example seen in French:
  - heading/UI translated to French;
  - source description remained English, e.g. “2022 Sinnis GPX 125 Euro 5 124cc presented in Black with 1,300 miles...”.
- Next task: make the motorcycle description respect the selected public language.
- Important: descriptions are motorcycle-specific/dynamic content, so this should not be solved by a one-off static text dictionary. The translation/generation method must preserve factual motorcycle details such as year, make, model, variant, engine size, mileage, colour, owner count and transmission while translating the prose around them.
- Re-render the description immediately when the shared header language changes, without altering the underlying English source description in the database unless a deliberate multilingual storage design is introduced later.
- After Bike Details description translation is proven, continue the full-page audit of all remaining public pages and remove any mixed-language sections.

### Remaining public-page language audit
Pages still requiring a complete end-to-end language audit and/or completion include:
- Buy Motorcycles
- Sell Your Motorcycle
- Export Services
- Services & Fees
- International Markets
- Freight Forwarders
- Bulk Buying Request
- Partners & Integrations
- Privacy Policy
- any other public page surfaced through the shared header/navigation

For each page test:
- all eight header languages;
- headings and body copy;
- buttons and links;
- forms, labels, placeholders and validation;
- dynamic content;
- notices and legal/commercial text;
- modals/dialogues;
- footer;
- browser/page title where applicable.

### Resume point
Resume from **Bike Details motorcycle-description translation**. Do not move on to the next public page until the description itself changes language cleanly and the page no longer shows a mixed-language result.


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
