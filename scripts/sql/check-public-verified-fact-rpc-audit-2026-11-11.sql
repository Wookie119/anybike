-- AnyBike public research connection regression checks — 11 Nov 2026
-- READ ONLY. This is the existing Supabase RPC, not a replacement template.
-- Verified facts must have matching, dated, independent source audit records.
SELECT
 position('motorcycle_catalog_fact_verification_audit' in
   pg_get_functiondef(p.oid))>0 AS audit_join_exists,
 position('a.source_url=f.source_url' in
   pg_get_functiondef(p.oid))>0 AS exact_audit_url_required,
 position('a.checked_at <= now()' in
   pg_get_functiondef(p.oid))>0 AS past_audit_date_required,
 p.prosecdef AS existing_security_definer_retained
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname='public_anybike_verified_model_facts_v1';

-- Compare these counts to the tested baseline after every change:
-- Suzuki RM250 10, CB750 Four 5, BMW F900 GS 7, KX125 2,
-- R1300 GS 20, Mugen Shinden 3.
SELECT 'Suzuki RM250' motorcycle,
 jsonb_array_length(public.public_anybike_verified_model_facts_v1('Suzuki','RM250')) facts
UNION ALL SELECT 'Honda Dream CB750 Four',
 jsonb_array_length(public.public_anybike_verified_model_facts_v1('Honda','Dream CB750 Four'))
UNION ALL SELECT 'BMW F 900 GS',
 jsonb_array_length(public.public_anybike_verified_model_facts_v1('BMW','F 900 GS'))
UNION ALL SELECT 'Kawasaki KX125',
 jsonb_array_length(public.public_anybike_verified_model_facts_v1('Kawasaki','KX125'))
UNION ALL SELECT 'BMW R 1300 GS',
 jsonb_array_length(public.public_anybike_verified_model_facts_v1('BMW','R 1300 GS'))
UNION ALL SELECT 'Mugen Shinden',
 jsonb_array_length(public.public_anybike_verified_model_facts_v1('Mugen','Shinden'));

-- Public model research must remain separate from universal draft releases.
SELECT count(*) AS public_universal_model_sections
FROM public.motorcycle_universal_published_sections_v1
WHERE entity_type='model' AND publication_eligible IS TRUE;
