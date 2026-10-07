
update public.live_source_connectors
set results_url='https://preowned.ducati.com/pob/gb/en',
    status='needs_adapter',
    refresh_mode='manual',
    refresh_interval_minutes=null,
    notes='Current Ducati UK Certified Pre-Owned portal. Stock results are browser/API-rendered; public server-side page exposes placeholder result cards rather than a complete UK inventory. Keep manual until a reliable structured endpoint is identified.',
    updated_at=now()
where id=6;

update public.live_source_connectors
set status='needs_adapter',
    refresh_mode='manual',
    refresh_interval_minutes=null,
    notes='CMC group stock is not yet safe for automatic refresh. The main /bikes route is not exposing a dependable server-side inventory and brand microsites expose only partial group stock. Keep manual until the complete used-stock endpoint is identified.',
    updated_at=now()
where id=14;
