update public.live_source_items
set model = case
  when upper(model) ~ 'MT[- ]?125|MT125' then 'MT-125'
  when upper(model) ~ 'MT[- ]?07|MT07' and upper(model) like '%Y-AMT%' then 'MT-07 Y-AMT'
  when upper(model) ~ 'MT[- ]?07|MT07' then 'MT-07'
  when upper(model) ~ 'MT[- ]?09|MT09' and upper(model) like '%SP%' then 'MT-09 SP'
  when upper(model) ~ 'MT[- ]?09|MT09' and (upper(model) like '%Y-AMT%' or upper(model) like '%YAMT%') then 'MT-09 Y-AMT'
  when upper(model) ~ 'MT[- ]?09|MT09' then 'MT-09'
  when upper(model) ~ 'MT[- ]?10|MT10' then 'MT-10'
  when upper(model) ~ 'N-?MAX[ -]?125' then 'NMAX 125'
  when upper(model) ~ 'N-?MAX[ -]?155' then 'NMAX 155'
  when upper(model) ~ 'YZF[- ]?R1M|R1M' then 'YZF-R1M'
  when upper(model) ~ '(^|[^0-9])R1([^0-9]|$)' then 'R1'
  when upper(model) ~ 'YZF[ -]?R125|R125' then 'R125'
  when upper(model) ~ '(^|[^0-9])R3([^0-9]|$)' then 'R3'
  when upper(model) ~ '(^|[^0-9])R7([^0-9]|$)' then 'R7'
  when upper(model) ~ 'YZF[ -]?R9|(^|[^0-9])R9([^0-9]|$)' then 'R9'
  when upper(model) like '%RAYZR%' then 'RAYZR'
  when upper(model) like '%TENERE 700 WORLD RAID%' then 'TENERE 700 WORLD RAID'
  when upper(model) like '%TENERE 700 RALLY%' then 'TENERE 700 RALLY'
  when upper(model) like '%TENERE 700%' then 'TENERE 700'
  when upper(model) like '%TMAX%' and upper(model) like '%TECH MAX%' then 'TMAX TECH MAX'
  when upper(model) like '%TMAX%' then 'TMAX'
  when upper(model) ~ 'TRACER[ -]?7' and upper(model) like '%GT%' and upper(model) like '%Y-AMT%' then 'TRACER 7 GT Y-AMT'
  when upper(model) ~ 'TRACER[ -]?7' and upper(model) like '%GT%' then 'TRACER 7 GT'
  when upper(model) ~ 'TRACER[ -]?7|TRACER 700' then 'TRACER 7'
  when upper(model) like '%TRACER 9%' and upper(model) like '%GT+%' then 'TRACER 9 GT+'
  when upper(model) like '%TRACER 9%' and upper(model) like '%GT%' and upper(model) like '%Y-AMT%' then 'TRACER 9 GT Y-AMT'
  when upper(model) like '%TRACER 9%' and upper(model) like '%GT%' then 'TRACER 9 GT'
  when upper(model) like '%TRACER 9%' or upper(model) like '%TRACER 900%' then 'TRACER 9'
  when upper(model) like '%TRICITY 300%' then 'TRICITY 300'
  when upper(model) like '%TRICITY%' and upper(model) like '%125%' then 'TRICITY 125'
  when upper(model) like '%WR125R%' then 'WR125R'
  when upper(model) like '%XMAX 125%' then 'XMAX 125'
  when upper(model) like '%XMAX 300%' and upper(model) like '%TECH MAX%' then 'XMAX 300 TECH MAX'
  when upper(model) like '%XMAX 300%' then 'XMAX 300'
  when upper(model) ~ 'XSR[ -]?125' then 'XSR125'
  when upper(model) ~ 'XSR[ -]?700' then 'XSR700'
  when upper(model) ~ 'XSR[ -]?900' and upper(model) like '%GP%' then 'XSR900 GP'
  when upper(model) ~ 'XSR[ -]?900' then 'XSR900'
  else trim(regexp_replace(regexp_replace(model,'\\mYAMAHA\\M','','gi'),'\\s+',' ','g'))
end,
updated_at=now()
where connector_id=7 and source_status='live';

update public.live_source_connectors
set notes='Structured Yamaha Approved Used feed. Yamaha models are normalised to clean sourcing model names; marketing copy and manufacturer wording are removed.',
    updated_at=now()
where id=7;
