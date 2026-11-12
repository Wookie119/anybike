# BMW model identity review — 12 November 2026

Purpose: reconcile factory-confirmed model identities with AnyBike's pending name-review queue before allowing independent indexing. This is an evidence review, not an approval or a change to the locked R 1300 GS model design.

## Confirmed factory model identities

- **F 900 GS Adventure** (catalogue model ID 37): BMW Motorrad's official model and connectivity references list the F 900 GS Adventure separately from F 900 GS. Source: https://www.global.bmw-motorrad.com/en/reach/reach-en.html and https://support.bmw-motorrad.com/s/article/BMW-Motorrad-Connectivity-TFT-Display-connectivity-availability-sYeyM . The existing `relationship_review` should be resolved before publication; avoid inheriting standard GS specs.
- **F 450 GS** (ID 42; existing feed label `F450 GS`): BMW's official model range uses the spaced name **F 450 GS**. Source: https://www.bmw-motorrad.com/en/products/models.html . Preserve original feed label as an alias if correcting the canonical model name.
- **R 12** (ID 60): BMW lists the modern R 12 as a standalone Heritage model. Distinguish it by year/generation from the historical 1935 R 12. Source: https://www.global.bmw-motorrad.com/en/reach/reach-en.html and https://support.bmw-motorrad.com/s/article/BMW-Motorrad-Connectivity-TFT-Display-connectivity-availability-sYeyM .
- **R 12 S** (ID 62): BMW separately lists the R 12 S. Its technical-document listing groups it with R 12 nineT, not with the cruiser R 12. Source: https://www.global.bmw-motorrad.com/en/reach/reach-en.html . Do not assign R 12 cruiser specifications.
  
## Keep unapproved until more detailed identity/relationship checks

- **K 1600** (ID 45): umbrella family name; factory materials distinguish GT, GTL, B and Grand America.
- **M 1000 XR Full** (ID 57) and **M 1000 XR M** (ID 58): confirm package versus standalone engineering model.
- **S 1000 RR M** (ID 91): verify whether suffix describes an M package rather than a distinct model.
- **CE 02 AM 7.9% APR Representative** (ID 25) and **K 1600 B GRAND AMERICA** (ID 47): already recorded as aliases; never index the advertising-text or duplicate labels.

## Publication rules

1. The public catalogue view `motorcycle_catalog_dropdown_clean` excludes model aliases and pending reviews. Do not bypass it by adding raw database rows to the sitemap.
2. Before approving an individual record, confirm model identity, canonical make/model, year/generation, and relationship to its parent; update review status and canonical identity together, then refresh the published identity snapshot and sitemap in one checked release.
3. Do not copy technical specifications from parent models or introduce an alternate page template.
4. Retain all original dealer feed labels for matching stock; canonical SEO names should be distinct.

## Permanent non-destructive history policy (owner confirmed)

- Never delete or merge raw motorcycle records solely because the make and model strings match. Discontinued models may be reintroduced after long gaps, with different engines, frames, homologation and production years.
- A canonical public model name is **not** a unique historical generation identifier. Preserve original source model names and identifiers. Distinguish generations by documented production period, factory model code, platform, market and source evidence when available.
- Aliases are reversible navigation mappings only; do not delete their source rows, stock references or associated historical evidence.
- A pending review is not a rejection of the motorcycle's existence. Preserve every pending row until research resolves its identity and relationship.
- For BMW R 12, retain the historical and modern name histories separately; never apply modern specifications to the pre-war motorcycle or vice versa.
- If a future catalogue imports a second generation with the same name, flag for human review instead of deduplicating or overwriting either record.
- Do not assume a missing end year means current production. An unknown production end date is not evidence of continuous production.
