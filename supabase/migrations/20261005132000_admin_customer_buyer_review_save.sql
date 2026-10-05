create or replace function public.admin_save_customer_buyer_review_v1(
  p_customer_id uuid,
  p_approval_status text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_uid uuid := auth.uid();
  v_status text := lower(trim(coalesce(p_approval_status,'')));
begin
  if not public.anybike_is_admin() then
    raise exception 'Admin access required';
  end if;
  if p_customer_id is null then
    raise exception 'Customer is required';
  end if;
  if v_status not in ('approved','approved_with_exception','more_information_required','not_reviewed') then
    raise exception 'Invalid buyer review decision';
  end if;

  insert into public.customer_buyer_onboarding(
    customer_id,approval_status,internal_notes,
    approved_at,approved_by,last_reviewed_at,last_reviewed_by,updated_at
  )
  values(
    p_customer_id,v_status,nullif(trim(coalesce(p_notes,'')),''),
    case when v_status in ('approved','approved_with_exception') then now() else null end,
    case when v_status in ('approved','approved_with_exception') then v_uid else null end,
    now(),v_uid,now()
  )
  on conflict (customer_id) do update
  set approval_status=excluded.approval_status,
      internal_notes=case when nullif(trim(coalesce(p_notes,'')),'') is not null then p_notes else customer_buyer_onboarding.internal_notes end,
      approved_at=case when v_status in ('approved','approved_with_exception') then now() else null end,
      approved_by=case when v_status in ('approved','approved_with_exception') then v_uid else null end,
      last_reviewed_at=now(),
      last_reviewed_by=v_uid,
      updated_at=now();

  return jsonb_build_object('success',true,'customer_id',p_customer_id,'approval_status',v_status);
end;
$function$;