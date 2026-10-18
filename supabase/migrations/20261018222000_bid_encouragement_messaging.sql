create table if not exists public.anybike_dealer_auction_message_preferences (
 dealer_organisation_id bigint primary key references public.dealer_organisations(id) on delete cascade,
 encouragement_paused boolean not null default false,
 updated_at timestamptz not null default now(),
 updated_by uuid
);
alter table public.anybike_dealer_auction_message_preferences enable row level security;
create or replace function public.dealer_set_auction_encouragement_paused_v1(p_paused boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id bigint;
begin
 select dealer_organisation_id into v_id from public.dealer_users where user_id=auth.uid() and active and verified order by id limit 1;
 if v_id is null then raise exception 'Verified dealership required';end if;
 insert into public.anybike_dealer_auction_message_preferences(dealer_organisation_id,encouragement_paused,updated_by)
 values(v_id,p_paused,auth.uid())
 on conflict(dealer_organisation_id) do update set encouragement_paused=excluded.encouragement_paused,updated_at=now(),updated_by=auth.uid();
 return jsonb_build_object('success',true,'paused',p_paused);
end $$;
create or replace function public.dealer_get_auction_encouragement_paused_v1()
returns boolean language sql security definer set search_path=public,pg_temp as $$
 select coalesce((select p.encouragement_paused from public.anybike_dealer_auction_message_preferences p join public.dealer_users u on u.dealer_organisation_id=p.dealer_organisation_id where u.user_id=auth.uid() and u.active and u.verified limit 1),false)
$$;
create or replace function public.admin_send_trade_bidder_encouragement_v1(p_opportunity_id bigint,p_dealer_id bigint,p_body text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid;v_thread bigint;v_dealer text;v_bike text;v_paused boolean;v_msg bigint;
begin
 if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin only';end if;
 if length(trim(coalesce(p_body,'')))<10 or length(p_body)>1500 then raise exception 'Message must be 10-1500 characters';end if;
 if not exists(select 1 from public.anybike_trade_underwrite_opportunities o join public.anybike_trade_underwrite_invitations i on i.opportunity_id=o.id where o.id=p_opportunity_id and o.status='live' and o.closes_at>now() and i.dealer_organisation_id=p_dealer_id) then raise exception 'Live invited auction required';end if;
 if not exists(select 1 from public.anybike_trade_underwrite_bids where opportunity_id=p_opportunity_id and dealer_organisation_id=p_dealer_id and status='live') then raise exception 'Dealer does not have a live bid';end if;
 select coalesce(encouragement_paused,false) into v_paused from public.anybike_dealer_auction_message_preferences where dealer_organisation_id=p_dealer_id;
 if coalesce(v_paused,false) then raise exception 'Dealer has paused encouragement messages';end if;
 select u.user_id into v_user from public.dealer_users u where u.dealer_organisation_id=p_dealer_id and u.active and u.verified order by u.id limit 1;
 if v_user is null then raise exception 'No verified recipient';end if;
 select trading_name into v_dealer from public.dealer_organisations where id=p_dealer_id;
 select concat_ws(' ',s.make,s.model) into v_bike from public.anybike_trade_underwrite_opportunities o join public.seller_motorcycle_submissions s on s.id=o.submission_id where o.id=p_opportunity_id;
 select t.id into v_thread from public.message_centre_threads t where t.customer_id=v_user and t.source_type='trade_underwrite_bid_encouragement' and t.related_request_id=p_opportunity_id order by t.id desc limit 1;
 if v_thread is null then
 insert into public.message_centre_threads(customer_id,customer_name,source_type,subject,status,department,related_request_id,bike_make,bike_model)
 values(v_user,v_dealer,'trade_underwrite_bid_encouragement','Trade bidding · '||coalesce(v_bike,'Motorcycle'),'open','Sales',p_opportunity_id,null,null) returning id into v_thread;
 end if;
 insert into public.message_centre_messages(thread_id,sender_type,sender_name,message,is_internal_note)
 values(v_thread,'admin','AnyBike',trim(p_body),false) returning id into v_msg;
 update public.message_centre_threads set last_message=left(trim(p_body),500),last_message_at=now(),last_sender='admin',updated_at=now() where id=v_thread;
 return jsonb_build_object('success',true,'thread_id',v_thread,'message_id',v_msg);
end $$;
revoke all on function public.dealer_set_auction_encouragement_paused_v1(boolean),public.dealer_get_auction_encouragement_paused_v1(),public.admin_send_trade_bidder_encouragement_v1(bigint,bigint,text) from public,anon;
grant execute on function public.dealer_set_auction_encouragement_paused_v1(boolean),public.dealer_get_auction_encouragement_paused_v1(),public.admin_send_trade_bidder_encouragement_v1(bigint,bigint,text) to authenticated;