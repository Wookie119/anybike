-- AnyBike public navigation projection for the existing 217 country market URLs.
-- This publishes ONLY country name, geographical grouping, and canonical public
-- path. It does not publish private editorial data, market demand, customer
-- records, drafts, or imply a country page passed live publication verification.
-- Source route registry matches the existing public sitemap (audited Nov 9).
CREATE OR REPLACE FUNCTION public.public_anybike_country_navigation_v1()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'label',r.country_name,
   'region',r.country_region,
   'url',r.public_path
 ) ORDER BY r.country_region,r.country_name,r.public_path),'[]'::jsonb)
 FROM anybike_publishing.editorial_page_routes r
 WHERE r.entity_type='country'
 AND r.source_verified_at IS NOT NULL
 AND r.country_name IS NOT NULL
 AND length(btrim(r.country_name))>0
 AND r.public_path ~ '^/markets/[a-z0-9-]+[.]html$'
 AND r.country_region IS NOT NULL
 AND r.publication_state IN ('candidate','published');
$function$;
-- Default PostgreSQL function execute permissions include PUBLIC.
REVOKE ALL ON FUNCTION public.public_anybike_country_navigation_v1() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_anybike_country_navigation_v1() FROM anon,authenticated;
GRANT EXECUTE ON FUNCTION public.public_anybike_country_navigation_v1() TO anon,authenticated;

-- Read-only verification:
SELECT jsonb_array_length(public.public_anybike_country_navigation_v1()) AS route_count;
