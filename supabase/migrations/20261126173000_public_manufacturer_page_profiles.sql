
alter table public.motorcycle_catalog_manufacturers
 add column if not exists public_page_title text,
 add column if not exists public_page_intro text;

alter table public.motorcycle_manufacturer_sections_v1
 add column if not exists public_body text;

update public.motorcycle_catalog_manufacturers
set public_page_title=coalesce(public_page_title,case slug
  when 'bmw' then E'BMW Motorcycles\nfrom the UK'
  when 'harley-davidson' then E'Harley-Davidson Motorcycles\nfrom the UK'
  when 'indian-motorcycle' then 'Indian Motorcycles'
  else display_name||' Motorcycles from the UK' end),
 public_page_intro=coalesce(public_page_intro,case slug
  when 'bmw' then 'Find the BMW motorcycle your business wants to buy. Explore GS adventure bikes, S and M sports motorcycles, touring machines, roadsters and historic BMW models — then ask AnyBike to source your chosen motorcycle from UK sellers.'
  when 'harley-davidson' then 'Find the Harley-Davidson your business wants to buy. Explore Grand American Touring motorcycles, Softail cruisers, Sportsters, Pan America adventure models and specialist CVO editions — then request your chosen model from UK sellers through AnyBike.'
  when 'indian-motorcycle' then 'A motorcycle name born in 1901, a celebrated Scout and Chief, a factory closure, decades of changing ownership and an extraordinary return. The story of Indian is not one uninterrupted company — it is a remarkable marque with distinct eras.'
  else 'Explore '||display_name||' motorcycle families and popular models. AnyBike can source current, used, classic and discontinued models from the UK on request, subject to seller availability.' end)
where public_page_title is null or public_page_intro is null;

create or replace function public.public_anybike_manufacturer_page_v1(p_make text)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'make',m.display_name,
  'title',coalesce(m.public_page_title,m.display_name||' Motorcycles from the UK'),
  'intro',coalesce(m.public_page_intro,'Explore '||m.display_name||' motorcycle models and current stock.'),
  'logo_url',case when m.public_logo_url like 'https://%' then m.public_logo_url end,
  'accent_hex',m.public_stock_accent_hex,
  'sections',coalesce((
   select jsonb_agg(jsonb_build_object('number',s.section_number,'title',s.section_title,'body',s.public_body)
                   order by s.section_number)
   from public.motorcycle_manufacturer_sections_v1 s
   where s.manufacturer_id=m.id and s.editorial_status='published'
    and s.published_at<=now() and nullif(btrim(s.public_body),'') is not null
  ),'[]'::jsonb)
 )
 from public.motorcycle_catalog_manufacturers m
 where length(p_make) between 2 and 80
 and regexp_replace(lower(m.display_name),'[^a-z0-9]','','g')
     =regexp_replace(lower(p_make),'[^a-z0-9]','','g')
 limit 1;
$$;

revoke all on function public.public_anybike_manufacturer_page_v1(text) from public,anon,authenticated;
grant execute on function public.public_anybike_manufacturer_page_v1(text) to anon,authenticated,service_role;
