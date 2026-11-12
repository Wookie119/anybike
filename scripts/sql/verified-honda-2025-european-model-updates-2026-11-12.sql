-- Honda official EICMA 2024 release, Europe 2025 model-year revisions.
-- Each fact is exact-model, exact-year and primary-source scoped.
with documented(catalog_model_id,category,label,value,start_year,market,source_name,source_url) as (values
(805,'design','CB750 Hornet 2025 European LED headlight and front fairing','{"model_year":2025,"headlight":"High-output LED","front_fairing":"Revised close-fitting front fairing"}'::jsonb,2025,'Europe','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(805,'chassis','CB750 Hornet 2025 European revised suspension','{"model_year":2025,"suspension":"Updated settings for sportier handling"}'::jsonb,2025,'Europe','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(184,'touring','XL750 Transalp 2025 European fairing and airflow','{"model_year":2025,"fairing":"Revised surrounding fairing","development_goal":"Improved airflow and rider comfort"}'::jsonb,2025,'Europe','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(184,'chassis','XL750 Transalp 2025 European suspension changes','{"model_year":2025,"suspension":"Revised settings for improved stability on rougher surfaces"}'::jsonb,2025,'Europe','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(457,'brakes','NC750X 2025 European dual front discs','{"model_year":2025,"front_brakes":"Dual front brake discs"}'::jsonb,2025,'Europe','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(457,'design','NC750X 2025 European revised seat and display','{"model_year":2025,"seat":"Redesigned for comfort","instrument":"TFT display with Honda RoadSync connectivity"}'::jsonb,2025,'Europe','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(457,'transmission','NC750X 2025 European optional DCT update','{"model_year":2025,"gearbox_option":"Optional Dual Clutch Transmission","revision":"Smoother low-speed operation"}'::jsonb,2025,'Europe','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(457,'factory_documents','NC750X 2025 European Durabio body colour parts','{"model_year":2025,"material":"Coloured Durabio for main colour parts","colours":["Earth Ivy Ash Green","Earth Black"]}'::jsonb,2025,'Europe','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(452,'chassis','CRF300L 2025 European suspension revisions','{"model_year":2025,"suspension":"Revised for smoother ride quality"}'::jsonb,2025,'Europe','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(452,'touring','CRF300L 2025 European heat management and USB','{"model_year":2025,"comfort":"Improved heat management","equipment":"USB socket"}'::jsonb,2025,'Europe','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(863,'chassis','CRF300 Rally 2025 European suspension revisions','{"model_year":2025,"suspension":"Revised for smoother ride quality"}'::jsonb,2025,'Europe','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(863,'touring','CRF300 Rally 2025 European comfort and USB','{"model_year":2025,"comfort":"Improved heat management","equipment":"USB socket"}'::jsonb,2025,'Europe','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html')
), added as (
insert into public.motorcycle_catalog_facts(catalog_model_id,category,label,value,start_year,market,source_name,source_url,verification_status)
select d.catalog_model_id,d.category,d.label,d.value,d.start_year,d.market,d.source_name,d.source_url,'verified'
from documented d join public.motorcycle_catalog_models m on m.id=d.catalog_model_id and m.manufacturer='Honda'
where ((m.id=805 and m.model='CB750 Hornet') or (m.id=184 and m.model='XL750 TRANSALP') or (m.id=457 and m.model='NC750X') or (m.id=452 and m.model='CRF300L') or (m.id=863 and m.model='CRF300 Rally'))
and not exists(select 1 from public.motorcycle_catalog_facts f where f.catalog_model_id=d.catalog_model_id and f.label=d.label)
returning id,source_url
)
insert into public.motorcycle_catalog_fact_verification_audit(fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
select id,now(),'manufacturer_primary_source_individual_model_checked_2026_11_12',source_url,
'Honda 2025 European model-year revisions as documented in the 5 November 2024 EICMA factory release.',
'Honda Global Newsroom, 5 November 2024' from added;
