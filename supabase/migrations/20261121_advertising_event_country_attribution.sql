alter table public.advertising_events add column if not exists country_code text;
alter table public.advertising_events drop constraint if exists advertising_events_country_code_check;
alter table public.advertising_events add constraint advertising_events_country_code_check check (country_code is null or country_code ~ '^[A-Z]{2}$');
create index if not exists advertising_events_country_date_idx on public.advertising_events(country_code,occurred_at);