-- Correction after source verification: factory F 850 GS Adventure 
-- 2020 model update specification is documented in BMW's own technical
-- release (16 July 2020). Do not change motorcycle numbers or review status.
UPDATE public.motorcycle_catalog_facts f
SET source_url='https://www.press.bmwgroup.com/south-africa/article/attachment/T0314486EN/458065',
    source_name='BMW Motorrad press and public relations · 16 July 2020',
    market='2020 BMW F 850 GS Adventure ECE reference'
FROM public.motorcycle_catalog_models m
WHERE f.catalog_model_id=m.id
  AND m.manufacturer='BMW' AND m.model='F 850 GS Adventure'
  AND f.label='BMW factory launch-period engine reference'
  AND f.source_url='https://www.press.bmwgroup.com/global/article/detail/T0311347EN/bmw-motorrad-presents-the-new-bmw-f-750-gs-bmw-f-850-gs-and-bmw-f-850-gs-adventure?showMedia=photo';
-- Refresh all verified fact slots using the shared synchronisation script afterwards.
