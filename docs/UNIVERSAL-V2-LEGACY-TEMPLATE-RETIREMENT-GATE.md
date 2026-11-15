# Universal V2 legacy-template retirement gate

Status: **RETIREMENT PENDING VERIFICATION** (15 November 2026).

The published route manifest `data/universal-v2-model-routes.json` declares 978 distinct model URLs. The shared approved design is `motorcycle-v2-master.html` and the shared renderer is `model-template/approved-v2-universal-preview.mjs`.

## Mandatory checks before any archive/removal
1. Run `node scripts/check-universal-v2-rollout.mjs` against the complete repository and resolve every failure; confirm 978 route pages, shared master HTML/CSS, and one renderer. A manifest count alone is insufficient.
2. Verify representative live pages across brands and model types on desktop and mobile, including BMW and Harley-Davidson; confirm Supabase data, all approved sections, category pills, images and navigation.
3. Inventory all legacy HTML, CSS and JS template candidates; search all runtime imports, script tags, internal links, redirects, sitemap references and admin links before deciding any file is unused.
4. **Never archive** the canonical master, shared renderer, live route files, or legacy routes still required for backwards compatibility, SEO, redirects, or business features. Preserve existing BMW/Harley content.
5. Only after checks pass, move truly unused template sources to a non-public archive (e.g. `archive/legacy-model-templates/`), recording original paths and purpose. Avoid moving public URLs without redirects.
6. Extend regression guards to reject new references to retired template sources and new alternative per-model layout implementations. Keep the archive out of site navigation and sitemap.
7. Distinguish successful GitHub commits from verified 123-reg deployment. Never manually upload to 123-reg.

**Do not execute mass deletion or moves until the complete audit is green.**
