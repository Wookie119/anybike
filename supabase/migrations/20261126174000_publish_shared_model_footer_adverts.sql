insert into public.advertising_slot_published_layouts
 (slot_code,page_path,campaign_ids,artwork_formats,advert_count)
select 'AB-UK-MODEL-FOOT',p.page_path,source.campaign_ids,source.artwork_formats,source.advert_count
from public.advertising_slot_published_layouts source
join public.advertising_page_inventory p on p.page_path='/motorcycle-v2-master.html'
 and p.slot_code='AB-UK-MODEL-FOOT' and p.placement_key='before_sources' and p.placement_enabled
where source.slot_code='AB-UK-ABOUT' and source.page_path='/about-us.html'
 and source.advert_count=3 and source.artwork_formats=array['square','square','square']::text[]
on conflict (slot_code) do nothing;
