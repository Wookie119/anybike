-- AnyBike universal motorcycle model publication audit
-- READ ONLY. Run in the AnyBike Supabase SQL editor or via a read-only CI role.
-- Publication eligibility is never implied by the presence of a staged row.
-- Do not treat empty section slots, model names or importer aliases as factual editorial content.

-- 1. Catalogue coverage and evidence gaps, by manufacturer.
WITH coverage AS (
  SELECT m.id, m.manufacturer, m.model, m.slug, m.motorcycle_type,
         count(s.id) AS staged_sections
  FROM public.motorcycle_catalog_models m
  LEFT JOIN public.motorcycle_universal_page_sections_v1 s
    ON s.entity_type='model' AND s.model_id=m.id
  GROUP BY m.id
)
SELECT manufacturer,
       count(*) AS catalog_models,
       count(*) FILTER (WHERE staged_sections>0) AS models_with_staged_research,
       count(*) FILTER (WHERE staged_sections=0) AS models_awaiting_documented_research,
       count(*) FILTER (WHERE nullif(trim(motorcycle_type),'') IS NULL) AS missing_motorcycle_type,
       sum(staged_sections) AS staged_section_rows
FROM coverage
GROUP BY manufacturer
ORDER BY models_awaiting_documented_research DESC, manufacturer;

-- 2. Safety assertions: every result should be ZERO.
WITH safety_checks AS (
 SELECT 'duplicate_model_section_positions' AS issue, count(*) AS violations
 FROM (
  SELECT model_id, section_number
  FROM public.motorcycle_universal_page_sections_v1
  WHERE entity_type='model'
  GROUP BY model_id,section_number HAVING count(*)>1
 ) d
 UNION ALL
 SELECT 'orphan_model_sections',count(*)
 FROM public.motorcycle_universal_page_sections_v1 s
 LEFT JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
 WHERE s.entity_type='model' AND m.id IS NULL
 UNION ALL
 SELECT 'out_of_range_section_numbers',count(*)
 FROM public.motorcycle_universal_page_sections_v1
 WHERE section_number NOT BETWEEN 1 AND 20
 UNION ALL
 SELECT 'model_sections_without_source_reference',count(*)
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model' AND nullif(trim(source_reference),'') IS NULL
 UNION ALL
 SELECT 'unapproved_rows_in_published_view',count(*)
 FROM public.motorcycle_universal_published_sections_v1
 WHERE publication_eligible IS NOT TRUE
 UNION ALL
 SELECT 'future_dated_rows_in_published_view',count(*)
 FROM public.motorcycle_universal_published_sections_v1
 WHERE published_at > now()
 UNION ALL
 SELECT 'missing_model_slugs',count(*)
 FROM public.motorcycle_catalog_models WHERE nullif(trim(slug),'') IS NULL
 UNION ALL
 SELECT 'duplicate_exact_model_names',count(*)
 FROM (
  SELECT lower(trim(manufacturer)),lower(trim(model))
  FROM public.motorcycle_catalog_models GROUP BY 1,2 HAVING count(*)>1
 ) d
 UNION ALL
 SELECT 'duplicate_manufacturer_slugs',count(*)
 FROM (
  SELECT lower(trim(manufacturer)),lower(trim(slug))
  FROM public.motorcycle_catalog_models GROUP BY 1,2 HAVING count(*)>1
 ) d
)
SELECT * FROM safety_checks ORDER BY issue;

-- 3. Model IDs with no documented research sections: intake queue,
-- NOT publishable content. No synthetic facts, timelines, imagery or URLs.
SELECT m.id AS catalog_model_id,m.manufacturer,m.model,m.slug,
       m.motorcycle_type,
       CASE WHEN nullif(trim(m.motorcycle_type),'') IS NULL
            THEN 'verify type and exact model identity'
            ELSE 'obtain exact-model/year official documentary source'
       END AS next_research_action
FROM public.motorcycle_catalog_models m
WHERE NOT EXISTS (
 SELECT 1 FROM public.motorcycle_universal_page_sections_v1 s
 WHERE s.entity_type='model' AND s.model_id=m.id
)
ORDER BY m.manufacturer,m.model,m.id;

-- 4. Publication ledger. Drafts MUST NOT become published automatically.
SELECT s.editorial_status,count(*) AS sections,
       count(*) FILTER (WHERE s.published_at IS NOT NULL) AS with_publication_date
FROM public.motorcycle_universal_page_sections_v1 s
GROUP BY s.editorial_status ORDER BY s.editorial_status;

-- 5. Similar names are only review candidates, not duplicates by definition.
-- This identifies obvious spacing/case variants without merging identities.
SELECT a.manufacturer,a.id AS left_id,a.model AS left_model,
       b.id AS right_id,b.model AS right_model
FROM public.motorcycle_catalog_models a
JOIN public.motorcycle_catalog_models b
  ON a.id<b.id
 AND lower(trim(a.manufacturer))=lower(trim(b.manufacturer))
 AND regexp_replace(lower(a.model),'[^a-z0-9]','','g')
     =regexp_replace(lower(b.model),'[^a-z0-9]','','g')
ORDER BY a.manufacturer,a.model,b.model;
