-- AnyBike production data repair, applied 11 November 2026.
-- Eight independently audited BMW manufacturing/launch facts had labels
-- bloated with duplicate source URLs (171-198 characters) and were excluded
-- by the existing public RPC 160-character title gate.
-- The original manufacturer URLs remain in source_url and source audit rows.
-- Idempotent: no change if short labels are already installed.
WITH labels(id,new_label) AS (
 VALUES
 (152::bigint,'Berlin factory: CE 04 series production began in November 2021'),
 (153::bigint,'F 850 GS: 2017 manufacturer announcement for the 2018 model year'),
 (155::bigint,'R 1200 GS: 100,000th combined GS and GS Adventure production milestone'),
 (156::bigint,'R 1200 GS: Berlin factory 500,000th boxer-powered GS milestone'),
 (157::bigint,'R 1250 GS: one-millionth boxer-powered GS built in Berlin'),
 (158::bigint,'R 1300 GS: Berlin factory production documented in September 2023'),
 (161::bigint,'S 1000 XR: Berlin factory production documented in April 2015'),
 (163::bigint,'R nineT: BMW confirms December 2013 series-production start')
)
UPDATE public.motorcycle_catalog_facts f SET label=l.new_label
FROM labels l
WHERE f.id=l.id
 AND f.verification_status='verified'
 AND f.category='manufacturing_evidence'
 AND length(f.label)>160
 AND f.label LIKE 'Manufacturing/launch evidence | Date:%'
 AND EXISTS (
  SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
  WHERE a.fact_id=f.id AND a.source_url=f.source_url
   AND nullif(btrim(a.verification_basis),'') IS NOT NULL
   AND a.checked_at IS NOT NULL AND a.checked_at<=now()
 );

-- Read-only post-change verification: exactly 8 repaired records, URLs/audits intact.
SELECT f.id,m.manufacturer,m.model,f.label,
       length(f.label) AS title_length,
       (f.source_url ~ '^https://[^[:space:]]+$') AS source_url_valid,
       EXISTS (
        SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
        WHERE a.fact_id=f.id AND a.source_url=f.source_url
        AND nullif(btrim(a.verification_basis),'') IS NOT NULL
        AND a.checked_at IS NOT NULL AND a.checked_at<=now()
       ) AS independently_audited
FROM public.motorcycle_catalog_facts f
JOIN public.motorcycle_catalog_models m ON m.id=f.catalog_model_id
WHERE f.id IN (152,153,155,156,157,158,161,163)
ORDER BY f.id;
