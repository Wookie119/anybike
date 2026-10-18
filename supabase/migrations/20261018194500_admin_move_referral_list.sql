create or replace function public.admin_list_move_dealer_referrals_v1()
returns table(referral_id bigint,dealer_id bigint,dealer_name text,contact_email text,contact_phone text,referral_status text,requested_at timestamptz)
language sql security definer set search_path=public,pg_temp as $$
select r.id,d.id,d.trading_name::text,d.email::text,d.telephone::text,r.status,r.requested_at
from public.anybike_move_dealer_referrals r join public.dealer_organisations d on d.id=r.dealer_id
where auth.uid() is not null and public.anybike_is_admin()
order by r.requested_at desc $$;
revoke all on function public.admin_list_move_dealer_referrals_v1() from public,anon;
grant execute on function public.admin_list_move_dealer_referrals_v1() to authenticated;