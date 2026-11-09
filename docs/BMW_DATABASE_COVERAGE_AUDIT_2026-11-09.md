# BMW database coverage audit — 9 November 2026

Scope: production Supabase `tuehtnezhdnkqbbhttgp`, read-only checks. This is a catalogue research audit, **not** a live webpage audit or publication approval.

## Verified counts
- BMW catalogue models: **103**
- Manufacturer records in database: **50** (do not confuse this with the historically advertised 49).
- BMW fact rows: **146**; status `verified`: **77**.
- BMW model-year media association rows: **3** (not the number of available images across the website or approved photo bank).
- BMW relationship rows with BMW parent: **78** (not all necessarily approved or reciprocal).

## Per-model audit run
A read-only query grouped all 103 BMW records by their next research blocker:
- **81** have no fact jointly marked `verification_status='verified'` and represented in `motorcycle_catalog_fact_verification_audit`.
- **22** have at least one such audited fact, but **no** model-year media row simultaneously `verification_status='verified'` and `publication_enabled=true`.
- **0** reached the audit's `REVIEW_FOR_PUBLICATION` category. This is a narrow evidence gate, *not* proof that 0 BMW pages are live or have imagery.
- **0** were classified as missing a slug by this query.

These categories are mutually exclusive and prioritised: fact evidence first, image approvals second. A model in the 81 may *also* lack approved year images. Research records are not automatically published.

## Implementation constraints
1. Keep the existing approved BMW/Harley manufacturer and model visual templates unchanged.
2. Research categories are **not** alternative HTML page layouts. A single reusable renderer is the target.
3. Available stock must sit **above** research, match the **exact canonical motorcycle model identity**, and never mix BMW models in results.
4. Do not expose unreviewed facts, candidate relationships, missing-year placeholders or internal research evidence on public pages.
5. Generate manufacturer/model/country/AnyBike Global links from canonical database identities and approved route registry; only publish resolved routes.
6. Automated tests should cover visitor vs logged-in visibility, model-exact stock, research ordering, images, links and responsive layouts across the model set.
7. The audit only read database records; no live web changes, approvals, Supabase schema mutations or publication decisions were made.

## Next batch
- Reconcile verified facts with their audit rows across the 81 research-gap models.
- Review the 22 evidence-bearing model records for verified, publication-eligible year-specific media without treating existing approved static hero/gallery assets as absent.
- Check existing canonical and alias mappings before enabling cross-model stock feeds.
- Perform a complete automated model-route comparison before changing public templates.
