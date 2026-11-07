-- Production source-gap follow-up, 2026-11-07.
-- Complete replacement function for reproducing current schema state.
CREATE OR REPLACE FUNCTION public.admin_bmw_bulk_research_audit_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_rows jsonb; v_count integer;
begin
 if auth.uid() is null or not public.anybike_is_admin() then
   raise exception 'Admin access required';
 end if;
 with models as (
  select m.id,m.model,m.slug
  from public.motorcycle_catalog_models m
  where m.manufacturer='BMW'
 ),
 audits as (
  select m.id,m.model,m.slug,
   (select count(*)::integer from public.motorcycle_catalog_facts f where f.catalog_model_id=m.id) as facts_total,
   (select count(*)::integer from public.motorcycle_catalog_facts f where f.catalog_model_id=m.id and f.verification_status='verified') as verified_facts,
   (select count(*)::integer from public.motorcycle_catalog_facts f where f.catalog_model_id=m.id and f.category='factory_colours' and f.verification_status='verified') as verified_colours,
   (select count(*)::integer from public.motorcycle_catalog_generations g where g.catalog_model_id=m.id) as generation_count,
   (select count(*)::integer from public.motorcycle_catalog_generations g where g.catalog_model_id=m.id and g.verification_status='verified') as verified_generations,
   (select count(*)::integer from public.motorcycle_catalog_generations g where g.catalog_model_id=m.id and g.start_year is not null and g.end_year is not null and g.start_year>g.end_year) as reversed_generation_years,
   (select count(*)::integer from public.motorcycle_catalog_timeline_events t where t.catalog_model_id=m.id) as timeline_count,
   (select count(*)::integer from public.motorcycle_catalog_timeline_events t where t.catalog_model_id=m.id and t.verification_status='verified') as verified_timeline_events,
   (select count(*)::integer from public.motorcycle_catalog_timeline_events t where t.catalog_model_id=m.id and t.event_month is not null and (t.event_month<1 or t.event_month>12)) as invalid_timeline_months,
   (select count(*)::integer from public.motorcycle_catalog_generations g where g.catalog_model_id=m.id and (nullif(trim(g.source_url),'') is null or nullif(trim(g.source_name),'') is null)) as generation_sources_missing,
   (select count(*)::integer from public.motorcycle_catalog_timeline_events t where t.catalog_model_id=m.id and (nullif(trim(t.source_url),'') is null or nullif(trim(t.source_name),'') is null)) as timeline_sources_missing,
   (select count(*)::integer from public.motorcycle_catalog_facts f where f.catalog_model_id=m.id and f.start_year is not null and f.end_year is not null and f.start_year>f.end_year) as reversed_fact_years,
   (select count(*)::integer from public.motorcycle_catalog_facts f where f.catalog_model_id=m.id and f.verification_status='verified' and (nullif(trim(f.source_url),'') is null or nullif(trim(f.source_name),'') is null)) as verified_facts_missing_sources,
   (select count(*)::integer from public.motorcycle_catalog_model_year_media y where y.model_id=m.id and y.verification_status='verified' and y.publication_enabled=false) as year_gallery_unpublished
  from models m
 )
 select coalesce(jsonb_agg(jsonb_build_object(
  'model',model,'slug',slug,'facts_total',facts_total,'verified_facts',verified_facts,
  'verified_colours',verified_colours,'generation_count',generation_count,
  'verified_generations',verified_generations,'reversed_generation_years',reversed_generation_years,
  'timeline_count',timeline_count,'verified_timeline_events',verified_timeline_events,
  'invalid_timeline_months',invalid_timeline_months,'generation_sources_missing',generation_sources_missing,
  'timeline_sources_missing',timeline_sources_missing,'reversed_fact_years',reversed_fact_years,
  'verified_facts_missing_sources',verified_facts_missing_sources,
  'year_gallery_unpublished',year_gallery_unpublished,
  'requires_research',(verified_facts=0 or verified_generations=0 or verified_timeline_events=0),
  'has_integrity_issue',(reversed_generation_years+invalid_timeline_months+reversed_fact_years+verified_facts_missing_sources)>0,
  'has_source_gaps',(generation_sources_missing+timeline_sources_missing)>0
 ) order by model),'[]'::jsonb) into v_rows from audits;
 v_count:=jsonb_array_length(v_rows);
 return jsonb_build_object(
  'manufacturer','BMW','model_count',v_count,
  'items',v_rows,
  'models_needing_research',(select count(*) from jsonb_array_elements(v_rows) x where (x->>'requires_research')::boolean),
  'models_with_integrity_flags',(select count(*) from jsonb_array_elements(v_rows) x where (x->>'has_integrity_issue')::boolean),
  'models_with_source_gaps',(select count(*) from jsonb_array_elements(v_rows) x where (x->>'has_source_gaps')::boolean),
  'mode','admin_only_read_only','publication_enabled',false);
end;
$function$;
revoke all on function public.admin_bmw_bulk_research_audit_v1() from public,anon,authenticated;
grant execute on function public.admin_bmw_bulk_research_audit_v1() to authenticated,service_role;
