# AnyBike visual review — Friday 13 November 2026

Status: deferred at user's request on 12 November. Do not interrupt database development for screenshots today.

## Approved reference
- BMW R 1300 GS: compare every tested page to its approved v2 layout. Do not redesign or remove sections.
- Check all roles see the same research sections when verified data exists; international views place exact-model Available Stock above research.

## Pages to check, in priority order
1. **BMW S 1000 RR** — https://www.anybike.co.uk/bmw-s1000rr.html — previously reported broken/not fully loaded. Check hero, clickable model links, exact-model Available Stock above research for international users, compact country navigation, and verified research sections.
2. **BMW R 1250 GS** — navigate from BMW manufacturer models. Check hero, correct R 1250 GS facts (not R 1300 GS), approved R 1300 GS layout consistency, no stock-access restriction banner that shouldn't be present.
3. **BMW F 900 GS** — navigate from BMW manufacturer models. Check hero, approved research layout, correct model facts, exact stock matching.
4. **BMW R 1300 GS** — approved reference page. Verify unchanged layout, year/edition and colour information, stock above research for international users, approved hero/gallery.
5. **BMW manufacturer** — https://www.anybike.co.uk/motorcycle-brand.html?make=BMW — model navigation and correct page links.
6. **Suzuki manufacturer** — https://www.anybike.co.uk/motorcycle-brand.html?make=Suzuki — models load and links work; GT750 research/page readiness if available.
7. **Kawasaki manufacturer** — https://www.anybike.co.uk/motorcycle-brand.html?make=Kawasaki — models load and links work; KH500 research/page readiness if available.

## Checks for each page
- No blank, missing, blacked-out, duplicated or collapsed research sections where verified content exists.
- Research appears in the approved template sections, not in a conflicting alternative layout.
- Model-specific data is correct and traceable to verified Supabase research.
- Only approved/cleaned licensed images display; never expose uncleaned dealer photos.
- Links are clickable and lead to the intended manufacturer/model page.
- Check UK logged-out, UK dealer/private, international logged-out and international dealer/private where feasible.
- No manual upload to 123-reg. GitHub commits and live deployment are separate verification steps.

## Database snapshot (12 November; metadata, not browser proof)
- BMW R 1300 GS: 21 verified facts, 1 approved hero, 4 approved gallery records.
- BMW R 1250 GS: 7 verified facts, 1 approved hero, 0 approved gallery records.
- BMW F 900 GS: 7 verified facts, 1 approved hero, 0 approved gallery records.
- BMW S 1000 RR: 8 verified facts, 1 approved hero, 0 approved gallery records.
- Suzuki GT750 and Kawasaki KH500 were not returned by the public verified-research coverage query; do not imply these are ready or have approved photographs.

This checklist records the user's requested deferred visual review. It does not claim that live rendering or deployment was tested.
