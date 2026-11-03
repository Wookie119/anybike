# Universal 20-section manufacturer architecture — 3 November 2026

STATUS: development specification only. Originals and all four 2026-11-02 backups are read-only reference assets. Never replace the approved BMW or Harley pages with a simplified renderer.

## Verified protected source files
- bmw-motorcycles.html (original, do not change)
- harley-davidson-motorcycles.html (original, do not change)
- bmw-motorcycles-backup-20261102.html
- bmw-motorcycles-numbered-backup-20261102.html (12 headings)
- harley-davidson-motorcycles-backup-20261102.html
- harley-davidson-motorcycles-numbered-backup-20261102.html (22 headings)

## Universal section mapping
The source numbers below refer to the exact numbered H2 headings of the protected backup files, **not** their order in the new template. Multi-section mappings require preserving the original substantive text and attribution once, then rendering contextual excerpts or links elsewhere.

| # | Universal section | BMW source | Harley-Davidson source | Preservation notes |
|---|---|---|---|---|
| 01 | Manufacturer introduction | Hero | Hero | Identity, origins, country, brand-specific introductory design |
| 02 | Complete model library | 02 | 02 | Preserve model families, pills, model links, no false promotion of variants as standalone |
| 03 | Manufacturer history | 03 | 03, 11 | Full existing stories, exact dates and references |
| 04 | Manufacturing and factories | 03 | 03, 04 | Factory and engine-plant stories; Harley 2026 announced manufacturing plans are forward-looking, not confirmed completion |
| 05 | Engineering and technology | 03 | 05, 08, 10, 13 | Powertrains, electrification, engineering distinctions |
| 06 | Generations and development | 02, 03 | 10, 11 | Generation dates and major platform changes |
| 07 | Historical timeline | 03 | 04, 11 | Keep planned 2027 milestones clearly marked planned/unconfirmed |
| 08 | Famous and iconic motorcycles | 02, 03 | 05, 10, 11 | R 32, XR750, V-Rod, Sportster etc. only as sourced |
| 09 | Categories and riding styles | 01, 06 | 01, 09, 16 | Preserve top-of-page category browse cards, anchor ids and type links |
| 10 | Motorsport history | 11 | 05, 21 | Discipline-specific source-backed coverage |
| 11 | Factory racing teams and works riders | 11 | 05, 21 | Preserve existing dynamic works rider and racing story display |
| 12 | Performance and specialist engineering | 02, 03 | 05, 06, 07, 08 | Preserve Battistinis, S&S Cycle, Screamin' Eagle, specialist engineering and custom culture as full stories |
| 13 | Factory colours and design evolution | Model references; additional research | 05, 06, 08; additional research | Model-specific sourced colours/years not invented |
| 14 | Production figures and global markets | Existing history/model details; additional research | Existing history/model details; additional research | Verified totals/registrations only; distinguish produced, registered, sold, listed |
| 15 | Factory and historical photography | 10, 12 | 20, 22; embedded editorial figures | Preserve existing photographs and visible credits; only publish with approved rights |
| 16 | Ownership and buying guides | Existing model/history links | 09, 12, 13 | Keep model comparisons and exact-engine-year checks |
| 17 | AnyBike Global stories | 04, 11 | 07, 14, 21 | Bidirectional database relations; never drop existing story links |
| 18 | Related manufacturers and comparisons | 05, 08 | 15, 18 | Preserve related maker and model crosslinks |
| 19 | UK motorcycle services | 07, 09 | 17, 19 | UK selling and appropriate UK dealer service calls to action only |
| 20 | International buying and exporting | 09 and existing sourcing navigation | 12, 19 and existing sourcing navigation | Country and overseas buyer journeys; do not show international buyer call-to-action in UK-specific area |

## Source heading inventory (verified)
BMW: 01 Choose your BMW motorcycle; 02 BMW model library; 03 BMW Motorrad — history and manufacturing; 04 BMW stories from AnyBike Global; 05 Explore related manufacturers; 06 Explore BMW by motorcycle type; 07 Sell your BMW motorcycle in the UK; 08 Compare other motorcycles; 09 Tell AnyBike what BMW your dealership needs; 10 Official BMW model photographs; 11 Works riders & racing stories; 12 Photograph credits.

Harley-Davidson: 01 Choose your Harley-Davidson motorcycle; 02 Harley-Davidson model library; 03 Harley-Davidson — history and manufacturing; 04 Harley-Davidson 2027: Sportster 883 return and the new Sprint; 05 Harley-Davidson racing, engineering and custom culture; 06 Battistinis Custom Cycles: a British connection to Harley custom culture; 07 Harley-Davidson performance: the full story; 08 S&S Cycle, Screamin’ Eagle and Harley-Davidson performance; 09 Which Harley-Davidson suits your riding?; 10 LiveWire: Harley-Davidson’s electric-motorcycle chapter; 11 Harley-Davidson through the generations; 12 What UK buyers and export dealers should check; 13 Harley-Davidson ownership and engineering guides; 14 Harley-Davidson stories from AnyBike Global; 15 Explore related manufacturers; 16 Explore Harley-Davidson by motorcycle type; 17 Sell your Harley-Davidson motorcycle in the UK; 18 Compare Harley-Davidson with other motorcycles; 19 Tell AnyBike what Harley-Davidson your dealership needs; 20 Official Harley-Davidson model photographs; 21 Works riders & racing stories; 22 Photograph credits.

## Migration rules / acceptance gates
1. Audit existing section *body* content (including script-built/model family/credits/rider blocks), not just headings, before extracting.
2. Preserve each existing original text fragment, link URL, image, alt text, source/attribution, anchored navigation ID, pill, and desktop/mobile layout through a reversible source-to-record mapping.
3. Never publish unverified information or unapproved photo assets. Missing sections can be deferred/hidden with a tracked coverage record, never filled with generic invented text.
4. Separate shared structured facts, rich brand editorial, model-specific fact tables, Global article relations, and approved photo assets.
5. Public output is published-only; protect drafts, internal operations and customer/dealer data with RLS and clear access grants.
6. Same template provides 20 structural slots but brand-appropriate modules; keep the approved BMW and Harley aesthetic, red #ed1c24 accents, outline pills and UK/global routing.
7. Do not alter originals, backups or production database until preview equality, URL/anchor parity, phone width, page speed, accessibility, RLS and search crawlability are verified.
8. Keep approved 13-section model V2 system independent of the manufacturer 20-section system.
9. Use non-destructive additive changes on an isolated branch; perform a full rollback test before deployment.
