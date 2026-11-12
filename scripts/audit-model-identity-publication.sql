-- AnyBike model identity publication audit (read-only).
-- Run in Supabase SQL Editor before approving model names or relationships.
-- Never auto-approve pending reviews or collapse distinct model generations.
-- 1. Catalogue coverage and review gates.
SELECT
  (SELECT count(*) FROM public.motorcycle_catalog_models) AS master_models,
  (SELECT count(*) FROM public.motorcycle_catalog_dropdown_clean) AS public_clean_models,
  (SELECT count(DISTINCT catalog_model_id) FROM public.motorcycle_catalog_name_reviews WHERE review_status = 'pending_review') AS pending_name_models,
  (SELECT count(DISTINCT alias_model_id) FROM public.motorcycle_catalog_model_aliases) AS alias_models;

-- 2. Pending identity reviews with the original source label preserved.
SELECT n.id AS review_id, m.id AS model_id, m.manufacturer, m.model AS source_model,
       n.suggested_model, n.issue_type, n.notes
FROM public.motorcycle_catalog_name_reviews n
JOIN public.motorcycle_catalog_models m ON m.id = n.catalog_model_id
WHERE n.review_status = 'pending_review'
ORDER BY m.manufacturer, m.model, n.id;

-- 3. Conflicting classifications for the same parent/child model pair.
SELECT p.manufacturer, p.model AS parent_model, c.model AS child_model,
       count(*) AS relationship_rows,
       string_agg(DISTINCT r.relationship_type, ', ' ORDER BY r.relationship_type) AS classifications
FROM public.motorcycle_catalog_model_relationships r
JOIN public.motorcycle_catalog_models p ON p.id = r.parent_model_id
JOIN public.motorcycle_catalog_models c ON c.id = r.child_model_id
GROUP BY r.parent_model_id, r.child_model_id, p.manufacturer, p.model, c.model
HAVING count(DISTINCT r.relationship_type) > 1
ORDER BY p.manufacturer, p.model, c.model;

-- 4. Relationship safety: should always be zero for both checks.
SELECT count(*) FILTER (WHERE r.parent_model_id = r.child_model_id) AS self_links,
       count(*) FILTER (WHERE p.manufacturer <> c.manufacturer) AS cross_manufacturer_links
FROM public.motorcycle_catalog_model_relationships r
JOIN public.motorcycle_catalog_models p ON p.id = r.parent_model_id
JOIN public.motorcycle_catalog_models c ON c.id = r.child_model_id;

-- 5. Verified research held behind a pending identity review.
-- These facts are not permission to publish the model or resolve its review.
SELECT m.manufacturer, m.model, m.id AS model_id,
       count(f.id) AS verified_facts,
       string_agg(DISTINCT n.issue_type, ', ' ORDER BY n.issue_type) AS review_reasons
FROM public.motorcycle_catalog_models m
JOIN public.motorcycle_catalog_name_reviews n ON n.catalog_model_id = m.id
  AND n.review_status = 'pending_review'
JOIN public.motorcycle_catalog_facts f ON f.catalog_model_id = m.id
  AND f.verification_status = 'verified'
GROUP BY m.id, m.manufacturer, m.model
ORDER BY verified_facts DESC, m.model;
