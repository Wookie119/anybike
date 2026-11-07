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

## Universal visibility and stock rule — confirmed 7 November 2026
- **One page composition for every manufacturer/model and every audience.** Research, model-year and edition galleries, specifications, photographs, colours, heritage, country links, sourcing, and selling information must not be rearranged or hidden according to UK/international geography, sign-in state, or dealer/private-user role.
- For international visitors, display **published stock matching the exact model identity** above the research; offer it to guests and signed-in visitors equally. Permitted factory trim variants are allowed; distinct models (including GS Adventure) must never be substituted.
- For UK visitors, preserve the same complete research page. The protected international stock endpoint continues to enforce the current geographical stock restrictions. A 403, timeout, zero stock or sign-in failure must never hide research or collapse the approved model-year gallery.
- All live model pages must use the same renderer and shared CSS design tokens. Avoid country/account-conditionals in markup, parallel UK/international gallery copies, or static per-model template forks.
- Until the shared template passes automated checks across model identities, viewport sizes, authentication states and stock responses, **do not replace approved live model pages or roll out additional models**.
- Separate publication permission from content completeness. A database model row does not by itself authorise public rendering or indexing.

## User-approved R 1300 GS section-order refinement — 7 November 2026
- The **R 1300 GS — model years and editions** gallery belongs with **development and ownership**, immediately before database-rendered research such as **BMW stories and comparisons**.
- **Development and ownership is one standalone red-bordered section**, not nested inside the **motorcycles available internationally** stock border. No second copy of the same research cards may remain inside stock.
- Stock and development are independent: sale-feed access, loading, and zero listings cannot hide the year/edition gallery or move research.
- Keep the approved edition photographs, credits, styling, existing technical content, and all-country/all-account visibility while making this ordering consistent in the universal renderer.
- The 2 November locked snapshot remains immutable historical reference; this explicitly approved section-order change is an amendment, **not** permission to redesign any other section.
