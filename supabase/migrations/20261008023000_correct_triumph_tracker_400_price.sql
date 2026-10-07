
update public.live_source_items
set source_price_gbp=4995,
    updated_at=now(),
    last_changed_at=now()
where id=1873 and connector_id=5;

delete from public.live_source_model_catalog where connector_id=5;

insert into public.live_source_model_catalog
  (connector_id,make,model,first_seen_at,last_seen_at,is_current)
select
  5,make,model,
  min(coalesce(first_seen_at,created_at,now())),
  max(coalesce(last_seen_at,updated_at,now())),
  true
from public.live_source_items
where connector_id=5
  and source_status='live'
  and coalesce(make,'')<>''
  and coalesce(model,'')<>''
group by make,model;
