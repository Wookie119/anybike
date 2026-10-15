create or replace function public.admin_set_trade_underwrite_deadline_v1(p_opportunity_id bigint,p_closes_at timestamptz)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_close timestamptz;
begin
 if not public.anybike_is_admin() then raise exception 'Admin access required'; end if;
 if p_closes_at is null or p_closes_at <= now() + interval '5 minutes' or p_closes_at > now() + interval '30 days' then
  raise exception 'Choose a closing time between 5 minutes and 30 days from now';
 end if;
 update public.anybike_trade_underwrite_opportunities
 set closes_at=p_closes_at, updated_at=now()
 where id=p_opportunity_id and status='live'
 returning closes_at into v_close;
 if v_close is null then raise exception 'No live underwriting opportunity found'; end if;
 return jsonb_build_object('success',true,'closes_at',v_close);
end $$;
revoke all on function public.admin_set_trade_underwrite_deadline_v1(bigint,timestamptz) from public, anon;
grant execute on function public.admin_set_trade_underwrite_deadline_v1(bigint,timestamptz) to authenticated;
