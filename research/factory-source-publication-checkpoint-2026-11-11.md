# AnyBike — factory research and publication checkpoint (11 November 2026)

This document continues the approved **one database, one research design system**
rollout. It does not replace the R 1300 GS design, create another template,
publish draft content, or alter customer stock/enquiry pathways.

## Verified SQL baseline

- Master catalogue: **979** models; clean public catalogue: **965** exact IDs.
- Catalogue facts: **194** rows, including **125** marked `verified`; **69**
  remain unverified or pending.
- **125** verified facts now have a database audit record with matching source
  URL, a checked timestamp and verification basis. This is an **audit-record
  matching result**; it does not replace editorial acceptance or prove all
  historic sources are still online.
- Universal model research: **1,265 draft sections on 277 models**; **zero**
  approved/published in universal model publication projection.
- Existing BMW/Harley editorial and imagery are independent of universal
  staging and must be retained.

## Corrections and evidence

### Honda Dream CB750 Four — exact domestic launch date

The Honda original Japan press release of 18 July 1969 gives domestic
**on-sale date 10 August 1969**, not the press release date. Fact 25 updated,
and the exact source incorporated into its audit record.

Original Honda announcement:
https://global.honda/jp/news/1969/2690728.html

### BMW R 1300 GS — colour source URL correction

Four factory-colour records (fact IDs 129–132) now point to the complete
BMW Group PressClub factory release URL, matching their audit records.
Original approved page, licensed hero and factory gallery remain untouched.

Source:
https://www.press.bmwgroup.com/global/article/detail/T0437059EN/the-new-bmw-r-1300-gs

### Honda, Mugen, Kawasaki and BMW record audits

Individual audit records were added for Honda Super Cub C100 and CB750 Four,
Mugen Shinden and ME125-W1, Kawasaki KX motocross history and BMW F 850 GS
Adventure. Preserve the source origin distinction: museum descriptions and
manufacturer press release reprints must not be relabelled direct factory
publications. Audit notes contain the specific corroborating links.

The remaining mismatched PressClub URLs were reconciled with original
regional/locale URL recorded in audit notes. Exact fact source remains
available to the customer when separately permitted.

## Common model-guide release safety

- Only exact manufacturer and model identity may enter verified rendering.
- Never convert a verified fact into a published universal editorial section
  without the existing review reference and approval gate.
- Keep real, authorised exact-model stock directly below the hero.
- Keep guest buyer enquiries and UK seller actions working.
- Show useful factory history, specifications and competition only if sourced.
- Render source links once per research group, not as raw technical data fields.
- Do not generate blank research cards or unsourced placeholder sections.
- Never substitute another motorcycle's picture, model year or specifications.

## Next large publication batches

1. Resolve the **69 unverified fact rows** in source groups, not one public
   page at a time.
2. Review 277 staged model research packets against the verified-facts audit,
   manufacturer source, year, country and photograph permissions.
3. Apply editorial approvals only with explicit review references and
   permission to publish; keep unapproved records private.
4. Expand source coverage across all manufacturers while preserving existing
   BMW/Harley editorial design and all market routes.
5. Validate every shared component with automated tests and targeted live
   display checks after deployment.

## Repeatable checks

Run `scripts/sql/check-verified-source-and-publication-safety-2026-11-11.sql`
and `scripts/sql/audit-all-model-coverage-2026-11-11.sql` against Supabase.
GitHub Actions `Universal catalogue integrity` also guards the shared
renderer, approved R 1300 GS, dedicated model stock and guide routes.
