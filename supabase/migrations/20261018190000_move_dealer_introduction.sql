create table if not exists public.anybike_move_dealer_referrals (
 id bigint generated always as identity primary key,
 dealer_id bigint not null references public.dealer_organisations(id),
 requested_by uuid not null,
 status text not null default 'requested' check(status in ('requested','contacted','activated','declined')),
 consent_to_share boolean not null check (consent_to_share),
 requested_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(dealer_id)
);
alter table public.anybike_move_dealer_referrals enable row level security;
revoke all on public.anybike_move_dealer_referrals from anon,authenticated;
create or replace function public.dealer_request_move_introduction_v1()
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_dealer bigint;v_id bigint;v_status text;
begin
 if auth.uid() is null then raise exception 'Please sign in';end if;
 select du.dealer_organisation_id into v_dealer from public.dealer_users du
 join public.dealer_organisations d on d.id=du.dealer_organisation_id
 where du.user_id=auth.uid() and du.active and d.active order by du.verified desc limit 1;
 if v_dealer is null then raise exception 'Your dealership profile is not linked yet';end if;
 insert into public.anybike_move_dealer_referrals(dealer_id,requested_by,consent_to_share)
 values(v_dealer,auth.uid(),true)
 on conflict(dealer_id) do nothing returning id into v_id;
 select status into v_status from public.anybike_move_dealer_referrals where dealer_id=v_dealer;
 return jsonb_build_object('status',v_status,'created',v_id is not null);
end $$;
create or replace function public.dealer_move_introduction_status_v1()
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_dealer bigint;v_status text;
begin
 if auth.uid() is null then raise exception 'Please sign in';end if;
 select dealer_organisation_id into v_dealer from public.dealer_users where user_id=auth.uid() and active order by verified desc limit 1;
 if v_dealer is null then return jsonb_build_object('status','not_linked');end if;
 select status into v_status from public.anybike_move_dealer_referrals where dealer_id=v_dealer;
 return jsonb_build_object('status',coalesce(v_status,'not_requested'));
end $$;
revoke all on function public.dealer_request_move_introduction_v1() from public,anon;
revoke all on function public.dealer_move_introduction_status_v1() from public,anon;
grant execute on function public.dealer_request_move_introduction_v1() to authenticated;
grant execute on function public.dealer_move_introduction_status_v1() to authenticated;