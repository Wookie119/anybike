-- BMW PressClub launch/update publication dates must not be misrepresented
-- as confirmed motorcycle model-years. Keep dates as source start_year
-- and remove any same-year model-year inference in these seven references.
UPDATE public.motorcycle_catalog_facts f
SET value=f.value-'reference_model_year'
FROM public.motorcycle_catalog_models m
WHERE f.catalog_model_id=m.id AND m.manufacturer='BMW'
 AND f.label='BMW factory launch-period engine reference'
 AND f.verification_status='verified'
 AND f.value->>'reference_model_year'=f.start_year::text
 AND m.model IN ('F 750 GS','F 850 GS','F 850 GS Adventure','G 310 GS',
                 'G 310 R','M 1000 R','R 1250 GS Adventure');
