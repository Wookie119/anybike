-- Read-only audit of the ONE universal V2 publication pipeline.
-- Run in Supabase SQL editor; this script never changes publication status.
WITH model_sections AS (
 SELECT s.*,m.id AS catalog_id,m.manufacturer AS catalog_make,m.model AS catalog_model
 FROM public.motorcycle_universal_page_sections_v1 s
 LEFT JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
 WHERE s.entity_type='model'
), duplicate_slots AS (
 SELECT model_id,section_number,count(*) n FROM model_sections
 GROUP BY 1,2 HAVING count(*)>1
)
SELECT count(*) AS draft_model_sections,
 count(distinct model_id) AS models_covered,
 count(*) FILTER(WHERE editorial_status='draft') AS draft_count,
 count(*) FILTER(WHERE catalog_id IS NULL) AS orphan_model_id,
 count(*) FILTER(WHERE section_number NOT BETWEEN 1 AND 20) AS invalid_section_number,
 count(*) FILTER(WHERE section_key IS DISTINCT FROM 'section_'||lpad(section_number::text,2,'0')) AS invalid_section_key,
 count(*) FILTER(WHERE content IS NULL OR content='{}'::jsonb OR content='null'::jsonb) AS empty_content,
 count(*) FILTER(WHERE nullif(btrim(source_reference),'') IS NULL) AS missing_source_reference,
 count(*) FILTER(WHERE source_reference ILIKE '%editorial_review_required%') AS explicit_review_required,
 count(*) FILTER(WHERE source_reference ILIKE '%http%') AS source_reference_with_url,
 count(*) FILTER(WHERE content ? 'source_url') AS content_with_source_url,
 (SELECT count(*) FROM duplicate_slots) AS duplicate_model_slots
FROM model_sections;

-- Separate public approval count: a draft is never published automatically.
SELECT entity_type,count(*) AS approved_section_rows,
 count(distinct entity_id) AS entities
FROM public.motorcycle_universal_published_sections_v1
GROUP BY entity_type ORDER BY entity_type;

-- Work queue for actual editorial review, one model and section per row.
SELECT s.model_id,m.manufacturer,m.model,s.section_number,s.section_key,
 s.section_title,s.editorial_status,s.source_reference,
 (s.source_reference ILIKE '%editorial_review_required%') AS explicit_review_required,
 (s.content ? 'source_url') AS has_content_source_url
FROM public.motorcycle_universal_page_sections_v1 s
JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
WHERE s.entity_type='model' AND s.editorial_status='draft'
ORDER BY (s.source_reference ILIKE '%editorial_review_required%') DESC,
 m.manufacturer,m.model,s.section_number;

-- Triage by source provenance. A source label does not confer approval.
SELECT split_part(source_reference,':',1) AS source_kind,
 count(*) AS draft_sections,count(distinct model_id) AS models,
 count(*) FILTER(WHERE source_reference ILIKE '%editorial_review_required%') AS explicit_source_hold,
 count(*) FILTER(WHERE content::text ILIKE '%pending_editorial_review%') AS pending_review_in_payload,
 count(*) FILTER(WHERE content::text ILIKE '%not_verified%') AS not_verified_in_payload
FROM public.motorcycle_universal_page_sections_v1
WHERE entity_type='model' AND editorial_status='draft'
GROUP BY 1 ORDER BY draft_sections DESC,source_kind;

-- Never mistake a source URL or a 'verified' field for publication approval.
-- Priority 1: explicit review markers; priority 2: unreviewed legacy editorial;
-- priority 3: other source-linked drafts.
SELECT s.model_id,m.manufacturer,m.model,s.section_number,s.section_title,
 CASE WHEN s.source_reference ILIKE '%editorial_review_required%'
           OR s.content::text ILIKE '%pending_editorial_review%'
           OR s.content::text ILIKE '%not_verified%'
      THEN 'HOLD: explicit review or verification marker'
      WHEN s.source_reference LIKE 'motorcycle_model_v2_editorial:%'
      THEN 'REVIEW: migrated V2 editorial draft'
      ELSE 'REVIEW: source-linked draft' END AS review_queue,
 s.source_reference
FROM public.motorcycle_universal_page_sections_v1 s
JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
WHERE s.entity_type='model' AND s.editorial_status='draft'
ORDER BY CASE WHEN s.source_reference ILIKE '%editorial_review_required%'
                   OR s.content::text ILIKE '%pending_editorial_review%'
                   OR s.content::text ILIKE '%not_verified%' THEN 0
              WHEN s.source_reference LIKE 'motorcycle_model_v2_editorial:%' THEN 1
              ELSE 2 END,
 m.manufacturer,m.model,s.section_number;

-- Source-linked batch: classify provenance without pretending URLs have been
-- fetched or factual claims approved. HTTPS syntax is not link validity.
WITH queued AS (
 SELECT s.*,
 CASE WHEN s.source_reference ILIKE '%editorial_review_required%'
           OR s.content::text ILIKE '%pending_editorial_review%'
           OR s.content::text ILIKE '%not_verified%' THEN 'hold'
      WHEN s.source_reference LIKE 'motorcycle_model_v2_editorial:%' THEN 'legacy'
      ELSE 'source' END AS bucket
 FROM public.motorcycle_universal_page_sections_v1 s
 WHERE s.entity_type='model' AND s.editorial_status='draft'
)
SELECT count(*) AS source_linked_sections,
 count(*) FILTER(WHERE content ? 'source_url') AS direct_source_urls,
 count(*) FILTER(WHERE content ? 'source_url' AND (content->>'source_url') ~ '^https://') AS https_source_urls,
 count(*) FILTER(WHERE content ? 'source_url' AND (content->>'source_url') !~ '^https://') AS non_https_source_urls,
 count(*) FILTER(WHERE source_reference LIKE 'harley-davidson-%@%') AS versioned_harley_page_sources,
 count(*) FILTER(WHERE source_reference LIKE 'motorcycle_catalog_facts:%') AS catalogue_fact_sources,
 count(*) FILTER(WHERE source_reference LIKE 'motorcycle_catalog_models.overview%') AS catalogue_overview_sources
FROM queued WHERE bucket='source';

-- Review the exact claim alongside its URL, year and canonical identity.
WITH queued AS (
 SELECT s.*,m.manufacturer,m.model,
 CASE WHEN s.source_reference ILIKE '%editorial_review_required%'
           OR s.content::text ILIKE '%pending_editorial_review%'
           OR s.content::text ILIKE '%not_verified%' THEN 'hold'
      WHEN s.source_reference LIKE 'motorcycle_model_v2_editorial:%' THEN 'legacy'
      ELSE 'source' END AS bucket
 FROM public.motorcycle_universal_page_sections_v1 s
 JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
 WHERE s.entity_type='model' AND s.editorial_status='draft'
)
SELECT model_id,manufacturer,model,section_number,section_title,
 content->>'source_url' AS exact_source_url,
 content->>'summary' AS claim_summary,source_reference
FROM queued
WHERE bucket='source' AND content ? 'source_url'
ORDER BY manufacturer,model,section_number;

-- Large-batch allocation: see source-linked research volume per manufacturer.
WITH queued AS (
 SELECT s.*,m.manufacturer,
 CASE WHEN s.source_reference ILIKE '%editorial_review_required%'
           OR s.content::text ILIKE '%pending_editorial_review%'
           OR s.content::text ILIKE '%not_verified%' THEN 'hold'
      WHEN s.source_reference LIKE 'motorcycle_model_v2_editorial:%' THEN 'legacy'
      ELSE 'source' END AS bucket
 FROM public.motorcycle_universal_page_sections_v1 s
 JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
 WHERE s.entity_type='model' AND s.editorial_status='draft'
)
SELECT manufacturer,count(*) AS source_linked_sections,
 count(distinct model_id) AS distinct_models,
 count(*) FILTER(WHERE content ? 'source_url') AS direct_urls
FROM queued WHERE bucket='source'
GROUP BY manufacturer ORDER BY source_linked_sections DESC,manufacturer;

-- Source-reference completeness, all manufacturer batches. A valid URL
-- is not a fetched source, factual verification, or publication permission.
WITH queued AS (
 SELECT s.*,m.manufacturer,m.model,
 CASE WHEN s.source_reference ILIKE '%editorial_review_required%'
           OR s.content::text ILIKE '%pending_editorial_review%'
           OR s.content::text ILIKE '%not_verified%' THEN 'hold'
      WHEN s.source_reference LIKE 'motorcycle_model_v2_editorial:%' THEN 'legacy'
      ELSE 'source' END AS bucket
 FROM public.motorcycle_universal_page_sections_v1 s
 JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
 WHERE s.entity_type='model' AND s.editorial_status='draft'
)
SELECT manufacturer,count(*) AS source_queue_sections,
 count(*) FILTER(WHERE content ? 'source_url') AS explicit_url_sections,
 count(*) FILTER(WHERE content ? 'source_url'
   AND nullif(btrim(content->>'summary'),'') IS NULL) AS missing_summary,
 count(*) FILTER(WHERE content ? 'source_url'
   AND nullif(btrim(content->>'source_name'),'') IS NULL) AS missing_source_name,
 count(*) FILTER(WHERE content ? 'source_url'
   AND (content->>'source_url') !~ '^https://') AS invalid_https_syntax
FROM queued WHERE bucket='source'
GROUP BY manufacturer ORDER BY source_queue_sections DESC,manufacturer;

-- KTM-specific editorial queue: keep distinct variants, source dates,
-- optional equipment, and year-scoped specifications under review.
SELECT s.model_id,m.model,s.section_number,s.section_title,
 s.content->>'source_url' AS source_url,
 s.content->>'summary' AS summary,
 s.source_reference
FROM public.motorcycle_universal_page_sections_v1 s
JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
WHERE s.entity_type='model' AND s.editorial_status='draft'
 AND m.manufacturer='KTM'
 AND s.source_reference NOT LIKE 'motorcycle_model_v2_editorial:%'
ORDER BY m.model,s.section_number;
