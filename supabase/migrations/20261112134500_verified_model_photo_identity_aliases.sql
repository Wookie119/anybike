-- Approved exact identity aliases for equivalent catalogue names only.
-- This does not merge/rename catalogue records, stock items or page routes.
create table if not exists public.anybike_model_identity_aliases (
 id bigint generated always as identity primary key,
 manufacturer text not null,
 alias_model text not null,
 canonical_model text not null,
 verification_note text not null,
 approved_at timestamptz not null default now(),
 constraint anybike_model_identity_aliases_unique unique (manufacturer,alias_model),
 constraint anybike_model_identity_aliases_distinct check(alias_model<>canonical_model)
);
revoke all on public.anybike_model_identity_aliases from anon, authenticated;

insert into public.anybike_model_identity_aliases(manufacturer,alias_model,canonical_model,verification_note)
values
('Honda','Africa Twin CRF1000L','CRF1000L AFRICA TWIN',
 'Honda CRF1000L Africa Twin word-order variation; not CRF1100L or Adventure Sports.'),
('Yamaha','Ténéré 700','Tenere 700',
 'Accent-only spelling variation of standard Ténéré 700; not Rally or World Raid.')
on conflict(manufacturer,alias_model) do nothing;

create or replace function public.public_anybike_model_hero_v1(p_make text,p_model text)
returns jsonb
language sql stable security definer set search_path=''
as $function$
with requested as (
 select trim(p_make) manufacturer,trim(p_model) original_model
 where p_make is not null and p_model is not null
 and length(trim(p_make)) between 2 and 80
 and length(trim(p_model)) between 1 and 120
 and exists (
  select 1 from public.motorcycle_catalog_models c
  where c.manufacturer=trim(p_make) and c.model=trim(p_model)
 )
), resolved as (
 select r.manufacturer,r.original_model,
 coalesce(a.canonical_model,r.original_model) model
 from requested r
 left join public.anybike_model_identity_aliases a
 on a.manufacturer=r.manufacturer and a.alias_model=r.original_model
 where a.canonical_model is null or exists (
  select 1 from public.motorcycle_catalog_models c
  where c.manufacturer=r.manufacturer and c.model=a.canonical_model
 )
), approved as (
 select p.*,r.original_model from resolved r
 join public.anybike_editorial_photo_bank p
 on p.manufacturer=r.manufacturer and p.model=r.model
 where p.approval_status='approved'
 and p.subject_category='whole_motorcycle'
 and 'model_hero'=any(p.usage_contexts)
 and p.image_url like 'https://%'
 and p.source_page_url like 'https://%'
 and p.licence_url like 'https://%'
 and length(trim(coalesce(p.attribution,'')))>0
 and length(trim(coalesce(p.licence,'')))>0
 order by p.model_year_start desc nulls last,p.asset_key
 limit 1
)
select jsonb_build_object(
 'make',p.manufacturer,'model',p.original_model,'canonical_model',p.model,
 'image_url',p.image_url,'source_page_url',p.source_page_url,
 'licence_url',p.licence_url,'attribution',p.attribution,
 'licence',p.licence,'title',p.title,
 'model_year_start',p.model_year_start,'model_year_end',p.model_year_end
) from approved p
$function$;
revoke all on function public.public_anybike_model_hero_v1(text,text) from public;
grant execute on function public.public_anybike_model_hero_v1(text,text) to anon,authenticated;
