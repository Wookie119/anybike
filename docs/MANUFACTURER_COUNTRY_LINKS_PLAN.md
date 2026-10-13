# AnyBike manufacturer-specific country links — development plan

Status: Required for every manufacturer; individual links to be researched and validated  
Added: 13 October 2026  
Scope: Public manufacturer pages and internal navigation only.

## Objective
Tailor the "Explore UK sourcing by destination" country pills for each motorcycle manufacturer based on trustworthy evidence of market relevance. Avoid reusing an identical generic list for BMW, Yamaha, Honda, Kawasaki, Suzuki, Triumph, Ducati and other manufacturers.

## Rules
1. Build a manufacturer-by-country evidence list before making recommendations. Use grounded official registrations/sales data, importer/dealer presence, relevant AnyBike buyer enquiries and aggregated AnyBike market interest, with dates and sources. Include evidence of established owners' clubs, enthusiast events, motorcycle forums and organised riding communities, marque loyalty, and an active conversation around the brand, distinguishing such a following from proven sales or export demand. Do not assert popularity on guesswork or general motorcycle popularity alone.
2. Link only to real, published AnyBike country pages. Validate URLs and headings before committing.
3. Prioritise country-specific relevance to the manufacturer and UK motorcycle sourcing/export, not just worldwide market size. Check whether importing the motorcycle is legally feasible; never imply guaranteed eligibility, duties, shipping or supply.
4. Keep the existing black/white/red responsive pill layout; show a manageable primary selection, with an accessible "More destinations" expansion or all-markets link as needed.
5. Different manufacturer pages can share countries when supported, but must not mechanically inherit the same list.
6. Preserve Available Stock OFF state; never expose hidden stock, dealer identity or data. Keep existing manufacturer menu, VMoto banner and customer workflows intact. No Supabase migration is needed for the public-page navigation task.
7. Validate desktop/mobile usability, accessibility, performance, broken links, page semantics and search indexing before sign-off.

## Mandatory page section
Every manufacturer page built from the BMW master layout must include a **brand-specific international countries and communities** section. Explain briefly why each selected country is relevant (e.g. documented owners' community, importer network, major local club/event, verified buyer enquiries); link to that country's existing AnyBike market page. Do not merely insert identical generic country pills for every brand. Keep the section visible even where only a small number of countries meet the evidence threshold; link to all international markets separately.

## Suggested execution order
- Finish BMW quality checks and identify which of its currently linked 24 destination pages are demonstrably relevant. Treat the existing set as navigation, not a demand ranking.
- Apply the evidence-led country pill selection to Harley-Davidson as the immediate priority, then Yamaha, using the BMW master layout as the design template. Brand-specific markets may differ significantly.
- Continue with Honda, Kawasaki, Suzuki, Triumph, Ducati and then the remaining manufacturers.
- Revisit country selections periodically when credible market data or actual AnyBike demand changes.

## Completion criteria
Each manufacturer has a documented country list with source/date or internal demand basis, verified links, appropriately qualified wording, and successful desktop/mobile QA.
