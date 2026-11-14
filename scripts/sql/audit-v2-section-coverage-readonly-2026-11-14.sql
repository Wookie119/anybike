-- AnyBike V2 section coverage and safe publication blockers (READ ONLY).
-- This diagnostic does not approve, publish or modify editorial records.
-- The approved 20-section layout is distinct from the 22 verified-facts research categories.
WITH slots AS (
 SELECT e.entity_type, e.section_number, count(*) AS records,
 count(*) FILTER (WHERE e.content IS NULL OR e.content='{}'::jsonb OR e.content='[]'::jsonb) AS empty_records,
 count(*) FILTER (WHERE nullif(btrim(e.content->>'source_verification_status'),'') IS NULL) AS missing_embedded_verification
 FROM public.motorcycle_universal_page_sections_v1 e
 GROUP BY e.entity_type,e.section_number
)
SELECT types.entity_type, numbers.section_number,
 coalesce(slots.records,0) AS draft_or_published_records,
 coalesce(slots.empty_records,0) AS empty_records,
 coalesce(slots.missing_embedded_verification,0) AS missing_embedded_verification,
 CASE WHEN slots.records IS NULL THEN 'no editorial records'
      WHEN slots.empty_records>0 THEN 'contains empty content'
      WHEN slots.missing_embedded_verification>0 THEN 'review verification metadata'
      ELSE 'review approval and publication status' END AS review_priority
FROM (VALUES ('manufacturer'),('model')) types(entity_type)
CROSS JOIN generate_series(1,20) numbers(section_number)
LEFT JOIN slots ON slots.entity_type=types.entity_type AND slots.section_number=numbers.section_number
ORDER BY types.entity_type,numbers.section_number;

-- Source metadata and public publication are separate gates.
SELECT entity_type, editorial_status, count(*) AS records
FROM public.motorcycle_universal_page_sections_v1
GROUP BY entity_type,editorial_status ORDER BY entity_type,editorial_status;
SELECT count(*) AS publicly_published_sections
FROM public.motorcycle_universal_published_sections_v1;
