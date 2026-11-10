-- AnyBike 20-section universal history/generation editorial queue.
-- Read-only. 92 generation rows and 113 timeline rows currently require
-- explicit documentary review. Never infer a manufacturing date from an
-- announcement, or mix CRF1000L/CRF1100L and related motorcycle variants.
WITH records AS (
 SELECT 'generation' AS evidence_type,g.id,g.catalog_model_id,
        g.start_year AS source_year,g.end_year,g.source_url,
        g.verification_status,g.generation_name AS title
 FROM public.motorcycle_catalog_generations g
 UNION ALL
 SELECT 'timeline' AS evidence_type,t.id,t.catalog_model_id,
        t.event_year,t.event_year,t.source_url,
        t.verification_status,t.title
 FROM public.motorcycle_catalog_timeline_events t
), joined AS (
 SELECT r.*,m.manufacturer,m.model,
   EXISTS (SELECT 1 FROM public.motorcycle_universal_page_sections_v1 s
      WHERE s.entity_type='model' AND s.model_id=r.catalog_model_id)
     AS model_has_staging,
   CASE WHEN r.evidence_type='generation' THEN 6 ELSE 3 END
     AS suggested_research_slot
 FROM records r
 LEFT JOIN public.motorcycle_catalog_models m ON m.id=r.catalog_model_id
)
SELECT evidence_type,verification_status,
 count(*) AS records,
 count(DISTINCT catalog_model_id) AS canonical_models,
 count(*) FILTER(WHERE manufacturer IS NULL) AS missing_model_identity,
 count(*) FILTER(WHERE model_has_staging) AS model_already_staged,
 count(*) FILTER(WHERE source_url IS NULL OR source_url NOT LIKE 'https://%')
   AS missing_https_source,
 count(*) FILTER(WHERE title IS NULL OR trim(title)='') AS missing_title,
 count(*) FILTER(WHERE source_year<1885 OR source_year>extract(year from now())+2)
   AS suspicious_year
FROM joined GROUP BY evidence_type,verification_status
ORDER BY evidence_type,verification_status;

-- Model-by-model queue for editorial evidence review.
WITH source_rows AS (
 SELECT 'generation' AS category,g.id,g.catalog_model_id,
        g.start_year AS year,g.end_year,g.source_url,
        g.generation_name AS description,g.verification_status
 FROM public.motorcycle_catalog_generations g
 UNION ALL
 SELECT 'timeline',e.id,e.catalog_model_id,e.event_year,e.event_year,
        e.source_url,e.title,e.verification_status
 FROM public.motorcycle_catalog_timeline_events e
)
SELECT m.manufacturer,m.model,s.catalog_model_id,s.category,
 s.id AS source_record_id,s.year,s.end_year,s.description,
 s.source_url,s.verification_status,
 CASE WHEN s.verification_status<>'verified' THEN 'evidence_review_required'
      WHEN s.source_url IS NULL OR s.source_url NOT LIKE 'https://%'
           THEN 'source_url_review_required'
      ELSE 'source_verified_editorial_review_required' END
      AS next_action
FROM source_rows s
LEFT JOIN public.motorcycle_catalog_models m ON m.id=s.catalog_model_id
ORDER BY m.manufacturer,m.model,s.category,s.year,s.id;

-- No pending records may be called approved just because a draft section
-- already contains a similarly named generation or a timeline excerpt.
SELECT count(*) AS published_universal_sections
FROM public.motorcycle_universal_published_sections_v1;
