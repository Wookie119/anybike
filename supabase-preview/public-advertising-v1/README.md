# Listing advertising — staged release

Do not deploy this copy automatically or merge the preview branch until release checks are complete. Production selection and event actions must remain compatible.

## Current scope
- UK Trade Auction: three independent slots (AB-UK-TRADE-LISTING-GALLERY, -DESCRIPTION, -BOTTOM).
- Each slot requires a published single slim creative, approved active UK house transport campaign, matching targeting, valid desktop/mobile artwork, and enabled existing page inventory.
- Available Stock individual listing slots remain collapsed. Retail selection is explicitly disabled on the server.
- Admin can select eligible artwork, preview desktop/mobile and save drafts; publishing new listing assignments is intentionally disabled. No automatic assignments or test promotions.
- Existing stock grid advertising and all other public placements are outside this release.

## Verified
- 26 offline listing master checks and 14 simulated advertising behaviour checks.
- 21 read-only seller declaration database checks.
- Existing UK Trade inventory enabled; no published listing assignments found during the 24 November 2026 read-only database check.

## Release sequence
1. Compare the staged service against the actual deployed service to avoid regressing existing actions.
2. Run both offline suites: `node tests/listing-master-regression.cjs` and `node tests/listing-advertising-behaviour.cjs`.
3. Test in an isolated browser preview with mocked or isolated service, including desktop/mobile sizing, opening and closing listings, actual gallery/description/bidding order, seller and admin review, and signed impression/click behavior. No production tracking events from preview.
4. Verify real admin permissions, draft persistence, duplicate exclusion across slots, disabled/expired campaigns, targeting and service failure. Confirm seller details and confidential bids never enter advertising requests.
5. Test deployment compatibility and rollback procedure. Release seller and auction template changes with empty advertising slots first if appropriate; keep listing publication disabled until the advertising integration is verified.
6. Only after the above checks, enable the intended trade-only publication workflow. Retail remains a separate release.

No manual upload to hosting. GitHub is the deployment source.
