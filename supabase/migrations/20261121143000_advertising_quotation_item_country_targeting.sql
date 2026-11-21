-- Add explicit country targeting to each quoted advertising placement.
-- Quote-level audience remains UK / International / Worldwide. Empty country
-- targeting means a legacy line needs review before a campaign may activate.
alter table public.advertising_quotation_items
  add column if not exists countries text[] not null default '{}'::text[];

comment on column public.advertising_quotation_items.countries is
  'Explicit two-letter country codes selected for this quoted placement. Empty means review required before campaign activation.';
