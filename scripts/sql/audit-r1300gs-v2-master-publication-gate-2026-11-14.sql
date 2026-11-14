-- AnyBike BMW R 1300 GS V2 universal-master publication worklist.
-- READ ONLY. Validated against live Supabase on 2026-11-14.
-- Do NOT publish staged drafts on the strength of verified individual facts.
-- Preserve the original R 1300 GS design, photographs and stock-first layout.
WITH slots AS (
  SELECT generate_series(1,20) AS section_number
),
drafts AS (
  SELECT id,section_number,section_key,section_title,editorial_status,
         source_reference,content
  FROM public.motorcycle_universal_page_sections_v1
  WHERE entity_type='model' AND model_id=77
),
published AS (
  SELECT section_number,count(*) AS live_rows
  FROM public.motorcycle_universal_published_sections_v1
  WHERE entity_type='model' AND entity_id=77
    AND editorial_status='published' AND publication_eligible IS TRUE
  GROUP BY section_number
)
SELECT s.section_number,
       'section_'||lpad(s.section_number::text,2,'0') AS expected_key,
       d.section_title,
       coalesce(d.editorial_status,'missing') AS draft_status,
       coalesce(p.live_rows,0) AS published_rows,
       CASE
         WHEN d.id IS NULL THEN 'NO_DRAFT: leave empty unless evidence supports it'
         WHEN d.section_key IS DISTINCT FROM 'section_'||lpad(s.section_number::text,2,'0')
           THEN 'BLOCKED: wrong slot key'
         WHEN d.content IS NULL OR d.content IN ('{}'::jsonb,'null'::jsonb,'[]'::jsonb)
           THEN 'BLOCKED: empty content'
         WHEN nullif(btrim(d.source_reference),'') IS NULL
           THEN 'BLOCKED: no staging provenance'
         WHEN d.content::text ILIKE '%pending_editorial_review%'
           THEN 'REVIEW: pending material inside draft'
         WHEN d.editorial_status<>'published'
           THEN 'REVIEW: draft only; requires section-level approval'
         ELSE 'CHECK: still requires approved publication provenance'
       END AS editorial_gate
FROM slots s
LEFT JOIN drafts d USING(section_number)
LEFT JOIN published p USING(section_number)
ORDER BY s.section_number;
