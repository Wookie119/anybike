-- Idempotent exact-model source-backed research enrichment.
-- Suzuki Motor Corporation, 7 November 2023:
-- https://www.globalsuzuki.com/globalnews/2023/1107.html
-- Distinct from staged universal editorial sections and unapproved photography.
with documented(catalog_model_id,category,label,value,start_year,market,source_name,source_url) as (values
(640,'design','GSX-8R 2024 factory sports-bodywork concept','{"basis":"GSX-8S platform","sports_fairing":"Full fairing with visible engine and seat rail","riding_position":"Separate handlebars for sport riding","factory_design_intent":"Sport-bike heritage combined with modern functional styling"}'::jsonb,2024,'Global launch','Suzuki Motor Corporation — GSX-8R EICMA announcement, 7 November 2023','https://www.globalsuzuki.com/globalnews/2023/1107.html'),
(640,'touring','GSX-8R 2024 factory intended riding uses','{"intended_uses":["Urban riding","Winding roads","Circuit riding","Touring"],"factory_positioning":"Versatile sport motorcycle based on GSX-8S"}'::jsonb,2024,'Global launch','Suzuki Motor Corporation — GSX-8R EICMA announcement, 7 November 2023','https://www.globalsuzuki.com/globalnews/2023/1107.html'),
(640,'wheels','GSX-8R 2024 launch tyre fitments','{"front_tyre":"120/70ZR17M/C tubeless","rear_tyre":"180/55ZR17M/C tubeless","model_year":2024}'::jsonb,2024,'Manufacturer launch specification','Suzuki Motor Corporation — GSX-8R EICMA announcement, 7 November 2023','https://www.globalsuzuki.com/globalnews/2023/1107.html'),
(640,'engineering','GSX-8R 2024 Suzuki Easy Start and Low RPM Assist','{"easy_start":"One-button starting system","low_rpm_assist":"Supports smooth launches and slow-speed riding","model_year":2024}'::jsonb,2024,'Manufacturer launch specification','Suzuki Motor Corporation — GSX-8R EICMA announcement, 7 November 2023','https://www.globalsuzuki.com/globalnews/2023/1107.html')
), added as (
insert into public.motorcycle_catalog_facts(catalog_model_id,category,label,value,start_year,market,source_name,source_url,verification_status)
select d.catalog_model_id,d.category,d.label,d.value,d.start_year,d.market,d.source_name,d.source_url,'verified'
from documented d where exists(select 1 from public.motorcycle_catalog_models m where m.id=d.catalog_model_id and m.manufacturer='Suzuki' and m.model='GSX-8R')
and not exists(select 1 from public.motorcycle_catalog_facts f where f.catalog_model_id=d.catalog_model_id and f.label=d.label)
returning id,source_url
)
insert into public.motorcycle_catalog_fact_verification_audit(fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
select a.id,now(),'manufacturer_primary_source_individual_model_checked_2026_11_12',a.source_url,
'Suzuki GSX-8R EICMA 2023 original factory launch specifications; no claim for other model years or variants.',
'Suzuki Global News, 7 November 2023' from added a;
