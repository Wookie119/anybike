-- Source-checked Honda EICMA 2024 European 2025 PCX125 and ADV350 updates.
with documented(catalog_model_id,category,label,value,start_year,market,source_name,source_url) as (values
(460,'brakes','PCX125 2025 European rear disc brake','{"model_year":2025,"revision":"Rear disc brake","purpose":"Increased stopping power"}'::jsonb,2025,'Europe 2025 model year','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(460,'design','PCX125 2025 European revised body styling','{"model_year":2025,"design":"Evolution of flowing body design lines"}'::jsonb,2025,'Europe 2025 model year','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(460,'specification','PCX125 Deluxe 2025 European TFT display','{"model_year":2025,"variant":"Deluxe","instrument":"5-inch TFT display","connectivity":"Honda RoadSync app compatibility"}'::jsonb,2025,'Europe 2025 model year','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(460,'model_year','PCX125 2025 European Deluxe variant introduction','{"model_year":2025,"variant":"Deluxe","variant_status":"New addition to PCX125 range"}'::jsonb,2025,'Europe 2025 model year','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(826,'specification','ADV350 2025 European TFT and connectivity','{"model_year":2025,"instrument":"5-inch TFT display","connectivity":"Honda RoadSync smartphone connectivity"}'::jsonb,2025,'Europe 2025 model year','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(826,'engineering','ADV350 2025 European rear suspension update','{"model_year":2025,"rear_shocks":"Preload-adjustable remote reservoir rear shocks"}'::jsonb,2025,'Europe 2025 model year','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(826,'touring','ADV350 2025 European convenience features','{"model_year":2025,"controls":"Four-way toggle switch","storage":"Storage compartment light","indicators":"Auto-cancelling indicators"}'::jsonb,2025,'Europe 2025 model year','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html'),
(826,'history','ADV350 2025 Honda Italian manufacturing','{"model_year":2025,"factory":"Honda Atessa factory","country":"Italy","source_context":"Honda EICMA 2024 European line-up"}'::jsonb,2025,'Europe 2025 model year','Honda Motor Co., Ltd.','https://global.honda/en/newsroom/news/2024/c241105beng.html')
), added as (
insert into public.motorcycle_catalog_facts(catalog_model_id,category,label,value,start_year,market,source_name,source_url,verification_status)
select d.catalog_model_id,d.category,d.label,d.value,d.start_year,d.market,d.source_name,d.source_url,'verified'
from documented d join public.motorcycle_catalog_models m on m.id=d.catalog_model_id and m.manufacturer='Honda'
where ((m.id=460 and m.model='PCX125') or (m.id=826 and m.model='ADV350'))
and not exists(select 1 from public.motorcycle_catalog_facts f where f.catalog_model_id=d.catalog_model_id and f.label=d.label)
returning id,source_url
)
insert into public.motorcycle_catalog_fact_verification_audit(fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
select id,now(),'manufacturer_primary_source_individual_model_checked_2026_11_12',source_url,
'2025 Honda European market PCX125 or ADV350 factory EICMA announcement; trim details are identified.',
'Honda Global Newsroom, 5 November 2024' from added;
