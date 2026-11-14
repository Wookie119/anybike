-- Public read-only index for the ONE approved V2 model renderer.
-- Applied on 2026-11-14 to Supabase project tuehtnezhdnkqbbhttgp.
-- Uses the existing cleaned/published model identities, never admin drafts,
-- seller information, stock, or unpublished editorial.
create or replace function public.public_anybike_universal_model_index_v1()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
select coalesce(jsonb_agg(
 jsonb_build_object(
  'model_id',d.model_id,
  'make',d.make,
  'model',d.model,
  'category',coalesce(nullif(btrim(d.motorcycle_type),''),'Other')
 ) order by d.make,d.model,d.model_id
),'[]'::jsonb)
from public.motorcycle_catalog_dropdown_clean d
where nullif(btrim(d.make),'') is not null
 and nullif(btrim(d.model),'') is not null
 and d.model !~* '(apr|pcp|representative|finance|deposit|monthly payment)';
$function$;
revoke all on function public.public_anybike_universal_model_index_v1() from public;
grant execute on function public.public_anybike_universal_model_index_v1() to anon,authenticated;
