# AnyBike Advertising Creative & Placement Rules
**Approved 22 November 2026 — applies to all newly created AnyBike adverts, every format and country.**

## Mandatory visual finish
- Every advert is **one standalone creative**, made to its named placement's exact aspect ratio (square 1:1, Available Stock 4:3, landscape, portrait or slim as required). Never combine several advertisers into a single image.
- Advert artwork **fills its own placement edge-to-edge** without letterboxing, empty/white bands, visible white hairlines, square corners, raw crop edges, unintentional borders or distracting outlines.
- **Consistent rounded corners (14px at typical card size, responsive as appropriate)** are applied by the placement's clipping container. No added red pinstripe around third-party advertisements; preserve each advertiser's visual identity.
- Do not stretch artwork or use extreme CSS zoom to make the wrong aspect ratio fit. Design/export a new correctly proportioned creative instead. Critical logos, text and CTAs must remain legible within a safe inset.
- Avoid baked-in disclosure text or redundant borders. Show **one clear 'Advertisement' disclosure** beneath the card using shared UI. Affiliate and paid links must have `rel="sponsored"` as well as suitable security attributes.
- Export clean artwork with no embedded edges. Validate at desktop/mobile sizes and zoom levels; visually inspect before publishing.

## Mandatory platform behaviour
- **Separate card, separate image URL, separate destination URL, separate campaign, separate named placement and separate click/impression accounting** for each advertiser. Advert groups may share a responsive grid but must never be merged into one clickable composite.
- All published campaigns and placements controlled by AnyBike's **one Supabase Advertising Mega System**. Do not insert manual advertiser HTML into content pages.
- Placement state, advertiser targeting, destination links, dates, country and approval must be checked before display.
- Existing approved ads should not be redesigned automatically when this standard is adopted, but correct visual defects when flagged.

## Dealer stock connection: three independent ads
- `AB-DEALER-FEED-S01` — **DealerWebs**, destination `https://www.dealerwebs.com/motorcycle`.
- `AB-DEALER-FEED-S02` — **ABR Festival**, destination `https://www.abrfestival.com/`.
- `AB-DEALER-FEED-S03` — **Motorcycle Live**, destination `https://www.motorcyclelive.co.uk/`.

These are three distinct ad records with distinct independent links, not one combined creative. Each shows one shared text disclosure underneath. ABR and Motorcycle Live event artwork should be checked against the official event dates prior to promotion.
