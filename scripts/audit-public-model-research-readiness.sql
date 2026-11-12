-- AnyBike verified research publication readiness (read-only).
-- Does not approve facts, expose unreviewed names, or modify the website.
-- Category labels are database research subdivisions, NOT additional page templates.

-- Overall coverage: facts and approved image metadata are not proof of browser rendering.
SELECT count(*) AS public_models,
       count(*) FILTER (WHERE verified_research_facts > 0) AS researched_models,
       sum(verified_research_facts) AS verified_public_facts,
       count(*) FILTER (WHERE approved_hero_photos > 0) AS models_with_approved_hero_metadata,
       count(*) FILTER (WHERE approved_gallery_photos > 0) AS models_with_approved_gallery_metadata
FROM public.anybike_public_model_research_coverage_v1;

-- Research gaps: prioritise catalogue models with no verified facts and no approved hero.
SELECT make, model, verified_research_facts,
       approved_hero_photos, approved_gallery_photos
FROM public.anybike_public_model_research_coverage_v1
WHERE verified_research_facts = 0 OR approved_hero_photos = 0
ORDER BY make, model;


-- Separate missing research from photography approval, so one does not block the other.
SELECT make,
       count(*) AS public_models,
       count(*) FILTER (WHERE verified_research_facts = 0) AS models_without_verified_research,
       count(*) FILTER (WHERE verified_research_facts > 0 AND approved_hero_photos = 0) AS researched_models_without_approved_hero,
       count(*) FILTER (WHERE verified_research_facts > 0 AND approved_hero_photos > 0) AS researched_models_with_approved_hero
FROM public.anybike_public_model_research_coverage_v1
GROUP BY make
ORDER BY models_without_verified_research DESC, make;

-- A database category with zero published facts is still a supported renderer destination,
-- but editors should see it in the source-research queue rather than inventing content.
SELECT s.section_order, s.category, s.display_label,
       count(f.id) AS verified_facts
FROM public.anybike_model_research_section_registry s
LEFT JOIN public.motorcycle_catalog_facts f
  ON f.category = s.category AND f.verification_status = 'verified'
GROUP BY s.section_order, s.category, s.display_label
ORDER BY s.section_order;

-- Verify every public model with research receives the same count from the public RPC.
-- The RPC returns a JSON array, not a SQL set of rows.
WITH counts AS (
  SELECT make, model, verified_research_facts,
         jsonb_array_length(public.public_anybike_verified_model_facts_v1(make, model)) AS rpc_facts
  FROM public.anybike_public_model_research_coverage_v1
  WHERE verified_research_facts > 0
)
SELECT count(*) AS researched_models_tested,
       count(*) FILTER (WHERE rpc_facts = verified_research_facts) AS matching_models,
       count(*) FILTER (WHERE rpc_facts <> verified_research_facts) AS mismatched_models,
       sum(verified_research_facts) AS coverage_facts,
       sum(rpc_facts) AS rpc_facts
FROM counts;

-- If nonempty, investigate identity mapping and audit records before publishing.
SELECT make, model, verified_research_facts,
       jsonb_array_length(public.public_anybike_verified_model_facts_v1(make, model)) AS rpc_facts
FROM public.anybike_public_model_research_coverage_v1
WHERE verified_research_facts > 0
  AND verified_research_facts <>
      jsonb_array_length(public.public_anybike_verified_model_facts_v1(make, model))
ORDER BY make, model;

-- Representative cross-manufacturer publication probes. These call the same
-- exact-model public endpoints used by the browser and make missing audited
-- content or licensed galleries visible without fabricating fallback records.
-- A zero means "not yet approved/published", NOT "no such motorcycle exists".
WITH probes(make, model) AS (
 VALUES
 ('BMW','R 1300 GS'),('BMW','R 1250 GS'),('BMW','F 900 GS'),
 ('BMW','S 1000 RR'),('Suzuki','RM250'),('Yamaha','YZ250'),
 ('Honda','Africa Twin'),('Ducati','Panigale V4'),
 ('Harley-Davidson','Fat Boy'),('Kawasaki','Ninja ZX-10R')
)
SELECT make,model,
       jsonb_array_length(public.public_anybike_verified_model_facts_v1(make,model))
         AS audited_public_facts,
       jsonb_array_length(public.public_anybike_verified_model_gallery_v1(make,model))
         AS approved_gallery_photos
FROM probes
ORDER BY make,model;

-- Find the highest-priority researched models awaiting usable photography.
-- Hero metadata and gallery metadata are tracked separately: an approved
-- hero is not evidence that a gallery can display a cleaned, licensed image.
SELECT make,model,verified_research_facts,approved_hero_photos,approved_gallery_photos
FROM public.anybike_public_model_research_coverage_v1
WHERE verified_research_facts>0
  AND approved_gallery_photos=0
ORDER BY verified_research_facts DESC,make,model;
