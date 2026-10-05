create or replace function public.admin_get_customer_review_documents_v1(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_profile public.customer_profiles%rowtype;
  v_onboarding public.customer_buyer_onboarding%rowtype;
begin
  if not public.anybike_is_admin() then raise exception 'Admin access required'; end if;

  select * into v_profile from public.customer_profiles where id=p_customer_id;
  select * into v_onboarding from public.customer_buyer_onboarding where customer_id=p_customer_id;

  return jsonb_build_object(
    'onboarding_documents',jsonb_build_array(
      jsonb_build_object(
        'document_type','Passport / photo ID',
        'document_title','Passport / photo ID',
        'storage_bucket','deal-files',
        'storage_path',v_profile.identity_document_path,
        'verification_status',coalesce(v_onboarding.identity_status,'Not Reviewed')
      ),
      jsonb_build_object(
        'document_type','Proof of address',
        'document_title','Proof of address',
        'storage_bucket','deal-files',
        'storage_path',v_profile.proof_of_address_document_path,
        'verification_status',coalesce(v_onboarding.address_status,'Not Reviewed')
      ),
      jsonb_build_object(
        'document_type','Driving licence',
        'document_title','Driving licence',
        'storage_bucket','deal-files',
        'storage_path',v_profile.driving_licence_document_path,
        'verification_status',coalesce(v_onboarding.licence_status,'Not Reviewed')
      )
    ),
    'customer_documents',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',cd.id,'document_type',cd.document_type,'document_title',cd.document_title,
        'original_file_name',cd.original_file_name,'verification_status',cd.verification_status,
        'document_status',cd.document_status,'storage_bucket',cd.storage_bucket,
        'storage_path',cd.storage_path,'created_at',cd.created_at
      ) order by cd.created_at desc)
      from public.anybike_customer_documents cd
      where cd.customer_id=p_customer_id and cd.deleted_at is null
    ),'[]'::jsonb),
    'motorcycle_documents',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',md.id,'deal_id',md.deal_id,'document_type',md.document_type,
        'document_title',md.document_title,'original_file_name',md.original_file_name,
        'storage_bucket',md.storage_bucket,'storage_path',md.storage_path,
        'document_status',md.document_status,'created_at',md.created_at
      ) order by md.created_at desc)
      from public.anybike_motorcycle_documents md
      where md.deal_id in (select id from public.anybike_deals where customer_id=p_customer_id)
    ),'[]'::jsonb)
  );
end;
$function$;
