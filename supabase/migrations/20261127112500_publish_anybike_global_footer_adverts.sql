-- Give Global its own placement using the approved manufacturer-directory campaign mix.
-- Preserve the advertising service's existing verified UK audience restriction.
with published as (
  insert into public.advertising_slot_published_layouts
    (slot_code, page_path, campaign_ids, artwork_formats, advert_count)
  select target.slot_code, target.page_path, source.campaign_ids,
    source.artwork_formats, source.advert_count
  from public.advertising_slot_published_layouts source
  join public.advertising_page_inventory target
    on target.page_path = '/anybike-global.html'
    and target.slot_code = 'AB-UK-51D766443D'
    and target.placement_key = 'main_end'
    and not target.excluded
  where source.page_path = '/motorcycle-manufacturers.html'
    and source.slot_code = 'AB-UK-4F13F319B7'
    and source.advert_count = 3
    and source.artwork_formats = array['square', 'square', 'square']::text[]
  on conflict (slot_code) do nothing
  returning page_path, slot_code, advert_count
)
update public.advertising_page_inventory inventory
set placement_enabled = true,
    advert_count = published.advert_count,
    updated_at = now()
from published
where inventory.page_path = published.page_path
  and inventory.slot_code = published.slot_code;
