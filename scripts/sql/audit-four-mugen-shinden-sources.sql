-- Document-only review for four EXACT Mugen Shinden/Shinden Go facts.
-- Preserves registry naming discrepancy for Mugen: no alias is approved
-- and no race-program results are assigned to a different race model.
-- Independent audit records, never public model/editorial publication.
DO $$
DECLARE eligible int; wrote int;
BEGIN
 WITH incoming(fact_id,model_id,source_url,scope_note) AS (VALUES
 (31,1045,'https://www.mugen-power.com/shindenproject/history/','Mugen official Shinden project history: initial Isle of Man TT entry in 2012 for the original Shinden electric motorcycle'),
 (34,1046,'https://www.iomtt.com/news/2016/03/29/mugen-shinden-go-unveiled','Isle of Man TT 29 March 2016: Shinden Go monocoque frame and internal battery arrangement'),
 (35,1046,'https://www.iomtt.com/news/2016/03/29/mugen-shinden-go-unveiled','Isle of Man TT 29 March 2016: Shinden Go new motor, battery and upgraded cooling technology'),
 (36,1046,'https://www.mugen-power.com/common/english/news/2016/20160128/index.html','Team Mugen official 28 January 2016 statement: Shinden Go rider line-up John McGuinness and Bruce Anstey')
 )
 SELECT count(*) INTO eligible FROM incoming x
 JOIN public.motorcycle_catalog_facts f
 ON f.id=x.fact_id AND f.catalog_model_id=x.model_id
  AND f.verification_status='verified' AND f.source_url=x.source_url
 WHERE NOT EXISTS (SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
  WHERE a.fact_id=x.fact_id);
 IF eligible<>4 THEN RAISE EXCEPTION 'Mugen fact audit stopped: expected four, got %',eligible; END IF;
 INSERT INTO public.motorcycle_catalog_fact_verification_audit
 (fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
 SELECT x.fact_id,now(),
 'race_machine_model_identity_and_documentary_source_checked',
 x.source_url,x.scope_note,
 'Mugen project record / Isle of Man TT source checked 2026-11-10'
 FROM (VALUES
 (31,1045,'https://www.mugen-power.com/shindenproject/history/','Mugen official Shinden project history: initial Isle of Man TT entry in 2012 for the original Shinden electric motorcycle'),
 (34,1046,'https://www.iomtt.com/news/2016/03/29/mugen-shinden-go-unveiled','Isle of Man TT 29 March 2016: Shinden Go monocoque frame and internal battery arrangement'),
 (35,1046,'https://www.iomtt.com/news/2016/03/29/mugen-shinden-go-unveiled','Isle of Man TT 29 March 2016: Shinden Go new motor, battery and upgraded cooling technology'),
 (36,1046,'https://www.mugen-power.com/common/english/news/2016/20160128/index.html','Team Mugen official 28 January 2016 statement: Shinden Go rider line-up John McGuinness and Bruce Anstey')
 ) x(fact_id,model_id,source_url,scope_note);
 GET DIAGNOSTICS wrote=ROW_COUNT;
 IF wrote<>4 THEN RAISE EXCEPTION 'Mugen audit rolled back: % rows',wrote; END IF;
END $$;
