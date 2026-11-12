# Multi-manufacturer research publication — 12 November 2026

This batch adds **31 verified facts** with **31 matching source-audit records**
to the existing Supabase public research catalogue, without modifying the
approved shared model template or adding unlicensed photographs.

| Manufacturer | Exact model | Catalogue ID | New facts | Scope |
|---|---|---:|---:|---|
| Honda | CB750 Hornet | 805 | 5 | 2023 European launch |
| Honda | XL750 TRANSALP | 184 | 4 | 2023 European return |
| Triumph | TIGER 900 | 256 | 3 | 2024 updated engine family |
| Triumph | TIGER 900 GT PRO | 257 | 3 | 2024 GT Pro |
| Triumph | TIGER 900 RALLY PRO | 258 | 4 | 2024 Rally Pro |
| Suzuki | GSX-8S | 641 | 4 | 2023 launch |
| Suzuki | V-Strom 800DE | 651 | 4 | 2023 launch |
| Suzuki | V-Strom 800 | 979 | 4 | 2024 road model |

## Manufacturer evidence

**Honda**
- https://hondanews.eu/gb/en/motorcycles/media/pressreleases/416779/23ym-honda-cb750-hornet-47
- https://hondanews.eu/eu/en/motorcycles/media/pressreleases/415509/the-new-cb750-hornet-lands-at-intermot
- https://hondanews.eu/gb/en/motorcycles/media/pressreleases/428524/23ym-honda-xl750-transalp
- https://global.honda/en/tech/XL750_TRANSALP/
- https://global.honda/en/newsroom/news/2022/c221108eng.html

**Triumph**
- https://www.triumphmotorcycles.co.uk/motorcycles/adventure/tiger-900/tiger-900-gt-pro-2024
- https://www.triumphmotorcycles.co.uk/motorcycles/adventure/tiger-900/tiger-900-rally-pro-2024
- https://www.triumphmotorcycles.co.uk/motorcycles/adventure/tiger-900/reasons-to-ride/engine
- https://www.triumphmotorcycles.co.uk/for-the-ride/news/motorcycles/tiger-900-q-and-a-2024-05-28

**Suzuki**
- https://www.globalsuzuki.com/globalnews/2022/1108a.html
- https://www.globalsuzuki.com/motorcycle/smgs/products/2023gsx-8s/
- https://www.globalsuzuki.com/motorcycle/smgs/products/2023v-strom800de/
- https://www.globalsuzuki.com/motorcycle/smgs/products/2024v-strom800/

## Critical variant distinctions

- Honda CB750 Hornet (805) is separate from the catalogue's
  `Hornet CB750` (456), which still needs an identity review.
- Honda XL750 Transalp is not the older XL650V or XL700V.
- Triumph GT Pro has a 19-inch front wheel and Marzocchi suspension;
  Rally Pro has a 21-inch front wheel and long-travel Showa suspension.
- Suzuki V-Strom 800 road model has a 19-inch front wheel and 825mm
  seat height; the V-Strom 800DE has a 21-inch front wheel and
  855mm seat height. These specifications must never be copied between
  models.
- Suzuki EICMA 2022 announcement and planned 2023 sales dates are
  not represented as verified factory production dates.
- The existing category publication guard rejected an unsupported
  `equipment` category during the first Honda/Triumph attempt.
  No partial data was inserted; the subsequent complete transaction
  used approved research categories and succeeded.

All eight exact-model public research RPCs were included in the
post-publication audit. Chromium live-page regression tests were expanded
to cover these models. After publication, the database reports
**107 researched public models** and **310 public verified facts**
out of 965 catalogue models.

## Follow-on Suzuki GSX-8R publication

A further **five audited facts** were added for Suzuki **GSX-8R**
(catalogue model ID **640**), covering the 2024 engine, fairing and
Showa fork, launch equipment, EICMA announcement and factory launch
colours. The exact-model public research browser regression includes
GSX-8R. Manufacturer evidence:

- https://www.globalsuzuki.com/globalnews/2023/1107.html
- https://www.globalsuzuki.com/motorcycle/smgs/products/360viewer/2024gsx-8r/

**Do not conflate GSX-8R with GSX-8S:** the 2024 GSX-8R has a
full fairing, separate handlebars and 205kg curb mass, whereas
the original GSX-8S is a naked streetfighter with 202kg curb mass.
The source gives January 2024 as planned global sales, not
a verified first production date.
