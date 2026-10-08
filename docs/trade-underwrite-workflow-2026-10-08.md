# AnyBike trade underwriting — agreed workflow checkpoint (8 October 2026)

STATUS: SPECIFICATION SAVED; NOT IMPLEMENTED END TO END. DO NOT REPRESENT AS LIVE.

Use existing pages only:
- admin-seller-underwrites.html (intake and review)
- admin-trade-underwrites.html (trade bids, reserve, seller purchase, buyer selection)
- Deal 360 / admin-enquiries.html (purchase agreement, supplier deposit, finance, customer payments, Move collection/delivery)
- dealer-underwrite.html / existing dealer workspace (dealer intake and onsite confirmation)
- admin-dashboard.html (work items)

## Agreed business rules
1. Dealer submits PX / motorcycle, suggested price, onsite status (onsite; expected PX; still with customer), expected arrival, and 'collected and paid for by' requested date. These are *different* dates and the requested completion deadline is not a guaranteed service promise.
2. AnyBike reviews photos, condition and seller details and publishes a buyer-safe opportunity to eligible verified UK trade dealers. Do NOT expose seller identity, dealer asking price, finance details or other dealers' offers.
3. Bidding starts OPEN with no automatic countdown. Admin holds an internal reserve that reflects dealer buy-in plus AnyBike required margin/costs. On a qualifying offer reaching that reserve, start a chosen countdown automatically. Admin can start the countdown manually *before* reserve is met. Countdown duration controlled by admin. Five-minute soft-close for qualifying new/increased bids in final five minutes (cap to be confirmed).
4. If one or more credible bids make buying profitable, AnyBike can agree to BUY/SECURE the motorcycle from submitting dealer before bidding ends or buyer selected. Record seller agreement and (optional) supplier deposit / purchase obligations via existing Deal 360, distinctly from selling to end buyer. This must not automatically close bidding or select a buyer. Only commit when bike availability, ownership/finance, price, condition and margin reviewed. If PX not yet onsite, contract/hold must describe conditional arrival/availability, never falsely mark bike physically onsite.
5. Bidding continues while AnyBike considers it useful, including after securing bike. Admin controls closing and can amend/restart bidding according to published rules; countdown expiry prompts a decision rather than auto-awarding.
6. After bidding closes, Admin can select UP TO THREE conditional trade buyers. Send explicit first-cleared-full-payment invitation terms; never tell three people they exclusively won. First buyer whose full cleared receipt is verified in Deal 360 receives sole allocation. Immediately prevent further payments / revoke other invitations and handle any simultaneous/late receipts for refund; transaction and allocation need server-side atomicity and financial audit log.
7. Dealer 'Motorcycle Now Onsite' button updates intake and informs buying team; 'No Longer Available' cancels. Onsite is NOT automatically HPI-clear.
8. Move collects and delivers according to agreed arrangements, and vendor collection/payment deadline is tracked separately from bidder countdown.
9. 'Your Next Action' stays visible on current workspaces and Dashboard; no new admin pages, avoid duplicate admin menu links.
10. Preserve all existing test deals and payment controls. Do NOT activate buyer invitations before confidentiality/security checks.

## Currently implemented / NOT implemented
- Dealer form captures position, expected arrival, requested collection/payment deadline in notes (not first-class DB fields).
- Seller/Underwrite queue has timed invitation with p_duration_hours; this currently starts countdown immediately (needs redesign).
- Trade Underwrite Desk has existing single confirmed-buyer selection and final seller/HPI gate; 3-buyer first-paid allocation NOT implemented.
- Reserve-triggered timer, manual override, soft-close, seller-first Deal 360 purchase/deposit separate from buyer, onsite self-service, automatic buyer invitation revocation and server-atomic first-paid allocation are NOT implemented.
- Buyer-facing RPC privacy must be reviewed so seller/internal notes never leak.

## Recommended implementation order
1. Inspect existing RPCs/tables for bids, confirmations, deals, supplier finance and onboarding permissions.
2. Build DB-safe staged underwriting state and timer transitions; migrate existing live tests safely.
3. Extend current Trade Underwrite Desk (not another page); wire admin reserve + manual start, seller purchase, continued offers.
4. Connect secured supplier purchase to Deal 360 without assigning a buyer.
5. Add up-to-three conditional invitations and atomic first-cleared-payment assignment, test concurrency and refund exceptions.
6. Update dealer onsite status and the Dashboard action queue, then end-to-end test with test users before enabling production invites.
