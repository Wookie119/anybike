update public.live_source_connectors
set results_url='https://www.bigmoto.co.uk/used-bikes',
    notes='Source-specific BigMoto adapter. Crawls the live /used-bikes paginated stock pages and accepts only complete motorcycle cards with genuine detail URLs.',
    updated_at=now()
where id=9;