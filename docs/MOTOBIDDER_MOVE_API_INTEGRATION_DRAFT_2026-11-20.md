# Motobidder → Move Motorcycles | Integration pack (INTERNAL DRAFT)
Updated: 20 November 2026
Status: **NOT READY TO ISSUE TO MOTOBIDDER**. This is a working specification, not deployed API access.

## Objective
After a Motobidder auction completes, the buying dealer chooses Book Transport. Motobidder sends a booking to a dedicated, server-side Move integration. The Move shipment must have complete motorcycle, sender, receiver, payment, and service data. Both dealerships are matched to existing Move accounts or invited to activate new accounts. Return a shipment reference and tracking information to Motobidder.

**Do not share AnyBike's existing Move customer credentials or an unrestricted Logxa admin token with Motobidder.** A dedicated key with a restricted scope, authentication, idempotency, logging, and rate limiting is required.

## Source-confirmed upstream Logxa Customer API
Base URL: `https://app.movemotorcycles.co.uk/api` (production).
Create booking: `POST /shipment/create`.
Authentication: `Authorization: Bearer <server-side token>`.
Content type: multipart form data.
Logxa documentation provides a successful response example `{"status":"success","data":101}` where `data` is a shipment ID, not the customer-visible tracking number. **Never assume booking success without a valid positive shipment ID; check status on uncertainty.**

Verified documented field names:
- Sender: `sender_name`, `sender_phone`, `sender_email`, `sender_street_address`, `sender_city`, `sender_state`, `sender_country`, `sender_code`, optional coordinates.
- Receiver: `receiver_name`, `receiver_phone`, `receiver_email`, `receiver_street_address`, `receiver_city`, `receiver_state`, `receiver_country`, `receiver_code`, optional coordinates.
- Motorcycle product: `pname[]`, `pweight[]`, `pprice[]`, `pquantity[]`, `ptotal[]`.
- Service and extra fields: `timeslot`, `instructions`, `cod_amount`, `payer`, `charges`, `custom_field[id]`.
- Tenant-specific field IDs from Logxa documentation: make `custom_field[11548]`; model `custom_field[11549]`; registration or VIN `custom_field[11550]`; notes `custom_field[11557]`; **Price Agreed with Move** `custom_field[11556]`; contact at dealership `custom_field[13046]`; What3Words collection `custom_field[11969]`; delivery `custom_field[11970]`.

**Important:** `custom_field[11556]` is not proof that Logxa stored a charge in its Shipping Charges ledger.

### Safe, illustrative request — INCOMPLETE / DO NOT SEND LIVE
The following documents fields whose encoding is confirmed. It deliberately omits `payer` and `charges` until Logxa confirms their exact accepted format and readback.

```sh
curl --request POST 'https://app.movemotorcycles.co.uk/api/shipment/create' \
  --header 'Authorization: Bearer YOUR_SERVER_SIDE_CUSTOMER_API_TOKEN' \
  --form 'sender_name=Example Selling Dealer Ltd' \
  --form 'sender_email=seller@example.invalid' \
  --form 'sender_phone=07000000001' \
  --form 'sender_street_address=1 Example Road' \
  --form 'sender_city=Oxford' \
  --form 'sender_country=United Kingdom' \
  --form 'sender_code=OX1 1AA' \
  --form 'receiver_name=Example Buying Dealer Ltd' \
  --form 'receiver_email=buyer@example.invalid' \
  --form 'receiver_phone=07000000002' \
  --form 'receiver_street_address=2 Example Road' \
  --form 'receiver_city=Reading' \
  --form 'receiver_country=United Kingdom' \
  --form 'receiver_code=RG1 1AA' \
  --form 'pname[]=Honda Forza 125' \
  --form 'pquantity[]=1' \
  --form 'custom_field[11548]=Honda' \
  --form 'custom_field[11549]=Forza 125' \
  --form 'custom_field[11550]=EXAMPLEVIN' \
  --form 'instructions=ILLUSTRATION ONLY — DO NOT CREATE SHIPMENT'
```
This is a **field-mapping illustration only**, not a runnable acceptance test.

## Verified customer-account APIs and safe matching

Official Logxa documentation supplied:

- `GET /admin/customers?email=<urlencoded email>` (admin bearer authentication) searches existing **customer-role** users. Optional query keys: `name`, `email`, `phone`; at least one is required. Response: `{"status":"success","customers":[{"id":5821,"firstname":"John","lastname":"Smith","email":"john@example.com","phone":"07700900123"}]}`.
- Lookup uses **partial matching**; an exact match must be established by normalising and comparing the returned email to the requested email (case-insensitive), and resolving any conflicting or multiple matches without guessing.
- `POST /account/create` accepts JSON with required `title`, `firstname`, `lastname`, `phone`, unique `email`, `password`, `password_confirmation`, optional `country_code` and address. On success returns `user_id` and sends a 6-digit OTP to the new customer's email.
- `POST /account/otp/verify` accepts JSON `{"user_id":5821,"otp":123456}`. The OTP belongs to that user, so only the recipient can complete verification. Do not ask Motobidder to store, read, or forward OTPs.
- New account generation must use independent high-entropy passwords on the trusted Move integration server; never distribute or persist plaintext passwords, and confirm a supported password-setup/reset mechanism before enabling customer access.
- Lookups should be made **separately for buyer and seller**. A known existing user ID can be used where the Logxa API specifically supports a `customer_id`; currently `POST /admin/shipments` documents one such customer field. The normal `POST /shipment/create` customer authentication and two-party account visibility still need verified permissions and a linkage mechanism.
- When one party is already an existing Move customer and the other is new, only create the new one. If both are existing, create neither. If the same verified person is on both sides, do not create duplicate accounts.
- Never send Logxa admin bearer tokens to Motobidder or place them in a browser request.

## Verified shipment retrieval and reconciliation

Logxa documents `GET /shipment/:type/:id` (customer API, bearer authentication) with two permitted lookup modes: `id` for the internal shipment ID and `tracking` for the public tracking number.

Official illustrative response:
```json
{"status":"success","data":{"shipment":{"id":101,"tracking_no":"TRK101","status":"In Transit","products":[],"charges":[],"statuses":[],"comments":[]}}}
```
The values `101` and `TRK101` are documentation examples, **not** actual AnyBike shipments.

After a successful create, read back `/shipment/id/{returned_id}` and verify shipment ID, tracking number, products, payment information and contacts wherever returned. If submission outcome is uncertain, perform a read-only check of the known existing shipment before any retry. For known Test 2 (tracking 115978), `GET /shipment/tracking/115978` is the documented read-only lookup route; verify the returned shipment ID and tracking match before reconciling the local record.

A `charges:[]` response does not establish an actual freight charge. The response example does not document payer, sender email or receiver email fields, so whether those are stored and returned must be verified separately rather than inferred.

## Customer login and shipment-list access (documented)

- `POST /account/login` authenticates an **activated** customer with email and password, returning `access_token` and `expires_at`. Tokens carry role scope, must be kept private, and must never be shared between the buyer and seller.
- `GET /shipments` with the logged-in customer's bearer token returns shipments **belonging to that authenticated customer**, newest first. Documented fields include `id`, `tracking_no`, `reference_no`, `receiver_name`, `status`, `is_paid`, and `expected_delivery`.
- Sample: `{"shipments":[{"id":101,"tracking_no":"TRK101","reference_no":"REF55","receiver_name":"Sara Khan","status":"In Transit","is_paid":0,"expected_delivery":"2026-06-10"}]}`. These are sample values, not test results.
- **Not yet established:** whether Logxa can associate the same shipment with two customer IDs. Its documented admin create endpoint exposes one `customer_id`, and customer shipment listing is scoped to the authenticated account. Do not claim both dealerships automatically see the shipment. Instead use a verified, permission-limited tracking link or notifications for the non-owning party unless Logxa confirms dual association.
- Do not return the authenticated buyer's `GET /shipments` results to the seller, or vice versa.

## Separate Logxa Admin API
`POST /admin/shipments` (JSON) documents `customer_id`, `reference_no`, sender/receiver address fields, `custom_data`, and required `status`. The supplied admin endpoint documentation **does not list sender_email, receiver_email, payer or charges**. Do not switch to the admin endpoint without confirming full field support and restricted permissions.

## Required external Motobidder booking contract (PROPOSED, not yet deployed)
Motobidder should send a unique immutable auction sale ID and unique transport booking ID, VIN/registration, make/model, seller dealership and collection contact/email/phone/address, buyer dealership and delivery contact/email/phone/address, ready date, agreed freight amount, currency, VAT classification, payer selected as sender or receiver, and optional notes.

The integration should:
1. Authenticate and authorise Motobidder with a **dedicated server credential**.
2. Validate required data **before** calling Logxa. Reject missing/unknown payer, absent or unapproved freight amount, or incomplete addresses with helpful errors.
3. Apply a persistent idempotency key scoped to Motobidder and its transport booking ID. Retrying the same request must return the existing booking rather than create another shipment. Reject payload conflicts under the same ID.
4. Match buyer and seller dealership accounts by verified identifiers, prioritising a known Logxa customer ID, then verified organisation/email; do not blindly merge based on an unverified name.
5. Link both dealerships to the shipment in the integration's customer/party mapping; the single Logxa `customer_id` on the Admin API alone does not establish two account associations.
6. For new dealerships, create accounts only through a verified supported customer-creation API, with **secure activation links**, never emailed passwords. Confirm customer permissions before providing shipment visibility. Existing customers continue with their current credentials.
7. Create the Logxa shipment only once, with buyer/seller contacts, agreed price and payer. Confirm via a trusted shipment read-back; a generic 200 response or populated notes alone is insufficient.
8. Return an internal shipment ID, public tracking reference when available, state and appropriate error information. Do not leak credentials or other dealers' data.
9. Notify buyer and seller about their respective collection/delivery arrangements; separate transactional notifications from optional marketing consent.
10. Log booking source as Motobidder; report new dealer accounts separately from repeat account usage and measure repeat jobs.

## Confirmed Motobidder operating procedure and commercial schedule (owner approved 20 November 2026)

This section preserves the owner's operational meaning. **Do not replace the existing Move staff workflow or build a second SMS system.**

1. Motobidder books transport in the **buyer's / receiving dealer's Move account** when the auction sale completes. Both buying and selling dealerships must be matched to existing Move customer accounts or onboarded for possible future business. The seller must **not** see the buyer's shipment or buyer's confidential information.
2. Every booking needs motorcycle details, full collection and delivery details, valid **mobile numbers at both ends**, and the **motorcycle ready date**.
3. Move receives the job in **Pickup Request**, then staff change status to **Booking Received**. Move sends its existing **Quick Send** texts to buyer and seller; no new notification platform is required.
4. Move sends the seller a text with the collecting driver's mobile number the day before collection. On the day, the driver calls with an ETA; if unanswered, the driver still attends the dealership.
5. **Payment for the motorcycle itself** is made directly between buying and selling dealerships while the Move driver is at collection. The seller speaks to the buyer; the buyer may call or WhatsApp the driver and ask for photos. The driver must **not load the motorcycle until the seller confirms payment has been received**. This motorcycle payment is completely separate from the transport invoice.
6. Once payment is confirmed, driver loads the motorcycle, uploads collection pictures to the **buyer's shipment**, and marks it **Collected**. Move Quick Send sends the buyer a collection notification and can refer them to `https://www.movemotorcycles.co.uk/delivery-tracking`.
7. Before delivery, Move sends the receiver a Quick Send text with the scheduled day, driver's name and mobile. On the day the driver calls the receiving dealership with an ETA, and still attends if there is no answer.
8. Driver marks the motorcycle **Delivered**, uploads delivery pictures to the buyer's Move shipment, and Move Quick Send sends the selling dealership a completion message.
9. **Transport invoicing:** Move invoices whichever party Motobidder selected as `payer` **at booking time** — sender or receiver. This is separate from the motorcycle purchase payment. A seller payer does **not** acquire access to the buyer's shipment.

### Agreed transport tariff — ALL PRICES INCLUDE VAT

| Area / distance band as described by owner | Rate inc VAT |
| --- | ---: |
| Standard UK mainland | £199 |
| Glasgow and Edinburgh | £299 |
| Above Glasgow and Edinburgh | £349 |
| Above Inverness | £389 |

All islands are **excluded** from Move coverage; the integration must not accept a route including any excluded island. The owner's long-distance example **Truro to Wick** is covered by the £389 band. Exact postcode boundary logic for Glasgow/Edinburgh, 'above', and Inverness still needs a verified postcode-to-zone table before automated pricing; do not guess from postcode text or straight-line distance.

### Service-level commitment
**Collect AND deliver within seven working days of the motorcycle ready date**, not within seven working days of the booking date. Confirm ready date on every booking and apply standard UK working-day and holiday handling consistently. Do not claim an automatically scheduled collection/delivery date solely from this service target.

### Existing notifications
Move staff use the **existing Quick Send text-message functionality** at the stated operational stages. No duplicate SMS system should be built in AnyBike or Motobidder.

### Account access boundary
Buyer is the shipment account holder; seller receives collection and completion communications and may independently use their own Move account for **future** bookings. Seller must never see buyer's shipment, photos, payment details or history merely because they were the sender.

## Known test results (DO NOT RETRY)
- AnyBike customer account 13882; Honda Forza 125 (HON125R), test £180 receiver-pays intent.
- Test 1: Move tracking `115977`, internal shipment ID `3457777`, confirmed. API readback gave `payer:null` and `charges:[]`.
- Test 2: Move portal visibly shows tracking `115978`; AnyBike guard row is `review_required`, `external_shipment_id:null`. The second shipment needs **read-only reconciliation**, NOT re-submission.
- Test 2 screenshot confirms missing sender email, receiver email, payer, and Shipping Charges. `Price Agreed with Move` is a separate custom field.
- The existing test function lacks sender/receiver email fields in its form payload. It attempted two unverified encodings of `charges`: JSON string and indexed form keys. Neither is confirmed successful.
- The AnyBike test UI now locks live repeat submissions; follow-up reconciliation and a verified payment mapping are still outstanding.

## Release blockers — do not send final API pack until cleared
1. **Logxa confirmation:** exact multipart encoding and permitted values of `payer` and `charges`, VAT/currency semantics, and how to read back or update existing shipment charges.
2. **Account onboarding:** documented endpoints/permissions for lookup, creation, activation and buyer-only shipment access and separate seller account onboarding. Confirm how email activation and customer-controlled password reset work securely.
3. **Reconcile Test 2:** use tracking 115978 to establish its internal shipment ID without creating another shipment, then compare shipping-charge fields with the portal.
4. **Actual end-to-end test:** verify sender/receiver emails, addresses, VIN/registration, payer, freight amount, customer access and notifications in the Move portal, using authorised test data and no unapproved chargeable shipment.
5. **Commercial documents:** owner's rates, VAT inclusion, island exclusions, ready-date SLA and payer choice are confirmed above. Remaining: exact machine-readable postcode bands, claims/escalation terms and rate validity before external release.
6. **Access controls:** dedicated Motobidder API credential; prevent a customer API key or unrestricted admin credential from being embedded in Motobidder's website/client JavaScript.
7. **Deployment:** build and verify Motobidder-facing integration endpoint; this file is documentation only. No endpoint is claimed live.

## Status language
**Documented:** upstream field names and official request examples supplied by Logxa.
**Observed:** existing AnyBike test bookings and missing data.
**Proposed:** Motobidder-facing contract, account onboarding, idempotency, reporting.
**Unverified:** freight/payer wire format, new-account provisioning and activation end-to-end, postcode-zone boundary encoding and remaining legal/commercial SLA details.
