-- AnyBike V2 universal master: public visibility and draft isolation regression (READ ONLY).
-- Verifies database grants and RLS configuration; cannot substitute for actual
-- logged-in/logged-out browser and API tests of the full model page.
-- The same published research must be available to anon and authenticated
-- visitors, subject to editorial release; trade stock has separate permissions.
-- Do not grant access to the private draft store or automatically publish content.

-- 1. Public released rows must be selectable; raw editorial drafts must not.
SELECT CASE
 WHEN has_table_privilege('anon','public.motorcycle_universal_published_sections_v1','SELECT')
  AND has_table_privilege('authenticated','public.motorcycle_universal_published_sections_v1','SELECT')
  AND NOT has_table_privilege('anon','public.motorcycle_universal_page_sections_v1','SELECT')
  AND NOT has_table_privilege('authenticated','public.motorcycle_universal_page_sections_v1','SELECT')
 THEN 'PASS' ELSE 'REVIEW' END AS privilege_gate;

-- 2. The released table must retain an anon/authenticated SELECT RLS policy
-- that explicitly restricts publication eligibility.
SELECT CASE WHEN EXISTS(
 SELECT 1 FROM pg_policies
 WHERE schemaname='public'
   AND tablename='motorcycle_universal_published_sections_v1'
   AND cmd='SELECT'
   AND roles @> ARRAY['anon','authenticated']::name[]
   AND qual LIKE '%publication_eligible%'
) THEN 'PASS' ELSE 'REVIEW' END AS released_rows_rls_policy_gate;

-- 3. Invalid public releases must always be zero, even after publication.
-- A zero row count today is not a successful rollout: it means no universal
-- editorial sections have been published yet.
SELECT COUNT(*) AS published_rows,
 COUNT(*) FILTER (WHERE editorial_status <> 'published'
    OR publication_eligible IS DISTINCT FROM true
    OR published_at IS NULL OR published_at > NOW()) AS invalid_publications
FROM public.motorcycle_universal_published_sections_v1;

-- 4. Monitor drafts separately from fully published reviewed source records.
SELECT COUNT(*) FILTER (WHERE entity_type='model') AS model_drafts,
 COUNT(*) FILTER (WHERE entity_type='manufacturer') AS manufacturer_drafts,
 COUNT(*) FILTER (WHERE editorial_status='published') AS approved_source_publications
FROM public.motorcycle_universal_page_sections_v1;
