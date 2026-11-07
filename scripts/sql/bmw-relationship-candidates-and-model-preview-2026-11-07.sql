-- Exact deployed production function definitions, 2026-11-07.
-- Admin-only, read-only; not approved for publication.

CREATE OR REPLACE FUNCTION public.admin_bmw_model_section_preview_v1(p_model_slug text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_sections jsonb; v_media jsonb; v_relationships jsonb; v_models jsonb;
begin
 if auth.uid() is null or not public.anybike_is_admin() then
   raise exception 'Admin access required';
 end if;
 v_sections := public.admin_bmw_verified_model_sections_v1(p_model_slug);
 v_media := public.admin_bmw_model_media_relationships_v1(p_model_slug);
 v_relationships := public.admin_bmw_relationship_candidates_v1(p_model_slug);
 with section_models as (
  select value as section_model from jsonb_array_elements(v_sections->'models')
 ), media_models as (
  select value as media_model from jsonb_array_elements(v_media->'models')
 )
 select coalesce(jsonb_agg(
  s.section_model || jsonb_build_object(
   'model_year_gallery',coalesce(m.media_model->'model_year_gallery','[]'::jsonb),
   'model_year_gallery_count',coalesce((m.media_model->>'model_year_gallery_count')::integer,0),
   'approved_media',coalesce(m.media_model->'approved_media','[]'::jsonb),
   'relationship_candidates',coalesce((
     select jsonb_agg(p.value)
     from jsonb_array_elements(v_relationships->'pairs') p
     where p.value->>'slug_a'=s.section_model->>'slug'
        or p.value->>'slug_b'=s.section_model->>'slug'
   ),'[]'::jsonb),
   'gallery_publication_enabled',false,
   'relationship_publication_enabled',false
  ) order by s.section_model->>'model'
 ),'[]'::jsonb) into v_models
 from section_models s
 left join media_models m on m.media_model->>'slug'=s.section_model->>'slug';
 return jsonb_build_object('manufacturer','BMW','section_contract',13,
  'models',v_models,'model_count',jsonb_array_length(v_models),
  'relationship_summary',jsonb_build_object('pair_count',v_relationships->'pair_count',
    'conflict_count',v_relationships->'conflict_count'),
  'mode','admin_only_read_only','publication_enabled',false,
  'approved_editorial_preserved',true);
end;
$function$;
REVOKE ALL ON FUNCTION public.admin_bmw_model_section_preview_v1(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bmw_model_section_preview_v1(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_bmw_relationship_candidates_v1(p_model_slug text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_pairs jsonb;
begin
 if auth.uid() is null or not public.anybike_is_admin() then
   raise exception 'Admin access required';
 end if;
 with source_rows as (
  select r.id as source_id,r.parent_model_id,r.child_model_id,r.relationship_type,r.review_status,
         least(r.parent_model_id,r.child_model_id) as low_id,
         greatest(r.parent_model_id,r.child_model_id) as high_id
  from public.motorcycle_catalog_model_relationships r
  join public.motorcycle_catalog_models a on a.id=r.parent_model_id
  join public.motorcycle_catalog_models b on b.id=r.child_model_id
  where a.manufacturer='BMW' and b.manufacturer='BMW'
    and r.parent_model_id<>r.child_model_id
 ),
 pair_groups as (
   select low_id,high_id,count(*)::integer as source_count,
    array_agg(source_id order by source_id) as source_ids,
    array_agg(distinct relationship_type order by relationship_type) as classifications,
    bool_and(review_status='verified') as all_verified,
    bool_or(review_status='pending_review') as has_pending
   from source_rows group by low_id,high_id
 ),
 enriched as (
  select g.*,a.model as model_a,a.slug as slug_a,b.model as model_b,b.slug as slug_b,
   case when cardinality(classifications)>1 then 'classification_conflict'
        when all_verified then 'verified_source_review_required'
        else 'pending_review' end as candidate_status
  from pair_groups g
  join public.motorcycle_catalog_models a on a.id=g.low_id
  join public.motorcycle_catalog_models b on b.id=g.high_id
  where p_model_slug is null or a.slug=p_model_slug or b.slug=p_model_slug
 )
 select coalesce(jsonb_agg(jsonb_build_object(
   'model_a',model_a,'slug_a',slug_a,'model_b',model_b,'slug_b',slug_b,
   'model_a_id',low_id,'model_b_id',high_id,
   'source_relationship_ids',to_jsonb(source_ids),
   'source_count',source_count,'proposed_types',to_jsonb(classifications),
   'candidate_status',candidate_status,
   'publication_allowed',false,
   'classification_selected',case when cardinality(classifications)=1 then classifications[1] else null end
 ) order by model_a,model_b),'[]'::jsonb)
 into v_pairs from enriched;
 return jsonb_build_object(
  'manufacturer','BMW','pairs',v_pairs,
  'pair_count',jsonb_array_length(v_pairs),
  'conflict_count',(select count(*) from jsonb_array_elements(v_pairs) p where p->>'candidate_status'='classification_conflict'),
  'source_relationship_count',(select coalesce(sum((p->>'source_count')::integer),0) from jsonb_array_elements(v_pairs) p),
  'mode','admin_only_read_only','publication_enabled',false);
end;
$function$;
REVOKE ALL ON FUNCTION public.admin_bmw_relationship_candidates_v1(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bmw_relationship_candidates_v1(text) TO authenticated, service_role;

