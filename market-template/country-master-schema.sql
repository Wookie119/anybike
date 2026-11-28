-- Install after the existing scoped catalogue and riding story migrations.
-- Content records from the legacy-page export start in review.
begin;

create table anybike_publishing.country_master_pages (
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  locale text not null check (locale ~ '^[a-z]{2}$'),
  content jsonb not null check (jsonb_typeof(content->'sections') = 'array'),
  is_primary boolean not null default false,
  published boolean not null default false,
  primary key (slug, locale)
);
create unique index country_master_one_primary_locale
  on anybike_publishing.country_master_pages (slug) where is_primary;

create table anybike_publishing.country_master_placements (
  slot_key text primary key check (slot_key in ('classifieds','ad-after-global','ad-footer')),
  advertising_slot text references public.advertising_named_spaces(slot_code),
  enabled boolean not null default false,
  check (slot_key <> 'classifieds' or advertising_slot is null)
);
insert into anybike_publishing.country_master_placements(slot_key, advertising_slot)
values ('classifieds', null), ('ad-after-global', 'AB-COUNTRY-CONTENT'), ('ad-footer', null);

alter table anybike_publishing.country_master_pages enable row level security;
alter table anybike_publishing.country_master_placements enable row level security;
revoke all on anybike_publishing.country_master_pages, anybike_publishing.country_master_placements
  from public, anon, authenticated;

-- Read-only projection of reviewed public content. Reuses country-scoped Global assignments.
create function public.public_anybike_country_master_v1(p_slug text, p_locale text default 'en')
returns jsonb language sql stable security definer set search_path='' as $$
  with page as (
    select p.content, p.slug, p.locale
    from anybike_publishing.country_master_pages p
    where p.slug=p_slug and p.published and (p.locale in (p_locale,'en') or p.is_primary)
    order by (p.locale=p_locale) desc, (p.locale='en') desc, p.is_primary desc
    limit 1
  ), stories as (
    select s.id, media.media is not null as illustrated,
      jsonb_strip_nulls(jsonb_build_object(
        'url',s.story_url,'title',s.headline,'summary',s.summary,
        'image',media.media->>'src','alt',media.media->>'alt','credit',media.media->>'credit',
        'source',media.media->>'source','licence',media.media->>'licence','licenceUrl',media.media->>'licenceUrl'
      )) as card
    from public.motorcycle_global_stories_v1 s
    left join anybike_publishing.riding_story_media media on media.story_url=s.story_url
    where s.editorial_status='published' and s.story_url ~ '^/global/[a-z0-9-]+[.]html$'
  )
  select p.content || jsonb_build_object(
    'slug',p.slug,'locale',p.locale,
    'localStories',coalesce((
      select jsonb_agg(s.card order by s.id desc)
      from stories s
      join anybike_publishing.market_global_features f on f.story_id=s.id
      where f.page_path='/markets/' || p.slug || '.html'
    ),'[]'::jsonb),
    'worldwideStories',coalesce((
      select jsonb_agg(fallback.card order by fallback.illustrated desc, fallback.id desc)
      from (
        select s.card,s.illustrated,s.id from stories s
        where not exists (select 1 from anybike_publishing.market_global_features f where f.story_id=s.id)
        order by s.illustrated desc,s.id desc
        limit 3
      ) fallback
    ),'[]'::jsonb),
    'slots',(
      select jsonb_agg(jsonb_build_object('key',slot.slot_key,
        'adSlot',slot.advertising_slot,'enabled',slot.enabled) order by slot.slot_key)
      from anybike_publishing.country_master_placements slot
    )
  ) from page p
$$;

revoke all on function public.public_anybike_country_master_v1(text,text) from public;
grant execute on function public.public_anybike_country_master_v1(text,text) to anon,authenticated;
commit;
