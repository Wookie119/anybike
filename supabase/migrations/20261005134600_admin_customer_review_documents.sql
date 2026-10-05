create or replace function public.admin_get_customer_review_documents_v1(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
begin
  if not public.anybike_is_admin() then
    raise exception 'Admin access required';
  end if;

  return jsonb_build_object(
    'customer_documents',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',cd.id,
        'document_type',cd.document_type,
        'document_title',cd.document_title,
        'original_file_name',cd.original_file_name,
        'verification_status',cd.verification_status,
        'document_status',cd.document_status,
        'storage_bucket',cd.storage_bucket,
        'storage_path',cd.storage_path,
        'created_at',cd.created_at
      ) order by cd.created_at desc)
      from public.anybike_customer_documents cd
      where cd.customer_id=p_customer_id and cd.deleted_at is null
    ),'[]'::jsonb),
    'motorcycle_documents',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',md.id,
        'deal_id',md.deal_id,
        'document_type',md.document_type,
        'document_title',md.document_title,
        'original_file_name',md.original_file_name,
        'storage_bucket',md.storage_bucket,
        'storage_path',md.storage_path,
        'document_status',md.document_status,
        'created_at',md.created_at
      ) order by md.created_at desc)
      from public.anybike_motorcycle_documents md
      where md.deal_id in (select id from public.anybike_deals where customer_id=p_customer_id)
    ),'[]'::jsonb)
  );
end;
$function$;

revoke all on function public.admin_get_customer_review_documents_v1(uuid) from public;
revoke all on function public.admin_get_customer_review_documents_v1(uuid) from anon;
grant execute on function public.admin_get_customer_review_documents_v1(uuid) to authenticated;
