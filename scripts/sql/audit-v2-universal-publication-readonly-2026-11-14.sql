-- AnyBike V2 universal publication readiness: read-only checks.
-- Run against the AnyBike Supabase project. Never auto-publish drafts.
-- Distinguish this 20-section editorial system from the separate verified-facts renderer.
SELECT editorial_status, entity_type, COUNT(*) AS section_count,
       COUNT(*) FILTER (WHERE NULLIF(BTRIM(source_reference),'') IS NOT NULL) AS source_reference_present,
       COUNT(*) FILTER (WHERE published_at IS NOT NULL) AS publication_timestamp_present
FROM public.motorcycle_universal_page_sections_v1
GROUP BY editorial_status, entity_type
ORDER BY editorial_status, entity_type;

SELECT COUNT(*) AS published_section_count
FROM public.motorcycle_universal_published_sections_v1;

SELECT section_number, section_key, COUNT(*) AS section_count
FROM public.motorcycle_universal_page_sections_v1
GROUP BY section_number, section_key
ORDER BY section_number, section_key;

-- These are verified research facts held for catalogue identity review.
-- Do not conflate them with the universal editorial draft records.
SELECT make, model, category, hold_reason, review_status,
       source_audited, research_section_supported
FROM public.anybike_model_research_publication_holds_v1
ORDER BY make, model, category;
