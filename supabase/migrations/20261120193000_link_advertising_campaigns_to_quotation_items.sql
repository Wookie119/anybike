-- Link converted advertising campaigns to their originating quotation line.
-- Additive and idempotent; quotation acceptance never activates advertising.
alter table public.advertising_campaigns
 add column if not exists source_quotation_item_id uuid
 references public.advertising_quotation_items(id) on delete restrict;

create unique index if not exists advertising_campaign_source_quotation_item_unique
 on public.advertising_campaigns(source_quotation_item_id)
 where source_quotation_item_id is not null;

comment on column public.advertising_campaigns.source_quotation_item_id is
 'Source quotation placement. One draft campaign per accepted quotation line; prevents duplicate conversion.';
