
with fixed as (
  select id,
    case
      when upper(raw_data->>'Name') ~ 'VMAX' then 'VMAX'
      when upper(raw_data->>'Name') ~ 'XMAX[ -]?300' and upper(raw_data->>'Name') ~ 'TECH MAX' then 'XMAX 300 TECH MAX'
      when upper(raw_data->>'Name') ~ 'XMAX[ -]?300' then 'XMAX 300'
      when upper(raw_data->>'Name') ~ 'XMAX[ -]?125' then 'XMAX 125'
      when upper(raw_data->>'Name') ~ 'N-?MAX[ -]?155|NMAX[ -]?155' then 'NMAX 155'
      when upper(raw_data->>'Name') ~ 'N-?MAX[ -]?125|NMAX[ -]?125' then 'NMAX 125'
      when upper(raw_data->>'Name') ~ 'TRICITY.*300' then 'TRICITY 300'
      when upper(raw_data->>'Name') ~ 'TRICITY.*125|MW125' then 'TRICITY 125'
      when upper(raw_data->>'Name') ~ 'MT[- ]?125|MT125' then 'MT-125'
      when upper(raw_data->>'Name') ~ 'XSR[ -]?125' then 'XSR125'
      when upper(raw_data->>'Name') ~ 'YZF[- ]?R125|(^|[^0-9])R125([^0-9]|$)' then 'R125'
      when upper(raw_data->>'Name') ~ 'YZF[- ]?R1M|R1M' then 'YZF-R1M'
      when upper(raw_data->>'Name') ~ '(^|[^0-9])R1([^0-9]|$)' then 'R1'
      when upper(raw_data->>'Name') ~ '(^|[^0-9])R3([^0-9]|$)|YZF[ -]?R3' then 'R3'
      when upper(raw_data->>'Name') ~ '(^|[^0-9])R7([^0-9]|$)|YZF[ -]?R7' then 'R7'
      when upper(raw_data->>'Name') ~ '(^|[^0-9])R9([^0-9]|$)|YZF[ -]?R9' then 'R9'
      when upper(raw_data->>'Name') ~ 'MT[- ]?07|MT07' and upper(raw_data->>'Name') ~ 'Y[- ]?AMT|YAMT' then 'MT-07 Y-AMT'
      when upper(raw_data->>'Name') ~ 'MT[- ]?07|MT07' then 'MT-07'
      when upper(raw_data->>'Name') ~ 'MT[- ]?09|MT09' and upper(raw_data->>'Name') ~ 'Y[- ]?AMT|YAMT' then 'MT-09 Y-AMT'
      when upper(raw_data->>'Name') ~ 'MT[- ]?09|MT09' and upper(raw_data->>'Name') ~ '(^|[^A-Z])SP([^A-Z]|$)' then 'MT-09 SP'
      when upper(raw_data->>'Name') ~ 'MT[- ]?09|MT09' then 'MT-09'
      when upper(raw_data->>'Name') ~ 'MT[- ]?10|MT10' then 'MT-10'
      when upper(raw_data->>'Name') ~ 'XSR[ -]?700' then 'XSR700'
      when upper(raw_data->>'Name') ~ 'XSR[ -]?900' and upper(raw_data->>'Name') ~ '(^|[^A-Z])GP([^A-Z]|$)' then 'XSR900 GP'
      when upper(raw_data->>'Name') ~ 'XSR[ -]?900' then 'XSR900'
      when upper(raw_data->>'Name') ~ 'TENERE 700 WORLD RAID' then 'TENERE 700 WORLD RAID'
      when upper(raw_data->>'Name') ~ 'TENERE 700 RALLY' then 'TENERE 700 RALLY'
      when upper(raw_data->>'Name') ~ 'TENERE 700' then 'TENERE 700'
      when upper(raw_data->>'Name') ~ 'TRACER[ -]?7.*GT.*Y[- ]?AMT|TRACER 7 GT YAMT' then 'TRACER 7 GT Y-AMT'
      when upper(raw_data->>'Name') ~ 'TRACER[ -]?7.*GT' then 'TRACER 7 GT'
      when upper(raw_data->>'Name') ~ 'TRACER[ -]?7|TRACER 700' then 'TRACER 7'
      when upper(raw_data->>'Name') ~ 'TRACER[ -]?9.*GT\+' then 'TRACER 9 GT+'
      when upper(raw_data->>'Name') ~ 'TRACER[ -]?9.*GT.*Y[- ]?AMT|TRACER 9 GT YAMT' then 'TRACER 9 GT Y-AMT'
      when upper(raw_data->>'Name') ~ 'TRACER[ -]?9.*GT|TRACER 900GT|TRACER 900 GT' then 'TRACER 9 GT'
      when upper(raw_data->>'Name') ~ 'TRACER[ -]?9|TRACER 900' then 'TRACER 9'
      when upper(raw_data->>'Name') ~ 'TMAX.*TECH MAX' then 'TMAX TECH MAX'
      when upper(raw_data->>'Name') ~ 'TMAX' then 'TMAX'
      when upper(raw_data->>'Name') ~ 'RAYZR' then 'RAYZR'
      when upper(raw_data->>'Name') ~ 'FZ6.*S2' then 'FZ6 S2'
      when upper(raw_data->>'Name') ~ 'FZS.*FAZER|FAZER' then 'FZS FAZER'
      else null
    end as clean_model
  from public.live_source_items
  where connector_id=7 and source_status='live'
)
update public.live_source_items i
set model=f.clean_model, updated_at=now()
from fixed f
where i.id=f.id
  and f.clean_model is not null
  and i.model is distinct from f.clean_model;

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
