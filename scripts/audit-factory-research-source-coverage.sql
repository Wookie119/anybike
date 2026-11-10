-- AnyBike factory research source and identity QA (read-only)
-- Intended for repeatable large-batch pre-publication checks.
-- Results are review queues, never commands to publish or merge.

-- Research/source coverage per manufacturer.
WITH per_model AS (
 SELECT m.id,m.manufacturer,m.model,m.motorcycle_type,
   count(DISTINCT s.id) AS drafts,
   count(DISTINCT i.source_url) AS sources
 FROM public.motorcycle_catalog_models m
 LEFT JOIN public.motorcycle_universal_page_sections_v1 s
   ON s.entity_type='model' AND s.model_id=m.id
 LEFT JOIN public.motorcycle_catalog_editorial_source_index i
   ON i.model_id=m.id
 GROUP BY m.id
)
SELECT manufacturer,count(*) AS models,
 count(*) FILTER (WHERE drafts>0) AS researched,
 count(*) FILTER (WHERE drafts=0) AS awaiting_sources,
 count(*) FILTER (WHERE sources>0) AS with_indexed_sources,
 count(*) FILTER (WHERE sources=0 AND drafts>0) AS unindexed_research,
 count(*) FILTER (WHERE nullif(trim(motorcycle_type),'') IS NULL) AS missing_type,
 sum(drafts) AS section_drafts
FROM per_model GROUP BY manufacturer
ORDER BY awaiting_sources DESC,manufacturer;

-- Each model-year record must have a source index entry, or appear in this queue.
SELECT s.model_id,m.manufacturer,m.model,s.section_number,s.section_title,
       s.content->>'model_year_scope' AS model_year_scope,
       s.content->>'source_url' AS source_url
FROM public.motorcycle_universal_page_sections_v1 s
JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
LEFT JOIN public.motorcycle_catalog_editorial_source_index i
 ON i.model_id=s.model_id AND i.source_url=s.content->>'source_url'
WHERE s.entity_type='model'
 AND s.content ? 'source_url'
 AND s.content->>'source_url' LIKE 'https://%'
 AND i.model_id IS NULL
ORDER BY m.manufacturer,m.model,s.section_number;

-- Caution: the same model family may have multiple real production generations.
-- These spacing-only matches are candidates for human identity review, not automatic merges.
SELECT a.manufacturer,a.id AS first_id,a.model AS first_model,
       b.id AS second_id,b.model AS second_model
FROM public.motorcycle_catalog_models a
JOIN public.motorcycle_catalog_models b
 ON a.id<b.id AND lower(trim(a.manufacturer))=lower(trim(b.manufacturer))
 AND regexp_replace(lower(a.model),'[^a-z0-9]','','g')=
     regexp_replace(lower(b.model),'[^a-z0-9]','','g')
ORDER BY a.manufacturer,a.model;

-- Check newly imported source notes remain draft and publication-isolated.
SELECT s.editorial_status,
 count(*) AS sections,
 count(*) FILTER(WHERE s.published_at IS NOT NULL) AS dated,
 count(*) FILTER(WHERE NOT EXISTS(
   SELECT 1 FROM public.motorcycle_catalog_editorial_source_index i
   WHERE i.model_id=s.model_id AND i.source_url=s.content->>'source_url'
 )) AS missing_index
FROM public.motorcycle_universal_page_sections_v1 s
WHERE s.source_reference LIKE 'manufacturer_primary_source:%'
   OR s.source_reference LIKE 'official_factory_source:%'
GROUP BY s.editorial_status ORDER BY s.editorial_status;

-- Public publication gate: only explicitly eligible rows should be returned.
SELECT count(*) AS total_public_rows,
 count(*) FILTER (WHERE publication_eligible IS NOT TRUE) AS invalid_public_rows,
 count(*) FILTER (WHERE published_at > now()) AS future_dated_public_rows
FROM public.motorcycle_universal_published_sections_v1;
