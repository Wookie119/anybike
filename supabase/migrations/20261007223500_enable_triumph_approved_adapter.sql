
update public.live_source_connectors
set adapter_key='triumph-approved-uk',status='adapter_ready',refresh_mode='scheduled',refresh_interval_minutes=360,
    notes='Source-specific Triumph Approved parser using genuine approved-preowned detail records.',
    updated_at=now()
where id=5;
