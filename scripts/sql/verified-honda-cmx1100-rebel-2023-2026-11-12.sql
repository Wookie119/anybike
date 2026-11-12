-- Honda EICMA November 2022: 2023 CMX1100 Rebel and CMX1100T touring variant.
with documented(catalog_model_id,category,label,value,start_year,market,source_name,source_url) as (values
(823,'model_year','CMX1100 Rebel 2023 touring variant introduction','{"model_year":2023,"variant":"CMX1100T Rebel","announcement":"Touring variant joined the CMX1100 Rebel family at EICMA 2022"}'::jsonb,2023,'Europe 2023 model-year announcement','Honda Motor Europe','https://global.honda/en/newsroom/news/2022/c221108eng.html'),
(823,'touring','CMX1100T Rebel 2023 factory front fairing','{"model_year":2023,"variant":"CMX1100T Rebel","equipment":"Dedicated front fairing and screen","purpose":"Increased weather protection"}'::jsonb,2023,'Europe 2023 model-year announcement','Honda Motor Europe','https://global.honda/en/newsroom/news/2022/c221108eng.html'),
(823,'touring','CMX1100T Rebel 2023 factory hard luggage','{"model_year":2023,"variant":"CMX1100T Rebel","luggage":"Top-hinged hard panniers","combined_capacity_l":35}'::jsonb,2023,'Europe 2023 model-year announcement','Honda Motor Europe','https://global.honda/en/newsroom/news/2022/c221108eng.html'),
(823,'engine','CMX1100 Rebel 2023 factory engine reference','{"model_year":2023,"engine_cc":1084,"engine_type":"Parallel twin","tuning":"Strong low- and mid-range torque"}'::jsonb,2023,'Europe 2023 model-year announcement','Honda Motor Europe','https://global.honda/en/newsroom/news/2022/c221108eng.html'),
(823,'factory_colours','CMX1100T Rebel 2023 touring factory finish','{"model_year":2023,"variant":"CMX1100T Rebel","factory_colour":"Gunpowder Black Metallic"}'::jsonb,2023,'Europe 2023 model-year announcement','Honda Motor Europe','https://global.honda/en/newsroom/news/2022/c221108eng.html'),
(823,'design','CMX1100 Rebel 2023 bobber design character','{"model_year":2023,"design":"Minimalist bobber-style cruiser","riding_character":"Relaxed cruising with engaging cornering capability"}'::jsonb,2023,'Europe 2023 model-year announcement','Honda Motor Europe','https://global.honda/en/newsroom/news/2022/c221108eng.html')
), added as (
insert into public.motorcycle_catalog_facts(catalog_model_id,category,label,value,start_year,market,source_name,source_url,verification_status)
select d.catalog_model_id,d.category,d.label,d.value,d.start_year,d.market,d.source_name,d.source_url,'verified'
from documented d join public.motorcycle_catalog_models m on m.id=d.catalog_model_id and m.manufacturer='Honda' and m.model='CMX1100 Rebel'
where not exists(select 1 from public.motorcycle_catalog_facts f where f.catalog_model_id=d.catalog_model_id and f.label=d.label)
returning id,source_url
)
insert into public.motorcycle_catalog_fact_verification_audit(fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
select id,now(),'manufacturer_primary_source_individual_model_checked_2026_11_12',source_url,
'Original Honda EICMA 2022 source: CMX1100T touring-only features explicitly marked as variant-specific.',
'Honda Global Newsroom, 8 November 2022' from added;
