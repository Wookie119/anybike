-- 2017 Kawasaki factory launch release, exact 2018 models. Idempotent.
with documented(catalog_model_id,category,label,value,start_year,market,source_name,source_url) as (values
(204,'history','Z900RS 2018 Kawasaki Z1 heritage','{"historical_reference":"Kawasaki Z1 (900 Super Four)","factory_positioning":"Retro-style sports model","model_year":2018}'::jsonb,2018,'Japan launch','Kawasaki Heavy Industries','https://global.kawasaki.com/en/corp/newsroom/news/detail/?f=20171025_6255'),
(204,'design','Z900RS 2018 factory tank and retro design','{"fuel_tank_shape":"Teardrop","factory_design_reference":"Original Z-series Z1","model_year":2018}'::jsonb,2018,'Japan launch','Kawasaki Heavy Industries','https://global.kawasaki.com/en/corp/newsroom/news/detail/?f=20171025_6255'),
(204,'engineering','Z900RS 2018 Kawasaki exhaust sound development','{"development":"Exhaust sound tuning","engineering_details":"Prechamber design and glass-wool length and density","model_year":2018}'::jsonb,2018,'Japan launch','Kawasaki Heavy Industries','https://global.kawasaki.com/en/corp/newsroom/news/detail/?f=20171025_6255'),
(204,'engine','Z900RS 2018 factory four-cylinder character','{"engine_type":"Liquid-cooled inline four-cylinder","engine_class":"900cc class","tuning":"Low- and mid-range torque with smooth high-rpm acceleration","model_year":2018}'::jsonb,2018,'Japan launch','Kawasaki Heavy Industries','https://global.kawasaki.com/en/corp/newsroom/news/detail/?f=20171025_6255'),
(204,'chassis','Z900RS 2018 factory chassis and traction control','{"frame":"Weight reduced using analytical technologies","suspension":"Supersport-derived suspension system","traction_control":"Electronic traction control","model_year":2018}'::jsonb,2018,'Japan launch','Kawasaki Heavy Industries','https://global.kawasaki.com/en/corp/newsroom/news/detail/?f=20171025_6255'),
(204,'factory_colours','Z900RS 2018 Japan launch colours','{"factory_colours":["Metallic Spark Black","Candytone Brown / Candytone Orange"],"model_year":2018}'::jsonb,2018,'Japan launch','Kawasaki Heavy Industries','https://global.kawasaki.com/en/corp/newsroom/news/detail/?f=20171025_6255'),
(497,'market_launch','Ninja 400 2018 Kawasaki Tokyo Motor Show unveiling','{"event":"45th Tokyo Motor Show","announcement_date":"2017-10-25","model_year":2018}'::jsonb,2018,'Overseas specification','Kawasaki Heavy Industries','https://global.kawasaki.com/en/corp/newsroom/news/detail/?f=20171025_6255'),
(497,'engine','Ninja 400 2018 overseas factory engine reference','{"engine_cc":399,"engine_type":"Parallel twin","model_year":2018,"market":"Overseas specification"}'::jsonb,2018,'Overseas specification','Kawasaki Heavy Industries','https://global.kawasaki.com/en/corp/newsroom/news/detail/?f=20171025_6255'),
(497,'chassis','Ninja 400 2018 factory shared 250-class chassis','{"chassis":"Lightweight 250cc-class body","platform":"Shared basic structure with redesigned Ninja 250","model_year":2018}'::jsonb,2018,'Overseas specification','Kawasaki Heavy Industries','https://global.kawasaki.com/en/corp/newsroom/news/detail/?f=20171025_6255'),
(497,'design','Ninja 400 2018 factory supersport styling','{"design_reference":"Ninja ZX-10R / ZX-10RR and Ninja H2","model_year":2018}'::jsonb,2018,'Overseas specification','Kawasaki Heavy Industries','https://global.kawasaki.com/en/corp/newsroom/news/detail/?f=20171025_6255')
), added as (
insert into public.motorcycle_catalog_facts(catalog_model_id,category,label,value,start_year,market,source_name,source_url,verification_status)
select d.catalog_model_id,d.category,d.label,d.value,d.start_year,d.market,d.source_name,d.source_url,'verified'
from documented d join public.motorcycle_catalog_models m on m.id=d.catalog_model_id and m.manufacturer='Kawasaki'
where ((m.id=204 and m.model='Z900 RS') or (m.id=497 and m.model='Ninja 400'))
and not exists(select 1 from public.motorcycle_catalog_facts f where f.catalog_model_id=d.catalog_model_id and f.label=d.label)
returning id,source_url
)
insert into public.motorcycle_catalog_fact_verification_audit(fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
select id,now(),'manufacturer_primary_source_individual_model_checked_2026_11_12',source_url,
'2018 Kawasaki model as described in October 2017 manufacturer release; historical launch-market scope only.',
'Kawasaki Heavy Industries, 25 October 2017' from added;
