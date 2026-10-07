update public.live_source_connectors
set name='Harley-Davidson Approved Used',
    source_type='website',
    base_url='https://www.h-dcertified.co.uk/',
    results_url='https://www.h-dcertified.co.uk/gb/bikes/page/1',
    adapter_key='harley-certified-uk',
    status='adapter_ready',
    refresh_mode='scheduled',
    refresh_interval_minutes=360,
    notes='Structured Harley-Davidson H-D Certified Approved Used UK stock connector. Uses AssetID as stable stock key and tracks live/ended inventory.',
    updated_at=now()
where id=8;