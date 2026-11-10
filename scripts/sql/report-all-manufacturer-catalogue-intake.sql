-- ANYBIKE: ALL-MANUFACTURER CATALOGUE INTAKE (READ ONLY)
-- Canonical manufacturer/model IDs are authoritative. Never infer a model ID
-- from a loose name, publish drafts, auto-approve aliases, or change stock.
-- This report is for internal/editorial batch planning, not a public API.

-- A: Manufacturer registry vs current model catalogue.
WITH model_counts AS (
 SELECT manufacturer,count(*) AS model_rows,
  count(*) FILTER(WHERE nullif(trim(overview),'') IS NOT NULL) AS overviews,
  count(*) FILTER(WHERE specifications IS NOT NULL AND
    specifications<>'{}'::jsonb) AS specifications_present
 FROM public.motorcycle_catalog_models GROUP BY manufacturer
), staged AS (
 SELECT m.manufacturer,count(DISTINCT s.model_id) AS staged_models,
   count(s.id) AS staged_sections
 FROM public.motorcycle_catalog_models m
 LEFT JOIN public.motorcycle_universal_page_sections_v1 s
  ON s.entity_type='model' AND s.model_id=m.id
 GROUP BY m.manufacturer
)
SELECT reg.id AS registry_id,reg.display_name AS registered_manufacturer,
 reg.slug AS registry_slug,reg.status AS registry_status,
 coalesce(mc.model_rows,0) AS exactly_named_models,
 coalesce(mc.overviews,0) AS overview_records,
 coalesce(mc.specifications_present,0) AS specification_records,
 coalesce(st.staged_models,0) AS staged_model_ids,
 coalesce(st.staged_sections,0) AS staged_research_sections
FROM public.motorcycle_catalog_manufacturers reg
LEFT JOIN model_counts mc ON mc.manufacturer=reg.display_name
LEFT JOIN staged st ON st.manufacturer=reg.display_name
ORDER BY exactly_named_models DESC,reg.display_name;

-- B: Every catalogue label lacking an exact registry identity.
SELECT c.manufacturer AS unregistered_label,
 count(*) AS affected_models,
 array_agg(c.id ORDER BY c.id) AS model_ids
FROM public.motorcycle_catalog_models c
LEFT JOIN public.motorcycle_catalog_manufacturers exact
 ON exact.display_name=c.manufacturer
WHERE exact.id IS NULL
GROUP BY c.manufacturer ORDER BY c.manufacturer;

-- C: Colliding exact make/model names after punctuation/case normalization.
-- Do not merge: trim, generation, production year and stock ID may differ.
SELECT lower(regexp_replace(manufacturer,'[^a-z0-9]','','gi')) AS make_key,
 lower(regexp_replace(model,'[^a-z0-9]','','gi')) AS model_key,
 count(*) AS matching_rows,
 array_agg(id ORDER BY id) AS candidate_catalogue_ids,
 array_agg(manufacturer||' '||model ORDER BY id) AS labels
FROM public.motorcycle_catalog_models
GROUP BY 1,2 HAVING count(*)>1 ORDER BY matching_rows DESC,make_key,model_key;

-- D: Alias review backlog, including source and intended canonical identity.
SELECT a.id AS alias_record_id,a.review_status,a.reason,
 a.alias_model_id AS original_model_id,
 am.manufacturer AS original_make,am.model AS original_model,
 a.canonical_model_id AS proposed_canonical_id,
 cm.manufacturer AS proposed_make,cm.model AS proposed_model
FROM public.motorcycle_catalog_model_aliases a
LEFT JOIN public.motorcycle_catalog_models am ON am.id=a.alias_model_id
LEFT JOIN public.motorcycle_catalog_models cm ON cm.id=a.canonical_model_id
WHERE a.review_status<>'approved'
ORDER BY a.alias_model_id;

-- E: Intake capacity for EVERY manufacturer: research presence is NOT
-- evidence approval. Untested copied overview text must remain private.
SELECT c.manufacturer,
 count(DISTINCT c.id) AS catalogue_models,
 count(DISTINCT s.model_id) AS staged_models,
 count(s.id) AS staged_sections,
 count(DISTINCT c.id) FILTER(
  WHERE nullif(trim(c.overview),'') IS NOT NULL
 ) AS overview_source_candidates,
 count(DISTINCT c.id) FILTER(
  WHERE c.specifications IS NOT NULL AND c.specifications<>'{}'::jsonb
 ) AS specification_source_candidates,
 count(s.id) FILTER(
  WHERE s.editorial_status='published'
 ) AS approved_staging_sections
FROM public.motorcycle_catalog_models c
LEFT JOIN public.motorcycle_universal_page_sections_v1 s
 ON s.entity_type='model' AND s.model_id=c.id
GROUP BY c.manufacturer ORDER BY catalogue_models DESC,c.manufacturer;

-- F: Explicit release gate. No bulk-publication statement in this report.
SELECT (SELECT count(*) FROM public.motorcycle_catalog_manufacturers)
  AS manufacturer_registry_rows,
 (SELECT count(DISTINCT manufacturer) FROM public.motorcycle_catalog_models)
  AS distinct_catalogue_make_labels,
 (SELECT count(*) FROM public.motorcycle_catalog_models)
  AS catalogue_model_ids,
 (SELECT count(*) FROM public.motorcycle_catalog_model_aliases
  WHERE review_status<>'approved') AS unreviewed_aliases,
 (SELECT count(*) FROM public.motorcycle_universal_page_sections_v1)
  AS draft_or_staged_sections,
 (SELECT count(*) FROM public.motorcycle_universal_published_sections_v1)
  AS actually_published_universal_sections;
