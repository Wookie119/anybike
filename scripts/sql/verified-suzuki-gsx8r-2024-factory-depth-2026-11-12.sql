-- Suzuki 7 November 2023 EICMA original factory release; 2024 GSX-8R only.
with documented(catalog_model_id,category,label,value,start_year,market,source_name,source_url) as (values
(640,'engineering','GSX-8R 2024 Suzuki ride-by-wire and riding modes','{"model_year":2024,"throttle":"Ride-by-wire","drive_modes":3,"mode_system":"Suzuki Drive Mode Selector (SDMS)"}'::jsonb,2024,'Global launch, Europe and North America primary markets','Suzuki Motor Corporation','https://www.globalsuzuki.com/globalnews/2023/1107.html'),
(640,'engineering','GSX-8R 2024 Suzuki traction control and quickshifter','{"model_year":2024,"traction_control":"Suzuki Traction Control System","quickshifter":"Bi-directional up/down clutchless shifting"}'::jsonb,2024,'Global launch, Europe and North America primary markets','Suzuki Motor Corporation','https://www.globalsuzuki.com/globalnews/2023/1107.html'),
(640,'chassis','GSX-8R 2024 Showa large-piston front suspension','{"model_year":2024,"front_fork":"SHOWA SFF-BP","front_suspension":"Separate Function Fork - Big Piston"}'::jsonb,2024,'Global launch, Europe and North America primary markets','Suzuki Motor Corporation','https://www.globalsuzuki.com/globalnews/2023/1107.html'),
(640,'specification','GSX-8R 2024 factory TFT instrument','{"model_year":2024,"instrument":"5-inch colour TFT LCD multi-information display"}'::jsonb,2024,'Global launch, Europe and North America primary markets','Suzuki Motor Corporation','https://www.globalsuzuki.com/globalnews/2023/1107.html'),
(640,'specification','GSX-8R 2024 factory consumption and emissions','{"model_year":2024,"fuel_consumption_km_per_l":23.8,"co2_g_per_km":99,"measurement_basis":"WMTC"}'::jsonb,2024,'Global launch, Europe and North America primary markets','Suzuki Motor Corporation','https://www.globalsuzuki.com/globalnews/2023/1107.html'),
(640,'market_launch','GSX-8R 2024 EICMA presentation and sales','{"model_year":2024,"event":"EICMA Milan 2023","announcement_date":"2023-11-07","planned_global_sales":"January 2024","initial_markets":"Primarily Europe and North America"}'::jsonb,2024,'Global launch, Europe and North America primary markets','Suzuki Motor Corporation','https://www.globalsuzuki.com/globalnews/2023/1107.html'),
(640,'dimensions','GSX-8R 2024 factory overall dimensions','{"model_year":2024,"length_mm":2155,"width_mm":770,"height_mm":1135,"wheelbase_mm":1465,"ground_clearance_mm":145}'::jsonb,2024,'Global launch, Europe and North America primary markets','Suzuki Motor Corporation','https://www.globalsuzuki.com/globalnews/2023/1107.html'),
(640,'engine','GSX-8R 2024 factory liquid-cooled DOHC twin','{"model_year":2024,"engine_cc":776,"engine_type":"Liquid-cooled four-stroke parallel twin DOHC"}'::jsonb,2024,'Global launch, Europe and North America primary markets','Suzuki Motor Corporation','https://www.globalsuzuki.com/globalnews/2023/1107.html')
), added as (
insert into public.motorcycle_catalog_facts(catalog_model_id,category,label,value,start_year,market,source_name,source_url,verification_status)
select d.catalog_model_id,d.category,d.label,d.value,d.start_year,d.market,d.source_name,d.source_url,'verified'
from documented d join public.motorcycle_catalog_models m on m.id=d.catalog_model_id and m.manufacturer='Suzuki' and m.model='GSX-8R'
where not exists(select 1 from public.motorcycle_catalog_facts f where f.catalog_model_id=d.catalog_model_id and f.label=d.label)
returning id,source_url
)
insert into public.motorcycle_catalog_fact_verification_audit(fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
select id,now(),'manufacturer_primary_source_individual_model_checked_2026_11_12',source_url,
'Original GSX-8R 2024 global launch specifications only, not GSX-8S or later model years.',
'Suzuki Global News, 7 November 2023' from added;
