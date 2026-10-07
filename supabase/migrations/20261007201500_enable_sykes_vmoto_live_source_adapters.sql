update public.live_source_connectors
set adapter_key='sykes-hd-uk',
    status='adapter_ready',
    refresh_mode='scheduled',
    refresh_interval_minutes=360,
    results_url='https://sykeshd.com/all-inventory',
    notes='AnyBike adapter reads Sykes Harley-Davidson live inventory. Seller identity remains internal and buyer-safe image processing applies before sharing.',
    updated_at=now()
where id=16;

update public.live_source_connectors
set name='VMoto UK',
    source_type='manufacturer_catalogue',
    base_url='https://vmoto.co.uk/',
    results_url='https://vmoto.co.uk/',
    adapter_key='vmoto-uk-catalogue',
    status='adapter_ready',
    refresh_mode='scheduled',
    refresh_interval_minutes=720,
    notes='Official VMoto UK model catalogue connector. Model and starting-price data can refresh automatically; specific unit stock must still be confirmed with VMoto UK until a stock API/feed is connected.',
    updated_at=now()
where id=19;
