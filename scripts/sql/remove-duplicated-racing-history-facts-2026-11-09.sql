-- Remove duplicate verified competition references incorrectly copied into
-- general-history slot 07; original fact records and racing slot 10 are kept.
WITH candidate AS (
 SELECT s.id, s.content,
  coalesce((SELECT jsonb_agg(e.value ORDER BY e.ordinality)
    FROM jsonb_array_elements(s.content->'verified_catalogue_facts')
     WITH ORDINALITY e(value,ordinality)
    LEFT JOIN public.motorcycle_catalog_facts f
      ON f.id=CASE WHEN e.value->>'fact_id' ~ '^[0-9]+$'
           THEN (e.value->>'fact_id')::bigint ELSE NULL END
    WHERE NOT (
      f.category='competition' AND f.catalog_model_id=s.model_id
      AND EXISTS(
       SELECT 1 FROM public.motorcycle_universal_page_sections_v1 racing
       WHERE racing.entity_type='model' AND racing.model_id=s.model_id
         AND racing.section_number=10
         AND racing.content->'verified_catalogue_facts' @>
           jsonb_build_array(jsonb_build_object('fact_id',f.id))
      )
    )),'[]'::jsonb) remaining
 FROM public.motorcycle_universal_page_sections_v1 s
 WHERE s.entity_type='model' AND s.section_number=7
 AND s.editorial_status='draft'
 AND jsonb_typeof(s.content->'verified_catalogue_facts')='array'
)
UPDATE public.motorcycle_universal_page_sections_v1 s
SET content=CASE WHEN c.remaining='[]'::jsonb
 THEN s.content-'verified_catalogue_facts'
 ELSE jsonb_set(s.content,'{verified_catalogue_facts}',c.remaining,true) END,
 updated_at=now()
FROM candidate c WHERE s.id=c.id
 AND c.remaining IS DISTINCT FROM s.content->'verified_catalogue_facts';
