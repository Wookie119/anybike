-- Yamaha Communication Plaza, original 1974 YZ250M archival specifications.
-- Distinguish the production YZ250M from the championship-winning YZM250 (0W12).
with documented(catalog_model_id,category,label,value,start_year,market,source_name,source_url) as (values
(1048,'history','YZ250M 1974 production replica of championship YZM250','{"model_year":1974,"prototype":"YZM250 (0W12)","production_relationship":"Production model replica of 1973 championship machine"}'::jsonb,1974,'Original 1974 factory production reference','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/showroom/cp/collection/racing_yz250/'),
(1048,'motorsport','YZ250M predecessor won 1973 motocross championships','{"model_year":1974,"reference_machine":"YZM250 (0W12)","championships":["1973 Motocross World Championship","1973 All Japan Motocross Championship"],"scope":"Championships won by predecessor YZM250, not production YZ250M"}'::jsonb,1974,'Original 1974 factory production reference','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/showroom/cp/collection/racing_yz250/'),
(1048,'transmission','YZ250M 1974 factory five-speed transmission','{"model_year":1974,"gearbox":"Five-speed"}'::jsonb,1974,'Original 1974 factory production reference','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/showroom/cp/collection/racing_yz250/'),
(1048,'production','YZ250M 1974 first production Monocross fitment','{"model_year":1974,"designation":"YZ250M","designation_meaning":"Monocross","production_milestone":"First production model equipped with Yamaha Monocross suspension"}'::jsonb,1974,'Original 1974 factory production reference','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/showroom/cp/collection/racing_yz250/'),
(1048,'engine','YZ250M 1974 Yamaha factory engine specification','{"model_year":1974,"engine_cc":246,"engine_type":"Air-cooled two-stroke single-cylinder","power_kw":25,"power_ps":34,"power_rpm":8000}'::jsonb,1974,'Original 1974 factory production reference','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/showroom/cp/collection/racing_yz250/')
), added as (
insert into public.motorcycle_catalog_facts(catalog_model_id,category,label,value,start_year,market,source_name,source_url,verification_status)
select d.catalog_model_id,d.category,d.label,d.value,d.start_year,d.market,d.source_name,d.source_url,'verified'
from documented d join public.motorcycle_catalog_models m on m.id=d.catalog_model_id and m.manufacturer='Yamaha' and m.model='YZ250'
where not exists(select 1 from public.motorcycle_catalog_facts f where f.catalog_model_id=d.catalog_model_id and f.label=d.label)
returning id,source_url
)
insert into public.motorcycle_catalog_fact_verification_audit(fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
select id,now(),'manufacturer_primary_source_individual_model_checked_2026_11_12',source_url,
'Yamaha factory museum original 1974 production YZ250M; predecessor YZM250 racing titles are not attributed to the production bike.',
'Yamaha Communication Plaza 1974 YZ250 collection' from added;
