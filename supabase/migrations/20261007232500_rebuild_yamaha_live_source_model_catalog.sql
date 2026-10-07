delete from public.live_source_model_catalog where connector_id=7;

insert into public.live_source_model_catalog
  (connector_id,make,model,first_seen_at,last_seen_at,is_current)
select
  7,
  'Yamaha',
  model,
  min(coalesce(first_seen_at,created_at,now())),
  max(coalesce(last_seen_at,updated_at,now())),
  true
from public.live_source_items
where connector_id=7
  and source_status='live'
  and coalesce(model,'')<>''
group by model;

update public.live_source_connectors
set updated_at=now()
where id=7;
