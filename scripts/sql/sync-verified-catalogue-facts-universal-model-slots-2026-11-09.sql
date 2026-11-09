-- AnyBike verified-fact synchronisation into ONE 20-section draft model research system.
-- Read verified original model facts only; classify into documented slots.
-- No publication switch, no photo-rights promotion, no route creation.
-- Idempotent: replace per-slot verified evidence from canonical fact IDs.
WITH candidate_facts AS (
 SELECT m.id model_id, f.id fact_id, f.category, f.label, f.value,
  f.market, f.start_year, f.end_year, f.source_name, f.source_url,
  f.verification_status,
  CASE
   WHEN f.category IN ('manufacturing','manufacturing_evidence','production') THEN 4
   WHEN f.category IN ('history','market_launch','model_year') THEN 7
   WHEN f.category='competition' THEN 10
   WHEN f.category IN ('engine','engineering','chassis','brakes','dimensions','performance','specification','transmission','wheels') THEN 12
   WHEN f.category='factory_colours' THEN 13
   ELSE NULL END slot
 FROM public.motorcycle_catalog_facts f
 JOIN public.motorcycle_catalog_models m ON m.id=f.catalog_model_id
 WHERE f.verification_status='verified'
 AND f.source_url ~ '^https://[^[:space:]]+$'
 AND length(btrim(coalesce(f.label,'')))>0
 AND m.model !~* '(APR|representative|finance|deposit|monthly payment|PCP|[0-9]+[.]?[0-9]*[[:space:]]*%)'
), facts AS (
 SELECT model_id,slot,jsonb_agg(jsonb_build_object(
  'fact_id',fact_id,'category',category,'label',label,'value',value,
  'market',market,'start_year',start_year,'end_year',end_year,
  'source_name',source_name,'source_url',source_url,
  'source_verification_status',verification_status
 ) ORDER BY fact_id) entries
 FROM candidate_facts WHERE slot IS NOT NULL GROUP BY model_id,slot
), updated AS (
 UPDATE public.motorcycle_universal_page_sections_v1 s
 SET content=jsonb_set(s.content,'{verified_catalogue_facts}',f.entries,true),
 source_reference=CASE
  WHEN coalesce(s.source_reference,'')='' THEN 'motorcycle_catalog_facts:verified_ids'
  WHEN position('motorcycle_catalog_facts:verified_ids' in s.source_reference)>0 THEN s.source_reference
  ELSE s.source_reference||';motorcycle_catalog_facts:verified_ids' END,
 updated_at=now()
 FROM facts f
 WHERE s.entity_type='model'
 AND s.model_id=f.model_id AND s.section_number=f.slot
 AND s.editorial_status='draft' AND s.published_at IS NULL
 AND (s.content->'verified_catalogue_facts' IS DISTINCT FROM f.entries
      OR position('motorcycle_catalog_facts:verified_ids' in coalesce(s.source_reference,''))=0)
 RETURNING s.model_id,s.section_number
)
INSERT INTO public.motorcycle_universal_page_sections_v1
 (entity_type,model_id,section_number,section_title,content,editorial_status,source_reference)
SELECT 'model',f.model_id,f.slot,
 CASE f.slot WHEN 4 THEN 'Verified manufacturing and production evidence'
 WHEN 7 THEN 'Verified model history'
 WHEN 10 THEN 'Verified motorsport and competition evidence'
 WHEN 12 THEN 'Verified technical specifications'
 WHEN 13 THEN 'Verified factory colours' END,
 jsonb_build_object('verified_catalogue_facts',f.entries),
 'draft','motorcycle_catalog_facts:verified_ids'
FROM facts f
WHERE NOT EXISTS (
 SELECT 1 FROM public.motorcycle_universal_page_sections_v1 s
 WHERE s.entity_type='model' AND s.model_id=f.model_id AND s.section_number=f.slot
);
