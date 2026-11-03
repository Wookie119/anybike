# Proposed additive manufacturer data model — design only (NOT executed)
Date: 2026-11-03. Based on live Supabase information_schema inspection.

## Reuse these existing relations
- motorcycle_catalog_manufacturers(id, display_name, slug, status, created_at): canonical manufacturer ID.
- motorcycle_catalog_models, motorcycle_catalog_families, motorcycle_catalog_family_members, motorcycle_catalog_generations, motorcycle_catalog_facts, motorcycle_catalog_timeline_events, motorcycle_catalog_market_metrics.
- motorcycle_model_v2_editorial: **13-section model** content; do not fold into manufacturer section table.
- motorcycle_racing_riders and motorcycle_racing_results.
- anybike_editorial_photo_bank: existing subject, make/model, years, source URL, photographer, licence, attribution, approval_status, usage_contexts and crop metadata; do not duplicate asset bytes/rights records.

## New proposed relations (review before DDL)
1. motorcycle_manufacturer_sections: id, manufacturer_id REFERENCES motorcycle_catalog_manufacturers(id), section_number CHECK 1..20, status (draft/review/approved/published), headline, introduction, body_blocks JSONB, display_options JSONB, source_reference, last_reviewed_at, published_at, revision; unique(manufacturer_id,section_number). Structured editorial blocks must accommodate preserved full rich stories, embedded media, cards, quotes, exact URLs/anchor IDs and crosslinks.
2. motorcycle_manufacturer_editorial_items: id, manufacturer_id, section_number, item_type, heading, body_blocks, sort_order, original_source_file, original_anchor, original_content_hash, source_name, source_url, verification_status, editorial_status. Multiple detailed stories per section, independent review.
3. motorcycle_manufacturer_milestones: id, manufacturer_id, event_date/event_year precision, title, body, status (historical/announced/planned), source_name, source_url, verification_status, sort_order.
4. motorcycle_manufacturer_model_relations: manufacturer_id, catalog_model_id, relation_type, sort_order, editorial_status; where appropriate rely on existing motorcycle_catalog_models.manufacturer and family tables rather than creating duplication.
5. motorcycle_editorial_story_links: story_id (existing actual Global primary key to be inspected), manufacturer_id nullable, catalog_model_id nullable, relation_type, sort_order, published_status; this is a proposal pending inspection of existing AnyBike Global tables.
6. motorcycle_manufacturer_photo_placements: manufacturer_id, section_number, photo_bank_id REFERENCES anybike_editorial_photo_bank(id), caption, sort_order, presentation_style. Rights authority stays in photo bank; public renderer additionally filters approval_status.
7. motorcycle_manufacturer_sources: manufacturer_id, editorial_item_id nullable, source_name, source_url, retrieved_at, rights_notes, verification_status. Support brand-level histories, production figures and registry facts distinct from model-specific facts.
8. motorcycle_manufacturer_section_audit: manufacturer_id, section_number, imported_reference_file, imported_heading_number, source_hash, imported_at, qa_status, qa_notes; source-to-record traceability and parity checks.

Do NOT create a standalone duplicate manufacturer catalog or substitute generic 20-section placeholder paragraphs for the original long-form BMW/Harley content.

## Suggested publishing policy
Expose approved/published content to public read only; keep drafts/review records and all admin writes private. Restrict source metadata where necessary. RLS must be enabled on every new exposed table, and public select policies must filter publication/rights. Views require security_invoker where supported; keep all secret keys server-side.

## Before implementing
Inspect existing Global articles/stories schema and manufacturer page data scripts; identify stable IDs and existing policies, unique constraints and indexes. Snapshot current content hashes. Draft migrations and populate **on a separate dev path** using idempotent upserts. Run staged parity tests for BMW and Harley before any public changes.

## Important existing security finding
Current Supabase table enumeration warns that RLS is disabled on:
- public.customer_profile_schema
- public.anybike_invoice_delivery_events
- public.anybike_quotes_automation_test_20261028
The advisory says these are exposed to anon/authenticated. This must be investigated separately; do not blindly enable RLS or create permissions because it could break active workflows. No policies or database changes were made in this step.
