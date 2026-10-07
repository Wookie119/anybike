
-- Keep only feeds that have produced trustworthy inventory marked ready.
update public.live_source_connectors
set status='needs_adapter', refresh_mode='manual', refresh_interval_minutes=null,
    notes=trim(both ' ' from coalesce(notes,'') || ' Source-specific adapter still required: generic refresh did not produce reliable inventory.'),
    updated_at=now()
where id in (5,6,9,10,11,12,14,15,16,17);

-- Preserve partially useful generic feeds, but flag their current state in notes.
update public.live_source_connectors
set notes=trim(both ' ' from coalesce(notes,'') || ' Generic adapter is partially working; source-specific filtering is still being improved.'),
    updated_at=now()
where id in (3,4);

-- Quarantine obvious non-bike/category/navigation false positives instead of deleting history.
update public.live_source_items
set source_status='review',
    excluded_from_sourcing=true,
    last_changed_at=now(),
    updated_at=now()
where connector_id=3
  and (
    source_url like '%25%7B%7B%7Bvehicle-detail-slug%7D%7D%7D%'
    or source_url='https://www.bikesinstock.co.uk/bikes-for-sale'
    or upper(coalesce(model,'')) like '%PAGE NOT FOUND%'
    or lower(coalesce(model,'')) like '%motorcycles for sale in the uk%'
  );

update public.live_source_items
set source_status='review',
    excluded_from_sourcing=true,
    last_changed_at=now(),
    updated_at=now()
where connector_id=4
  and (
    source_url in ('https://www.motorcyclenews.com/bikes-for-sale/','https://www.motorcyclenews.com/bikes-for-sale/minibike/')
    or lower(coalesce(model,'')) like '%marketplace%'
  );

-- One MCN advert has a finance-style £149 amount misread as the bike price; quarantine until price parsing is tightened.
update public.live_source_items
set source_status='review',
    excluded_from_sourcing=true,
    last_changed_at=now(),
    updated_at=now()
where connector_id=4 and source_price_gbp < 500 and source_price_gbp > 0;

-- All records from currently unreliable adapters are retained for diagnostics but excluded from buyer sourcing.
update public.live_source_items
set source_status='review',
    excluded_from_sourcing=true,
    last_changed_at=now(),
    updated_at=now()
where connector_id in (5,6,9,10,11,12,14,15,16,17)
  and source_status='live';
