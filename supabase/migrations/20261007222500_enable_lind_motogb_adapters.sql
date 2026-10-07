
update public.live_source_connectors
set adapter_key='lind-used-uk',status='adapter_ready',refresh_mode='scheduled',refresh_interval_minutes=360,
    notes='Source-specific LIND Used parser using genuine /used/.../<id>.htm motorcycle records.',
    updated_at=now()
where id=12;

update public.live_source_connectors
set adapter_key='motogb-used-uk',status='adapter_ready',refresh_mode='scheduled',refresh_interval_minutes=360,
    notes='Source-specific MotoGB Used parser using genuine used-bike detail records.',
    updated_at=now()
where id=10;
