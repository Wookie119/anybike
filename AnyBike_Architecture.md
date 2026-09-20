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
