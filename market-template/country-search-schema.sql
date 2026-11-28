-- Install after country-master-schema.sql.
begin;

create table anybike_publishing.country_model_search_hours (
  market_slug text not null,
  model_id bigint not null references public.motorcycle_catalog_models(id) on delete cascade,
  observed_hour timestamptz not null,
  primary key (market_slug, observed_hour, model_id)
);
alter table anybike_publishing.country_model_search_hours enable row level security;
revoke all on anybike_publishing.country_model_search_hours from public, anon, authenticated;

-- Record one signal per model, market and hour. No search text or visitor identifier.
create function public.record_anybike_country_model_search_v1(p_market text, p_model_id bigint)
returns void language sql volatile security definer set search_path='' as $$
  insert into anybike_publishing.country_model_search_hours(market_slug,model_id,observed_hour)
  select p_market, p_model_id, date_trunc('hour',now())
  where exists (
    select 1 from public.motorcycle_catalog_dropdown_clean model
    where model.model_id=p_model_id
      and nullif(btrim(model.make),'') is not null and nullif(btrim(model.model),'') is not null
      and model.model !~* '(apr|pcp|representative|finance|deposit|monthly payment)'
  )
    and exists (select 1 from anybike_publishing.country_master_pages p where p.slug=p_market and p.published)
  on conflict do nothing
$$;

create function public.public_anybike_country_popular_models_v1(p_market text)
returns table(model_id bigint) language sql stable security definer set search_path='' as $$
  select obs.model_id
  from anybike_publishing.country_model_search_hours obs
  where obs.market_slug=p_market and obs.observed_hour>=now()-interval '30 days'
    and exists (select 1 from anybike_publishing.country_master_pages p where p.slug=p_market and p.published)
  group by obs.model_id
  having count(*)>=3 and count(distinct (obs.observed_hour at time zone 'UTC')::date)>=2
  order by count(*) desc, max(obs.observed_hour) desc, obs.model_id
  limit 8
$$;

revoke all on function public.record_anybike_country_model_search_v1(text,bigint),
  public.public_anybike_country_popular_models_v1(text) from public;
grant execute on function public.record_anybike_country_model_search_v1(text,bigint),
  public.public_anybike_country_popular_models_v1(text) to anon,authenticated;
commit;
