
update public.live_source_items
set model='TRACER', updated_at=now()
where connector_id=7
  and source_status='live'
  and id=1706
  and model='CBF';

delete from public.live_source_model_catalog where connector_id=7;

insert into public.live_source_model_catalog
  (connector_id,make,model,first_seen_at,last_seen_at,is_current)
select 7,make,model,
       min(coalesce(first_seen_at,created_at,now())),
       max(coalesce(last_seen_at,updated_at,now())),
       true
from public.live_source_items
where connector_id=7
  and source_status='live'
  and coalesce(make,'')<>''
  and coalesce(model,'')<>''
group by make,model;
