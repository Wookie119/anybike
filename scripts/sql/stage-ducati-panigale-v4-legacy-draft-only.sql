-- Atomic private draft intake of the already-written Ducati Panigale V4 guide.
-- No stock, existing HTML, model IDs or publication approvals are changed.
-- Separate Panigale V4 S/R/Speciale specifications remain OUT OF SCOPE.
-- Source: data/motorcycle-model-guides.json blob f030ec145e2610badcb5d1a589bfbabb52272eb0
DO $$
DECLARE count_existing integer; inserted integer;
BEGIN
 SELECT count(*) INTO count_existing FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model' AND model_id=107;
 IF count_existing<>0 OR NOT EXISTS(
  SELECT 1 FROM public.motorcycle_catalog_models WHERE id=107
   AND manufacturer='Ducati' AND lower(regexp_replace(model,'[^a-z0-9]','','gi'))='panigalev4')
 THEN RAISE EXCEPTION 'Ducati draft intake aborted: canonical identity or staging changed'; END IF;
 INSERT INTO public.motorcycle_universal_page_sections_v1
  (entity_type,manufacturer_id,model_id,section_number,section_title,content,
   editorial_status,source_reference,published_at)
 VALUES
  ('model',NULL,107,1,'Model introduction',
   '{"summary":"The Panigale V4 brought Ducati''s V4 superbike design into its production flagship. Each revision has combined distinctive Italian styling with track-oriented engineering.","years":"Panigale V4 introduced for the 2018 model year. Major updates followed, including significant 2022 and 2025-model developments. Confirm production and equipment dates for each individual variant.","source_verification_status":"pending_review","editorial_status":"draft","source_origin":"data/motorcycle-model-guides.json:ducati"}'::jsonb,
   'draft','data/motorcycle-model-guides.json:ducati@f030ec145e2610badcb5d1a589bfbabb52272eb0',NULL),
  ('model',NULL,107,3,'Model history',
   '{"timeline":[{"period":"2022 model year","description":"Substantial revisions to aero, ergonomics, engine, chassis and electronics","source":"https://www.ducati.com/gb/en/news/the-evolution-in-ducati-never-stops-the-new-panigale-v4-has-been-presented-even-more-powerful-and-improved-in-every-aspect"},{"period":"2025 model year","description":"New redesigned Panigale V4, unveiled July 2024","source":"https://www.ducati.com/gb/en/news/new-ducati-panigale-v4-wonder-engineered"}],"source_verification_status":"pending_review","editorial_status":"draft","source_origin":"data/motorcycle-model-guides.json:ducati"}'::jsonb,
   'draft','data/motorcycle-model-guides.json:ducati@f030ec145e2610badcb5d1a589bfbabb52272eb0',NULL);
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted<>2 THEN RAISE EXCEPTION 'Ducati draft intake rolled back: % rows',inserted; END IF;
END $$;
