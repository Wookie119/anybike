# Harley-Davidson manufacturer rebuild — October 2026

Status: in progress — initial audit completed 13 October 2026
Priority: Harley-Davidson before Yamaha, as requested.

## Existing state
- Public manufacturer index links to /motorcycle-brand.html?make=Harley-Davidson.
- data/motorcycle-catalogue-base.json currently contains 12 Harley-Davidson models: Breakout, Electra Glide, Fat Boy, Iron 883, Low Rider S, Pan America 1250, Road Glide, Road King, Softail Standard, Sportster S, Street Glide, Ultra Limited.
- data/motorcycle-model-guides.json currently has no Harley-Davidson entries. Do not claim those model guides already exist.

## Work order
1. Build dedicated /harley-davidson-motorcycles.html inspired by BMW's successful responsive black/white/red manufacturer layout. Retain current routes until new content and links have been verified; no premature cutover.
2. Cover key families: Grand American Touring, Cruiser/Softail, Sport, Adventure Touring, plus heritage models where accurately documented. Audit model and variant coverage rather than presuming the initial 12 exhaust Harley-Davidson's range.
3. Create validated model guides, with production years, historical generations, engine families, technical specifications and model/market/year qualifiers. Link models, variants and sourcing enquiries.
4. Only use correct model photographs with documented commercial reuse permissions or suitable Creative Commons licensing, with discreet but complete credits, source and relevant licence links. Do not substitute similar models.
5. Integrate UK sourcing and existing trade/export enquiry workflows, with no public Available Stock data while visibility is OFF.
6. Add manufacturer-specific destination pills using evidence-led international trade demand, not guessed country rankings. See docs/MANUFACTURER_COUNTRY_LINKS_PLAN.md.
7. Verify SEO and structured data, canonical/indexing, mobile, loading performance, navigation, and links before public cutover.
8. Preserve existing public header/manufacturer dropdown, VMoto banner and all production workflows. No Supabase changes or Vercel. Commit staged GitHub updates to main only after validation.

After Harley-Davidson quality checks, return to Yamaha.
