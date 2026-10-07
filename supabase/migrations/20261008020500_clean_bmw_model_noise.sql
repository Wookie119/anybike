update public.live_source_items
set model = case
  when model='CE 02 AM Pre Registered Special' then 'CE 02 AM'
  when model='F 900 R Ex' then 'F 900 R'
  when model in ('F 900 R Low','F 900 R LOW') then 'F 900 R'
  when model='G 310 GS Ex' then 'G 310 GS'
  when model='G 310 GS with' then 'G 310 GS'
  when model='M 1000 R EX' then 'M 1000 R'
  when model='M 1000 XR Low' then 'M 1000 XR'
  when model='R 1250 RT Very' then 'R 1250 RT'
  when model='R 1300 GS HIGH' then 'R 1300 GS'
  when model='F 900 R R' then 'F 900 R'
  when model='K 1600 B B' then 'K 1600 B'
  else model
end,
updated_at=now()
where connector_id=1
  and model in (
    'CE 02 AM Pre Registered Special','F 900 R Ex','F 900 R Low','F 900 R LOW',
    'G 310 GS Ex','G 310 GS with','M 1000 R EX','M 1000 XR Low',
    'R 1250 RT Very','R 1300 GS HIGH','F 900 R R','K 1600 B B'
  );

delete from public.live_source_model_catalog where connector_id=1;

insert into public.live_source_model_catalog
  (connector_id,make,model,first_seen_at,last_seen_at,is_current)
select
  1,make,model,
  min(coalesce(first_seen_at,created_at,now())),
  max(coalesce(last_seen_at,updated_at,now())),
  true
from public.live_source_items
where connector_id=1
  and source_status='live'
  and coalesce(make,'')<>''
  and coalesce(model,'')<>''
group by make,model;
