-- Original Yamaha 7 July 2014 MT-07 / MT-07A Japanese launch, source checked.
with documented(catalog_model_id,category,label,value,start_year,market,source_name,source_url) as (values
(273,'engine','MT-07 2014 Japan bore, stroke and compression','{"model_year":2014,"bore_mm":80,"stroke_mm":68.5,"compression_ratio":"11.5:1"}'::jsonb,2014,'Japan 2014 launch','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/jp/news/2014/0707/mt-07.html'),
(273,'engineering','MT-07 2014 Japan engine balance and cylinder design','{"model_year":2014,"balance_shaft":"Single-axis balancer","cylinder_design":"Direct-plated cylinders","offset_cylinders":"Offset cylinder layout to reduce friction"}'::jsonb,2014,'Japan 2014 launch','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/jp/news/2014/0707/mt-07.html'),
(273,'engineering','MT-07 2014 Japan compact exhaust and fuel injection','{"model_year":2014,"exhaust":"2-into-1 under-engine exhaust with chamber","fuel_delivery":"Fuel injection","lubrication":"Forced-feed wet sump"}'::jsonb,2014,'Japan 2014 launch','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/jp/news/2014/0707/mt-07.html'),
(273,'specification','MT-07 2014 Japan original lighting and battery','{"model_year":2014,"headlight":"Halogen 12V 60/55W","battery":"YTZ10S 12V 8.6Ah","engine_oil_capacity_l":3}'::jsonb,2014,'Japan 2014 launch','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/jp/news/2014/0707/mt-07.html'),
(273,'chassis','MT-07 2014 Japan caster and trail','{"model_year":2014,"caster":"24°50′","trail_mm":90}'::jsonb,2014,'Japan 2014 launch','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/jp/news/2014/0707/mt-07.html'),
(273,'design','MT-07 2014 Japan LCD instrument functions','{"model_year":2014,"display":"Compact full-LCD multifunction instrument","features":["Gear position","ECO indicator","Torque-band tachometer display"]}'::jsonb,2014,'Japan 2014 launch','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/jp/news/2014/0707/mt-07.html'),
(273,'market_launch','MT-07 2014 Japan factory domestic sales plan','{"model_year":2014,"japan_launch_date":"2014-08-20","annual_domestic_sales_plan_units":2500,"scope":"Combined MT-07 and MT-07A Japan plan"}'::jsonb,2014,'Japan 2014 launch','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/jp/news/2014/0707/mt-07.html'),
(273,'model_year','MT-07 2014 Japan original ABS variant distinction','{"model_year":2014,"base_variant":"MT-07","abs_variant":"MT-07A","abs_variant_standard_equipment":"ABS","base_kerb_weight_kg":179,"abs_kerb_weight_kg":182}'::jsonb,2014,'Japan 2014 launch','Yamaha Motor Co., Ltd.','https://global.yamaha-motor.com/jp/news/2014/0707/mt-07.html')
), added as (
insert into public.motorcycle_catalog_facts(catalog_model_id,category,label,value,start_year,market,source_name,source_url,verification_status)
select d.catalog_model_id,d.category,d.label,d.value,d.start_year,d.market,d.source_name,d.source_url,'verified'
from documented d join public.motorcycle_catalog_models m on m.id=d.catalog_model_id and m.manufacturer='Yamaha' and m.model='MT-07'
where not exists(select 1 from public.motorcycle_catalog_facts f where f.catalog_model_id=d.catalog_model_id and f.label=d.label)
returning id,source_url
)
insert into public.motorcycle_catalog_fact_verification_audit(fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
select id,now(),'manufacturer_primary_source_individual_model_checked_2026_11_12',source_url,
'Original 2014 Japan MT-07 release, MT-07A ABS variant clearly distinguished. Do not apply to later model years.',
'Yamaha Japan News, 7 July 2014' from added;
