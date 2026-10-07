
update public.live_source_connectors
set adapter_key='manchester-hd-uk',status='adapter_ready',refresh_mode='scheduled',refresh_interval_minutes=360,
    notes='Source-specific Manchester Harley-Davidson adapter using genuine motorcycle detail pages.',
    updated_at=now()
where id=17;

update public.live_source_connectors
set adapter_key='motodealers-uk',status='adapter_ready',refresh_mode='scheduled',refresh_interval_minutes=360,
    notes='Source-specific Moto Dealers adapter using genuine /bikes/<make>/<model>/<id> advert pages.',
    updated_at=now()
where id=15;
