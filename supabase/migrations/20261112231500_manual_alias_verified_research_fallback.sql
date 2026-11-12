-- Only hand-approved exact-model aliases may inherit same-model audited facts.
-- Both requested and canonical model require approved public catalogue identities.
-- Prefer original exact model's own facts and preserve requested name for client.
CREATE OR REPLACE FUNCTION public.public_anybike_verified_model_facts_v1(p_make text, p_model text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
with clean_identity as (
 select d.model_id,d.make,d.model
 from public.motorcycle_catalog_dropdown_clean d
 where lower(trim(d.make))=lower(trim(p_make))
   and lower(trim(d.model))=lower(trim(p_model))
   and length(trim(p_make)) between 2 and 80
   and length(trim(p_model)) between 1 and 120
   and d.model !~* '(apr|pcp|representative|finance|deposit|monthly payment)'
), one_identity as (
 select model_id,make,model from clean_identity
 where (select count(*) from clean_identity)=1
), selected_identity as (
 select m.make,m.model,
  case when exists (
   select 1 from public.motorcycle_catalog_facts f
   where f.catalog_model_id=m.model_id and f.verification_status='verified'
  ) then m.model_id
  else coalesce((
   select canon.model_id
   from public.anybike_model_identity_aliases a
   join public.motorcycle_catalog_dropdown_clean canon
    on canon.make=a.manufacturer and canon.model=a.canonical_model
   where a.manufacturer=m.make and a.alias_model=m.model
     and canon.model !~* '(apr|pcp|representative|finance|deposit|monthly payment)'
   order by canon.model_id
   limit 1
  ),m.model_id)
  end as fact_model_id
 from one_identity m
), verified as (
 select f.id,f.category,f.label,f.value,f.start_year,f.end_year,
        f.market,f.source_name,f.source_url,m.make,m.model
 from selected_identity m
 join public.motorcycle_catalog_facts f on f.catalog_model_id=m.fact_model_id
 join public.anybike_model_research_section_registry section on section.category=f.category
 where f.verification_status='verified'
   and f.source_url ~ '^https://[^[:space:]]+$'
   and length(trim(f.label)) between 1 and 160
   and exists(
     select 1 from public.motorcycle_catalog_fact_verification_audit a
     where a.fact_id=f.id and a.source_url=f.source_url
       and nullif(btrim(a.verification_basis),'') is not null
       and a.checked_at is not null and a.checked_at<=now()
   )
 order by section.section_order,f.start_year nulls last,f.id

)
select coalesce(jsonb_agg(jsonb_build_object(
 'fact_id',id,'make',make,'model',model,'category',category,'label',label,
 'value',value,'start_year',start_year,'end_year',end_year,'market',market,
 'source_name',source_name,'source_url',source_url
) order by id),'[]'::jsonb) from verified;
$function$;
revoke all on function public.public_anybike_verified_model_facts_v1(text,text) from public;
grant execute on function public.public_anybike_verified_model_facts_v1(text,text) to anon,authenticated;
