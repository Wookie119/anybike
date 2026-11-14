# AnyBike Universal V2 — approved visual checkpoint

**Approved by owner:** 14 November 2026 (UK)
**Status:** Visual layout APPROVED from owner-supplied screenshots. **Not** a claim that the complete 20-section database publisher or universal rollout is finished.
**Repository:** `Wookie119/anybike`, `main`.
**Canonical visual reference:** `/motorcycle-v2-master.html?make=BMW&model=R%201300%20GS`.
**Second shared route:** `/motorcycle-model-guide.html`.

## Design lock — preserve in subsequent development

- One shared model-page design; one Supabase-backed research and publication system for all manufacturers and models. No separate design per make, and do not disturb the existing approved BMW R 1300 GS production page.
- AnyBike palette: black, charcoal, white and red `#ed1c24`; charcoal panels with red pinstripes/accents; no burgundy, pink, sliders, white-background variants or cosmetic redesigns.
- Approved hero: BMW title and factory introduction top left, large licensed motorcycle image top right; two pill actions side by side where there is space; image attribution and licence visible.
- UK audience: international available-stock/access-restricted panel hidden when a UK visitor is confirmed. International audience keeps model-specific published stock and existing security/permissions. Do not interpret a missing country response as verified UK.
- Other brand models and manufacturer navigation retained. Full other-manufacturer directory expanded by default without internal operational notes.
- Documented specifications: model-year/market source retained with visible Engine, Power, Torque tiles. Do not invent or merge years/markets.
- Documented generations, model-years/editions and six development/ownership cards: retain compact matching-card design. Model-year timeline is a CLOSED compact disclosure with development/model years, not a prominent redundant standalone section.
- Approved licensed photo gallery with source credits; model/year and attribution preserved.
- Documented factory research: exactly the source-backed research categories available for each model, 3 equal-size cards per row on desktop, 2 on tablet, 1 on mobile; all initially collapsed; expand/collapse all; source links and full records remain in the document; heading/intro/controls compact (no oversized blank grid rows). BMW reference currently shows 15 categories — *not* a universal hardcoded limit. The universal framework has up to 20 approved sections, with no invented/empty content.
- Riding style: eight currently published and verified category routes displayed in a compact evenly-spaced pill grid. These eight links should be taken from approved model editorial/canonical route data, not assumed to represent all possible future classification types.
- Worldwide markets: approved 3-column charcoal region cards with red TOP edge, responsive 2/1 columns; preserved 217 market links and text that market links do not imply exact-model inventory.
- Global stories, ownership/history, enquiry remain. Buyer/source action and UK seller action in two visually matching 50/50 cards on desktop, stacked mobile; enquiry form kept accessible.
- Keep SEO-relevant genuine research, internal links, credits and verified sources. Avoid duplicate text and avoid unapproved/noindex/no-source placeholders.
- No further purely cosmetic changes without a specific owner request. Apply fixes at the shared renderer and shared stylesheet rather than adding make-specific markup.

## Current implementation pointers (GitHub blob SHA at checkpoint)

| File | GitHub blob SHA |
| --- | --- |
| `motorcycle-v2-master.html` | `41c590035c29b92b507e07c3501b2ed08635cf69` |
| `motorcycle-model-guide.html` | `d4d030cdfb650cbb6dcf5919b699f1da0a8af96c` |
| `model-template/approved-v2-preview-style.css` | `ee69a9acd2e437987ee493bba7e7c34ba6d7e409` |
| `model-template/approved-v2-universal-preview.mjs` | `971227f8fa9abe7fec3c59d517a3f0018671e132` |
| `model-template/approved-v2-dynamic-navigation.mjs` | `3b7bbcd48c03f321c2de687dfef87b95ce9e9a98` |
| `model-template/public-verified-model-facts.mjs` | `c99eb8ea1fd69beae7fb6e80a84ee984d7eaae2b` |

This file records the **visual approval** and reference blob IDs for audit. It is not a deployable version tag, not a rollback branch, and it does not publish unreviewed research.

## Next work — in order

1. **Finish the publishing pathway** from source-linked reviewed Supabase records into the existing approved 20-section universal structure. Inspect the published-vs-staged counts, exact model IDs, provenance, section placement and whether data is publicly released; never silently publish drafts or reveal seller/dealer-private information.
2. **Close the BMW R 1300 GS V2 master**: reconcile duplicate model-years/editions and research; check all approved sections, licence/attribution, exact-model stocks and internal links without changing the visual approval. Verify that genuinely reviewed records appear on the public page.
3. **Roll out the same renderer in controlled larger batches** across BMW and Harley, then other makes, preserving factory-specific content and photos; no independent model templates.
4. **Verify** UK guest/dealer/private and international guest/dealer/private, desktop/mobile, SEO canonical metadata and indexable source-backed copy. GitHub commit success and real live deployment are separate checks.
5. Keep automatic data refresh and publication safe; new reviewed records should appear under the correct model and approved sections without a manual page redesign.

**Do not** resume visual redesign or unrelated site tasks while this universal master remains unfinished.
