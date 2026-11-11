-- AnyBike source-of-truth drift correction — 11 November 2026.
-- Applied to production: seven DRAFT sections containing eleven stale label/source
-- snapshots were reconciled with independently audited canonical fact records.\n-- Extended review: four nested BMW source fields and the verified Honda\n-- Dream CB750 Four Japanese on-sale date (10 August 1969) are also reconciled.
-- No factual values, photography, editorial status or published sections changed.
-- Idempotent: reruns make no updates when current metadata matches.
WITH expanded AS (
 SELECT s.id section_id,s.model_id,e.ord,e.elem,
        f.label canonical_label,f.source_url canonical_source,f.value canonical_value,
        (f.id IS NOT NULL AND f.catalog_model_id=s.model_id
         AND f.verification_status='verified'
         AND EXISTS(
          SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
          WHERE a.fact_id=f.id AND a.source_url=f.source_url
            AND nullif(btrim(a.verification_basis),'') IS NOT NULL
            AND a.checked_at IS NOT NULL AND a.checked_at<=now()
         )) canonical_safe
 FROM public.motorcycle_universal_page_sections_v1 s
 CROSS JOIN LATERAL jsonb_array_elements(
   CASE WHEN jsonb_typeof(s.content->'verified_catalogue_facts')='array'
        THEN s.content->'verified_catalogue_facts'
        ELSE '[]'::jsonb END
 ) WITH ORDINALITY e(elem,ord)
 LEFT JOIN public.motorcycle_catalog_facts f
   ON (e.elem->>'fact_id')~'^[0-9]{1,18}$'
   AND f.id=CASE WHEN (e.elem->>'fact_id')~'^[0-9]{1,18}$'
                 THEN (e.elem->>'fact_id')::bigint END
 WHERE s.entity_type='model' AND s.editorial_status='draft'
), rebuilt AS (
 SELECT section_id,
  jsonb_agg(
   CASE WHEN canonical_safe THEN
    jsonb_set(
      jsonb_set(
       jsonb_set(elem,'{label}',to_jsonb(canonical_label),true),
       '{source_url}',to_jsonb(canonical_source),true
      ),
      '{value}',canonical_value,true
    )
   ELSE elem END ORDER BY ord
  ) facts
 FROM expanded GROUP BY section_id
), changed AS (
 SELECT s.id,jsonb_set(s.content,'{verified_catalogue_facts}',r.facts,true) updated
 FROM public.motorcycle_universal_page_sections_v1 s
 JOIN rebuilt r ON r.section_id=s.id
 WHERE s.entity_type='model' AND s.editorial_status='draft'
   AND s.content->'verified_catalogue_facts' IS DISTINCT FROM r.facts
)
UPDATE public.motorcycle_universal_page_sections_v1 s
SET content=c.updated,updated_at=now()
FROM changed c WHERE s.id=c.id AND s.editorial_status='draft'
RETURNING s.id,s.model_id,s.section_number,s.editorial_status;

-- After applying, check that canonical metadata stays aligned and no
-- foreign/missing model identity or unaudited reference can be published.
WITH embedded AS (
 SELECT s.model_id,(e.elem->>'fact_id')::bigint fact_id,
        e.elem->>'label' cached_label,e.elem->>'source_url' cached_source_url,
        e.elem->'value' cached_value
 FROM public.motorcycle_universal_page_sections_v1 s
 CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(s.content->'verified_catalogue_facts')='array'
       THEN s.content->'verified_catalogue_facts'
       ELSE '[]'::jsonb END
 ) e(elem)
 WHERE s.entity_type='model' AND s.editorial_status='draft'
   AND (e.elem->>'fact_id')~'^[0-9]+$'
)
SELECT count(*) embedded_refs,
 count(*) FILTER(WHERE f.id IS NULL) missing_fact,
 count(*) FILTER(WHERE f.catalog_model_id<>e.model_id) wrong_model,
 count(*) FILTER(WHERE f.label IS DISTINCT FROM e.cached_label) stale_labels,
 count(*) FILTER(WHERE f.source_url IS DISTINCT FROM e.cached_source_url) stale_sources,
 count(*) FILTER(WHERE f.value IS DISTINCT FROM e.cached_value) stale_values,
 count(*) FILTER(WHERE NOT EXISTS(
  SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
  WHERE a.fact_id=f.id AND a.source_url=f.source_url
    AND nullif(btrim(a.verification_basis),'') IS NOT NULL
    AND a.checked_at<=now()
 )) missing_current_audit
FROM embedded e LEFT JOIN public.motorcycle_catalog_facts f ON f.id=e.fact_id;
