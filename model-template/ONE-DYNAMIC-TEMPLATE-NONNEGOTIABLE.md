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
