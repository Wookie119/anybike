-- Read-only AnyBike V2 model-data readiness. Run as an authorised admin only.
-- Preview approval and public indexing must NEVER be inferred from content counts.
WITH metrics AS (
 SELECT model_id,slug,preview_visible,
  jsonb_array_length(coalesce(editorial->'sections','[]'::jsonb)) AS research_sections,
  jsonb_array_length(coalesce(editorial#>'{production,generations}','[]'::jsonb)) AS documented_generations,
  jsonb_array_length(coalesce(editorial#>'{production,official_colours}','[]'::jsonb)) AS factory_colours,
  jsonb_array_length(coalesce(editorial#>'{production,specifications}','[]'::jsonb)) AS technical_specifications,
  jsonb_array_length(coalesce(editorial->'development_cards','[]'::jsonb)) AS engineering_cards,
  jsonb_array_length(coalesce(editorial->'related_model_links','[]'::jsonb)) AS related_model_links,
  jsonb_array_length(coalesce(editorial->'motorcycle_type_links','[]'::jsonb)) AS motorcycle_types,
  jsonb_array_length(coalesce(editorial->'action_links','[]'::jsonb)) AS customer_actions,
  jsonb_array_length(coalesce(editorial->'deep_dive','[]'::jsonb)) AS heritage_cards,
  coalesce(editorial->>'summary', editorial#>>'{hero,summary}','') AS summary
 FROM public.motorcycle_model_v2_editorial
)
SELECT model_id,slug,preview_visible,research_sections,documented_generations,
 factory_colours,technical_specifications,engineering_cards,related_model_links,
 motorcycle_types,customer_actions,heritage_cards,
 array_remove(ARRAY[
  CASE WHEN length(trim(summary))=0 THEN 'introduction' END,
  CASE WHEN documented_generations=0 THEN 'model years' END,
  CASE WHEN research_sections=0 AND heritage_cards=0 THEN 'research/heritage' END,
  CASE WHEN factory_colours=0 THEN 'factory colours' END,
  CASE WHEN technical_specifications=0 THEN 'technical specifications' END,
  CASE WHEN engineering_cards=0 THEN 'engineering/gallery cards' END,
  CASE WHEN related_model_links=0 THEN 'related model links' END,
  CASE WHEN motorcycle_types=0 THEN 'motorcycle type links' END,
  CASE WHEN customer_actions=0 THEN 'buyer/seller actions' END
 ],NULL)::text[] AS missing_data
FROM metrics ORDER BY cardinality(array_remove(ARRAY[
 CASE WHEN documented_generations=0 THEN 'years' END,
 CASE WHEN factory_colours=0 THEN 'colours' END,
 CASE WHEN technical_specifications=0 THEN 'specs' END,
 CASE WHEN related_model_links=0 THEN 'links' END
],NULL)) ASC,slug;
