
update public.live_source_items
set model = case
  when model ~* 'MT[- ]?125|MT125' then 'MT-125'
  when model ~* 'MT[- ]?07|MT07' and model ~* 'Y[- ]?AMT|YAMT' then 'MT-07 Y-AMT'
  when model ~* 'MT[- ]?07|MT07' then 'MT-07'
  when model ~* 'MT[- ]?09|MT09' and model ~* '\mSP\M' then 'MT-09 SP'
  when model ~* 'MT[- ]?09|MT09' and model ~* 'Y[- ]?AMT|YAMT' then 'MT-09 Y-AMT'
  when model ~* 'MT[- ]?09|MT09' then 'MT-09'
  when model ~* 'MT[- ]?10|MT10' then 'MT-10'
  when model ~* 'N-?MAX[ -]?125' then 'NMAX 125'
  when model ~* 'N-?MAX[ -]?155' then 'NMAX 155'
  when model ~* 'YZF[- ]?R1M|R1M' then 'YZF-R1M'
  when model ~* '(^|[^0-9])R125([^0-9]|$)|YZF[ -]?R125' then 'R125'
  when model ~* '(^|[^0-9])R1([^0-9]|$)' then 'R1'
  when model ~* '(^|[^0-9])R3([^0-9]|$)' then 'R3'
  when model ~* '(^|[^0-9])R7([^0-9]|$)' then 'R7'
  when model ~* '(^|[^0-9])R9([^0-9]|$)|YZF[ -]?R9' then 'R9'
  when model ~* 'RAYZR' then 'RAYZR'
  when model ~* 'TENERE 700 WORLD RAID' then 'TENERE 700 WORLD RAID'
  when model ~* 'TENERE 700 RALLY' then 'TENERE 700 RALLY'
  when model ~* 'TENERE 700' then 'TENERE 700'
  when model ~* 'TMAX' and model ~* 'TECH MAX' then 'TMAX TECH MAX'
  when model ~* 'TMAX' then 'TMAX'
  when model ~* 'TRACER[ -]?7|TRACER 700' and model ~* 'GT' and model ~* 'Y[- ]?AMT|YAMT' then 'TRACER 7 GT Y-AMT'
  when model ~* 'TRACER[ -]?7|TRACER 700' and model ~* 'GT' then 'TRACER 7 GT'
  when model ~* 'TRACER[ -]?7|TRACER 700' then 'TRACER 7'
  when model ~* 'TRACER 9|TRACER 900' and model ~* 'GT\+' then 'TRACER 9 GT+'
  when model ~* 'TRACER 9|TRACER 900' and model ~* 'GT' and model ~* 'Y[- ]?AMT|YAMT' then 'TRACER 9 GT Y-AMT'
  when model ~* 'TRACER 9|TRACER 900' and model ~* 'GT' then 'TRACER 9 GT'
  when model ~* 'TRACER 9|TRACER 900' then 'TRACER 9'
  when model ~* 'TRICITY 300' then 'TRICITY 300'
  when model ~* 'TRICITY' and model ~* '125' then 'TRICITY 125'
  when model ~* 'WR125R' then 'WR125R'
  when model ~* 'XMAX 125' then 'XMAX 125'
  when model ~* 'XMAX 300' and model ~* 'TECH MAX' then 'XMAX 300 TECH MAX'
  when model ~* 'XMAX 300' then 'XMAX 300'
  when model ~* 'XSR[ -]?125' then 'XSR125'
  when model ~* 'XSR[ -]?700' then 'XSR700'
  when model ~* 'XSR[ -]?900' and model ~* '\mGP\M' then 'XSR900 GP'
  when model ~* 'XSR[ -]?900' then 'XSR900'
  else model
end,
updated_at=now()
where connector_id=7
  and source_status='live';

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
