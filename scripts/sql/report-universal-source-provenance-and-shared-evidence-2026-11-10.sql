-- AnyBike provenance, exact-model and release-safety review (READ ONLY)
-- All staged model rows: source URLs, model-specific vs shared sources,
-- publication status, missing summaries and mismatched source references.
-- A shared manufacturer source is not inherently wrong: it requires a
-- per-claim, per-model verification, and is NEVER publication approval.
WITH notes AS (
 SELECT s.id AS section_id,s.model_id,m.manufacturer,m.model,
        s.section_number,s.editorial_status,s.published_at,s.source_reference,
        s.content->>'source_url' AS documentary_url,
        s.content->>'source_verification_status' AS source_status,
        s.content->>'editorial_status' AS content_editorial,
        s.content->>'summary' AS summary
 FROM public.motorcycle_universal_page_sections_v1 s
 JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
 WHERE s.entity_type='model'
), shared_source AS (
 SELECT documentary_url,count(DISTINCT model_id) AS cited_model_ids,
        count(*) AS cited_sections
 FROM notes WHERE documentary_url IS NOT NULL
 GROUP BY documentary_url
), checks AS (
 SELECT notes.*,coalesce(shared_source.cited_model_ids,0) AS cited_model_ids,
 CASE
 WHEN notes.editorial_status<>'draft' OR notes.published_at IS NOT NULL
      OR notes.content_editorial='published'
   THEN '00_publication_state_review'
 WHEN notes.documentary_url IS NOT NULL
      AND notes.documentary_url !~ '^https://[^[:space:]/@]+'
   THEN '01_unsafe_documentary_url'
 WHEN notes.documentary_url IS NOT NULL
      AND notes.source_reference !~ 'https://'
   THEN '02_source_reference_without_url'
 WHEN notes.documentary_url IS NOT NULL
      AND notes.source_reference NOT LIKE '%' || notes.documentary_url
   THEN '03_source_reference_url_mismatch'
 WHEN notes.documentary_url IS NOT NULL
      AND shared_source.cited_model_ids>=4
   THEN '04_shared_source_four_or_more_models'
 WHEN notes.documentary_url IS NOT NULL
      AND shared_source.cited_model_ids>=2
   THEN '05_shared_source_two_or_three_models'
 WHEN notes.documentary_url IS NOT NULL AND
      coalesce(notes.source_status,'pending_review') <> 'verified'
   THEN '06_single_model_documentary_source_pending'
 WHEN notes.documentary_url IS NOT NULL
   THEN '07_single_model_source_claims_need_editorial_review'
 WHEN nullif(btrim(notes.source_reference),'') IS NULL
   THEN '08_missing_source_reference'
 ELSE '09_legacy_or_structured_source_review'
 END AS review_lane
 FROM notes LEFT JOIN shared_source
 ON shared_source.documentary_url=notes.documentary_url
)
SELECT review_lane,count(*) AS sections,
       count(DISTINCT model_id) AS models,
       count(DISTINCT manufacturer) AS manufacturer_labels
FROM checks GROUP BY review_lane ORDER BY review_lane;

-- For precise corrective editorial work, reuse the CTEs above and replace
-- the final SELECT with this query (do NOT auto-approve or merge):
-- SELECT review_lane,manufacturer,model,model_id,section_number,section_id,
--        documentary_url,source_reference,source_status,cited_model_ids
-- FROM checks WHERE review_lane < '09_legacy_or_structured_source_review'
-- ORDER BY review_lane,manufacturer,model,model_id,section_number;
--
-- Research source verification, photo licensing and editorial release are
-- independent gates. Never turn a source URL into a published model guide.
