-- AnyBike BMW launch-generation research, sourced directly from BMW Group PressClub.
-- Seven canonical motorcycles; keeps all source facts and 20-slot sections DRAFT.
-- Re-run-safe and never changes public publication state or preview flags.
WITH research(model,year,market,engine_cc,power_hp,torque_nm,source_url) AS (
 VALUES
 ('F 750 GS',2018,'2018 BMW global press kit',853,77,83,'https://www.press.bmwgroup.com/global/article/detail/T0279024EN/the-new-bmw-f-750-gs-and-f-850-gs?language=en'),
 ('F 850 GS',2018,'2018 BMW global press kit',853,95,92,'https://www.press.bmwgroup.com/global/article/detail/T0279024EN/the-new-bmw-f-750-gs-and-f-850-gs?language=en'),
 ('F 850 GS Adventure',2020,'2020 BMW F 850 GS Adventure ECE reference',853,95,92,'https://www.press.bmwgroup.com/south-africa/article/attachment/T0314486EN/458065'),
 ('G 310 GS',2016,'Global launch',313,34,28,'https://www.press.bmwgroup.com/global/article/detail/T0265624EN/the-new-bmw-g-310-gs?language=en'),
 ('G 310 R',2015,'USA launch',313,34,28,'https://www.press.bmwgroup.com/usa/article/detail/T0243964EN_US/the-new-bmw-g-310-r'),
 ('M 1000 R',2022,'Global launch',NULL,210,113,'https://www.press.bmwgroup.com/global/article/detail/T0404210EN/the-new-bmw-m-1000-r?language=en'),
 ('R 1250 GS Adventure',2019,'India press kit',1254,136,143,'https://www.press.bmwgroup.com/india/article/detail/T0291519EN/press-kit-the-all-new-bmw-r-1250-gs-adventure')
), candidates AS (
 SELECT m.id, r.*
 FROM research r
 JOIN public.motorcycle_catalog_models m
  ON m.manufacturer='BMW' AND m.model=r.model
), inserted AS (
 INSERT INTO public.motorcycle_catalog_facts
 (catalog_model_id,category,label,value,start_year,market,source_name,source_url,verification_status)
 SELECT c.id,'engine',
 'BMW factory launch-period engine reference',
 jsonb_strip_nulls(jsonb_build_object('engine_cc',c.engine_cc,
 'power_hp',c.power_hp,'torque_nm',c.torque_nm)),
 c.year,c.market,'BMW Group PressClub',c.source_url,'verified'
 FROM candidates c
 WHERE NOT EXISTS (
   SELECT 1 FROM public.motorcycle_catalog_facts f
   WHERE f.catalog_model_id=c.id AND f.category='engine'
   AND f.source_url=c.source_url
   AND f.label='BMW factory launch-period engine reference'
 )
 RETURNING catalog_model_id
), verified AS (
 SELECT f.catalog_model_id, jsonb_agg(jsonb_build_object(
 'fact_id',f.id,'label',f.label,'value',f.value,'market',f.market,
 'source_url',f.source_url,'source_name',f.source_name,
 'start_year',f.start_year,'end_year',f.end_year,
 'source_verification_status',f.verification_status
 ) ORDER BY f.id) entries
 FROM public.motorcycle_catalog_facts f
 JOIN candidates c ON c.id=f.catalog_model_id
 WHERE f.verification_status='verified' AND f.source_url LIKE 'https://%'
 GROUP BY f.catalog_model_id
), update_staging AS (
 UPDATE public.motorcycle_universal_page_sections_v1 s
 SET content=jsonb_set(
   s.content,'{verified_catalogue_facts}',v.entries,true),
 source_reference='motorcycle_catalog_facts:verified_ids',
 updated_at=now()
 FROM verified v
 WHERE s.entity_type='model' AND s.model_id=v.catalog_model_id
 AND s.section_number=12 AND s.editorial_status='draft'
 RETURNING s.model_id
)
INSERT INTO public.motorcycle_universal_page_sections_v1
 (entity_type,model_id,section_number,section_title,
 content,editorial_status,source_reference)
SELECT 'model',v.catalog_model_id,12,'Verified technical evidence',
 jsonb_build_object('verified_catalogue_facts',v.entries),
 'draft','motorcycle_catalog_facts:verified_ids'
FROM verified v
WHERE NOT EXISTS (
 SELECT 1 FROM public.motorcycle_universal_page_sections_v1 s
 WHERE s.entity_type='model' AND s.model_id=v.catalog_model_id AND s.section_number=12
);

-- Second statement sees any fact rows inserted by the first statement;
-- this avoids same-statement PostgreSQL MVCC snapshots hiding new records.
WITH verified AS (
 SELECT f.catalog_model_id, jsonb_agg(jsonb_build_object(
 'fact_id',f.id,'label',f.label,'value',f.value,'market',f.market,
 'source_url',f.source_url,'source_name',f.source_name,
 'start_year',f.start_year,'end_year',f.end_year,
 'source_verification_status',f.verification_status
 ) ORDER BY f.id) entries
 FROM public.motorcycle_catalog_facts f
 JOIN public.motorcycle_catalog_models c ON c.id=f.catalog_model_id
 WHERE c.manufacturer='BMW'
 AND c.model IN ('F 750 GS','F 850 GS','F 850 GS Adventure','G 310 GS','G 310 R','M 1000 R','R 1250 GS Adventure')
 AND f.verification_status='verified' AND f.source_url LIKE 'https://%'
 GROUP BY f.catalog_model_id
), update_staging AS (
 UPDATE public.motorcycle_universal_page_sections_v1 s
 SET content=jsonb_set(
   s.content,'{verified_catalogue_facts}',v.entries,true),
 source_reference='motorcycle_catalog_facts:verified_ids',
 updated_at=now()
 FROM verified v
 WHERE s.entity_type='model' AND s.model_id=v.catalog_model_id
 AND s.section_number=12 AND s.editorial_status='draft'
 RETURNING s.model_id
)
INSERT INTO public.motorcycle_universal_page_sections_v1
 (entity_type,model_id,section_number,section_title,
 content,editorial_status,source_reference)
SELECT 'model',v.catalog_model_id,12,'Verified technical evidence',
 jsonb_build_object('verified_catalogue_facts',v.entries),
 'draft','motorcycle_catalog_facts:verified_ids'
FROM verified v
WHERE NOT EXISTS (
 SELECT 1 FROM public.motorcycle_universal_page_sections_v1 s
 WHERE s.entity_type='model' AND s.model_id=v.catalog_model_id AND s.section_number=12
);
