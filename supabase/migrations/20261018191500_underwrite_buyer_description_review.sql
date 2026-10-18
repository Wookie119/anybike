create or replace function public.admin_save_underwrite_buyer_description_v1(p_submission_id bigint,p_description text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not public.anybike_is_admin() then raise exception 'Admin access required'; end if;
 if not exists(select 1 from public.seller_motorcycle_submissions where id=p_submission_id) then raise exception 'Submission not found'; end if;
 if length(trim(coalesce(p_description,'')))>3500 then raise exception 'Description too long'; end if;
 update public.seller_motorcycle_submissions set dealer_description=nullif(trim(p_description),''),updated_at=now() where id=p_submission_id;
 return jsonb_build_object('success',true,'submission_id',p_submission_id);
end $$;
revoke all on function public.admin_save_underwrite_buyer_description_v1(bigint,text) from public,anon;
grant execute on function public.admin_save_underwrite_buyer_description_v1(bigint,text) to authenticated;