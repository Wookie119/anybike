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
