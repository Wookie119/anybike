-- AnyBike ONE universal V2 master: read-only publication identity and coverage audit.
-- Run manually against the connected AnyBike Supabase project.
-- NEVER approve drafts, alter publication flags, manufacture sections or change stock/photo permissions.
-- 20 editorial slots are distinct from the verified-facts category taxonomy.
--
-- 1. Resolve each researched model to exactly one canonical manufacturer.
--    A missing match is a BLOCKER requiring catalogue review, not a reason to
--    invent a new manufacturer or borrow another brand's identity.
WITH researched_models AS (
 SELECT DISTINCT m.id,m.manufacturer,m.model
 FROM public.motorcycle_catalog_models m
 JOIN public.motorcycle_universal_page_sections_v1 s
   ON s.entity_type='model' AND s.model_id=m.id
), identity_resolution AS (
 SELECT m.id,m.manufacturer,m.model,
        COUNT(c.id) AS manufacturer_matches,
        MIN(c.id) AS resolved_manufacturer_id
 FROM researched_models m
 LEFT JOIN public.motorcycle_catalog_manufacturers c
   ON LOWER(BTRIM(c.display_name))=LOWER(BTRIM(m.manufacturer))
 GROUP BY m.id,m.manufacturer,m.model
)
SELECT id AS catalog_model_id,manufacturer,model,
       manufacturer_matches,resolved_manufacturer_id
FROM identity_resolution
WHERE manufacturer_matches<>1
ORDER BY manufacturer,model,id;

-- 2. Count missing/unambiguous canonical manufacturer matches across ALL
-- researched catalogue models; a model draft's manufacturer_id may legitimately
-- be null until the reviewed publication mapping is resolved.
WITH researched_models AS (
 SELECT DISTINCT m.id,m.manufacturer
 FROM public.motorcycle_catalog_models m
 JOIN public.motorcycle_universal_page_sections_v1 s
   ON s.entity_type='model' AND s.model_id=m.id
), matches AS (
 SELECT m.id,COUNT(c.id) AS manufacturer_matches
 FROM researched_models m
 LEFT JOIN public.motorcycle_catalog_manufacturers c
   ON LOWER(BTRIM(c.display_name))=LOWER(BTRIM(m.manufacturer))
 GROUP BY m.id
)
SELECT COUNT(*) AS models_with_drafts,
       COUNT(*) FILTER (WHERE manufacturer_matches=1) AS unambiguously_mapped,
       COUNT(*) FILTER (WHERE manufacturer_matches=0) AS missing_manufacturer,
       COUNT(*) FILTER (WHERE manufacturer_matches>1) AS ambiguous_manufacturer
FROM matches;

-- 2a. Authoritative publication gate: the reviewed parent-identity table,
--     NOT text matching, is what the release trigger actually checks.
--     A matching manufacturer name cannot waive a missing verified relation.
WITH researched_models AS (
 SELECT DISTINCT model_id
 FROM public.motorcycle_universal_page_sections_v1
 WHERE entity_type='model'
), validated AS (
 SELECT r.model_id,p.manufacturer_id,p.review_status
 FROM researched_models r
 LEFT JOIN public.motorcycle_catalog_model_parent_identity_v1 p
   ON p.catalog_model_id=r.model_id
)
SELECT COUNT(*) AS models_with_draft_sections,
       COUNT(*) FILTER (WHERE review_status='verified' AND manufacturer_id IS NOT NULL)
         AS verified_canonical_parents,
       COUNT(*) FILTER (WHERE review_status IS NULL OR manufacturer_id IS NULL)
         AS unresolved_parents,
       COUNT(*) FILTER (WHERE review_status IS NOT NULL AND review_status<>'verified')
         AS unapproved_parents
FROM validated;

-- 2b. Identify unresolved models without altering or guessing their parents.
SELECT m.id AS catalog_model_id,m.manufacturer,m.model,
       p.manufacturer_id,p.review_status
FROM public.motorcycle_catalog_models m
JOIN (SELECT DISTINCT model_id FROM public.motorcycle_universal_page_sections_v1
      WHERE entity_type='model') researched ON researched.model_id=m.id
LEFT JOIN public.motorcycle_catalog_model_parent_identity_v1 p
  ON p.catalog_model_id=m.id
WHERE p.review_status IS DISTINCT FROM 'verified' OR p.manufacturer_id IS NULL
ORDER BY m.manufacturer,m.model,m.id;

-- 3. Per-model editorial readiness for the approved 20-slot layout.
--    Missing slots are EMPTY DESTINATIONS, not missing templates. No assumption
--    that a draft with a source_reference is verified, licensed or publishable.
WITH grouped AS (
 SELECT s.model_id,
        COUNT(*) AS draft_sections,
        COUNT(*) FILTER (WHERE s.content IS NULL OR s.content IN ('{}'::jsonb,'[]'::jsonb)) AS empty_sections,
        COUNT(*) FILTER (WHERE s.content->>'source_verification_status' IN
          ('pending_review','pending_editorial_review','draft','unverified')) AS expressly_unreviewed_sections,
        COUNT(*) FILTER (WHERE s.section_key IS DISTINCT FROM
          'section_'||LPAD(s.section_number::text,2,'0')) AS invalid_keys,
        ARRAY_AGG(s.section_number ORDER BY s.section_number) AS slots
 FROM public.motorcycle_universal_page_sections_v1 s
 WHERE s.entity_type='model'
 GROUP BY s.model_id
)
SELECT m.id AS catalog_model_id,m.manufacturer,m.model,
       COALESCE(g.draft_sections,0) AS existing_draft_slots,
       COALESCE(g.empty_sections,0) AS empty_sections,
       COALESCE(g.expressly_unreviewed_sections,0) AS expressly_unreviewed_sections,
       COALESCE(g.invalid_keys,0) AS invalid_keys,
       ARRAY(
         SELECT n FROM generate_series(1,20) n
         WHERE NOT n=ANY(COALESCE(g.slots,'{}'::smallint[]))
         ORDER BY n
       ) AS currently_unfilled_destinations
FROM public.motorcycle_catalog_models m
LEFT JOIN grouped g ON g.model_id=m.id
WHERE m.manufacturer='BMW' AND m.model IN
  ('R 1300 GS','R 1300 GS Adventure','R 1300 GS TE')
ORDER BY CASE m.model WHEN 'R 1300 GS' THEN 0 ELSE 1 END,m.model,m.id;

-- 4. Production public projection is physically separate and RLS protected.
--    Counts here are not a substitute for anon/authenticated browser-role tests.
SELECT COUNT(*) AS publicly_published_universal_sections
FROM public.motorcycle_universal_published_sections_v1;
