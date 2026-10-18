# Protected baseline — AnyBike Message Centre (18 October 2026)

**Verified by live UK-dealer testing.** Preserve these working behaviours during Dealer Welcome and other future development.

- Ordinary customer Message Centre links open quickly. The shared `public-header.js` versions links to `/customer-messages.html` to avoid previously observed stale cached HTML. Do not remove this without measuring normal navigation (not just `?debug_load=1`).
- A UK dealer sees the dedicated My Dealership dashboard; customer Messages returns there.
- The dealer Messages navigation badge and the shared bell show waiting messages.
- When two bell alerts exist, opening **one** marks only that notification read: 2 → 1. Opening its conversation must not mark all alerts linked to the same thread read. Two alerts can point to the same thread.
- Do not bulk-clear `customer_notifications` on page load, conversation opening, or refresh.
- Keep the customer Message Centre two-panel desktop inbox and responsive mobile layout.
- Preserve customer-specific database filtering and access permissions.
- Preserve welcome-email and automatic message delivery safety switches: they remain OFF pending explicit authorisation and testing.
- Do not send dealer test emails or messages without approval.

## Before modifying messaging files
Run `node scripts/check-messaging-regressions.cjs`. After deployment, verify ordinary navigation from My Dealership, bell 2 → 1 → 0, the dealer Messages badge, one working thread and reply, and no change to customer permissions. Static tests cannot replace that live validation.

Known-good fixes include `478b218` (versioned links), `9187ae3` and `2949662` (notification links/read behaviour), and `6c18f5a` (prevent bulk-clear).

**Do not enable automatic welcome emails as part of a styling, caching or Message Centre change.**
