create or replace function public.admin_set_dealer_service_permissions_for_user_v2(p_user_id uuid,p_buy boolean,p_sell boolean,p_trade boolean,p_submit_underwrite boolean,p_bid boolean,p_international_vq boolean,p_move_interest boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id bigint;
begin
 if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin permission required';end if;
 select du.dealer_organisation_id into v_id from public.dealer_users du where du.user_id=p_user_id and du.active order by du.verified desc,du.dealer_organisation_id limit 1;
 if v_id is null then raise exception 'Linked dealership required';end if;
 return public.admin_set_dealer_service_permissions_v3(v_id,p_buy,p_sell,p_trade,p_submit_underwrite,p_bid,p_international_vq,p_move_interest);
end $$;
revoke all on function public.admin_set_dealer_service_permissions_for_user_v2(uuid,boolean,boolean,boolean,boolean,boolean,boolean,boolean) from public,anon;
grant execute on function public.admin_set_dealer_service_permissions_for_user_v2(uuid,boolean,boolean,boolean,boolean,boolean,boolean,boolean) to authenticated;