-- AnyBike universal catalogue: read-only pre-publication inventory.
-- One 20-section contract for manufacturers and models.
-- Structural completeness is NOT publication approval: source verification,
-- exact model identity, image rights, stock entitlement and visual QA still apply.
-- This report never promotes draft records or modifies public projections.
WITH staged AS (
 SELECT entity_type,manufacturer_id,model_id,section_number,section_key,
        section_title,content,editorial_status
 FROM public.motorcycle_universal_page_sections_v1
), per_entity AS (
 SELECT entity_type,coalesce(model_id,manufacturer_id) AS entity_id,
        count(*) AS section_count,
        count(*) FILTER (WHERE content IS NULL OR content='{}'::jsonb) AS empty_sections,
        count(*) FILTER (
          WHERE section_number NOT BETWEEN 1 AND 20
             OR section_key IS DISTINCT FROM 'section_'||lpad(section_number::text,2,'0')
        ) AS invalid_keys,
        count(*) FILTER (WHERE editorial_status='published') AS published_sections,
        count(*) FILTER (
          WHERE content->'engineering'->>'verification_status'='pending_editorial_review'
        ) AS pending_engineering
 FROM staged GROUP BY entity_type,coalesce(model_id,manufacturer_id)
)
SELECT entity_type,count(*) AS entities,sum(section_count) AS staged_sections,
       sum(empty_sections) AS empty_sections,sum(invalid_keys) AS invalid_keys,
       sum(pending_engineering) AS pending_engineering,
       count(*) FILTER (
         WHERE section_count=20 AND empty_sections=0
           AND invalid_keys=0 AND pending_engineering=0
       ) AS structurally_complete_20,
       sum(published_sections) AS published_sections
FROM per_entity GROUP BY entity_type ORDER BY entity_type;

-- Exact empty-section worklist: no placeholder or fabricated content.
SELECT entity_type,manufacturer_id,model_id,section_number,section_key,section_title
FROM public.motorcycle_universal_page_sections_v1
WHERE content IS NULL OR content='{}'::jsonb
ORDER BY entity_type,manufacturer_id,model_id,section_number;

-- Canonical section identity collisions (should return no rows).
SELECT entity_type,manufacturer_id,model_id,section_number,count(*) AS duplicates
FROM public.motorcycle_universal_page_sections_v1
GROUP BY entity_type,manufacturer_id,model_id,section_number
HAVING count(*)>1;

-- BMW canonical model-name review. The readiness view flags ambiguous identities:
-- review them individually; do not automatically rename legitimate variants.
SELECT m.id,m.model,r.name_issue_count,r.verified_specification_count,
       r.generation_count,r.timeline_count
FROM public.motorcycle_catalog_models m
JOIN public.motorcycle_catalog_readiness r ON r.id=m.id
WHERE m.manufacturer='BMW' AND r.name_issue_count>0
ORDER BY m.model,m.id;

-- BMW model staging coverage and nested engineering review, without promoting drafts.
-- Count left-join rows using s.id, not count(*): missing sections must remain zero.
SELECT m.id,m.model,
       count(s.id) AS staged_sections,
       count(s.id) FILTER (WHERE s.content IS NULL OR s.content='{}'::jsonb) AS empty_sections,
       count(s.id) FILTER (
         WHERE s.content->'engineering'->>'verification_status'='pending_editorial_review'
       ) AS pending_engineering_sections,
       count(s.id) FILTER (WHERE s.editorial_status='published') AS published_sections
FROM public.motorcycle_catalog_models m
LEFT JOIN public.motorcycle_universal_page_sections_v1 s
  ON s.entity_type='model' AND s.model_id=m.id
WHERE m.manufacturer='BMW'
GROUP BY m.id,m.model ORDER BY staged_sections DESC,m.model,m.id;

-- Coverage by manufacturer is staging only, never a count of approved live pages.
SELECT m.manufacturer,count(DISTINCT m.id) AS catalog_models,
       count(s.id) AS staged_model_sections
FROM public.motorcycle_catalog_models m
LEFT JOIN public.motorcycle_universal_page_sections_v1 s
  ON s.entity_type='model' AND s.model_id=m.id
GROUP BY m.manufacturer ORDER BY catalog_models DESC,m.manufacturer;

-- Live-source canonical identity integrity. Reports exceptions only.
-- A verified match can still have a stale feed label, so check both ID
-- and normalized make/model; never reassign identity automatically.
SELECT x.live_source_item_id,x.catalog_model_id,x.source_make,x.source_model,
       m.manufacturer AS canonical_manufacturer,m.model AS canonical_model,
       x.review_status
FROM public.motorcycle_live_source_catalogue_identity_v1 x
LEFT JOIN public.motorcycle_catalog_models m ON m.id=x.catalog_model_id
WHERE x.review_status='verified'
  AND (m.id IS NULL OR
       (nullif(trim(x.source_make),'') IS NOT NULL AND
         regexp_replace(lower(x.source_make),'[^a-z0-9]','','g') <>
         regexp_replace(lower(m.manufacturer),'[^a-z0-9]','','g')) OR
       (nullif(trim(x.source_model),'') IS NOT NULL AND
         regexp_replace(lower(x.source_model),'[^a-z0-9]','','g') <>
         regexp_replace(lower(m.model),'[^a-z0-9]','','g')))
ORDER BY x.live_source_item_id;

-- Verified parent identities must point at actual catalogue models.
SELECT x.catalog_model_id,x.source_manufacturer_name,x.review_status
FROM public.motorcycle_catalog_model_parent_identity_v1 x
LEFT JOIN public.motorcycle_catalog_models m ON m.id=x.catalog_model_id
WHERE x.review_status='verified' AND m.id IS NULL
ORDER BY x.catalog_model_id;

-- BMW research readiness ranked by staged section coverage and cited facts.
-- The report counts facts embedded in private draft sections only; numbers
-- are NOT publication approvals or a claim all research is verified.
SELECT m.id,m.model,
       count(s.id) AS staged_sections,
       count(s.id) FILTER (
         WHERE s.content->'engineering'->>'verification_status'='pending_editorial_review'
       ) AS pending_engineering,
       coalesce(sum(jsonb_array_length(
         CASE WHEN jsonb_typeof(s.content->'verified_catalogue_facts')='array'
              THEN s.content->'verified_catalogue_facts'
              ELSE '[]'::jsonb END
       )),0) AS embedded_evidence_facts,
       count(s.id) FILTER (
         WHERE s.content IS NULL OR s.content='{}'::jsonb
       ) AS empty_sections
FROM public.motorcycle_catalog_models m
LEFT JOIN public.motorcycle_universal_page_sections_v1 s
  ON s.entity_type='model' AND s.model_id=m.id
WHERE m.manufacturer='BMW'
GROUP BY m.id,m.model
ORDER BY staged_sections DESC,embedded_evidence_facts DESC,m.model,m.id;

-- Publication provenance integrity. Run before approving ANY public release.
-- A source-section foreign key alone does not prove the source belongs to the
-- same model, section slot or manufacturer. Report all mismatches without writes.
SELECT pub.source_section_id,pub.entity_type,pub.entity_id,pub.manufacturer_id,
       pub.section_number,pub.section_key,pub.publication_review_reference,
       src.model_id AS source_model_id,src.manufacturer_id AS source_manufacturer_id,
       m.manufacturer AS catalogue_manufacturer
FROM public.motorcycle_universal_published_sections_v1 pub
LEFT JOIN public.motorcycle_universal_page_sections_v1 src
  ON src.id=pub.source_section_id
LEFT JOIN public.motorcycle_catalog_models m
  ON pub.entity_type='model' AND pub.entity_id=m.id
LEFT JOIN public.motorcycle_catalog_manufacturers cm
  ON cm.display_name=m.manufacturer
WHERE src.id IS NULL
   OR src.entity_type IS DISTINCT FROM pub.entity_type
   OR src.section_number IS DISTINCT FROM pub.section_number
   OR src.section_key IS DISTINCT FROM pub.section_key
   OR (pub.entity_type='model' AND (
       src.model_id IS DISTINCT FROM pub.entity_id
       OR m.id IS NULL OR cm.id IS DISTINCT FROM pub.manufacturer_id))
   OR (pub.entity_type='manufacturer' AND (
       src.manufacturer_id IS DISTINCT FROM pub.entity_id
       OR pub.manufacturer_id IS DISTINCT FROM pub.entity_id))
ORDER BY pub.entity_type,pub.entity_id,pub.section_number;

-- Staging rows must refer to their proper canonical entity.
SELECT s.id AS source_section_id,s.entity_type,s.manufacturer_id,s.model_id
FROM public.motorcycle_universal_page_sections_v1 s
LEFT JOIN public.motorcycle_catalog_models m
  ON s.entity_type='model' AND s.model_id=m.id
LEFT JOIN public.motorcycle_catalog_manufacturers mf
  ON s.entity_type='manufacturer' AND s.manufacturer_id=mf.id
WHERE (s.entity_type='model' AND m.id IS NULL)
   OR (s.entity_type='manufacturer' AND mf.id IS NULL)
ORDER BY s.entity_type,s.id;

-- Editorial photography rights and exact identity worklist. Only approved
-- pictures are eligible for public display; this query never promotes assets.
SELECT asset_key,manufacturer,model,approval_status,
       CASE
         WHEN image_url IS NULL OR image_url !~ '^https://' THEN 'image_url'
         WHEN source_page_url IS NULL OR source_page_url !~ '^https://' THEN 'source_page_url'
         WHEN licence_url IS NULL OR licence_url !~ '^https://' THEN 'licence_url'
         WHEN nullif(trim(licence),'') IS NULL THEN 'licence'
         WHEN nullif(trim(attribution),'') IS NULL THEN 'attribution'
       END AS missing_rights_field
FROM public.anybike_editorial_photo_bank
WHERE approval_status='approved'
  AND (image_url IS NULL OR image_url !~ '^https://'
       OR source_page_url IS NULL OR source_page_url !~ '^https://'
       OR licence_url IS NULL OR licence_url !~ '^https://'
       OR nullif(trim(licence),'') IS NULL
       OR nullif(trim(attribution),'') IS NULL)
ORDER BY manufacturer,model,asset_key;

-- Model-level approved photo coverage is separate from staged research.
SELECT m.id,m.manufacturer,m.model,
       count(distinct p.asset_key) AS approved_model_photo_assets
FROM public.motorcycle_catalog_models m
LEFT JOIN public.anybike_editorial_photo_bank p
  ON p.manufacturer=m.manufacturer AND p.model=m.model
 AND p.approval_status='approved'
WHERE m.manufacturer='BMW'
GROUP BY m.id,m.manufacturer,m.model
ORDER BY approved_model_photo_assets DESC,m.model,m.id;

-- Existing approved BMW-route RPC: structural coverage in one read-only batch.
-- 27 routes are an integration baseline, NOT a second template.
WITH bmw_routes(path) AS (
 VALUES
 ('/bmw-c400gt.html'),('/bmw-c400x.html'),('/bmw-ce02.html'),('/bmw-ce04.html'),
 ('/bmw-f850gs.html'),('/bmw-f900gs.html'),('/bmw-f900r.html'),('/bmw-f900xr.html'),
 ('/bmw-g650gs.html'),('/bmw-hp4.html'),('/bmw-k1600gt.html'),('/bmw-k1600gtl.html'),
 ('/bmw-m1000rr.html'),('/bmw-r1200gs.html'),('/bmw-r1200rt.html'),
 ('/bmw-r1250gs.html'),('/bmw-r1250r.html'),('/bmw-r1250rt.html'),
 ('/bmw-r1300gs.html'),('/bmw-r18.html'),('/bmw-r32.html'),('/bmw-r80gs.html'),
 ('/bmw-r90s.html'),('/bmw-rninet.html'),('/bmw-s1000r.html'),
 ('/bmw-s1000rr.html'),('/bmw-s1000xr.html')
), public_research AS (
 SELECT path,public.public_bmw_model_history_v1(path) AS data
 FROM bmw_routes
)
SELECT path, data->>'model' AS model,
       data IS NOT NULL AS has_public_research,
       data->>'make'='BMW' AS correct_manufacturer,
       jsonb_array_length(coalesce(data->'generations','[]'::jsonb)) AS generations,
       jsonb_array_length(coalesce(data->'technical_specifications','[]'::jsonb)) AS technical_references,
       jsonb_array_length(coalesce(data->'related_models','[]'::jsonb)) AS related_models,
       jsonb_array_length(coalesce(data->'country_markets','[]'::jsonb)) AS model_specific_country_links
FROM public_research
ORDER BY path;

-- The shared navigation RPC lists existing routes, not approved country
-- editorial. A candidate route is NOT equivalent to published research.
SELECT r.publication_state,count(*) AS eligible_country_routes
FROM anybike_publishing.editorial_page_routes r
WHERE r.entity_type='country'
 AND r.source_verified_at IS NOT NULL
 AND r.country_region IS NOT NULL
 AND r.public_path ~ '^/markets/[a-z0-9-]+[.]html$'
GROUP BY r.publication_state ORDER BY r.publication_state;

-- Verify public routes are URL-safe, unique, and separate from canonical
-- editorial approval. The country RPC is navigation-only.
WITH links AS (
 SELECT jsonb_array_elements(public.public_anybike_country_navigation_v1()) AS entry
)
SELECT count(*) AS returned_links,
 count(DISTINCT entry->>'url') AS unique_paths,
 count(*) FILTER(WHERE (entry->>'url') !~ '^/markets/[a-z0-9-]+[.]html$') AS invalid_paths,
 count(*) FILTER(WHERE coalesce(trim(entry->>'label'),'')='') AS missing_labels
FROM links;

-- Private stock-to-catalogue review does not establish API entitlements.
-- Never publish stock merely because a private identity is verified.
SELECT x.review_status,count(*) AS mapped_stock_rows,
 count(*) FILTER(WHERE m.id IS NULL) AS missing_catalogue_rows,
 count(*) FILTER(WHERE m.manufacturer='BMW') AS bmw_rows
FROM public.motorcycle_stock_catalogue_identity_v1 x
LEFT JOIN public.motorcycle_catalog_models m ON m.id=x.catalog_model_id
GROUP BY x.review_status ORDER BY x.review_status;

-- Buyer-safe catalog v2 is the data contract used BY the protected
-- international-public-stock Edge Function. Direct SQL here is an admin audit,
-- never permission for a UK visitor or a substitute for the Edge Function.
WITH public_items AS (
 SELECT jsonb_array_elements(public.international_vq_public_catalog_v2()) AS item
), aggregate AS (
 SELECT count(*) AS item_count,
   count(DISTINCT item->>'catalog_model_id') AS distinct_catalogue_models,
   count(*) FILTER (
     WHERE item->>'catalogue_identity_status'='verified'
       AND item->>'publication_eligible'='true'
       AND (item->>'catalog_model_id') ~ '^[1-9][0-9]*$'
   ) AS verified_eligible,
   count(*) FILTER (WHERE item->>'catalog_model_id' IS NULL) AS missing_canonical_id
 FROM public_items
)
SELECT * FROM aggregate;

-- Detect mismatched canonical IDs versus public model labels. Never
-- silently relabel or replace model stock in the UI.
WITH public_items AS (
 SELECT jsonb_array_elements(public.international_vq_public_catalog_v2()) AS item
)
SELECT item->>'item_id' AS published_item_id,
       item->>'make' AS source_make,item->>'model' AS source_model,
       item->>'catalog_model_id' AS canonical_id,
       m.manufacturer AS canonical_make,m.model AS canonical_model
FROM public_items
LEFT JOIN public.motorcycle_catalog_models m
 ON m.id=CASE WHEN (item->>'catalog_model_id') ~ '^[1-9][0-9]*$'
   THEN (item->>'catalog_model_id')::bigint ELSE NULL END
WHERE item->>'catalogue_identity_status'='verified'
 AND (m.id IS NULL OR
  regexp_replace(lower(coalesce(item->>'make','')),'[^a-z0-9]','','g') <>
  regexp_replace(lower(m.manufacturer),'[^a-z0-9]','','g') OR
  regexp_replace(lower(coalesce(item->>'model','')),'[^a-z0-9]','','g') <>
  regexp_replace(lower(m.model),'[^a-z0-9]','','g'))
ORDER BY published_item_id;

-- Manufacturer imported-source backlog: these rows are not researched content.
-- A JSON object containing only draft source pointers must NOT be published.
SELECT s.manufacturer_id,m.display_name AS manufacturer,s.section_number,
       s.section_key,s.section_title,
       jsonb_array_length(s.content->'source_blocks') AS imported_source_blocks,
       count(*) FILTER(WHERE b.value->>'import_status'='draft') AS draft_source_blocks
FROM public.motorcycle_universal_page_sections_v1 s
JOIN public.motorcycle_catalog_manufacturers m ON m.id=s.manufacturer_id
CROSS JOIN LATERAL jsonb_array_elements(
 CASE WHEN jsonb_typeof(s.content->'source_blocks')='array'
 THEN s.content->'source_blocks' ELSE '[]'::jsonb END
) AS b(value)
WHERE s.entity_type='manufacturer'
 AND (s.content-'source_blocks')='{}'::jsonb
GROUP BY s.manufacturer_id,m.display_name,s.section_number,
         s.section_key,s.section_title,s.content
ORDER BY manufacturer,s.section_number;

-- Overall scope: only-source-pointer records with all imports still draft.
SELECT count(*) AS manufacturer_source_only_sections,
       count(*) FILTER(WHERE NOT EXISTS (
         SELECT 1 FROM jsonb_array_elements(s.content->'source_blocks') b
         WHERE b->>'import_status' IS DISTINCT FROM 'draft'
       )) AS all_imports_still_draft
FROM public.motorcycle_universal_page_sections_v1 s
WHERE s.entity_type='manufacturer'
 AND jsonb_typeof(s.content->'source_blocks')='array'
 AND (s.content-'source_blocks')='{}'::jsonb;

-- Every staged entity, missing canonical 20-slot positions. A missing slot is
-- NOT automatically required or approved: record applicability before writing
-- research. Do not fabricate filler content to reach twenty.
WITH entities AS (
 SELECT entity_type,manufacturer_id,model_id,
        coalesce(model_id,manufacturer_id) AS entity_id
 FROM public.motorcycle_universal_page_sections_v1
 GROUP BY entity_type,manufacturer_id,model_id
), slots AS (
 SELECT e.entity_type,e.entity_id,e.manufacturer_id,e.model_id,
        n AS section_number,
        'section_'||lpad(n::text,2,'0') AS section_key
 FROM entities e CROSS JOIN generate_series(1,20) n
)
SELECT v.entity_type,v.entity_id,v.model_id,v.section_number,v.section_key
FROM slots v
LEFT JOIN public.motorcycle_universal_page_sections_v1 s
 ON s.entity_type=v.entity_type
 AND s.section_number=v.section_number
 AND (CASE WHEN v.entity_type='model'
       THEN s.model_id=v.model_id ELSE s.manufacturer_id=v.manufacturer_id END)
WHERE s.id IS NULL
ORDER BY v.entity_type,v.entity_id,v.section_number;

-- Summary by entity type distinguishes staged coverage from published work.
WITH entities AS (
 SELECT entity_type,coalesce(model_id,manufacturer_id) entity_id,
        count(*) staged_slots,
        count(*) FILTER(WHERE editorial_status='published') approved_staging_slots
 FROM public.motorcycle_universal_page_sections_v1
 GROUP BY entity_type,coalesce(model_id,manufacturer_id)
)
SELECT entity_type,count(*) entities,sum(staged_slots) research_slots,
       sum(20-staged_slots) absent_slots,
       sum(approved_staging_slots) approved_staging_slots
FROM entities GROUP BY entity_type ORDER BY entity_type;

-- Manufacturer-wide catalogue progress; count distinct model IDs rather than
-- joined staging rows. Existing HTML guides are not automatically migrated.
SELECT c.manufacturer,
 count(DISTINCT c.id) AS catalogue_models,
 count(DISTINCT s.model_id) AS models_with_staged_sections,
 count(s.id) AS staged_sections,
 count(s.id) FILTER (
  WHERE s.content->'engineering'->>'verification_status'='pending_editorial_review'
 ) AS pending_engineering_sections
FROM public.motorcycle_catalog_models c
LEFT JOIN public.motorcycle_universal_page_sections_v1 s
 ON s.entity_type='model' AND s.model_id=c.id
GROUP BY c.manufacturer
ORDER BY catalogue_models DESC,c.manufacturer;
