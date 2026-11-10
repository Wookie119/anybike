-- AnyBike ALL-MANUFACTURER research dashboard. READ ONLY.
-- Covers canonical model IDs, all registered manufacturer names, staged
-- sections, source verification and identity blockers in one pass.
-- This is an editorial queue, NOT a release/publication gate bypass.
WITH base AS (
 SELECT m.id,m.manufacturer,m.model,
  nullif(trim(m.overview),'') IS NOT NULL AS has_overview,
  m.specifications IS NOT NULL AND m.specifications<>'{}'::jsonb AS has_specifications
 FROM public.motorcycle_catalog_models m
), registry AS (
 SELECT display_name FROM public.motorcycle_catalog_manufacturers
), alias_review AS (
 SELECT alias_model_id FROM public.motorcycle_catalog_model_aliases
 WHERE review_status<>'approved'
), collisions AS (
 SELECT lower(regexp_replace(manufacturer,'[^a-z0-9]','','gi')) make_key,
  lower(regexp_replace(model,'[^a-z0-9]','','gi')) model_key
 FROM base GROUP BY 1,2 HAVING count(*)>1
), staged AS (
 SELECT model_id,count(*) sections
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model' GROUP BY model_id
), sources AS (
 SELECT model_id,count(*) source_count,
  count(*) FILTER(WHERE verification_status IN ('verified','approved'))
   AS verified_sources,
  count(*) FILTER(WHERE verification_status NOT IN ('verified','approved'))
   AS pending_sources
 FROM public.motorcycle_catalog_editorial_source_index GROUP BY model_id
), classified AS (
 SELECT b.id,b.manufacturer,b.model,
  coalesce(st.sections,0) staged_sections,
  coalesce(src.source_count,0) indexed_sources,
  coalesce(src.verified_sources,0) verified_sources,
  coalesce(src.pending_sources,0) pending_sources,
  CASE
   WHEN NOT EXISTS(SELECT 1 FROM registry r WHERE r.display_name=b.manufacturer)
    OR EXISTS(SELECT 1 FROM alias_review a WHERE a.alias_model_id=b.id)
    OR EXISTS(SELECT 1 FROM collisions c
      WHERE c.make_key=lower(regexp_replace(b.manufacturer,'[^a-z0-9]','','gi'))
       AND c.model_key=lower(regexp_replace(b.model,'[^a-z0-9]','','gi')))
    OR b.model ~* '(^|[^[:alnum:]])(apr|representative|finance|financing|deposit|monthly payment|pcp)([^[:alnum:]]|$)|[0-9]+([.][0-9]+)?[[:space:]]*%'
   THEN 'identity_review'
   WHEN coalesce(st.sections,0)>0 THEN 'existing_draft_review'
   WHEN b.has_overview OR b.has_specifications OR coalesce(src.source_count,0)>0
   THEN 'source_verification'
   ELSE 'research_required' END AS workstream
 FROM base b
 LEFT JOIN staged st ON st.model_id=b.id
 LEFT JOIN sources src ON src.model_id=b.id
)
SELECT manufacturer,count(*) catalogue_model_ids,
 count(*) FILTER(WHERE workstream='identity_review') identity_review,
 count(*) FILTER(WHERE workstream='existing_draft_review') existing_draft_review,
 count(*) FILTER(WHERE workstream='source_verification') source_verification,
 count(*) FILTER(WHERE workstream='research_required') research_required,
 sum(staged_sections) staged_sections,
 sum(indexed_sources) indexed_source_links,
 sum(verified_sources) verified_source_links,
 sum(pending_sources) pending_source_links
FROM classified GROUP BY manufacturer
ORDER BY catalogue_model_ids DESC,manufacturer;

-- Explicit summary: use this to reconcile total models with the local
-- all-brand JavaScript planner. Counts must sum to every catalogue model ID.
WITH base AS (
 SELECT m.id,m.manufacturer,m.model,
  nullif(trim(m.overview),'') IS NOT NULL AS has_overview,
  m.specifications IS NOT NULL AND m.specifications<>'{}'::jsonb AS has_specs
 FROM public.motorcycle_catalog_models m
), collisions AS (
 SELECT lower(regexp_replace(manufacturer,'[^a-z0-9]','','gi')) make_key,
  lower(regexp_replace(model,'[^a-z0-9]','','gi')) model_key
 FROM base GROUP BY 1,2 HAVING count(*)>1
), staged AS (
 SELECT model_id,count(*) n FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model' GROUP BY model_id
), sources AS (
 SELECT model_id,count(*) n FROM public.motorcycle_catalog_editorial_source_index
 GROUP BY model_id
), statuses AS (
 SELECT CASE
 WHEN NOT EXISTS(SELECT 1 FROM public.motorcycle_catalog_manufacturers r
    WHERE r.display_name=b.manufacturer)
  OR EXISTS(SELECT 1 FROM public.motorcycle_catalog_model_aliases a
     WHERE a.alias_model_id=b.id AND a.review_status<>'approved')
  OR EXISTS(SELECT 1 FROM collisions c
     WHERE c.make_key=lower(regexp_replace(b.manufacturer,'[^a-z0-9]','','gi'))
      AND c.model_key=lower(regexp_replace(b.model,'[^a-z0-9]','','gi')))
  OR b.model ~* '(^|[^[:alnum:]])(apr|representative|finance|financing|deposit|monthly payment|pcp)([^[:alnum:]]|$)|[0-9]+([.][0-9]+)?[[:space:]]*%'
 THEN 'identity_review'
 WHEN coalesce(st.n,0)>0 THEN 'existing_draft_review'
 WHEN b.has_overview OR b.has_specs OR coalesce(src.n,0)>0
 THEN 'source_verification' ELSE 'research_required' END status
 FROM base b
 LEFT JOIN staged st ON st.model_id=b.id
 LEFT JOIN sources src ON src.model_id=b.id
)
SELECT status,count(*) model_ids FROM statuses GROUP BY 1 ORDER BY 1;
