-- Three manufacturer-supported 1949 Honda Dream D-Type facts.
-- Checked against original Honda 75-year history 2026-11-10.
-- Audit rows only: no factual changes, catalogue merges, public permissions,
-- research promotion, automatic publication, or stock access changes.
DO $$
DECLARE eligible integer; wrote integer;
BEGIN
 WITH source(fact_id,model_id,source_url,scope_note) AS (VALUES
(26,1044,'https://global.honda/en/about/history-digest/75years-history/chapter1/','Honda 75 Years of History, Chapter I Section 1: Dream D-Type factory paint described as maroon'),
(27,1044,'https://global.honda/en/about/history-digest/75years-history/chapter1/','Honda 75 Years of History, Chapter I Section 1: Dream D-Type channel-type frame mostly stamped steel plate'),
(28,1044,'https://global.honda/en/about/history-digest/75years-history/chapter1/','Honda 75 Years of History, Chapter I Section 1: Dream D-Type introduced August 1949')
 )
 SELECT count(*) INTO eligible FROM source x
 JOIN public.motorcycle_catalog_facts f ON f.id=x.fact_id
 WHERE f.catalog_model_id=x.model_id
   AND f.verification_status='verified'
   AND f.source_url=x.source_url
   AND NOT EXISTS (SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
    WHERE a.fact_id=x.fact_id);
 IF eligible<>3 THEN RAISE EXCEPTION 'Honda audit cancelled: % of 3 eligible',eligible; END IF;
 INSERT INTO public.motorcycle_catalog_fact_verification_audit
 (fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
 SELECT x.fact_id,now(),
  'manufacturer_primary_source_exact_model_fact_checked',x.source_url,
  x.scope_note,'Honda 75 Years of History Chapter I / source checked 2026-11-10'
 FROM (VALUES
(26,1044,'https://global.honda/en/about/history-digest/75years-history/chapter1/','Honda 75 Years of History, Chapter I Section 1: Dream D-Type factory paint described as maroon'),
(27,1044,'https://global.honda/en/about/history-digest/75years-history/chapter1/','Honda 75 Years of History, Chapter I Section 1: Dream D-Type channel-type frame mostly stamped steel plate'),
(28,1044,'https://global.honda/en/about/history-digest/75years-history/chapter1/','Honda 75 Years of History, Chapter I Section 1: Dream D-Type introduced August 1949')
 ) AS x(fact_id,model_id,source_url,scope_note);
 GET DIAGNOSTICS wrote=ROW_COUNT;
 IF wrote<>3 THEN RAISE EXCEPTION 'Honda audit rolled back, wrote %',wrote; END IF;
END $$;
