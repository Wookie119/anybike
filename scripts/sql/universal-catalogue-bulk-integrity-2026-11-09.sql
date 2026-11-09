-- AnyBike one-framework bulk migration integrity (READ ONLY).
-- Must be run after editorial imports; no source rows or permission settings changed.

-- Overall 20-section store status.
select entity_type,editorial_status,count(*) sections,
 count(distinct coalesce(manufacturer_id,model_id)) entities
from public.motorcycle_universal_page_sections_v1
group by entity_type,editorial_status order by entity_type,editorial_status;

-- Model IDs and section keys must match the model from the original source.
select count(*) bad_provenance
from public.motorcycle_universal_page_sections_v1 u
where u.entity_type='model'
 and u.source_reference like 'motorcycle_model_v2_editorial:%'
 and u.source_reference not like 'motorcycle_model_v2_editorial:model_id='||u.model_id::text||'%';

-- Check every imported verified fact against its source model and status.
select count(*) bad_fact_scopes
from public.motorcycle_universal_page_sections_v1 u
cross join lateral jsonb_array_elements(coalesce(u.content->'verified_catalogue_facts','[]'::jsonb)) fact
left join public.motorcycle_catalog_facts f on f.id=(fact->>'fact_id')::bigint
where f.id is null or f.catalog_model_id is distinct from u.model_id
 or f.verification_status is distinct from 'verified';

-- Approved manufacturer source-block lineage; no HTML rendering implied.
select count(*) bad_manufacturer_sources
from public.motorcycle_universal_page_sections_v1 u
cross join lateral jsonb_array_elements(coalesce(u.content->'source_blocks','[]'::jsonb)) source
left join public.motorcycle_manufacturer_source_blocks_v1 b
 on b.id=(source->>'source_block_id')::bigint
where b.id is null or b.manufacturer_id is distinct from u.manufacturer_id
 or not(u.section_number=any(b.universal_sections));

-- New-section publication MUST stay at zero until public projection, source,
-- image rights, exact stock matching, design comparison and access QA succeed.
select count(*) published_sections from public.motorcycle_universal_page_sections_v1
where editorial_status='published';

-- Unresolved crosswalks require named reviews; do not silently merge models.
select m.manufacturer,count(*) unresolved_models
from public.motorcycle_catalog_models m
left join public.motorcycle_catalog_model_parent_identity_v1 p on p.catalog_model_id=m.id
where p.catalog_model_id is null
group by m.manufacturer order by m.manufacturer;

-- Private mapping tables must NOT be queryable by browser API roles.
select table_name,
 has_table_privilege('anon','public.'||table_name,'select') anon_select,
 has_table_privilege('authenticated','public.'||table_name,'select') authenticated_select
from (values
 ('motorcycle_universal_page_sections_v1'),
 ('motorcycle_catalog_model_parent_identity_v1'),
 ('motorcycle_stock_catalogue_identity_v1')
) v(table_name);
