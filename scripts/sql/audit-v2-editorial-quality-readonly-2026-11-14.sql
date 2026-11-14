-- AnyBike V2 editorial quality gates (read-only, 2026-11-14).
-- Run manually against AnyBike Supabase. These are diagnostics, NOT publication approval.
-- Existing verified-model-facts remain a separate rendering pathway.
-- Never automatically change editorial_status or published_at.

-- 1. Draft volume and missing identity/section numbers.
SELECT editorial_status, entity_type, COUNT(*) AS records,
       COUNT(*) FILTER (WHERE content IS NULL OR content = '{}'::jsonb OR content = '[]'::jsonb) AS empty_json,
       COUNT(*) FILTER (WHERE section_number NOT BETWEEN 1 AND 20) AS invalid_section_number,
       COUNT(*) FILTER (WHERE (entity_type='model' AND model_id IS NULL)
                            OR (entity_type='manufacturer' AND manufacturer_id IS NULL)) AS missing_identity
FROM public.motorcycle_universal_page_sections_v1
GROUP BY editorial_status, entity_type ORDER BY editorial_status, entity_type;

-- 2. Duplicate section slots for the same catalogue entity. Expected: no rows.
SELECT entity_type, COALESCE(model_id,manufacturer_id) AS entity_id, section_number, COUNT(*) AS duplicates
FROM public.motorcycle_universal_page_sections_v1
GROUP BY entity_type, COALESCE(model_id,manufacturer_id), section_number
HAVING COUNT(*) > 1 ORDER BY duplicates DESC LIMIT 100;

-- 3. Embedded editorial metadata is NOT a substitute for publication approval.
-- Missing summary/source_url may be legitimate for other structured content shapes;
-- review content schema per section before treating these as blocking failures.
SELECT entity_type,
       content->>'source_verification_status' AS verification_status,
       content->>'editorial_status' AS embedded_editorial_status,
       COUNT(*) AS records,
       COUNT(*) FILTER (WHERE NULLIF(BTRIM(content->>'summary'),'') IS NULL) AS missing_summary,
       COUNT(*) FILTER (WHERE NULLIF(BTRIM(content->>'source_url'),'') IS NULL) AS missing_source_url
FROM public.motorcycle_universal_page_sections_v1
GROUP BY entity_type, content->>'source_verification_status', content->>'editorial_status'
ORDER BY records DESC;

-- 4. Published count is authoritative; do not expose drafts on public pages.
SELECT COUNT(*) AS published_sections
FROM public.motorcycle_universal_published_sections_v1;
