-- Honda Super Cub C100 and Yamaha 1974 YZ250 primary-source evidence.
-- Inspected 2026-11-10. Audit trail only, NOT editorial publication.
-- All facts source-matched to exact canonical IDs; fail if status or source
-- has changed. Does not modify any model, fact, image, stock or live page.
DO $$
DECLARE valid_count integer; written integer;
BEGIN
 WITH incoming(fact_id,model_id,source_url,scope_note) AS (VALUES
 (18,1042,'https://global.honda/en/about/history-digest/1950/','Honda corporate history explicitly labels the Super Cub C100 as a 1958 model'),
 (20,1042,'https://global.honda/en/about/history-digest/75years-history/chapter3/section1_4/','Honda 75-year history explicitly describes the C100 automatic centrifugal clutch in 1958'),
 (37,1048,'https://global.yamaha-motor.com/showroom/cp/collection/racing_yz250/','Yamaha museum 1974 YZ250M specifications explicitly list 246 cm3 air-cooled two-stroke single'),
 (38,1048,'https://global.yamaha-motor.com/showroom/cp/collection/racing_yz250/','Yamaha museum states the 1974 YZ250M was the first production model equipped with Monocross suspension'),
 (39,1048,'https://global.yamaha-motor.com/showroom/cp/collection/racing_yz250/','Yamaha museum 1974 YZ250M specifications list 25.0 kW (34 PS) at 8000 rpm')
 )
 SELECT count(*) INTO valid_count
 FROM incoming i JOIN public.motorcycle_catalog_facts f
  ON f.id=i.fact_id AND f.catalog_model_id=i.model_id
  AND f.verification_status='verified' AND f.source_url=i.source_url
 WHERE NOT EXISTS (
  SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
  WHERE a.fact_id=i.fact_id);
 IF valid_count<>5 THEN
  RAISE EXCEPTION 'Source audit cancelled: expected 5 exact unaudited facts, found %',valid_count;
 END IF;
 INSERT INTO public.motorcycle_catalog_fact_verification_audit
 (fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
 SELECT i.fact_id,now(),
 'manufacturer_primary_source_checked_against_exact_model_year_record',
 i.source_url,i.scope_note,
 CASE WHEN i.model_id=1042
  THEN 'Honda Global corporate history checked 2026-11-10'
  ELSE 'Yamaha Motor Communication Plaza original 1974 YZ250 listing checked 2026-11-10'
 END
 FROM (VALUES
 (18,1042,'https://global.honda/en/about/history-digest/1950/','Honda corporate history explicitly labels the Super Cub C100 as a 1958 model'),
 (20,1042,'https://global.honda/en/about/history-digest/75years-history/chapter3/section1_4/','Honda 75-year history explicitly describes the C100 automatic centrifugal clutch in 1958'),
 (37,1048,'https://global.yamaha-motor.com/showroom/cp/collection/racing_yz250/','Yamaha museum 1974 YZ250M specifications explicitly list 246 cm3 air-cooled two-stroke single'),
 (38,1048,'https://global.yamaha-motor.com/showroom/cp/collection/racing_yz250/','Yamaha museum states the 1974 YZ250M was the first production model equipped with Monocross suspension'),
 (39,1048,'https://global.yamaha-motor.com/showroom/cp/collection/racing_yz250/','Yamaha museum 1974 YZ250M specifications list 25.0 kW (34 PS) at 8000 rpm')
 ) i(fact_id,model_id,source_url,scope_note);
 GET DIAGNOSTICS written=ROW_COUNT;
 IF written<>5 THEN RAISE EXCEPTION 'Audit rollback: wrote %',written; END IF;
END $$;
