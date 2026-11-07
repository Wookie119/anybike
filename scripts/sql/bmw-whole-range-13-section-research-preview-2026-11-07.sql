-- AnyBike BMW whole-range 13-section research preview
-- Deployed 7 November 2026. Admin-only. No content publication.

CREATE OR REPLACE FUNCTION public.admin_bmw_verified_model_sections_v1(p_model_slug text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_result jsonb;
begin
 if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin access required'; end if;
 with section_map(section_order,section_key,section_title,categories) as (values
  (1,'identity_history','Model identity and history',array['history','design']::text[]),
  (2,'generations_timeline','Generations and timeline',array['model_year','market_launch']::text[]),
  (3,'variants_editions','Variants and editions',array['variants','editions']::text[]),
  (4,'engine_drivetrain','Engine and drivetrain',array['engine','performance','transmission','engineering']::text[]),
  (5,'chassis_suspension','Chassis and suspension',array['chassis']::text[]),
  (6,'dimensions_wheels_brakes','Dimensions, wheels and brakes',array['dimensions','wheels','brakes']::text[]),
  (7,'model_year_colours','Model-year colours',array['factory_colours']::text[]),
  (8,'production_manufacturing','Production and manufacturing',array['production','manufacturing','manufacturing_evidence']::text[]),
  (9,'registrations_sales','Registrations and sales',array['registrations','sales']::text[]),
  (10,'racing_heritage','Racing and heritage',array['motorsport','motorsport_heritage','competition']::text[]),
  (11,'buying_ownership','Buying and ownership',array['buying','ownership','touring']::text[]),
  (12,'related_global','Related models and AnyBike Global',array['global_story','related_models']::text[]),
  (13,'stock_sourcing_actions','Stock, selling and sourcing',array['stock','sourcing']::text[])
 ), eligible_models as (
  select m.id,m.model,m.slug,e.slug editorial_slug,e.preview_visible,
   jsonb_array_length(case when jsonb_typeof(e.editorial->'sections')='array' then e.editorial->'sections' else '[]'::jsonb end) existing_editorial_rows
  from public.motorcycle_catalog_models m
  left join public.motorcycle_model_v2_editorial e on e.model_id=m.id
  where m.manufacturer='BMW' and (p_model_slug is null or m.slug=p_model_slug or e.slug=p_model_slug)
 ), mapped as (
 select m.id,m.model,m.slug,m.editorial_slug,m.preview_visible,m.existing_editorial_rows,
 s.section_order,s.section_key,s.section_title,
 coalesce((select jsonb_agg(jsonb_build_object(
  'fact_id',f.id,'category',f.category,'label',f.label,'value',f.value,
  'start_year',f.start_year,'end_year',f.end_year,'market',f.market,
  'source_name',f.source_name,'source_url',f.source_url,
  'verified_scope',a.scope_note,'verified_at',a.checked_at
 ) order by f.start_year nulls last,f.id)
  from public.motorcycle_catalog_facts f
  join public.motorcycle_catalog_fact_verification_audit a on a.fact_id=f.id
  where f.catalog_model_id=m.id and f.verification_status='verified'
   and f.category=any(s.categories)),'[]'::jsonb) facts
 from eligible_models m cross join section_map s
 ), model_rows as (
 select id,model,slug,editorial_slug,preview_visible,existing_editorial_rows,
 sum(jsonb_array_length(facts))::integer verified_fact_count,
 jsonb_agg(jsonb_build_object('order',section_order,'key',section_key,'title',section_title,
  'verified_facts',facts,'fact_count',jsonb_array_length(facts),
  'content_policy','verified facts only; pending history separate; approved editorial untouched') order by section_order) sections
 from mapped group by id,model,slug,editorial_slug,preview_visible,existing_editorial_rows
 )
 select coalesce(jsonb_agg(jsonb_build_object(
 'model',model,'slug',slug,'editorial_slug',editorial_slug,
 'preview_visible',preview_visible,'existing_editorial_rows',existing_editorial_rows,
 'verified_fact_count',verified_fact_count,'sections',sections,
 'publish_ready',false
 ) order by model),'[]'::jsonb) into v_result from model_rows;
 return jsonb_build_object('manufacturer','BMW','section_contract',13,'models',v_result,
 'model_count',jsonb_array_length(v_result),'mode','admin_only_read_only','publication_enabled',false);
end;$function$;
revoke all on function public.admin_bmw_verified_model_sections_v1(text) from public,anon,authenticated;
grant execute on function public.admin_bmw_verified_model_sections_v1(text) to authenticated,service_role;

CREATE OR REPLACE FUNCTION public.admin_bmw_model_section_preview_v1(p_model_slug text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_sections jsonb;v_media jsonb;v_relationships jsonb;v_models jsonb;
begin
 if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin access required';end if;
 v_sections:=public.admin_bmw_verified_model_sections_v1(p_model_slug);
 v_media:=public.admin_bmw_model_media_relationships_v1(p_model_slug);
 v_relationships:=public.admin_bmw_relationship_candidates_v1(p_model_slug);
 with section_models as (select value as section_model from jsonb_array_elements(v_sections->'models')),
 media_models as (select value as media_model from jsonb_array_elements(v_media->'models'))
 select coalesce(jsonb_agg(s.section_model || jsonb_build_object(
 'model_year_gallery',coalesce(m.media_model->'model_year_gallery','[]'::jsonb),
 'model_year_gallery_count',coalesce((m.media_model->>'model_year_gallery_count')::integer,0),
 'approved_media',coalesce(m.media_model->'approved_media','[]'::jsonb),
 'relationship_candidates',coalesce((
  select jsonb_agg(p.value) from jsonb_array_elements(v_relationships->'pairs') p
  where p.value->>'slug_a'=s.section_model->>'slug' or p.value->>'slug_b'=s.section_model->>'slug'
 ),'[]'::jsonb),
 'research_generation_candidates',coalesce((
 select jsonb_agg(jsonb_build_object('id',g.id,'generation_name',g.generation_name,
  'start_year',g.start_year,'end_year',g.end_year,'source_name',g.source_name,
  'source_url',g.source_url,'verification_status',g.verification_status) order by g.start_year,g.id)
 from public.motorcycle_catalog_generations g join public.motorcycle_catalog_models model on model.id=g.catalog_model_id
 where model.slug=s.section_model->>'slug'
 ),'[]'::jsonb),
 'research_timeline_candidates',coalesce((
 select jsonb_agg(jsonb_build_object('id',t.id,'title',t.title,'event_year',t.event_year,
  'event_month',t.event_month,'event_type',t.event_type,'source_name',t.source_name,
  'source_url',t.source_url,'verification_status',t.verification_status) order by t.event_year,t.event_month nulls last,t.id)
 from public.motorcycle_catalog_timeline_events t join public.motorcycle_catalog_models model on model.id=t.catalog_model_id
 where model.slug=s.section_model->>'slug'
 ),'[]'::jsonb),
 'gallery_publication_enabled',false,'relationship_publication_enabled',false,
 'pending_history_publication_enabled',false
 ) order by s.section_model->>'model'),'[]'::jsonb) into v_models
 from section_models s left join media_models m on m.media_model->>'slug'=s.section_model->>'slug';
 return jsonb_build_object('manufacturer','BMW','section_contract',13,'models',v_models,
 'model_count',jsonb_array_length(v_models),'relationship_summary',
 jsonb_build_object('pair_count',v_relationships->'pair_count','conflict_count',v_relationships->'conflict_count'),
 'mode','admin_only_read_only','publication_enabled',false,'approved_editorial_preserved',true);
end;$function$;
revoke all on function public.admin_bmw_model_section_preview_v1(text) from public,anon,authenticated;
grant execute on function public.admin_bmw_model_section_preview_v1(text) to authenticated,service_role;

