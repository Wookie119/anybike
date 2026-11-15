-- AnyBike catalogue-wide verified-fact staging (editorial drafts ONLY).
-- Idempotent. Run with the approved Supabase service/admin SQL role.
-- Never grants publication eligibility, changes page layout, or invents facts.
-- All makes/models are processed together. Preserve existing section JSON.
BEGIN;

-- First create a history slot only where a model has verified, URL-backed
-- catalogue facts and no existing universal history section.
INSERT INTO public.motorcycle_universal_page_sections_v1
 (entity_type,model_id,section_number,section_title,content,editorial_status,source_reference)
SELECT 'model',f.catalog_model_id,7,'Verified model history',
       jsonb_build_object('verified_catalogue_facts','[]'::jsonb),
       'draft','motorcycle_catalog_facts:verified_ids;editorial_review_required'
FROM public.motorcycle_catalog_facts f
JOIN public.motorcycle_catalog_models m ON m.id=f.catalog_model_id
WHERE f.verification_status='verified'
  AND nullif(trim(f.source_url),'') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.motorcycle_universal_page_sections_v1 s
    WHERE s.entity_type='model' AND s.model_id=f.catalog_model_id
      AND s.section_number=7
  )
GROUP BY f.catalog_model_id
ON CONFLICT DO NOTHING;

-- Merge only facts whose IDs are not already present. Existing milestones
-- and other editorial fields are retained. Draft-only update; never edit
-- published content. This handles both new and pre-existing models.
WITH missing AS (
 SELECT s.id AS section_id,
        jsonb_agg(jsonb_build_object(
          'fact_id',f.id,'category',f.category,'label',f.label,
          'value',f.value,'start_year',f.start_year,'end_year',f.end_year,
          'market',f.market,'source_name',f.source_name,
          'source_url',f.source_url,
          'source_verification_status',f.verification_status
        ) ORDER BY f.id) AS new_facts
 FROM public.motorcycle_universal_page_sections_v1 s
 JOIN public.motorcycle_catalog_facts f ON f.catalog_model_id=s.model_id
 WHERE s.entity_type='model' AND s.section_number=7
   AND s.editorial_status='draft'
   AND f.verification_status='verified'
   AND nullif(trim(f.source_url),'') IS NOT NULL
   AND NOT (s.content @> jsonb_build_object(
     'verified_catalogue_facts',
     jsonb_build_array(jsonb_build_object('fact_id',f.id))))
 GROUP BY s.id
)
UPDATE public.motorcycle_universal_page_sections_v1 s
SET content=jsonb_set(
  s.content,'{verified_catalogue_facts}',
  coalesce(s.content->'verified_catalogue_facts','[]'::jsonb)
    || missing.new_facts,true)
FROM missing WHERE s.id=missing.section_id;

-- Zero is the expected missing-facts count after this operation.
SELECT count(*) AS missing_verified_fact_links
FROM public.motorcycle_catalog_facts f
JOIN public.motorcycle_universal_page_sections_v1 s
  ON s.model_id=f.catalog_model_id
 AND s.entity_type='model' AND s.section_number=7
WHERE f.verification_status='verified'
  AND nullif(trim(f.source_url),'') IS NOT NULL
  AND NOT (s.content @> jsonb_build_object(
    'verified_catalogue_facts',
    jsonb_build_array(jsonb_build_object('fact_id',f.id))));

COMMIT;
