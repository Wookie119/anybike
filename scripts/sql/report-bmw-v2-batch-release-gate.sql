-- AnyBike BMW universal 13-section release gate — READ ONLY.
-- Report content readiness separately from photo rights, source review,
-- browser QA and explicit publication approval. Never flip preview_visible.
-- No missing section may be filled by data copied from another BMW model.
WITH editorial AS (
 SELECT slug,preview_visible,editorial,
  editorial->>'make' AS make,editorial->>'model' AS model,
  coalesce(editorial#>>'{page_metadata,canonical_url}','') AS canonical,
  jsonb_array_length(coalesce(editorial->'model_year_cards','[]'::jsonb)) AS years,
  jsonb_array_length(coalesce(editorial->'development_cards','[]'::jsonb)) AS gallery_cards,
  jsonb_array_length(coalesce(editorial->'deep_dive','[]'::jsonb)) AS heritage_cards,
  jsonb_array_length(coalesce(editorial#>'{production,official_colours}','[]'::jsonb)) AS colours,
  jsonb_array_length(coalesce(editorial#>'{production,specifications}','[]'::jsonb)) AS specifications,
  jsonb_array_length(coalesce(editorial->'related_model_links','[]'::jsonb)) AS related,
  jsonb_array_length(coalesce(editorial->'motorcycle_type_links','[]'::jsonb)) AS types,
  jsonb_array_length(coalesce(editorial->'country_market_links','[]'::jsonb)) AS markets,
  jsonb_array_length(coalesce(editorial->'action_links','[]'::jsonb)) AS actions,
  jsonb_array_length(coalesce(editorial->'reference_links','[]'::jsonb)) AS references,
  jsonb_array_length(coalesce(editorial#>'{production,documented_production_evidence}','[]'::jsonb)) AS production_evidence,
  coalesce(editorial->>'reference_aggregation_status','not_aggregated') AS reference_review_status
 FROM public.motorcycle_model_v2_editorial
 WHERE editorial->>'make'='BMW'
),
photos AS (
 SELECT lower(regexp_replace(model,'[^a-z0-9]','','gi')) AS model_key,
        count(*) AS rights_cleared_photo_count
 FROM public.anybike_editorial_photo_bank
 WHERE manufacturer='BMW' AND approval_status='approved'
   AND coalesce(image_url,'') LIKE 'https://%'
   AND coalesce(source_page_url,'') LIKE 'https://%'
   AND coalesce(licence_url,'') LIKE 'https://%'
   AND length(trim(coalesce(attribution,'')))>0
   AND length(trim(coalesce(licence,'')))>0
 GROUP BY 1
),
checks AS (
 SELECT e.*,
   coalesce(p.rights_cleared_photo_count,0) AS rights_cleared_photo_count,
   array_remove(ARRAY[
    CASE WHEN length(trim(coalesce(e.editorial#>>'{hero,summary}',e.editorial->>'summary','')))=0 THEN 'introduction' END,
    CASE WHEN years=0 THEN 'model_development' END,
    CASE WHEN gallery_cards=0 THEN 'engineering_gallery' END,
    CASE WHEN e.editorial->'global_stories' IS NULL OR length(coalesce(e.editorial#>>'{global_stories,url}',''))=0 THEN 'stories_and_comparisons' END,
    CASE WHEN colours=0 THEN 'factory_colours' END,
    CASE WHEN specifications=0 THEN 'technical_specifications' END,
    CASE WHEN heritage_cards=0 AND jsonb_array_length(coalesce(e.editorial->'sections','[]'::jsonb))=0 THEN 'heritage' END,
    CASE WHEN related=0 THEN 'related_models' END,
    CASE WHEN types=0 THEN 'motorcycle_types' END,
    CASE WHEN markets=0 THEN 'country_markets' END,
    CASE WHEN actions=0 THEN 'customer_action' END,
    CASE WHEN production_evidence=0 THEN 'production_evidence' END,
    CASE WHEN references=0 THEN 'sources_and_references' END
   ],NULL)::text[] AS missing_sections
 FROM editorial e LEFT JOIN photos p ON lower(regexp_replace(e.model,'[^a-z0-9]','','gi'))=p.model_key
)
SELECT slug,make,model,preview_visible,years,gallery_cards,colours,specifications,
  related,types,markets,references,rights_cleared_photo_count,
  missing_sections,
  cardinality(missing_sections) AS missing_section_count,
  (cardinality(missing_sections)=0) AS editorial_section_inputs_present,
  -- Published model approval is a separate explicit, external process.
  false AS public_release_approved_by_this_report,
  CASE
   WHEN cardinality(missing_sections)>0 THEN 'complete_editorial_sections'
   WHEN rights_cleared_photo_count=0 THEN 'clear_model_specific_photography'
   WHEN reference_review_status='existing_source_links_collected_pending_individual_url_review' THEN 'verify_reference_urls'
   ELSE 'manual_design_content_accessibility_and_permission_qa'
  END AS next_action
FROM checks
ORDER BY missing_section_count ASC,years DESC,slug;
