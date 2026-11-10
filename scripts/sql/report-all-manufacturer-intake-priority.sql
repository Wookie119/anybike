-- AnyBike batch population queue across the entire manufacturer catalogue.
-- READ ONLY: no INSERT/UPDATE/DELETE and no claim of source review approval.
-- Canonical IDs are never changed; all source and alias conflicts remain
-- in the review queue until a person explicitly approves their meaning.
WITH registry AS (
 SELECT display_name FROM public.motorcycle_catalog_manufacturers
), pending_aliases AS (
 SELECT alias_model_id FROM public.motorcycle_catalog_model_aliases
 WHERE review_status<>'approved'
), colliding_names AS (
 SELECT lower(regexp_replace(manufacturer,'[^a-z0-9]','','gi')) manufacturer_key,
        lower(regexp_replace(model,'[^a-z0-9]','','gi')) model_key
 FROM public.motorcycle_catalog_models
 GROUP BY 1,2 HAVING count(*)>1
), staged AS (
 SELECT model_id,count(*) section_count FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model' GROUP BY model_id
), issues AS (
 SELECT m.id,m.manufacturer,m.model,
  EXISTS (SELECT 1 FROM registry r WHERE r.display_name=m.manufacturer)
    AS exact_registry_name,
  EXISTS(SELECT 1 FROM pending_aliases a WHERE a.alias_model_id=m.id)
    AS pending_alias,
  EXISTS(SELECT 1 FROM colliding_names c
    WHERE c.manufacturer_key=lower(regexp_replace(m.manufacturer,'[^a-z0-9]','','gi'))
      AND c.model_key=lower(regexp_replace(m.model,'[^a-z0-9]','','gi')))
    AS colliding_model_name,
  m.model ~* '(apr|representative|finance|financing|deposit|monthly payment|pcp|[0-9]+([.][0-9]+)?[[:space:]]*%)'
    AS possible_marketing_label,
  nullif(trim(m.overview),'') IS NOT NULL AS has_overview_source_candidate,
  m.specifications IS NOT NULL AND m.specifications <> '{}'::jsonb
    AS has_specification_source_candidate,
  coalesce(s.section_count,0) AS staged_sections
 FROM public.motorcycle_catalog_models m
 LEFT JOIN staged s ON s.model_id=m.id
)
SELECT id AS model_id,manufacturer,model,
 CASE
  WHEN NOT exact_registry_name OR pending_alias OR colliding_model_name OR possible_marketing_label
    THEN 'identity_review'
  WHEN staged_sections>0 THEN 'existing_draft_review'
  WHEN has_overview_source_candidate OR has_specification_source_candidate
    THEN 'source_verification'
  ELSE 'research_required'
 END AS next_workstream,
 staged_sections,has_overview_source_candidate,has_specification_source_candidate,
 NOT exact_registry_name AS manufacturer_mismatch,
 pending_alias,colliding_model_name,possible_marketing_label
FROM issues ORDER BY
 CASE
  WHEN NOT exact_registry_name OR pending_alias OR colliding_model_name OR possible_marketing_label THEN 1
  WHEN has_overview_source_candidate OR has_specification_source_candidate THEN 2
  WHEN staged_sections>0 THEN 3
  ELSE 4 END,
 manufacturer,model,id;

-- Summaries are source-intake work, NOT completed universal pages.
WITH registry AS (SELECT display_name FROM public.motorcycle_catalog_manufacturers),
 pending_aliases AS (
 SELECT alias_model_id FROM public.motorcycle_catalog_model_aliases
 WHERE review_status<>'approved'
), colliding_names AS (
 SELECT lower(regexp_replace(manufacturer,'[^a-z0-9]','','gi')) manufacturer_key,
        lower(regexp_replace(model,'[^a-z0-9]','','gi')) model_key
 FROM public.motorcycle_catalog_models GROUP BY 1,2 HAVING count(*)>1
), staged AS (
 SELECT model_id,count(*) sections
 FROM public.motorcycle_universal_page_sections_v1 WHERE entity_type='model'
 GROUP BY model_id
), flagged AS (
 SELECT m.id,m.manufacturer,
 CASE
  WHEN NOT EXISTS(SELECT 1 FROM registry r WHERE r.display_name=m.manufacturer)
   OR EXISTS(SELECT 1 FROM pending_aliases a WHERE a.alias_model_id=m.id)
   OR EXISTS(SELECT 1 FROM colliding_names c WHERE
       c.manufacturer_key=lower(regexp_replace(m.manufacturer,'[^a-z0-9]','','gi'))
       AND c.model_key=lower(regexp_replace(m.model,'[^a-z0-9]','','gi')))
   OR m.model ~* '(apr|representative|finance|financing|deposit|monthly payment|pcp|[0-9]+([.][0-9]+)?[[:space:]]*%)'
  THEN 'identity_review'
  WHEN coalesce(s.sections,0)>0 THEN 'existing_draft_review'
  WHEN nullif(trim(m.overview),'') IS NOT NULL OR
       (m.specifications IS NOT NULL AND m.specifications <> '{}'::jsonb)
  THEN 'source_verification'
  ELSE 'research_required' END AS workstream
 FROM public.motorcycle_catalog_models m LEFT JOIN staged s ON s.model_id=m.id
)
SELECT workstream,count(*) AS model_records,count(DISTINCT manufacturer) AS manufacturer_labels
FROM flagged GROUP BY workstream ORDER BY workstream;
