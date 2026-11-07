-- BMW trim/equipment safety audit — read-only. These variants are NOT
-- automatically distinct public models or eligible to inherit parent research.
WITH variants AS (
 SELECT slug,preview_visible,editorial->>'model' AS model,
  editorial->'parent_navigation_metadata' AS parent_info,
  coalesce(editorial->'action_links','[]'::jsonb) AS actions,
  coalesce(editorial->'related_model_links','[]'::jsonb) AS related
 FROM public.motorcycle_model_v2_editorial
 WHERE editorial->>'make'='BMW' AND editorial->'parent_navigation_metadata' IS NOT NULL
), checks AS (
 SELECT *,
  jsonb_array_length(related)=1 AND EXISTS (
   SELECT 1 FROM jsonb_array_elements(related) link
   WHERE link->>'url'=(
    SELECT replace(parent.editorial#>>'{page_metadata,canonical_url}','https://www.anybike.co.uk','')
    FROM public.motorcycle_model_v2_editorial parent
    WHERE parent.slug=variants.parent_info->>'parent_slug'
   )
  ) AS valid_parent_navigation,
  EXISTS (SELECT 1 FROM jsonb_array_elements(actions) a
   WHERE a->>'id'='ukSelling' AND a->>'url' LIKE '/uk-motorcycle-selling.html%') AS uk_selling,
  EXISTS (SELECT 1 FROM jsonb_array_elements(actions) a
   WHERE a->>'id'='internationalSourcing'
    AND a->>'url'='/bulk-buying-request.html?make=BMW&model='||replace(model,' ','%20')) AS exact_trim_sourcing,
  parent_info->>'inherit_stock'='false' AND
  parent_info->>'inherit_photography'='false' AND
  parent_info->>'inherit_specifications'='false' AS inheritance_blocked
 FROM variants
)
SELECT count(*) AS mapped_trims,
 count(*) FILTER(WHERE valid_parent_navigation) AS parent_links_verified,
 count(*) FILTER(WHERE uk_selling AND exact_trim_sourcing) AS both_actions_verified,
 count(*) FILTER(WHERE inheritance_blocked) AS correctly_isolated,
 count(*) FILTER(WHERE preview_visible) AS inadvertently_preview_enabled,
 count(*) FILTER(WHERE NOT valid_parent_navigation OR NOT exact_trim_sourcing OR NOT uk_selling OR NOT inheritance_blocked) AS failed_trims
FROM checks;
