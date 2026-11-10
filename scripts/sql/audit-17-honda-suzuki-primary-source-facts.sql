-- Exact-identity, source-checked Honda and Suzuki FACT audit records.
-- Primary manufacturer pages inspected 10 November 2026.
-- Does NOT change source fact values, verification_status, source URLs,
-- model IDs, editorial status, draft sections, public projections or stock.
-- One atomic DO transaction; fails without partial inserts if preconditions drift.
-- Honda heritage: https://global.honda/en/heritage/episodes/1969cb750four.html
-- Suzuki RM250: https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php
-- Suzuki TM125/RM125: https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_173.php
DO $$
DECLARE expected integer; wrote integer;
BEGIN
 WITH incoming(fact_id,model_id,source_url,scope_note) AS (VALUES
 (21,1043,'https://global.honda/en/heritage/episodes/1969cb750four.html','Honda heritage Chapter 4: body production started at Hamamatsu; transferred to Suzuka October 1971'),
 (22,1043,'https://global.honda/en/heritage/episodes/1969cb750four.html','Honda heritage Chapter 4: engine production started at Saitama; transferred to Suzuka July 1971'),
 (40,1049,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_173.php','Suzuki factory archive TM125 1973 engine table: air-cooled two-stroke single, 123 cm3'),
 (41,1049,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_173.php','Suzuki factory archive TM125 1973 output table: 16.2 kW / 22 PS at 10000 rpm'),
 (42,1050,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_173.php','Suzuki factory archive RM125 1976 specifications: 6-speed constant-mesh transmission'),
 (43,1050,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_173.php','Suzuki factory archive RM125 1981: Full Floater suspension described'),
 (44,1050,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_173.php','Suzuki factory archive RM125 1981: first Suzuki liquid-cooled motocross model described'),
 (49,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1976: 246 cm3, 26.5 kW, 97 kg, air cooled and semi-double cradle'),
 (50,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 2001: 249 cm3, 40.5 kW, 96 kg and redesign described'),
 (51,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1993: 249 cm3, 39.3 kW, 98 kg and crankcase reed/frame changes'),
 (52,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1977: 246 cm3, 27.2 kW, 97 kg and 67 by 70 mm engine'),
 (53,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1989: 249 cm3, 37.5 kW, 97 kg, reed valve and inverted forks'),
 (54,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1982: 246 cm3, 31.6 kW, 96.5 kg, liquid cooling and Full Floater'),
 (55,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 2003: 249 cm3, 40.5 kW, 96 kg and cylinder ports/exhaust controls'),
 (56,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1996: 249 cm3, 39 kW, 97 kg and aluminium subframe'),
 (57,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1986: 246 cm3, 35.3 kW, 97 kg and Excellent Full Floater'),
 (58,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1981: 246 cm3, 30.5 kW, 98 kg, Full Floater and air cooling')
 )
 SELECT count(*) INTO expected
 FROM incoming i JOIN public.motorcycle_catalog_facts f
  ON f.id=i.fact_id AND f.catalog_model_id=i.model_id
  AND f.verification_status='verified'
  AND f.source_url=i.source_url
 WHERE NOT EXISTS (
  SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
  WHERE a.fact_id=i.fact_id
 );
 IF expected<>17 THEN
  RAISE EXCEPTION 'Primary-source audit cancelled: expected 17 exact unaudited facts, found %',expected;
 END IF;
 INSERT INTO public.motorcycle_catalog_fact_verification_audit
  (fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
 SELECT i.fact_id,now(),
   'manufacturer_primary_source_checked_against_exact_model_year_record',
   i.source_url,i.scope_note,
   CASE WHEN i.source_url LIKE 'https://global.honda/%'
      THEN 'Honda Global Heritage / The Dream CB750 FOUR (1969); checked 2026-11-10'
      ELSE 'Suzuki Motorcycle Global Salon Digital Archive; checked 2026-11-10' END
 FROM (VALUES
 (21,1043,'https://global.honda/en/heritage/episodes/1969cb750four.html','Honda heritage Chapter 4: body production started at Hamamatsu; transferred to Suzuka October 1971'),
 (22,1043,'https://global.honda/en/heritage/episodes/1969cb750four.html','Honda heritage Chapter 4: engine production started at Saitama; transferred to Suzuka July 1971'),
 (40,1049,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_173.php','Suzuki factory archive TM125 1973 engine table: air-cooled two-stroke single, 123 cm3'),
 (41,1049,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_173.php','Suzuki factory archive TM125 1973 output table: 16.2 kW / 22 PS at 10000 rpm'),
 (42,1050,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_173.php','Suzuki factory archive RM125 1976 specifications: 6-speed constant-mesh transmission'),
 (43,1050,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_173.php','Suzuki factory archive RM125 1981: Full Floater suspension described'),
 (44,1050,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_173.php','Suzuki factory archive RM125 1981: first Suzuki liquid-cooled motocross model described'),
 (49,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1976: 246 cm3, 26.5 kW, 97 kg, air cooled and semi-double cradle'),
 (50,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 2001: 249 cm3, 40.5 kW, 96 kg and redesign described'),
 (51,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1993: 249 cm3, 39.3 kW, 98 kg and crankcase reed/frame changes'),
 (52,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1977: 246 cm3, 27.2 kW, 97 kg and 67 by 70 mm engine'),
 (53,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1989: 249 cm3, 37.5 kW, 97 kg, reed valve and inverted forks'),
 (54,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1982: 246 cm3, 31.6 kW, 96.5 kg, liquid cooling and Full Floater'),
 (55,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 2003: 249 cm3, 40.5 kW, 96 kg and cylinder ports/exhaust controls'),
 (56,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1996: 249 cm3, 39 kW, 97 kg and aluminium subframe'),
 (57,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1986: 246 cm3, 35.3 kW, 97 kg and Excellent Full Floater'),
 (58,1054,'https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/competition_172.php','Suzuki factory archive RM250 1981: 246 cm3, 30.5 kW, 98 kg, Full Floater and air cooling')
 ) AS i(fact_id,model_id,source_url,scope_note);
 GET DIAGNOSTICS wrote=ROW_COUNT;
 IF wrote<>17 THEN
  RAISE EXCEPTION 'Primary-source audit rolled back: inserted % instead of 17',wrote;
 END IF;
END $$;

-- Post-operation manual verification:
-- SELECT count(*) FROM public.motorcycle_catalog_fact_verification_audit
-- WHERE fact_id IN (21,22,40,41,42,43,44,49,50,51,52,53,54,55,56,57,58);
-- SELECT count(*) FROM public.motorcycle_universal_published_sections_v1;
