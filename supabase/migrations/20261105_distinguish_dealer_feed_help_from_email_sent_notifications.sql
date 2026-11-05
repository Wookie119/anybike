create or replace function public.customer_request_dealer_stock_connection_v1(p_method text,p_provider_name text default null,p_details text default null)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare v_id bigint; v_type text; v_name text; v_provider text; v_details text; v_user uuid; v_help boolean;
begin
 v_user:=auth.uid();
 if v_user is null then raise exception 'Sign in required'; end if;
 select customer_type,business_name into v_type,v_name from public.customer_profiles where id=v_user;
 if v_type not in ('uk_dealer','uk_distributor','intl_dealer') then raise exception 'Dealer account required'; end if;
 if p_method not in ('csv','deepblue','other_dms') then raise exception 'Select a valid stock connection method'; end if;
 v_provider:=left(nullif(btrim(p_provider_name),''),160);
 v_details:=left(nullif(btrim(p_details),''),2000);
 v_help:=coalesce(v_details,'') like 'Dealer requests help arranging a permanent stock feed.%';
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||':feed-confirm',50219));
 select id into v_id from public.dealer_stock_connection_leads where user_id=v_user and method=p_method and provider_name is not distinct from v_provider and details is not distinct from v_details and created_at>now()-interval '24 hours' order by created_at desc,id desc limit 1;
 if v_id is not null then return jsonb_build_object('success',true,'request_id',v_id,'already_recorded',true);end if;
 insert into public.dealer_stock_connection_leads(user_id,method,provider_name,details) values(v_user,p_method,v_provider,v_details) returning id into v_id;
 insert into public.admin_notifications(type,title,message,link,is_read)
 values('dealer_stock_connection',case when v_help then 'Dealer requests help connecting stock' else 'Dealer stock feed request sent' end,
 case when v_help then coalesce(nullif(v_name,''),'A dealer')||' asks AnyBike for help arranging a stock feed with '||coalesce(v_provider,'their stock provider')||'. No provider email was sent by AnyBike. Contact the dealer to arrange the next step.'
 else coalesce(nullif(v_name,''),'A dealer')||' confirms they sent a stock feed request to '||coalesce(v_provider,'their stock provider')||'. Follow up on the sample feed and connection.' end,
 '/admin-customer-database.html?customer='||v_user::text,false);
 return jsonb_build_object('success',true,'request_id',v_id,'already_recorded',false);
end $function$;
update public.admin_notifications set title='Dealer requests help connecting stock',message='Gifford Motorcycles ltd asks AnyBike for help arranging a stock feed with Auto Trader. No provider email was sent by AnyBike. Contact the dealer to arrange the next step.' where id=627 and type='dealer_stock_connection' and title='Dealer stock feed request sent' and message like 'Gifford Motorcycles ltd confirms they sent a stock feed request to Auto Trader.%';