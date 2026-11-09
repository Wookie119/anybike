-- Public model directory projection currently installed in Supabase.
-- 27 BMW and 18 Harley-Davidson existing model guides; not draft model publication.
CREATE OR REPLACE FUNCTION public.public_anybike_manufacturer_model_routes_v1(p_make text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT coalesce(jsonb_agg(jsonb_build_object(
    'make',m.manufacturer,
    'model',m.model,
    'url',r.public_path
  ) ORDER BY m.model,r.public_path),'[]'::jsonb)
 FROM anybike_publishing.editorial_page_routes r
 JOIN public.motorcycle_catalog_models m ON m.id=r.model_id
 WHERE r.entity_type='model'
   AND r.source_verified_at IS NOT NULL
   AND r.publication_state IN ('candidate','published')
   AND m.manufacturer = CASE
     WHEN p_make='BMW' THEN 'BMW'
     WHEN p_make='Harley-Davidson' THEN 'Harley-Davidson'
     ELSE NULL END
   AND r.public_path ~ '^/(bmw|harley-davidson)-[a-z0-9-]+[.]html$'
   AND ((m.manufacturer='BMW' AND r.public_path LIKE '/bmw-%')
       OR (m.manufacturer='Harley-Davidson'
         AND r.public_path LIKE '/harley-davidson-%'));
$function$
;
REVOKE ALL ON FUNCTION public.public_anybike_manufacturer_model_routes_v1(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_anybike_manufacturer_model_routes_v1(text) FROM anon,authenticated;
GRANT EXECUTE ON FUNCTION public.public_anybike_manufacturer_model_routes_v1(text) TO anon,authenticated;
