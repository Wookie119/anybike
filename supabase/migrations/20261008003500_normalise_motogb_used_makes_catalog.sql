update public.live_source_items
set make = case lower(trim(make))
  when 'aprilia' then 'Aprilia'
  when 'benelli' then 'Benelli'
  when 'beta' then 'Beta'
  when 'bmw' then 'BMW'
  when 'ducati' then 'Ducati'
  when 'honda' then 'Honda'
  when 'indian' then 'Indian'
  when 'kawasaki' then 'Kawasaki'
  when 'ktm' then 'KTM'
  when 'lambretta' then 'Lambretta'
  when 'mgb' then 'MGB'
  when 'moto guzzi' then 'Moto Guzzi'
  when 'piaggio' then 'Piaggio'
  when 'qjmotor' then 'QJMotor'
  when 'royal enfield' then 'Royal Enfield'
  when 'suzuki' then 'Suzuki'
  when 'triumph' then 'Triumph'
  when 'voge' then 'Voge'
  when 'yamaha' then 'Yamaha'
  else trim(make)
end,
updated_at=now()
where connector_id=10 and coalesce(make,'')<>'';

delete from public.live_source_model_catalog where connector_id=10;

insert into public.live_source_model_catalog
  (connector_id,make,model,first_seen_at,last_seen_at,is_current)
select
  10,make,model,
  min(coalesce(first_seen_at,created_at,now())),
  max(coalesce(last_seen_at,updated_at,now())),
  true
from public.live_source_items
where connector_id=10
  and source_status='live'
  and coalesce(make,'')<>''
  and coalesce(model,'')<>''
group by make,model;
