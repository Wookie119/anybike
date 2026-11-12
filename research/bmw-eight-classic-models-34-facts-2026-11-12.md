# BMW Group Classic — eight-model source-verified publication batch
**Date:** 12 November 2026
**Database:** existing Supabase public research catalogue (no schema or template changes)

## Publication results
- **34 newly inserted verified facts**; **34 matching verification-audit records**
- **8 exact BMW model identities** researched for the first time
- Public catalogue coverage after this batch: **117 / 965 models**, **352 verified facts**
- Browser regression expanded from 34 to **42 exact-model checks** (including existing mobile and gallery checks)

| BMW model | Catalogue ID | Added facts | Original factory model scope |
|---|---:|---:|---|
| K 100 | 751 | 4 | 1983–1990 unfaired K 100 |
| K 1100 LT | 790 | 4 | 1991–1999 luxury tourer |
| R 80 G/S | 375 | 4 | 1980–1987 Monolever original, **with slash** |
| R 100 GS | 780 | 6 | E88 1987–1990, E91 1990–1994, distinct Paris-Dakar editions |
| R 1100 GS | 778 | 4 | 1993–1999 four-valve boxer |
| R 1150 GS | 789 | 4 | 1999–2003 base GS, not Adventure |
| R 1150 RT | 784 | 4 | 2000–2006 touring RT |
| R 1200 C | 783 | 4 | 1996–2004 cruiser, public launch 1997 |

## BMW manufacturer catalogue references
- https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-640-1.bmw-k-100.html
- https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-659-1.bmw-k-1100-lt.html
- https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-637-1.bmw-r-80-g-s.html
- https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-654-1.bmw-r-100-gs-e88.html
- https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-757-1.bmw-r-80-gs-e91.html
- https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-758-1.bmw-r-100-gs-paris-dakar-e88.html
- https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-759-1.bmw-r-100-gs-paris-dakar-e91.html
- https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-663-1.bmw-r-1100-gs.html
- https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-715-1.bmw-r-1150-gs.html
- https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-717-1.bmw-r-1150-rt.html
- https://www.bmwgroup-classic.com/en/models/bmw-motorcycle-classics/product-description-page.md-668-1.bmw-r-1200-c.html

## Scope and reliability protections
- BMW Classic explicitly marks some explanatory narrative as AI-created. The verified entries prioritise the **manufacturer's own tabulated production dates, engine output, displacement and prices**, while keeping engineering descriptions closely scoped to that same model and year.
- BMW Classic R 100 GS E91 **URL slug misleadingly says R 80 GS**, while its heading and technical data say R 100 GS (E91). Source is scoped by the heading and variant; the discrepancy is noted in its verification audit.
- Historical **German Deutsche Mark prices** are stored as historical manufacturer prices, never current sale prices.
- **R 80 G/S** (1980–1987) is not the later **R 80 GS**; **R 100 GS E88** is not E91. R 100 GS Paris-Dakar edition end dates are not copied to base model production.
- R 1100 GS factory catalogue records **1993 production** and **1994 presentation** separately.
- R 1150 GS 85 hp and R 1150 RT 95 hp are never interchanged.
- BMW R 1200 C 1996 production start and 1997 public launch are distinguished.
- No new image was approved without rights metadata; no changes to shared model HTML, BMW R 1300 GS design, 20-section structure, country pages or UK/international roles.
- Exact-model public RPC returned **all 34 newly inserted facts** across these eight models. Browser deployment smoke is separately tracked in GitHub Actions.
