create or replace function public.admin_set_dealer_service_permissions_for_user_v1(p_user_id uuid,p_buy boolean,p_sell boolean,p_trade boolean,p_bid boolean,p_international_vq boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id bigint;v_result jsonb;
begin
 if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin permission required';end if;
 select du.dealer_organisation_id into v_id from public.dealer_users du where du.user_id=p_user_id and du.active=true order by du.verified desc,du.dealer_organisation_id limit 1;
 if v_id is null then raise exception 'No linked dealership organisation found. Complete organisation verification before saving Level 2 service permissions.';end if;
 v_result:=public.admin_set_dealer_service_permissions_v1(v_id,p_buy,p_sell,p_trade,p_bid,p_international_vq);
 return v_result;
end $$;
revoke all on function public.admin_set_dealer_service_permissions_for_user_v1(uuid,boolean,boolean,boolean,boolean,boolean) from public,anon;
grant execute on function public.admin_set_dealer_service_permissions_for_user_v1(uuid,boolean,boolean,boolean,boolean,boolean) to authenticated;