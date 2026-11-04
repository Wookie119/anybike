-- AnyBike backend-only editorial export.
-- Run with a trusted PostgreSQL connection that can read the private
-- anybike_publishing schema. NEVER run from public browser JavaScript.
-- Single JSON value on one line; consume using scripts/export-private-editorial-from-postgres.mjs.
select jsonb_build_object(
  'routes', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'entity_type',entity_type,
      'manufacturer_id',manufacturer_id,
      'model_id',model_id,
      'story_id',story_id,
      'country_slug',country_slug,
      'country_name',country_name,
      'country_region',country_region,
      'country_code',country_code,
      'public_path',public_path,
      'publication_state',publication_state,
      'source_verified_at',source_verified_at,
      'live_verified_at',live_verified_at,
      'editorial_verified_at',editorial_verified_at
    ) order by public_path), '[]'::jsonb)
    from anybike_publishing.editorial_route_export
  ),
  'manufacturers', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',id, 'display_name',display_name
    ) order by id), '[]'::jsonb)
    from public.motorcycle_catalog_manufacturers
  ),
  'models', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',id, 'manufacturer',manufacturer, 'model',model
    ) order by id), '[]'::jsonb)
    from public.motorcycle_catalog_models
  ),
  'countryLinks', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'model_id',model_id,'country_code',country_code,
      'market_url',market_url,'is_published',is_published
    ) order by id), '[]'::jsonb)
    from public.motorcycle_model_country_links
    where model_id is not null and is_published is true
  ),
  'globalStories', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',id,'story_url',story_url,'headline',headline,
      'editorial_status',editorial_status
    ) order by id), '[]'::jsonb)
    from public.motorcycle_global_stories_v1
  ),
  'storyManufacturers', '[]'::jsonb,
  'modelRelationships', '[]'::jsonb
)::text as private_editorial_export;
