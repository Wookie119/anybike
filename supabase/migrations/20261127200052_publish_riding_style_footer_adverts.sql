with slots as (
  select target.slot_code, target.page_path, source.campaign_ids, source.artwork_formats, source.advert_count
  from public.advertising_slot_published_layouts source
  join public.advertising_page_inventory target on target.page_path in (
    '/motorcycle-type-adventure.html','/motorcycle-type-touring.html','/motorcycle-type-sports.html','/motorcycle-type-classics.html',
    '/motorcycle-type-cruisers.html','/motorcycle-type-scooters.html','/motorcycle-type-roadsters.html','/motorcycle-type-off-road.html')
    and target.placement_key = 'main_end' and not target.excluded
  where source.page_path = '/motorcycle-types.html' and source.advert_count = 3
    and source.artwork_formats = array['square','square','square']::text[]
), published as (
  insert into public.advertising_slot_published_layouts(slot_code,page_path,campaign_ids,artwork_formats,advert_count)
  select * from slots on conflict (slot_code) do nothing
  returning slot_code,advert_count
)
update public.advertising_page_inventory target set placement_enabled=true, advert_count=p.advert_count, updated_at=now()
from published p where target.slot_code=p.slot_code;
