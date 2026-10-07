
update public.live_source_connectors
set adapter_key='motogb-new-uk',status='adapter_ready',refresh_mode='scheduled',refresh_interval_minutes=720,
    notes='Source-specific MotoGB new-bike catalogue adapter using genuine /model/...-<id> detail pages.',
    updated_at=now()
where id=11;
