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
