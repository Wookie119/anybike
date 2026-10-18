create or replace function public.admin_get_underwrite_buyer_description_v1(p_submission_id bigint)
returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare v_text text;
begin
 if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin access required';end if;
 select dealer_description into v_text from public.seller_motorcycle_submissions where id=p_submission_id;
 return v_text;
end $$;
revoke all on function public.admin_get_underwrite_buyer_description_v1(bigint) from public,anon;
grant execute on function public.admin_get_underwrite_buyer_description_v1(bigint) to authenticated;