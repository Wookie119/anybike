-- AnyBike BMW generational source reconciliation, 7 November 2026.
-- Database migration already applied; commit is reproducible source-of-truth.
-- Source restoration uses only model/year-matched original BMW Group PressClub references.
-- Historical claims remain pending_review. No public page publication.
with restored as (
 update public.motorcycle_catalog_timeline_events t
 set source_name = g.source_name, source_url = g.source_url
 from public.motorcycle_catalog_generations g
 where (t.id,g.id,t.catalog_model_id,t.event_year) in
   ((1,1,63,2004),(2,2,63,2013),(3,3,68,2019),(4,4,77,2023))
   and g.catalog_model_id=t.catalog_model_id
   and g.start_year=t.event_year
   and t.source_name is null and t.source_url is null
   and g.source_name='BMW Group PressClub'
   and g.source_url like 'https://www.press.bmwgroup.com/%'
 returning t.id
)
select count(*) as repaired from restored;

CREATE OR REPLACE FUNCTION public.admin_bmw_generation_timeline_reconciliation_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_models jsonb;
begin
 if auth.uid() is null or not public.anybike_is_admin() then
  raise exception 'Admin access required';
 end if;
 with bmw as (
   select id,model,slug from public.motorcycle_catalog_models where manufacturer='BMW'
 ), summary as (
 select m.id,m.model,m.slug,
 (select count(*)::integer from public.motorcycle_catalog_generations g where g.catalog_model_id=m.id) as generations,
 (select count(*)::integer from public.motorcycle_catalog_generations g where g.catalog_model_id=m.id and g.verification_status='verified') as verified_generations,
 (select count(*)::integer from public.motorcycle_catalog_timeline_events t where t.catalog_model_id=m.id) as timeline_events,
 (select count(*)::integer from public.motorcycle_catalog_timeline_events t where t.catalog_model_id=m.id and t.verification_status='verified') as verified_timeline_events,
 (select count(*)::integer from public.motorcycle_catalog_timeline_events t where t.catalog_model_id=m.id and t.event_type='generation_reference') as generation_reference_events,
 (select count(*)::integer from public.motorcycle_catalog_timeline_events t
   where t.catalog_model_id=m.id and t.event_type='generation_reference'
   and not exists(select 1 from public.motorcycle_catalog_generations g
    where g.catalog_model_id=t.catalog_model_id and g.start_year=t.event_year
      and g.source_url is not distinct from t.source_url)) as unmatched_generation_references,
 (select count(*)::integer from public.motorcycle_catalog_generations g where g.catalog_model_id=m.id and
   (nullif(btrim(g.source_url),'') is null or g.source_url !~ '^https://')) as generation_bad_source_urls,
 (select count(*)::integer from public.motorcycle_catalog_timeline_events t where t.catalog_model_id=m.id and
   (nullif(btrim(t.source_url),'') is null or t.source_url !~ '^https://')) as timeline_bad_source_urls,
 (select count(*)::integer from public.motorcycle_catalog_generations g where g.catalog_model_id=m.id and
   (g.start_year is null or (g.end_year is not null and g.end_year<g.start_year))) as generation_year_problems
 from bmw m
 )
 select coalesce(jsonb_agg(jsonb_build_object(
  'model',model,'slug',slug,'generations',generations,'verified_generations',verified_generations,
  'timeline_events',timeline_events,'verified_timeline_events',verified_timeline_events,
  'generation_reference_events',generation_reference_events,
  'unmatched_generation_references',unmatched_generation_references,
  'generation_bad_source_urls',generation_bad_source_urls,
  'timeline_bad_source_urls',timeline_bad_source_urls,
  'generation_year_problems',generation_year_problems,
  'source_reconciliation_state',case when unmatched_generation_references+
   generation_bad_source_urls+timeline_bad_source_urls+generation_year_problems>0
   then 'needs_source_reconciliation' else 'source_fields_consistent_not_fact_verified' end
 ) order by model),'[]'::jsonb) into v_models from summary;
 return jsonb_build_object('manufacturer','BMW','models',v_models,
  'model_count',jsonb_array_length(v_models),
  'total_generations',(select count(*) from public.motorcycle_catalog_generations g join public.motorcycle_catalog_models m on m.id=g.catalog_model_id where m.manufacturer='BMW'),
  'total_timeline_events',(select count(*) from public.motorcycle_catalog_timeline_events t join public.motorcycle_catalog_models m on m.id=t.catalog_model_id where m.manufacturer='BMW'),
  'unmatched_generation_references',(select coalesce(sum((v->>'unmatched_generation_references')::integer),0) from jsonb_array_elements(v_models) v),
  'bad_generation_source_urls',(select coalesce(sum((v->>'generation_bad_source_urls')::integer),0) from jsonb_array_elements(v_models) v),
  'bad_timeline_source_urls',(select coalesce(sum((v->>'timeline_bad_source_urls')::integer),0) from jsonb_array_elements(v_models) v),
  'verification_policy','source-field consistency is not source-content verification',
  'mode','admin_only_read_only','publication_enabled',false);
end;
$function$;
revoke all on function public.admin_bmw_generation_timeline_reconciliation_v1() from public,anon,authenticated;
grant execute on function public.admin_bmw_generation_timeline_reconciliation_v1() to authenticated,service_role;
