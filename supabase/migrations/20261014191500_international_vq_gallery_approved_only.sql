
create table if not exists public.anybike_international_vq_gallery (
 live_source_item_id bigint primary key references public.live_source_items(id) on delete restrict,
 approved_by uuid not null,
 approved_at timestamptz not null default now(),
 published boolean not null default false,
 published_at timestamptz,
 checked_at timestamptz not null default now()
);
alter table public.anybike_international_vq_gallery enable row level security;
revoke all on public.anybike_international_vq_gallery from public, anon, authenticated;
grant all on public.anybike_international_vq_gallery to service_role;

create or replace function public.admin_list_vq_gallery_candidates_v1()
returns table(item_id bigint, make text, model text, year integer, mileage integer, source_status text, vat_qualifying boolean, safe_image_url text, published boolean)
language plpgsql security definer set search_path='public','pg_temp'
as $$
begin
 if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin only'; end if;
 return query
 select i.id,i.make,i.model,i.year,i.mileage,i.source_status,i.vat_qualifying,
 (select b.buyer_safe_url from public.anybike_live_source_buyer_safe_images b
 where b.live_source_item_id=i.id and b.safe_status='safe' and b.approved_for_buyer_display=true and b.buyer_safe_url like 'https://%'
 order by b.position,b.id limit 1),
 coalesce(g.published,false)
 from public.live_source_items i
 left join public.anybike_international_vq_gallery g on g.live_source_item_id=i.id
 where i.vat_qualifying=true and i.source_status='live'
 order by i.id desc limit 100;
end;$$;
revoke all on function public.admin_list_vq_gallery_candidates_v1() from public;
grant execute on function public.admin_list_vq_gallery_candidates_v1() to authenticated;

create or replace function public.admin_set_vq_gallery_publication_v1(p_item_id bigint,p_publish boolean)
returns boolean language plpgsql security definer set search_path='public','pg_temp'
as $$
declare v_eligible boolean;
begin
 if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin only'; end if;
 if p_publish then
  select exists(select 1 from public.live_source_items i
   where i.id=p_item_id and i.vat_qualifying=true and i.vat_qualifying_verified_at is not null
   and i.source_status='live' and coalesce(i.excluded_from_sourcing,false)=false
   and exists(select 1 from public.anybike_live_source_buyer_safe_images b
   where b.live_source_item_id=i.id and b.safe_status='safe' and b.approved_for_buyer_display=true and b.buyer_safe_url like 'https://%')) into v_eligible;
  if not v_eligible then raise exception 'VQ confirmation and approved buyer-safe image required'; end if;
 end if;
 insert into public.anybike_international_vq_gallery(live_source_item_id,approved_by,published,published_at)
 values(p_item_id,auth.uid(),p_publish,case when p_publish then now() else null end)
 on conflict(live_source_item_id) do update set published=excluded.published,published_at=excluded.published_at,approved_by=auth.uid(),checked_at=now();
 return true;
end;$$;
revoke all on function public.admin_set_vq_gallery_publication_v1(bigint,boolean) from public;
grant execute on function public.admin_set_vq_gallery_publication_v1(bigint,boolean) to authenticated;

create or replace function public.international_vq_gallery_v1()
returns table(item_id bigint, make text, model text, year integer, mileage integer, image_url text)
language plpgsql security definer stable set search_path='public','pg_temp'
as $$
begin
 if auth.uid() is null or not exists(
   select 1 from public.customer_profiles cp where cp.id=auth.uid()
   and cp.profile_reviewed_at is not null
   and lower(trim(coalesce(nullif(cp.business_country,''),cp.country,''))) not in ('','uk','united kingdom','great britain','england','scotland','wales','northern ireland')
   and lower(coalesce(cp.customer_type,'')) like '%dealer%'
 ) then
   return;
 end if;
 return query
 select i.id,i.make,i.model,i.year,i.mileage,
 (select b.buyer_safe_url from public.anybike_live_source_buyer_safe_images b
 where b.live_source_item_id=i.id and b.safe_status='safe' and b.approved_for_buyer_display=true and b.buyer_safe_url like 'https://%'
 order by b.position,b.id limit 1)
 from public.anybike_international_vq_gallery g
 join public.live_source_items i on i.id=g.live_source_item_id
 where g.published=true and i.vat_qualifying=true and i.vat_qualifying_verified_at is not null
 and i.source_status='live' and coalesce(i.excluded_from_sourcing,false)=false
 and exists(select 1 from public.anybike_live_source_buyer_safe_images b where b.live_source_item_id=i.id and b.safe_status='safe' and b.approved_for_buyer_display=true and b.buyer_safe_url like 'https://%')
 order by g.published_at desc limit 100;
end;$$;
revoke all on function public.international_vq_gallery_v1() from public;
grant execute on function public.international_vq_gallery_v1() to authenticated;
