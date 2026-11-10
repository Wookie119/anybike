-- AnyBike all-manufacturer MODEL RELEASE QUEUE, READ ONLY.
-- Global overview across all 979 canonical catalogue model IDs.
-- This is a release *blocker* inventory, not a command to publish drafts.
-- Source links, stage presence and photo count NEVER mean editorial approval.
-- Uses canonical model IDs for all joins; manufacturer/model labels are only
-- for presentation and identity-conflict detection.
WITH registry AS (
 SELECT display_name FROM public.motorcycle_catalog_manufacturers
), alias_review AS (
 SELECT alias_model_id FROM public.motorcycle_catalog_model_aliases
 WHERE review_status <> 'approved'
), collisions AS (
 SELECT lower(regexp_replace(manufacturer,'[^a-z0-9]','','gi')) make_key,
        lower(regexp_replace(model,'[^a-z0-9]','','gi')) model_key
 FROM public.motorcycle_catalog_models GROUP BY 1,2 HAVING count(*) > 1
), sections AS (
 SELECT model_id,
   count(*) AS staged_sections,
   count(*) FILTER (WHERE editorial_status='published') AS approved_staging_sections,
   count(*) FILTER (WHERE editorial_status='draft') AS draft_sections,
   count(*) FILTER (WHERE content IS NULL OR content='{}'::jsonb) AS blank_sections,
   count(*) FILTER (
     WHERE jsonb_typeof(content->'photography')='object'
       AND (content-'photography')='{}'::jsonb
   ) AS rights_only_references,
   count(*) FILTER(
     WHERE content ? 'source_blocks'
       AND (content-'source_blocks')='{}'::jsonb
   ) AS source_import_only,
   count(*) FILTER(
     WHERE content->'engineering'->>'verification_status'='pending_editorial_review'
   ) AS pending_engineering
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model' GROUP BY model_id
), source_facts AS (
 SELECT f.catalog_model_id,
   count(*) AS source_facts,
   count(*) FILTER (WHERE f.verification_status='verified') AS verified_facts,
   count(*) FILTER (
     WHERE f.verification_status='verified' AND
       a.fact_id IS NOT NULL AND
       a.source_url=f.source_url AND f.source_url LIKE 'https://%'
       AND nullif(trim(a.verification_basis),'') IS NOT NULL
       AND a.checked_at IS NOT NULL AND a.checked_at<=now()
   ) AS fully_audited_facts,
   count(*) FILTER (
     WHERE f.verification_status='verified' AND a.fact_id IS NULL
   ) AS missing_audits,
   count(*) FILTER (
     WHERE f.verification_status='verified' AND a.fact_id IS NOT NULL
      AND a.source_url IS DISTINCT FROM f.source_url
   ) AS mismatched_audits
 FROM public.motorcycle_catalog_facts f
 LEFT JOIN public.motorcycle_catalog_fact_verification_audit a
  ON a.fact_id=f.id
 GROUP BY f.catalog_model_id
), history AS (
 SELECT catalog_model_id,count(*) AS unresolved_history
 FROM (
   SELECT catalog_model_id FROM public.motorcycle_catalog_generations
   WHERE verification_status<>'verified'
   UNION ALL
   SELECT catalog_model_id FROM public.motorcycle_catalog_timeline_events
   WHERE verification_status<>'verified'
 ) x GROUP BY catalog_model_id
), photos AS (
 SELECT manufacturer,model,count(*) AS approved_with_complete_rights
 FROM public.anybike_editorial_photo_bank
 WHERE approval_status='approved'
 AND image_url LIKE 'https://%'
 AND source_page_url LIKE 'https://%'
 AND licence_url LIKE 'https://%'
 AND nullif(trim(licence),'') IS NOT NULL
 AND nullif(trim(attribution),'') IS NOT NULL
 GROUP BY manufacturer,model
), combined AS (
 SELECT m.id,m.manufacturer,m.model,
  NOT EXISTS(SELECT 1 FROM registry r WHERE r.display_name=m.manufacturer)
   AS registry_name_mismatch,
  EXISTS(SELECT 1 FROM alias_review a WHERE a.alias_model_id=m.id)
   AS alias_review_required,
  EXISTS(SELECT 1 FROM collisions x
    WHERE x.make_key=lower(regexp_replace(m.manufacturer,'[^a-z0-9]','','gi'))
    AND x.model_key=lower(regexp_replace(m.model,'[^a-z0-9]','','gi')))
   AS normalized_model_collision,
  m.model ~* '(^|[^[:alnum:]])(apr|representative|finance|financing|deposit|monthly payment|pcp)([^[:alnum:]]|$)|[0-9]+([.][0-9]+)?[[:space:]]*%'
   AS promotional_model_label,
  coalesce(s.staged_sections,0) staged_sections,
  coalesce(s.approved_staging_sections,0) approved_staging_sections,
  coalesce(s.draft_sections,0) draft_sections,
  coalesce(s.blank_sections,0) blank_sections,
  coalesce(s.rights_only_references,0) rights_only_references,
  coalesce(s.source_import_only,0) source_import_only,
  coalesce(s.pending_engineering,0) pending_engineering,
  coalesce(sf.source_facts,0) source_facts,
  coalesce(sf.verified_facts,0) verified_facts,
  coalesce(sf.fully_audited_facts,0) fully_audited_facts,
  coalesce(sf.missing_audits,0) missing_audits,
  coalesce(sf.mismatched_audits,0) mismatched_audits,
  coalesce(h.unresolved_history,0) unresolved_history,
  coalesce(p.approved_with_complete_rights,0) rights_verified_photos
 FROM public.motorcycle_catalog_models m
 LEFT JOIN sections s ON s.model_id=m.id
 LEFT JOIN source_facts sf ON sf.catalog_model_id=m.id
 LEFT JOIN history h ON h.catalog_model_id=m.id
 LEFT JOIN photos p ON p.manufacturer=m.manufacturer AND p.model=m.model
)
SELECT id AS canonical_model_id,manufacturer,model,
 staged_sections,draft_sections,approved_staging_sections,
 verified_facts,fully_audited_facts,missing_audits,mismatched_audits,
 unresolved_history,pending_engineering,blank_sections,rights_only_references,
 source_import_only,rights_verified_photos,
 registry_name_mismatch,alias_review_required,normalized_model_collision,
 promotional_model_label,
 CASE WHEN registry_name_mismatch OR alias_review_required
   OR normalized_model_collision OR promotional_model_label
   THEN 'identity_review'
  WHEN staged_sections=0 THEN 'research_not_staged'
  WHEN draft_sections>0 OR approved_staging_sections<staged_sections
   THEN 'editorial_draft_review'
  WHEN missing_audits>0 OR mismatched_audits>0 OR unresolved_history>0
   OR pending_engineering>0 OR blank_sections>0 OR rights_only_references>0
   OR source_import_only>0 THEN 'evidence_or_rights_review'
  ELSE 'manual_release_review_required'
 END AS next_review_stage
FROM combined
ORDER BY manufacturer,model,id;

-- A compact count-only cross-manufacturer launch pulse.
WITH all_models AS (
 SELECT m.id,m.manufacturer,
  EXISTS(SELECT 1 FROM public.motorcycle_universal_page_sections_v1 s
   WHERE s.entity_type='model' AND s.model_id=m.id) has_staged_research,
  EXISTS(SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
   JOIN public.motorcycle_catalog_facts f ON f.id=a.fact_id
   WHERE f.catalog_model_id=m.id AND f.verification_status='verified'
    AND a.source_url=f.source_url) has_source_audit
 FROM public.motorcycle_catalog_models m
)
SELECT count(*) AS canonical_models,
 count(DISTINCT manufacturer) AS catalogue_manufacturer_labels,
 count(*) FILTER(WHERE has_staged_research) AS staged_model_ids,
 count(*) FILTER(WHERE NOT has_staged_research) AS models_without_staged_research,
 count(*) FILTER(WHERE has_source_audit) AS models_with_consistent_fact_audit,
 (SELECT count(*) FROM public.motorcycle_universal_page_sections_v1) AS staged_sections,
 (SELECT count(*) FROM public.motorcycle_universal_published_sections_v1)
  AS public_universal_sections
FROM all_models;
