create table if not exists public.international_vq_interests (
 id bigint generated always as identity primary key,
 buyer_id uuid not null,
 live_source_item_id bigint not null references public.live_source_items(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 status text not null default 'interested',
 unique (buyer_id,live_source_item_id)
);
alter table public.international_vq_interests enable row level security;
revoke all on public.international_vq_interests from public,anon,authenticated;
grant all on public.international_vq_interests to service_role;
create or replace function public.international_vq_motorcycle_v1(p_item_id bigint)
returns jsonb language plpgsql security definer stable set search_path='public','pg_temp'
as $$
declare v_item record;
begin
 select * into v_item from public.international_vq_gallery_v1() where item_id=p_item_id limit 1;
 if not found then return null; end if;
 return jsonb_build_object('id',v_item.item_id,'make',v_item.make,'model',v_item.model,'year',v_item.year,'mileage',v_item.mileage,'images',
 coalesce((select jsonb_agg(b.buyer_safe_url order by b.position,b.id) from public.anybike_live_source_buyer_safe_images b where b.live_source_item_id=p_item_id and b.safe_status='safe' and b.approved_for_buyer_display=true and b.buyer_safe_url like 'https://%'),'[]'::jsonb),
 'interested',exists(select 1 from public.international_vq_interests t where t.buyer_id=auth.uid() and t.live_source_item_id=p_item_id));
end;$$;
revoke all on function public.international_vq_motorcycle_v1(bigint) from public;
grant execute on function public.international_vq_motorcycle_v1(bigint) to authenticated;

create or replace function public.international_vq_record_interest_v1(p_item_id bigint)
returns jsonb language plpgsql security definer set search_path='public','pg_temp'
as $$
begin
 if auth.uid() is null or not exists(select 1 from public.international_vq_gallery_v1() where item_id=p_item_id) then
 raise exception 'Motorcycle unavailable to this account';
 end if;
 insert into public.international_vq_interests(buyer_id,live_source_item_id)
 values(auth.uid(),p_item_id)
 on conflict (buyer_id,live_source_item_id) do update set status='interested',updated_at=now();
 return jsonb_build_object('saved',true,'motorcycle_id',p_item_id);
end;$$;
revoke all on function public.international_vq_record_interest_v1(bigint) from public;
grant execute on function public.international_vq_record_interest_v1(bigint) to authenticated;