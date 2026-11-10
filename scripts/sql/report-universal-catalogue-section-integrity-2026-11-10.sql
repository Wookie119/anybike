-- AnyBike all-manufacturer, all-model and all-staged-section integrity audit.
-- READ ONLY. Run as part of prepublication checklist before any change
-- to universal renderer or database section mapping.
-- This deliberately checks BOTH model and manufacturer section types.
WITH s AS (
 SELECT s.id,s.entity_type,s.model_id,s.manufacturer_id,
  s.section_number,s.section_key,s.editorial_status,s.published_at,
  s.source_reference,m.manufacturer,m.model
 FROM public.motorcycle_universal_page_sections_v1 s
 LEFT JOIN public.motorcycle_catalog_models m ON m.id=s.model_id
), checks AS (
 SELECT 'missing_source' AS reason,count(*) AS exceptions
 FROM s WHERE nullif(trim(source_reference),'') IS NULL
 UNION ALL SELECT 'slot_out_of_range',count(*)
 FROM s WHERE section_number NOT BETWEEN 1 AND 20
 UNION ALL SELECT 'missing_model_catalogue_fk',count(*)
 FROM s WHERE entity_type='model' AND manufacturer IS NULL
 UNION ALL SELECT 'wrong_entity_id_shape',count(*)
 FROM s WHERE (entity_type='model' AND (model_id IS NULL OR manufacturer_id IS NOT NULL))
 OR (entity_type='manufacturer' AND (manufacturer_id IS NULL OR model_id IS NOT NULL))
 UNION ALL SELECT 'publication_leak',count(*)
 FROM s WHERE editorial_status<>'draft' OR published_at IS NOT NULL
 UNION ALL SELECT 'duplicate_model_slots',coalesce(sum(n-1),0)
 FROM (SELECT count(*) AS n FROM s WHERE entity_type='model'
 GROUP BY model_id,section_number HAVING count(*)>1) d
 UNION ALL SELECT 'duplicate_manufacturer_slots',coalesce(sum(n-1),0)
 FROM (SELECT count(*) AS n FROM s WHERE entity_type='manufacturer'
 GROUP BY manufacturer_id,section_number HAVING count(*)>1) d
 UNION ALL SELECT 'duplicate_entity_section_keys',coalesce(sum(n-1),0)
 FROM (SELECT count(*) AS n FROM s GROUP BY
 entity_type,coalesce(model_id,manufacturer_id),section_key
 HAVING count(*)>1) d
)
SELECT reason,exceptions FROM checks ORDER BY reason;
-- IMPORTANT: all exception counts should be zero. Any nonzero result blocks
-- release pending diagnosis; this query itself never corrects a record.
