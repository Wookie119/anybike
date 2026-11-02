# AnyBike approved motorcycle model design — LOCKED 2 November 2026

Status: DESIGN LOCKED; content/data validation and launch approval are separate.

## Single source of truth
- Design reference: `design/model-template/approved-bmw-r1300gs-v2-2026-11-02.html`
- Working preview: `bmw-r1300gs-v2.html`
- Do not create alternative model-page designs or independently restyle manufacturer/model pages.
- Future model pages must render from ONE shared database-driven template, with model-specific facts, images and relevant sections loaded from Supabase. Do not fork the markup/CSS for each make/model.
- Design changes require explicit user approval. Content edits, verified photo updates and bug fixes must preserve this design.
- Do not roll out to other model pages until the user approves the completed master template.

## Frozen visual language
- Page background black; outer main sections charcoal grey with full corporate red border #ed1c24.
- Approved shared palette: --anybike-approved-panel #252525; --anybike-approved-panel-inner #303030; --anybike-approved-panel-raised #3a3a3a; --anybike-approved-panel-border #767676, as defined in public-header.css.
- Inner cards: lighter grey, thin neutral border, 3px corporate-red LEFT pinstripe only; no full red perimeter.
- White body text; clear readable hierarchy; no salmon/pink/burgundy, no red gradients.
- Photographs fill their 16:9 image region edge-to-edge, no inset. Crop with object-fit:cover; protect intrinsic subject against inappropriate cropping.
- Approved AnyBike placeholders fill the allocated photo region. Do not substitute unrelated photos or unlicensed images.
- Attribution/licensing links preserved for every third-party photo.
- Models/years/editions cards, engineering cards, equipment cards, colour cards, technical mini-cards and expanded panels all use the same inner-card visual treatment.
- Keep the compact red-outline navigation pills near the bottom, not prominent diversions near the introduction.
- Keep UK selling and international buyer flows distinct and obey permissions.
- No oversized whitespace, sliders, duplicated copy, unnecessary empty sections or ad-hoc per-model overrides.

## Guardrails
1. Before any model-page change, compare the modified output against the locked snapshot at desktop and mobile widths.
2. Accept only changes to content/data, verified images or corrections unless a design change has been expressly authorised.
3. When the database-driven renderer is implemented, use shared reusable classes/tokens, not copy/pasted CSS per model.
4. Verify working galleries, expandable sections, mobile styling and UK/international visibility before release.
5. Never overwrite this approved snapshot. If the design is explicitly re-approved later, create a new versioned snapshot.
