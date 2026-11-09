-- Align the two F-series source-reference years with the actual BMW
-- Global PressClub press kit dated 2 March 2018, not an assumed model year.
UPDATE public.motorcycle_catalog_facts f
SET start_year=2018,
    market='2018 BMW global press kit'
FROM public.motorcycle_catalog_models m
WHERE f.catalog_model_id=m.id AND m.manufacturer='BMW'
 AND m.model IN ('F 750 GS','F 850 GS')
 AND f.label='BMW factory launch-period engine reference'
 AND f.source_url='https://www.press.bmwgroup.com/global/article/detail/T0279024EN/the-new-bmw-f-750-gs-and-f-850-gs?language=en'
 AND f.start_year=2017;
