-- AnyBike universal model release blockers, 11 November 2026
-- READ ONLY. Never interpret an independently verified fact as a signed-off
-- model page, and never bypass review status to fill missing 20-section slots.
WITH manufacturer_registry AS (
 SELECT lower(trim(display_name)) make_key,
        min(id) manufacturer_id,
        count(*) registry_matches,
        bool_or(status='approved') approved
 FROM public.motorcycle_catalog_manufacturers
 GROUP BY lower(trim(display_name))
), staged AS (
 SELECT s.model_id,count(*) staged_sections,
        count(*) FILTER (WHERE s.editorial_status='draft') draft_sections,
        count(*) FILTER (
          WHERE jsonb_typeof(s.content->'verified_catalogue_facts')='array'
            AND (SELECT count(*) FROM jsonb_object_keys(s.content))=1
        ) fact_only_sections,
        count(*) FILTER (
          WHERE jsonb_typeof(s.content->'verified_catalogue_facts')='array'
            AND (SELECT count(*) FROM jsonb_object_keys(s.content))=1
            AND NOT EXISTS (
             SELECT 1 FROM jsonb_array_elements(s.content->'verified_catalogue_facts') f
             WHERE f->>'source_verification_status'='verified'
               AND f->>'editorial_status' IN ('approved','published')
               AND f->>'publication_eligible'='true'
            )
        ) fact_only_unapproved
 FROM public.motorcycle_universal_page_sections_v1 s
 WHERE s.entity_type='model'
 GROUP BY s.model_id
), audited AS (
 SELECT f.catalog_model_id model_id,count(*) fact_count
 FROM public.motorcycle_catalog_facts f
 WHERE f.verification_status='verified' AND EXISTS(
   SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
   WHERE a.fact_id=f.id AND a.source_url=f.source_url
     AND nullif(btrim(a.verification_basis),'') IS NOT NULL
     AND a.checked_at<=now()
 )
 GROUP BY f.catalog_model_id
)
SELECT m.id model_id,m.manufacturer,m.model,
       mr.manufacturer_id,mr.registry_matches,
       coalesce(mr.approved,false) manufacturer_approved,
       s.staged_sections,s.draft_sections,
       s.fact_only_sections,s.fact_only_unapproved,
       coalesce(a.fact_count,0) audited_facts,
       EXISTS(SELECT 1 FROM public.motorcycle_catalog_name_reviews n
              WHERE n.catalog_model_id=m.id AND n.review_status='pending_review') name_review_pending,
       (SELECT count(*) FROM public.motorcycle_universal_published_sections_v1 p
        WHERE p.entity_type='model' AND p.entity_id=m.id
          AND p.publication_eligible=true AND p.published_at<=now()) publicly_released_sections
FROM staged s
JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
LEFT JOIN manufacturer_registry mr ON mr.make_key=lower(trim(m.manufacturer))
LEFT JOIN audited a ON a.model_id=m.id
ORDER BY coalesce(a.fact_count,0) DESC,s.staged_sections DESC,m.manufacturer,m.model;
