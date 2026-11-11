# AnyBike — factory research and publication checkpoint (11 November 2026)

This document continues the approved **one database, one research design system**
rollout. It does not replace the R 1300 GS design, create another template,
publish draft content, or alter customer stock/enquiry pathways.

## Verified SQL baseline

- Master catalogue: **979** models; clean public catalogue: **965** exact IDs.
- Catalogue facts: **194** rows, including **125** marked `verified`; **69**
  remain unverified or pending.
- **135** verified facts now have a database audit record with matching source
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

1. Resolve the **59 unverified fact rows** in source groups, not one public
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

## Second source-verification batch — 11 November 2026

Ten existing fact records were cross-checked against factory press material,
individually audited in Supabase and changed from pending to verified:

- **2023 BMW R 1250 R** (facts 124–126): Ice Grey standard, Triple Black /
  Black Storm Metallic and Style Sport / Racing Blue Metallic. Original
  BMW Canada press kit:
  https://www.press.bmwgroup.com/canada/article/detail/T0405140EN/the-new-bmw-r-1250-r-roadster?language=en
- **2017-era BMW K 1600 GT** (facts 108,110,111): Blackstorm metallic,
  Lupine Blue metallic / Blackstorm metallic and Mars Red metallic. Factory
  launch source:
  https://www.press.bmwgroup.com/global/article/detail/T0263816EN/the-new-bmw-k-1600-gt?language=en
  Canada 2017 market launch corroboration:
  https://www.press.bmwgroup.com/canada/article/detail/T0264869EN/the-new-bmw-k-1600-gt
  BMW model year 2019 update records withdrawal of the Mars Red and Lupine
  Blue finish:
  https://www.press.bmwgroup.com/africa-dom-easteurope/article/detail/T0282746EN/bmw-motorrad-model-revision-measures-for-model-year-2019?language=en
- **BMW CE 02** (fact 92): label corrected to say **motor-cover finish**
  rather than whole-bike body colour. BMW factory 2023 launch:
  https://www.press.bmwgroup.com/global/article/detail/T0422302EN/the-new-bmw-ce-02?language=en
- **BMW R 18, model year 2022** (fact 134): Option 719 Galaxy Dust metallic /
  Titanium silver2 metallic from BMW model revision bulletin:
  https://www.press.bmwgroup.com/global/article/detail/T0336699EN/updates-for-bmw-r-18-and-r-18-classic?language=en
- **BMW R 1200 RT** (facts 145,146): Ostra Grey metallic matt and Polar
  metallic explicitly named in the 2009 factory press kit; no exact
  production year inferred:
  https://www.press.bmwgroup.com/global/article/detail/T0060833EN/the-new-bmw-r-1200-rt?language=en

Production database confirmed 194 facts: **135 verified with matching audit
records**, **59 pending**. None of these updates authorise universal editorial
publication. The unchanged approved BMW/Harley designs remain protected.

## Public connection release gate

The existing `public_anybike_verified_model_facts_v1` Supabase RPC was
updated in place with a matching-fact source audit requirement (same source
URL, non-empty verification basis and checked timestamp not in future).
Six existing model results were checked both before and after and retained
their original counts. A repeatable read-only SQL regression script is in
`scripts/sql/check-public-verified-fact-rpc-audit-2026-11-11.sql`.

## Third source-verification batch — 11 November 2026 (current baseline)

**15 more** previously pending factory facts were source-checked and given
matching independent audit records, taking the actual production database to
**150 verified / 44 pending, 50 models with verified facts**, out of 194 fact
records. The earlier numeric checkpoints above are historical snapshots.

- BMW R 18, MY2022: new Manhattan metallic matt and Mars red metallic
  (facts 135–136); BMW original MY2022 update,
  https://www.press.bmwgroup.com/global/article/detail/T0336699EN/updates-for-bmw-r-18-and-r-18-classic?language=en
- BMW S 1000 R, MY2017: Catalano Grey, BMW Motorsport tricolour and Racing
  Red / Black Storm (facts 137–139); BMW USA MY2017 press kit,
  https://www.press.bmwgroup.com/usa/article/detail/T0266152EN_US/the-new-bmw-s-1000-rr-and-bmw-s-1000-r?language=en_US
- BMW R 1250 RT MY2022: Triple Black / Black storm metallic 2
  (fact 128), https://www.press.bmwgroup.com/global/article/detail/T0336232EN/bmw-motorrad-model-revision-measures-for-the-model-year-2022
- BMW R nineT, MY2017: Black Storm metallic (fact 151),
  https://www.press.bmwgroup.com/usa/article/detail/T0266150EN_US/the-new-bmw-r-ninet-and-r-ninet-urban-g/s
- BMW HP4: original 2012 factory colour and Competition Package (facts 143,
  144), https://www.press.bmwgroup.com/global/article/detail/T0128804EN/the-new-bmw-hp4
  **Important correction:** 2012 was the global launch/premiere year,
  not asserted as the production model-year. These two entries were
  amended to `launch_year: 2012`, with labels explicitly stating
  `Introduced: 2012`.
- BMW R 90 S: Daytona Orange from 1975, Silver Smoke metallic
  (facts 149,150), https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-623-1.bmw-r-90-s.html
- BMW R 32: 1923 Berlin Motor Show debut and Max Friz design (fact 67),
  original R 32 494 cc, 8.5 hp, flat-twin and shaft drive (fact 68),
  https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-569-1.bmw-r-32.html
  and https://www.bmwgroup.com/en/company/history.html
- BMW R 90 S: Hans Muth design and original finishes (fact 69), as per
  BMW Group Classic above.
- BMW R 1200 RS: fifth boxer-RS generation, 2015–2018 retrospective
  production period, 1,170 cc, 125 hp (fact 87), BMW 21 April 2026
  factory historical retrospective:
  https://www.press.bmwgroup.com/global/article/detail/T0457144EN/bmw-motorrad-celebrates-50-years-of-bmw-rs-production-and-competition-motorcycles

All these fact records have a matching, dated source audit. Existing
public RPC rules were preserved: the verified-fact view is separate from
universal editorial publication. **1,265 draft universal model sections
are not published**, and all existing approved BMW/Harley editorial,
photography, stock-first layout and guest enquiry remain untouched.

## Fourth source-verification and cross-manufacturer expansion — 11 Nov 2026

The current database contains **202 fact records: 169 verified** (all with
matching independent audit records) and **33 pending**, across **62 models**
with verified facts. This supersedes earlier numerical snapshots above.

### Six existing BMW launch/manufacturing facts verified

- BMW S 1000 RR: 2009 factory 193 hp / 142 kW, Monza May 2009 launch,
  serial production at Berlin BMW Motorrad plant. Source:
  https://www.press.bmwgroup.com/united-kingdom/article/detail/T0018555EN_GB/the-new-bmw-s-1000-rr?language=en_GB
  and https://www.press.bmwgroup.com/global/article/detail/T0011582EN/the-race-is-on%3A-supersports-bike-bmw-s-1000-rr-comes-off-the-production-line-at-the-bmw-motorrad-plant-in-berlin?language=en
- BMW F 850 GS: the November 2017 USA manufacturer announcement of the 2018
  model, distinct from first factory production:
  https://www.press.bmwgroup.com/usa/article/detail/T0276939EN_US/model-year-2018-%E2%80%93-new-models-equipment-updates-and-pricing
- BMW S 1000 R: factory announcement on 5 November 2013; not necessarily
  the first day of factory production:
  https://www.press.bmwgroup.com/usa/article/detail/T0154044EN_US/the-new-bmw-s-1000-r
- BMW S 1000 XR: original BMW Berlin factory 23 April 2015 plant report,
  confirming production underway that April:
  https://www.press.bmwgroup.com/deutschland/article/detail/T0214042DE/sportlicher-familienzuwachs-im-bmw-werk-berlin

### Five other verified existing BMW facts

- F 850 GS MY2021 40 Years GS Edition
- S 1000 XR MY2026 Sport Sage Green metallic
- R 1300 RS and RT initial 2025 factory variant names, explicitly treated
  as launch styles rather than universal model-year colour schedules
- R 18 B launch-generation touring specs, distinct from R 18 Transcontinental

### Eight newly inserted primary-manufacturer research facts

Each has an **exact Supabase catalogue model ID**, manufacturer source URL,
reference generation/year, independent audit record and successful live
public RPC result. New verified model coverage:

| Manufacturer | Exact catalogue model | Manufacturer document |
|---|---|---|
| Aprilia | RS 660 | https://wlassets.aprilia.com/wlassets/aprilia/master/tech_spec/2020/RS_660_EN/original/RS_660_EN.pdf |
| Ducati | PANIGALE V4 | https://www.ducati.com/us/en/news/the-new-panigale-v4-my-2020-available-at-ducati-dealers |
| Honda | CBR600RR | https://global.honda/en/newsroom/news/2020/2200821eng.html |
| Honda | Africa Twin CRF1100L | https://global.honda/en/AfricaTwin/history/stories/2019/ |
| Royal Enfield | Classic 350 | https://www.royalenfield.com/content/dam/royal-enfield/india/our-world/news-and-media/press-release/product-launches/all-new-classic-350/all-new-classic-350-launch-release-sept%202021.pdf |
| Suzuki | GSX-R750 | https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/sports_081.php |
| Triumph | Bonneville T120 | https://www.triumphmotorcycles.com/our-story/bonneville |
| Yamaha | MT-07 | https://global.yamaha-motor.com/jp/news/2014/0707/mt-07.html |

The sources explicitly limit data to the stated generations and markets;
no false cross-year specifications or publication of staged editorial.
The public model RPC also now includes verified touring records, and the
shared renderer safely displays flat lists of factory variant/style names
without emitting nested unsourced objects. The tests cover both cases.

Regression SQL: `scripts/sql/check-multibrand-sourced-research-2026-11-11.sql`
was run and all four reports passed: eight public models with one verified
fact each, 169 matching source audits, zero universal editorial publications.
