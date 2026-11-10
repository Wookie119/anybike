-- AnyBike exact model-identity exceptions — READ ONLY.
-- No automatic merge, rename, marketing-title cleanup, or manufacturer
-- registry writes. Every exception needs an independent editorial decision.
WITH aliases AS (
 SELECT a.alias_model_id,
  count(*) FILTER(WHERE a.review_status<>'approved') AS pending_alias_count,
  string_agg(DISTINCT a.canonical_model_id::text,', ' ORDER BY a.canonical_model_id::text)
   FILTER(WHERE a.review_status<>'approved') AS proposed_canonical_ids
 FROM public.motorcycle_catalog_model_aliases a GROUP BY a.alias_model_id
), exceptions AS (
 SELECT m.id,m.manufacturer,m.model,
  CASE WHEN r.display_name IS NULL THEN true ELSE false END AS unregistered_manufacturer_label,
  coalesce(a.pending_alias_count,0) AS pending_alias_count,
  a.proposed_canonical_ids,
  CASE WHEN m.model ~* '(APR Representative|finance|% APR| PCP )'
   THEN true ELSE false END AS possible_finance_marketing_title
 FROM public.motorcycle_catalog_models m
 LEFT JOIN public.motorcycle_catalog_manufacturers r ON r.display_name=m.manufacturer
 LEFT JOIN aliases a ON a.alias_model_id=m.id
 WHERE r.display_name IS NULL OR coalesce(a.pending_alias_count,0)>0
)
SELECT manufacturer,id AS exact_model_id,model,
 unregistered_manufacturer_label,pending_alias_count,
 proposed_canonical_ids,possible_finance_marketing_title
FROM exceptions ORDER BY manufacturer,model,id;
-- Do not use string or punctuation similarity as merge approval.
-- All 17 identities need explicit evidence before registry/alias changes.
