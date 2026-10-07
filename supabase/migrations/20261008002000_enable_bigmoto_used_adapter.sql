
update public.live_source_connectors
set adapter_key='bigmoto-used-uk',status='adapter_ready',refresh_mode='scheduled',refresh_interval_minutes=180,
    results_url='https://www.bigmoto.co.uk/used/bikes/yamaha',
    notes='Source-specific BigMoto adapter. Crawls used-bike make/result pages and accepts only cards with year, mileage, price and a genuine BigMoto motorcycle detail URL.',
    updated_at=now()
where id=9;
