# One manufacturer layout: BMW is the approved master

Approved reference: `bmw-motorcycles.html`.
Protected byte-for-byte master: `templates/bmw-manufacturer-master.html`.
BMW baseline Git blob SHA: `375d4734816c4c0648a390a99209dcf0b7b98056` (13 October 2026).

## Rules
- Never modify the public BMW page during another manufacturer's rollout.
- Use the copied BMW HTML, CSS, semantic sections, responsive breakpoints, heading hierarchy, cards and navigation rather than redesigning from scratch.
- All manufacturer pages must use the same section order: hero; five category cards; model library; history/manufacturing; AnyBike Global stories; related manufacturers; motorcycle types; UK selling; comparisons and brand-specific countries/owner communities; dealership enquiries; official model photograph resources; photograph credits where photographs are reproduced.
- Content can differ: manufacturer identity, models, model-guide URLs, history, verified specifications, photograph permissions, international country links, and agreed accent colour.
- Preserve the `/bulk-buying-request.html?make=...` sourcing flow and `/uk-motorcycle-selling.html?make=...` UK selling entry route. Never link directly to `/sell-your-motorcycle.html` from the manufacturer selling button unless a later separately approved change applies across the template.
- The public Available Stock switch remains OFF; do not expose stock, supplier identities, or bypass login/Deal 360.
- Do not modify Supabase, authentication, payments, bookings, VMoto banners or public header under this task.
- For each image, verify model and variant and document rights and credits. Link to official photo libraries; do not copy factory press photos without reuse permission.
- Country links should reflect researched local owner clubs, conversations, enthusiast networks, dealers, or verified AnyBike enquiries. They are not automatically sales rankings or promises of import eligibility.
- After each manufacturer conversion, compare rendered desktop/mobile output and click actual customer paths. An HTML structural test alone is not visual or live testing.

## Protection check
Run `node scripts/check-manufacturer-template.mjs` from the repository root before any manufacturer rollout. It intentionally fails when `bmw-motorcycles.html` differs from the protected original and checks essential sections and customer entry URLs on BMW and Harley-Davidson. Add further dedicated manufacturers to the check as they are converted.

## Next engineering stage
Extract design-only shared CSS and safe template rendering logic from this protected BMW source into a reusable generator with brand-specific structured data. Keep the BMW live output untouched; do not apply untested bulk rewrites to all 49 pages. Do not call this stage complete until layout parity, all routes and production visual QA are verified.
