-- Admin-uploaded advertiser creatives, public images only; other buckets unaffected.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('advertising-creatives','advertising-creatives',true,10485760,array['image/webp','image/jpeg','image/png']::text[])
on conflict (id) do update set public=true,file_size_limit=10485760,allowed_mime_types=array['image/webp','image/jpeg','image/png']::text[];
drop policy if exists "Admin advertising creatives upload" on storage.objects;
create policy "Admin advertising creatives upload" on storage.objects for insert to authenticated with check(bucket_id='advertising-creatives' and public.anybike_is_admin());
drop policy if exists "Admin advertising creatives update" on storage.objects;
create policy "Admin advertising creatives update" on storage.objects for update to authenticated using(bucket_id='advertising-creatives' and public.anybike_is_admin()) with check(bucket_id='advertising-creatives' and public.anybike_is_admin());
drop policy if exists "Admin advertising creatives read" on storage.objects;
create policy "Admin advertising creatives read" on storage.objects for select to authenticated using(bucket_id='advertising-creatives' and public.anybike_is_admin());
drop policy if exists "Admin advertising creatives delete" on storage.objects;
create policy "Admin advertising creatives delete" on storage.objects for delete to authenticated using(bucket_id='advertising-creatives' and public.anybike_is_admin());