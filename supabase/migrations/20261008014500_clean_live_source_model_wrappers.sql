update public.live_source_items
set model = trim(
  regexp_replace(
    regexp_replace(
      model,
      '^(?:Used|Ex[ -]?Demo)\s+' || regexp_replace(make, '([\-])', '\\\1', 'g') || '\s+',
      '',
      'i'
    ),
    '\s+for\s+sale\s+in\s+.+$',
    '',
    'i'
  )
),
updated_at=now()
where connector_id in (5,12,17)
  and (
    model ~* '^(Used|Ex[ -]?Demo)\s+'
    or model ~* '\s+for\s+sale\s+in\s+'
  );

update public.live_source_items
set model='F 900 R', updated_at=now()
where connector_id=1 and model='F 900 R R';

update public.live_source_items
set model='K 1600 B', updated_at=now()
where connector_id=1 and model='K 1600 B B';

delete from public.live_source_model_catalog;

insert into public.live_source_model_catalog
  (connector_id,make,model,first_seen_at,last_seen_at,is_current)
select
  connector_id,make,model,
  min(coalesce(first_seen_at,created_at,now())),
  max(coalesce(last_seen_at,updated_at,now())),
  true
from public.live_source_items
where source_status='live'
  and coalesce(make,'')<>''
  and coalesce(model,'')<>''
group by connector_id,make,model;
