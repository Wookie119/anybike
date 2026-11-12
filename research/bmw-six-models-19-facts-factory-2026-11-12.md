# BMW factory-source batch — 12 November 2026

## Actual publication
**19 new verified research facts** with **19 matching verification-audit rows**, inserted idempotently into the existing Supabase research catalogue, across six exact BMW models:

| Exact model | New facts | Model-year scope | Status before batch |
|---|---:|---|---|
| BMW R 1200 S | 5 | 2006 original launch | Unresearched |
| BMW R nineT | 4 | 2017 EU4 roadster | Already researched |
| BMW F 800 ST | 2 | 2005 announcement only | Unresearched |
| BMW K 1200 GT | 2 | 2005 announcement only | Unresearched |
| BMW K 1600 GT | 3 | 2022 EU5 update | Already researched |
| BMW K 1600 GTL | 3 | 2022 EU5 update | Already researched |

**Public catalogue after batch:** 124 / 965 models with verified research; 387 verified public facts. The F 800 ST and K 1200 GT have deliberately limited introductory records rather than invented specifications: the factory press kit headline names the models but its published HTML body is predominantly the R 1200 S press kit.

## Primary sources fully inspected
- https://www.press.bmwgroup.com/usa/article/detail/T0017536EN_US/the-new-bmw-r-1200-s-and-information-about-the-k-1200-gt-and-f-800-st?language=en_US
- https://www.press.bmwgroup.com/global/article/detail/T0265047EN/the-new-bmw-r-ninet-and-r-ninet-urban-g/s
- https://www.press.bmwgroup.com/global/article/detail/T0350352EN/the-new-bmw-k-1600-gt-k-1600-gtl-k-1600-b-and-k-1600-grand-america

## Non-negotiable scope rules
- R 1200 S 2006: 1,170cc, 122hp, 213kg full-tank; optional switchable ABS, never universally standard. Factory launch colours explicitly dated to original launch.
- R nineT 2017: 1,170cc 110hp, **fully adjustable USD fork, 17-inch front and rear**; distinct from R nineT Urban G/S conventional fork and 19-inch front.
- K 1600 GT 2022: audio system 2.0 optional ex works; K 1600 GTL 2022: standard.
- BMW 2005 press release does not establish exact production or US market launch dates for F 800 ST or K 1200 GT.
- No new image rights assumed. No model template changes. No manually uploaded 123-reg files.

Four additional live browser checks were added to the existing shared script, extending the exact-model cases to **50**. The exact-model public Supabase RPC was checked for all six motorcycles and returned their expected verified facts. Browser and deployment workflow conclusions must be checked separately before reporting success.
