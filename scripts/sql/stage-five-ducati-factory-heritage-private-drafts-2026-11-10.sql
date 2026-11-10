-- One-time guarded Ducati factory-source research capture, 10 Nov 2026.
-- Atomic, private draft only. No model/registry/alias/stock/public-page changes.
-- These are original editorial summaries with factory URLs, NOT final facts.
DO $$
DECLARE matched integer; inserted integer; published_before integer; published_after integer;
BEGIN
 SELECT count(*) INTO published_before FROM public.motorcycle_universal_published_sections_v1;
 WITH expected(id,make,name) AS (VALUES
  (400,'Ducati','916'),
  (748,'Ducati','Monster 900'),
  (779,'Ducati','851'),
  (788,'Ducati','1098'),
  (831,'Ducati','Multistrada 1200')
 )
 SELECT count(*) INTO matched FROM expected e
 JOIN public.motorcycle_catalog_models m ON m.id=e.id AND m.manufacturer=e.make AND m.model=e.name
 WHERE NOT EXISTS (
  SELECT 1 FROM public.motorcycle_universal_page_sections_v1 s
  WHERE s.entity_type='model' AND s.model_id=e.id
 )
 AND NOT EXISTS (
  SELECT 1 FROM public.motorcycle_catalog_model_aliases a
  WHERE a.alias_model_id=e.id AND a.review_status<>'approved'
 );
 IF matched<>5 THEN RAISE EXCEPTION 'Ducati source capture cancelled: identity or staging changed (%)',matched; END IF;
 INSERT INTO public.motorcycle_universal_page_sections_v1
 (entity_type,manufacturer_id,model_id,section_number,section_title,content,
  editorial_status,source_reference,published_at)
 SELECT 'model',NULL,v.model_id,v.section_number,v.section_title,v.content,
 'draft','ducati_factory_heritage:'||v.source_url,NULL
 FROM (VALUES
 (400,1,'Model introduction','{"summary":"The Ducati 916 became a landmark superbike with its sculptural Massimo Tamburini design, compact proportions and underseat exhaust styling.","source_name":"Ducati Heritage","source_url":"https://www.ducati.com/ww/en/heritage/bikes/916","source_verification_status":"pending_review","editorial_status":"draft","editorial_note":"Private factory source capture. Confirm model year, market, variant, facts and reuse rights before editorial approval."}'::jsonb,'https://www.ducati.com/ww/en/heritage/bikes/916'),
  (400,7,'Documented model history','{"summary":"Ducati''s heritage history records the 916 debut at the Milan Motorcycle Show in October 1993. Specifications and market arrival need year-specific review.","source_name":"Ducati Heritage","source_url":"https://www.ducati.com/ww/en/heritage/bikes/916","source_verification_status":"pending_review","editorial_status":"draft","editorial_note":"Private factory source capture. Confirm model year, market, variant, facts and reuse rights before editorial approval."}'::jsonb,'https://www.ducati.com/ww/en/heritage/bikes/916'),
  (400,12,'Factory heritage specification','{"summary":"The Ducati heritage example lists 916 cc displacement and 114 hp at 9,000 rpm, with a 195 kg dry weight. These figures apply to the historical example shown, not every racing or road variant.","source_name":"Ducati Heritage","source_url":"https://www.ducati.com/ww/en/heritage/bikes/916","source_verification_status":"pending_review","editorial_status":"draft","editorial_note":"Private factory source capture. Confirm model year, market, variant, facts and reuse rights before editorial approval."}'::jsonb,'https://www.ducati.com/ww/en/heritage/bikes/916'),
  (748,1,'Model introduction','{"summary":"The original Monster 900 combined Ducati roadster minimalism with a visible trellis frame and an air/oil-cooled engine derived from the Supersport line.","source_name":"Ducati Heritage","source_url":"https://www.ducati.com/ww/en/heritage/bikes/monster-900","source_verification_status":"pending_review","editorial_status":"draft","editorial_note":"Private factory source capture. Confirm model year, market, variant, facts and reuse rights before editorial approval."}'::jsonb,'https://www.ducati.com/ww/en/heritage/bikes/monster-900'),
  (748,7,'Documented model history','{"summary":"Ducati''s historical account identifies the Monster 900 prototype at the Cologne Motorcycle Show in autumn 1992, with an 851/888-derived trellis chassis and a 904 cc engine.","source_name":"Ducati Heritage","source_url":"https://www.ducati.com/ww/en/heritage/bikes/monster-900","source_verification_status":"pending_review","editorial_status":"draft","editorial_note":"Private factory source capture. Confirm model year, market, variant, facts and reuse rights before editorial approval."}'::jsonb,'https://www.ducati.com/ww/en/heritage/bikes/monster-900'),
  (779,1,'Model introduction','{"summary":"The Ducati 851 family introduced Ducati''s liquid-cooled, fuel-injected, four-valve desmodromic twin technology to a new era of road superbikes.","source_name":"Ducati Heritage","source_url":"https://www.ducati.com/ww/en/heritage/bikes/851-tricolore","source_verification_status":"pending_review","editorial_status":"draft","editorial_note":"Private factory source capture. Confirm model year, market, variant, facts and reuse rights before editorial approval."}'::jsonb,'https://www.ducati.com/ww/en/heritage/bikes/851-tricolore'),
  (779,7,'Documented model history','{"summary":"Ducati''s Tricolore account traces a 748 cc development prototype to 1986 and the 851 cc generation to 1988. This source is edition-specific; its detailed Tricolore figures must not be generalized to every 851.","source_name":"Ducati Heritage","source_url":"https://www.ducati.com/ww/en/heritage/bikes/851-tricolore","source_verification_status":"pending_review","editorial_status":"draft","editorial_note":"Private factory source capture. Confirm model year, market, variant, facts and reuse rights before editorial approval."}'::jsonb,'https://www.ducati.com/ww/en/heritage/bikes/851-tricolore'),
  (788,1,'Model introduction','{"summary":"Ducati''s 1098 combined road-going supersport engineering with styling that recalled the brand''s earlier racing-derived superbikes.","source_name":"Ducati Heritage","source_url":"https://www.ducati.com/ww/en/heritage/bikes/1098","source_verification_status":"pending_review","editorial_status":"draft","editorial_note":"Private factory source capture. Confirm model year, market, variant, facts and reuse rights before editorial approval."}'::jsonb,'https://www.ducati.com/ww/en/heritage/bikes/1098'),
  (788,13,'Character and design','{"summary":"Ducati''s heritage article highlights the 1098''s raised tail, compact front end, twin silencers below the seat and single-sided swingarm.","source_name":"Ducati Heritage","source_url":"https://www.ducati.com/ww/en/heritage/bikes/1098","source_verification_status":"pending_review","editorial_status":"draft","editorial_note":"Private factory source capture. Confirm model year, market, variant, facts and reuse rights before editorial approval."}'::jsonb,'https://www.ducati.com/ww/en/heritage/bikes/1098'),
  (831,1,'Model introduction','{"summary":"Ducati''s Multistrada 1200 combined superbike-derived engineering with touring, urban and more varied road-riding applications.","source_name":"Ducati Heritage","source_url":"https://www.ducati.com/ww/en/heritage/bikes/multistrada-1200","source_verification_status":"pending_review","editorial_status":"draft","editorial_note":"Private factory source capture. Confirm model year, market, variant, facts and reuse rights before editorial approval."}'::jsonb,'https://www.ducati.com/ww/en/heritage/bikes/multistrada-1200'),
  (831,7,'Documented model history','{"summary":"The Ducati heritage article describes the Multistrada 1200''s riding modes and its development beyond the original Multistrada introduced in 2003; the article''s own introduction chronology needs checking against market-specific model years.","source_name":"Ducati Heritage","source_url":"https://www.ducati.com/ww/en/heritage/bikes/multistrada-1200","source_verification_status":"pending_review","editorial_status":"draft","editorial_note":"Private factory source capture. Confirm model year, market, variant, facts and reuse rights before editorial approval."}'::jsonb,'https://www.ducati.com/ww/en/heritage/bikes/multistrada-1200'),
  (831,12,'Factory heritage specification','{"summary":"For the particular historical configuration shown, Ducati lists 1,198.4 cc displacement, 148 hp at 9,250 rpm and 189 kg dry weight. The figures are not a blanket specification for every year and trim.","source_name":"Ducati Heritage","source_url":"https://www.ducati.com/ww/en/heritage/bikes/multistrada-1200","source_verification_status":"pending_review","editorial_status":"draft","editorial_note":"Private factory source capture. Confirm model year, market, variant, facts and reuse rights before editorial approval."}'::jsonb,'https://www.ducati.com/ww/en/heritage/bikes/multistrada-1200')
 ) AS v(model_id,section_number,section_title,content,source_url);
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted<>12 THEN RAISE EXCEPTION 'Ducati source capture expected 12 sections; inserted %',inserted; END IF;
 SELECT count(*) INTO published_after FROM public.motorcycle_universal_published_sections_v1;
 IF published_after<>published_before THEN RAISE EXCEPTION 'Ducati source capture changed public section count'; END IF;
END $$;
