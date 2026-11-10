-- AnyBike canonical model research publication gap, 10 November 2026.
-- READ ONLY. Count staged drafts separately from content cleared for public display.
-- An HTTPS source URL, a complete section, or a cleared source audit alone
-- is NOT editorial approval. Do not automatically publish these records.
WITH sections AS (
 SELECT model_id,
  count(*) AS staged,
  count(*) FILTER (WHERE editorial_status='published' AND published_at IS NOT NULL) AS released,
  count(*) FILTER (WHERE editorial_status='draft') AS drafts,
  count(*) FILTER (WHERE coalesce(content->>'source_verification_status','')
    IN ('pending_review','pending_editorial_review')) AS explicitly_pending_review,
  count(*) FILTER (WHERE nullif(trim(source_reference),'') IS NULL) AS missing_source_reference
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model'
 GROUP BY model_id
), per_model AS (
 SELECT m.id,m.manufacturer,m.model,
  coalesce(s.staged,0) staged,
  coalesce(s.released,0) released,
  coalesce(s.drafts,0) drafts,
  coalesce(s.explicitly_pending_review,0) explicitly_pending_review,
  coalesce(s.missing_source_reference,0) missing_source_reference
 FROM public.motorcycle_catalog_models m
 LEFT JOIN sections s ON s.model_id=m.id
)
SELECT manufacturer,
 count(*) AS canonical_models,
 count(*) FILTER (WHERE staged>0) AS models_with_staged_research,
 count(*) FILTER (WHERE staged=0) AS models_not_started,
 sum(staged) AS staged_sections,
 sum(drafts) AS private_draft_sections,
 sum(explicitly_pending_review) AS explicitly_pending_review_sections,
 sum(missing_source_reference) AS missing_source_references,
 count(*) FILTER (WHERE released>0) AS models_with_released_research,
 sum(released) AS released_sections,
 sum(staged-released) AS staged_not_released_sections
FROM per_model
GROUP BY manufacturer
ORDER BY staged_not_released_sections DESC, canonical_models DESC, manufacturer;

-- Independently run this compact site-wide summary:
WITH sections AS (
 SELECT model_id,
  count(*) staged,
  count(*) FILTER (WHERE editorial_status='published' AND published_at IS NOT NULL) released,
  count(*) FILTER (WHERE editorial_status='draft') drafts,
  count(*) FILTER (WHERE coalesce(content->>'source_verification_status','')
   IN ('pending_review','pending_editorial_review')) explicitly_pending
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model' GROUP BY model_id
)
SELECT count(*) models,
 count(*) FILTER (WHERE coalesce(s.staged,0)>0) models_with_staging,
 count(*) FILTER (WHERE coalesce(s.staged,0)=0) models_without_staging,
 coalesce(sum(s.staged),0) staged_sections,
 coalesce(sum(s.drafts),0) private_drafts,
 coalesce(sum(s.explicitly_pending),0) explicitly_pending,
 coalesce(sum(s.released),0) published_sections
FROM public.motorcycle_catalog_models m
LEFT JOIN sections s ON s.model_id=m.id;

-- Public rendering remains independently gated by model identity, verified
-- fact/source scope, editorial approval, rights, stock entitlement and
-- template parity. This report changes neither pages nor database records.
