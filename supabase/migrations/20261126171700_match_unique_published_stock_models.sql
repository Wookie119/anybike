CREATE OR REPLACE FUNCTION public.international_vq_public_catalog_v2()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
with buyer_safe as (
 select j.value item,j.ordinality position
 from jsonb_array_elements(public.international_vq_public_catalog_v1())
 with ordinality j(value,ordinality)
), unique_names as (
 select lower(trim(manufacturer)) make_key,
        lower(regexp_replace(model,'[^a-zA-Z0-9]','','g')) model_key,
        min(id) id
 from public.motorcycle_catalog_models
 group by 1,2
 having count(*)=1 and lower(regexp_replace(min(model),'[^a-zA-Z0-9]','','g'))<>''
), tagged as (
 select b.position,
 case when m.id is not null or (x.live_source_item_id is null and exact.id is not null)
 then b.item || jsonb_build_object(
     'catalog_model_id',coalesce(m.id,exact.id),
     'catalogue_identity_status','verified',
     'publication_eligible',true)
 else b.item end as item
 from buyer_safe b
 left join public.motorcycle_live_source_catalogue_identity_v1 x
   on x.live_source_item_id=(b.item->>'item_id')::bigint

 left join public.live_source_items i
   on i.id=x.live_source_item_id and x.review_status='verified' and i.make=x.source_make and i.model=x.source_model
 left join public.motorcycle_catalog_models m
   on m.id=x.catalog_model_id
  and lower(trim(m.manufacturer))=lower(trim(i.make))
  and lower(regexp_replace(m.model,'[^a-zA-Z0-9]','','g'))=
      lower(regexp_replace(i.model,'[^a-zA-Z0-9]','','g'))
 left join unique_names exact
   on x.live_source_item_id is null
  and exact.make_key=lower(trim(b.item->>'make'))
  and exact.model_key=lower(regexp_replace(b.item->>'model','[^a-zA-Z0-9]','','g'))
)
select coalesce(jsonb_agg(t.item || jsonb_build_object('google_source_permission_ready',coalesce(r.readiness_status='source_permission_ready',false),'images',coalesce((select jsonb_agg(z.buyer_safe_url order by z.position,z.id) from (select distinct on (b.buyer_safe_url) b.buyer_safe_url,b.position,b.id from public.anybike_live_source_buyer_safe_images b where b.live_source_item_id=(t.item->>'item_id')::bigint and b.safe_status='safe' and b.approved_for_buyer_display is true and b.buyer_safe_url like 'https://%' order by b.buyer_safe_url,b.position,b.id) z),'[]'::jsonb)) order by t.position),'[]'::jsonb) from tagged t left join public.admin_live_stock_google_readiness r on r.item_id=(t.item->>'item_id')::bigint
$function$;
