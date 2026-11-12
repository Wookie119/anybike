# Honda four-model factory research publication — 12 November 2026

## Completed
**16 new verified facts and 16 matching verification-audit records** inserted into the existing Supabase model catalogue. All four exact-model public RPC responses returned their expected verified fact counts. **Three models had no research previously.**

| Model | ID | New facts | Current public facts |
|---|---:|---:|---:|
| Honda CBR500R | 448 | 4 | 5 |
| Honda Rebel CMX500 | 461 | 4 | 4 |
| Honda CRF1100L Africa Twin | 177 | 4 | 4 |
| Honda CRF1100L AFRICA TWIN ADVENTURE SPORTS | 178 | 4 | 4 |

**Catalogue totals after publication: 135/965 models researched, 458 verified public facts.**

## Primary manufacturer sources
- Honda 2024 CBR500R: https://hondanews.eu/eu/en/motorcycles/media/pressreleases/452840/24ym-honda-cbr500r
- Honda 2024 CMX500 Rebel: https://hondanews.eu/eu/en/motorcycles/media/pressreleases/451551/2024-cmx500-rebel
- Honda 2024 CRF1100L Africa Twin: https://hondanews.eu/gb/en/motorcycles/media/pressreleases/451543/24ym-crf1100l-africa-twin
- Honda 2024 CRF1100L Africa Twin Adventure Sports: https://hondanews.eu/gb/en/motorcycles/media/pressreleases/451931/24ym-crf1100l-africa-twin-adventure-sports

## Exact-model/variant safeguards
- 2024 CBR500R is 471cc / 35kW, with 191kg kerb mass, 296mm dual front discs, 5-inch TFT and standard HSTC; no 2026 E-Clutch claims copied into 2024.
- 2024 CMX500 Rebel is 471cc / **34kW**, not 35kW CB500 Hornet; 690mm seat and 11.2-litre tank. Rebel **S** paint and fitted accessories are edition-only, not standard base equipment.
- 2024 base CRF1100L Africa Twin has **21-inch front wheel, 18.8-litre tank**, and standard Showa suspension. EERA suspension is ES-only; DCT is optional.
- 2024 Adventure Sports has **19-inch front wheel, 24.8-litre tank**, and **standard Showa EERA**. Do not merge Adventure Sports data into the base model.
- The catalogue also contains alternative names 'CMX500 Rebel' and 'Africa Twin CRF1100L'. This batch targeted the precise page identifiers above and did not automatically copy research to ambiguous aliases.
- No photo rights inferred, no model template changes, no hardcoded pages.

## Website testing
Four new exact-model browser smoke cases were committed to the shared GitHub script. Total smoke cases **68**. A committed test case is not a passed live-browser test; check the workflow conclusion separately.
