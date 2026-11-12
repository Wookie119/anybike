-- 2027 Ninja 500 SE European factory features; SE trim identified.
with documented(catalog_model_id,category,label,value,start_year,market,source_name,source_url) as (values
(913,'engine','Ninja 500 SE 2027 European displacement and engine configuration','{"model_year":2027,"variant":"SE","engine_cc":451,"engine_type":"Liquid-cooled parallel twin"}'::jsonb,2027,'Europe 2027 Ninja 500 SE','Kawasaki Motors Europe','https://www.kawasaki.eu/en/Motorcycles/Supersport_Sport/Ninja_500_SE_2027.html'),
(913,'chassis','Ninja 500 SE 2027 European engine stressed-member frame','{"model_year":2027,"variant":"SE","frame":"Lightweight trellis","engine_mounting":"Rigid-mounted stressed member","development":"Dynamic rigidity analysis"}'::jsonb,2027,'Europe 2027 Ninja 500 SE','Kawasaki Motors Europe','https://www.kawasaki.eu/en/Motorcycles/Supersport_Sport/Ninja_500_SE_2027.html'),
(913,'transmission','Ninja 500 SE 2027 European assist and slipper clutch','{"model_year":2027,"variant":"SE","clutch":"Assist and slipper","benefits":["Lighter clutch lever action","Reduced rear wheel hopping under downshifts"]}'::jsonb,2027,'Europe 2027 Ninja 500 SE','Kawasaki Motors Europe','https://www.kawasaki.eu/en/Motorcycles/Supersport_Sport/Ninja_500_SE_2027.html'),
(913,'touring','Ninja 500 SE 2027 European riding comfort and wind protection','{"model_year":2027,"variant":"SE","seat":"Thick low-rebound cushioning","wind_protection":"Full-fairing bodywork"}'::jsonb,2027,'Europe 2027 Ninja 500 SE','Kawasaki Motors Europe','https://www.kawasaki.eu/en/Motorcycles/Supersport_Sport/Ninja_500_SE_2027.html'),
(913,'design','Ninja 500 SE 2027 European short-wheelbase riding geometry','{"model_year":2027,"variant":"SE","chassis_layout":"Short-wheelbase long-swingarm supersport layout","rider_position":"Raised handlebar and slightly forward footpegs"}'::jsonb,2027,'Europe 2027 Ninja 500 SE','Kawasaki Motors Europe','https://www.kawasaki.eu/en/Motorcycles/Supersport_Sport/Ninja_500_SE_2027.html')
), added as (
insert into public.motorcycle_catalog_facts(catalog_model_id,category,label,value,start_year,market,source_name,source_url,verification_status)
select d.catalog_model_id,d.category,d.label,d.value,d.start_year,d.market,d.source_name,d.source_url,'verified'
from documented d join public.motorcycle_catalog_models m on m.id=d.catalog_model_id and m.manufacturer='Kawasaki' and m.model='Ninja 500'
where not exists(select 1 from public.motorcycle_catalog_facts f where f.catalog_model_id=d.catalog_model_id and f.label=d.label)
returning id,source_url
)
insert into public.motorcycle_catalog_fact_verification_audit(fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
select id,now(),'manufacturer_primary_source_individual_model_checked_2026_11_12',source_url,
'2027 Ninja 500 SE European official factory feature description; no universal-year claim.',
'Kawasaki Europe 2027 Ninja 500 SE' from added;
