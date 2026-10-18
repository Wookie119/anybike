create or replace function public.admin_trade_invite_safety_v1(p_opportunity_id bigint)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_seller bigint;v_ids bigint[];
begin
 if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin permission required'; end if;
 select s.dealer_organisation_id into v_seller from public.anybike_trade_underwrite_opportunities o join public.seller_motorcycle_submissions s on s.id=o.submission_id where o.id=p_opportunity_id;
 if not found then raise exception 'Opportunity not found'; end if;
 select coalesce(array_agg(i.dealer_organisation_id),array[]::bigint[]) into v_ids from public.anybike_trade_underwrite_invitations i where i.opportunity_id=p_opportunity_id;
 return jsonb_build_object('seller_dealer_id',v_seller,'invited_dealer_ids',to_jsonb(v_ids));
end $$;
revoke all on function public.admin_trade_invite_safety_v1(bigint) from public,anon;
grant execute on function public.admin_trade_invite_safety_v1(bigint) to authenticated;