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

-- Market defaults and allowed display currencies are separate from editorial content.
create table anybike_publishing.country_market_preferences (
  market_slug text primary key check (market_slug ~ '^[a-z0-9-]+$'),
  default_locale text not null check (default_locale ~ '^[a-z]{2}$'),
  default_display_currency text not null default 'GBP' check (default_display_currency ~ '^[A-Z]{3}$')
);
create table anybike_publishing.country_market_display_currencies (
  market_slug text not null references anybike_publishing.country_market_preferences(market_slug),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$' and currency_code <> 'GBP'),
  primary key (market_slug, currency_code)
);
create table anybike_publishing.country_display_rates (
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$' and currency_code <> 'GBP'),
  units_per_gbp numeric(18,8) not null check (units_per_gbp > 0 and units_per_gbp <> 'NaN'::numeric),
  effective_at timestamptz not null,
  valid_until timestamptz not null check (valid_until > effective_at),
  provider text not null check (length(trim(provider)) > 0),
  primary key (currency_code, effective_at)
);

alter table anybike_publishing.country_market_preferences enable row level security;
alter table anybike_publishing.country_market_display_currencies enable row level security;
alter table anybike_publishing.country_display_rates enable row level security;
revoke all on anybike_publishing.country_market_preferences,
  anybike_publishing.country_market_display_currencies, anybike_publishing.country_display_rates
  from public, anon, authenticated;

create table anybike_publishing.country_global_card_translations (
  story_url text not null check (story_url ~ '^/global/[a-z0-9-]+[.]html$'),
  locale text not null check (locale ~ '^[a-z]{2}$' and locale <> 'en'),
  title text not null check (length(trim(title)) > 0),
  summary text not null check (length(trim(summary)) > 0),
  image_alt text,
  published boolean not null default false,
  primary key (story_url, locale)
);
alter table anybike_publishing.country_global_card_translations enable row level security;
revoke all on anybike_publishing.country_global_card_translations from public, anon, authenticated;

-- Read-only projection of reviewed public content. Reuses country-scoped Global assignments.
create function public.public_anybike_country_master_v1(p_slug text, p_locale text default null)
returns jsonb language sql stable security definer set search_path='' as $$
  with market as (
    select
      coalesce(nullif(split_part(lower(p_locale),'-',1),''),preferences.default_locale,'en') as requested_locale,
      coalesce(preferences.default_display_currency,'GBP') as default_currency
    from (values (p_slug)) requested(slug)
    left join anybike_publishing.country_market_preferences preferences on preferences.market_slug=requested.slug
  ), page as (
    select p.content, p.slug, p.locale
    from anybike_publishing.country_master_pages p
    cross join market
    where p.slug=p_slug and p.published and (p.locale in (market.requested_locale,'en') or p.is_primary)
    order by (p.locale=market.requested_locale) desc, (p.locale='en') desc, p.is_primary desc
    limit 1
  ), stories as (
    select s.id, media.media is not null as illustrated,
      jsonb_strip_nulls(jsonb_build_object(
        'url',s.story_url,'title',coalesce(t.title,s.headline),'summary',coalesce(t.summary,s.summary),
        'locale',p.locale,'articleLocale','en',
        'image',media.media->>'src','alt',case when p.locale='en' then media.media->>'alt' else t.image_alt end,
        'credit',media.media->>'credit',
        'source',media.media->>'source','licence',media.media->>'licence','licenceUrl',media.media->>'licenceUrl',
        'resized',media.media->'resized'
      )) as card
    from public.motorcycle_global_stories_v1 s
    cross join page p
    left join anybike_publishing.riding_story_media media on media.story_url=s.story_url
    left join anybike_publishing.country_global_card_translations t
      on t.story_url=s.story_url and t.locale=p.locale and t.published
    where s.editorial_status='published' and s.story_url ~ '^/global/[a-z0-9-]+[.]html$'
      and (p.locale='en' or t.story_url is not null)
  ), rates as (
    select coalesce(jsonb_object_agg(latest.currency_code, latest.units_per_gbp),'{}'::jsonb) as values,
           coalesce(jsonb_object_agg(latest.currency_code, latest.valid_until),'{}'::jsonb) as expiry
    from (
      select distinct on (r.currency_code) r.currency_code,r.units_per_gbp,r.valid_until
      from anybike_publishing.country_display_rates r
      where r.effective_at<=now() and (r.currency_code='USD' or exists (
        select 1 from anybike_publishing.country_market_display_currencies enabled
        where enabled.market_slug=p_slug and enabled.currency_code=r.currency_code
      ))
      order by r.currency_code,r.effective_at desc
    ) latest
    where latest.valid_until>now()
  )
  select p.content || jsonb_build_object(
    'defaultCurrency',case when rates.values ? market.default_currency then market.default_currency else 'GBP' end,
    'preferredDisplayCurrency',market.default_currency,
    'displayCurrencies',coalesce((
      select jsonb_agg(currency_code order by currency_code)
      from (
        select currency_code from anybike_publishing.country_market_display_currencies where market_slug=p_slug
        union select 'USD'
      ) enabled
    ),'[]'::jsonb),
    'currencyRates',rates.values,
    'currencyRateExpiry',rates.expiry,
    'slug',p.slug,'locale',p.locale,'translationStatus','reviewed',
    'availableLocales',(
      select jsonb_agg(translation.locale order by translation.locale)
      from anybike_publishing.country_master_pages translation
      where translation.slug=p.slug and translation.published
    ),
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
  ) from page p cross join market cross join rates
$$;

revoke all on function public.public_anybike_country_master_v1(text,text) from public;
grant execute on function public.public_anybike_country_master_v1(text,text) to anon,authenticated;
commit;
