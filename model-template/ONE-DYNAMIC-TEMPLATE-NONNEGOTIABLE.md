# AnyBike: ONE dynamic motorcycle model template — binding development rule

Owner direction confirmed 15 November 2026. This is the single plan for the model-page rollout. Do not reinterpret or expand the scope without explicit owner approval.

## Non-negotiable architecture

1. ONE Supabase database is the authoritative source of manufacturer/model identity, approved research, model-year data, media permissions and publication state.
2. ONE shared dynamic renderer uses the owner-approved BMW R 1300 GS V2 master design across ALL motorcycle models and manufacturers, for all visitor roles. Preserve the approved BMW/Harley quality, mobile pill spacing, dark/charcoal/white with AnyBike red, and the 20-section layout. No second design, per-brand variant or hardcoded model-page content.
3. ONE canonical 20-section publication contract. Every content-bearing area of the master must dynamically render the right model's approved information, not merely create invisible 20-slot placeholders. Hide empty/unapproved sections without hiding the shared structure or inventing data.
4. Exact model identity isolation on every data source; approved source-backed facts, year/market distinctions, permitted photography, exact-model stock and UK/international/role access controls. Never publish pending_review/draft records, unlicensed media or restricted stock.
5. Unique index,follow SEO-friendly model URLs, correct metadata/canonicals and manufacturer links. Preserve existing content and functionality.

## Work order — do not get sidetracked

A. Audit the shared renderer and map **every** approved master section to an RLS-approved Supabase source and a visible component. Identify and close gaps centrally, not model by model.
B. Complete one shared data-loading/publication-to-render pipeline, including empty, approved-only, verified-only and combined research states; keep every model's data separate.
C. Run automated regression checks and actual desktop/mobile browser checks on a representative cross-brand sample; preserve the protected BMW R 1300 GS and Harley designs. Fix shared defects in shared code.
D. Roll out the verified single renderer across every clean published model identity. Report actual coverage and remaining blockers, distinguishing GitHub commit from live 123-reg deployment.

**Do not** divert to individual model edits, cosmetic tweaks, wording changes, new research campaigns, unrelated site features, alternate templates or repeated user check requests. Only make an exception for a blocking security/data-leak or shared production regression. Work in substantial tested batches. GitHub commits deploy automatically; never manually upload to 123-reg.

Before each development batch and hourly automated run, read this directive and the approved design checkpoint. Every update must state what was implemented, what was tested, what remains incomplete and whether live deployment was verified. Do not claim all 20 sections are dynamic until proven.

## Legacy template retirement rule — 15 November 2026

The sole authoritative model-page HTML is `motorcycle-v2-master.html`; the sole model-page runtime is `model-template/approved-v2-universal-preview.mjs` with its shared navigation, styling, and 20-section data contract. The 979 permanent `models/<make>/<model>.html` URLs are generated SEO entry points, NOT independently edited templates. Their `<main>` and inline `<style>` must match the master exactly; the bulk synchroniser and regression test enforce this.

Do not edit model-specific HTML or create a manufacturer-specific renderer. Any necessary fix must be made to the shared master, renderer, or Supabase publication pipeline, then synchronised across all routes.

Before deleting any legacy page, guide, renderer, or stylesheet: search every HTML/JS import, internal link, redirect, sitemap, and indexed public URL; migrate dependencies to the approved shared renderer while retaining working public URLs; verify SEO redirects and live deployment; only then remove unreferenced implementation files. Do not remove BMW or Harley editorial content or break existing inbound links.


## ABSOLUTE OWNER RULE — 16 November 2026: never edit an individual motorcycle model page

**No assistant, scheduled agent or developer may patch, hand-edit, redesign, hotfix or independently generate a single `models/<make>/<model>.html` page. This includes apparently harmless one-line fixes for individual motorcycles.**

1. All 979 permanent model URLs are centrally generated SEO entry points, **never independent templates**. Their permitted differences are limited to centrally generated model identity, canonical metadata and other model-specific SEO fields.
2. Design changes happen **only** in `motorcycle-v2-master.html`, `model-template/approved-v2-universal-preview.mjs`, the shared stylesheet/navigation and the central section contract. Research, specifications, photography and model history come from the correctly matched, authorised Supabase database records.
3. Future section additions or removals update the **one central section contract and publication pipeline**, followed by the shared renderer. Every published model route must inherit those changes automatically; never make 979 manual edits.
4. The only permitted operation that writes model route HTML is the **central reviewed bulk synchroniser** running consistently against all routes with preservation of unique identity and SEO metadata. It must never be used as a pretext to edit one motorcycle template.
5. Before rollout, run `node scripts/check-universal-v2-rollout.mjs` and relevant contract tests. The existing rollout test compares every published model route's `<main>` and inline `<style>` with the shared master and checks the shared renderer and route identities. Never weaken or bypass the tests. CI should fail on drift.
6. If one bike appears incorrect, check its authorised Supabase facts/media, shared renderer, styling, cache and deployment. **Never alter that motorcycle's HTML**. Preserve BMW and Harley-Davidson quality, all old research and public URL compatibility.
7. GitHub commits, CI results and live 123-reg deployment are separate evidence; never report a live change without checking it.

**No exceptions to individual template editing without the owner's explicit approval.**
