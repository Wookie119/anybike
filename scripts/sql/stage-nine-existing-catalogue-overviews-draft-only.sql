-- Controlled one-time import of nine existing, unverified catalogue overviews.
-- This is PRIVATE draft-only data, NOT editorial approval or publication.
-- Supabase public released projection must remain unchanged. No model names,
-- IDs, existing rows, stock access, HTML or manufacturer records are altered.
-- Preconditions: exactly nine specified model IDs, Yamaha/Suzuki only,
-- nonblank source overview, and NO existing universal model sections.
-- One DO statement is atomic: any failed precondition rolls back everything.
DO $$
DECLARE
 candidate_count integer;
 created_count integer;
BEGIN
 SELECT count(*) INTO candidate_count
 FROM public.motorcycle_catalog_models m
 WHERE m.id IN (1053,1055,1056,1057,1058,1059,1060,1061,1062)
   AND m.manufacturer IN ('Suzuki','Yamaha')
   AND nullif(trim(m.overview),'') IS NOT NULL
   AND EXISTS (
     SELECT 1 FROM public.motorcycle_catalog_manufacturers reg
     WHERE reg.display_name=m.manufacturer)
   AND NOT EXISTS (
     SELECT 1 FROM public.motorcycle_universal_page_sections_v1 previous
     WHERE previous.entity_type='model' AND previous.model_id=m.id);
 IF candidate_count<>9 THEN
   RAISE EXCEPTION 'Draft import cancelled: expected 9 unmodified sources, found %',
     candidate_count;
 END IF;

 INSERT INTO public.motorcycle_universal_page_sections_v1
  (entity_type,manufacturer_id,model_id,section_number,
   section_title,content,editorial_status,source_reference,published_at)
 SELECT 'model',NULL,m.id,1,'Model introduction',
   jsonb_build_object(
      'summary',trim(m.overview),
      'source_verification_status','pending_review',
      'editorial_status','draft',
      'source_origin','motorcycle_catalog_models.overview',
      'editorial_note','Existing catalogue overview retained for evidence review; not approved for public release'
   ),'draft',
   'motorcycle_catalog_models.overview:model_id='||m.id::text,
   NULL
 FROM public.motorcycle_catalog_models m
 WHERE m.id IN (1053,1055,1056,1057,1058,1059,1060,1061,1062)
   AND m.manufacturer IN ('Suzuki','Yamaha')
   AND nullif(trim(m.overview),'') IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.motorcycle_universal_page_sections_v1 previous
     WHERE previous.entity_type='model' AND previous.model_id=m.id);
 GET DIAGNOSTICS created_count=ROW_COUNT;
 IF created_count<>9 THEN
   RAISE EXCEPTION 'Draft import rolled back: expected 9, inserted %',created_count;
 END IF;
END $$;

-- Verify separately after this operation, never reinterpret private drafts
-- as public release or source verification:
-- SELECT count(*) FROM public.motorcycle_universal_published_sections_v1;
-- SELECT model_id,editorial_status,published_at FROM
-- public.motorcycle_universal_page_sections_v1
-- WHERE model_id IN (1053,1055,1056,1057,1058,1059,1060,1061,1062);
