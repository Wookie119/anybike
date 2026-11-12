-- Read-only catalogue generation coverage audit.
-- Safe to run repeatedly: never deletes, merges, renames or approves models.
-- Model name alone is NOT a generation key. Unknown end year does not mean ongoing production.

select count(*) as source_models,
       count(*) filter (where g.catalog_model_id is not null) as models_with_generation_history,
       count(*) filter (where g.catalog_model_id is null) as models_without_generation_history
from public.motorcycle_catalog_models m
left join (select distinct catalog_model_id from public.motorcycle_catalog_generations) g
 on g.catalog_model_id=m.id;

select m.manufacturer,
       count(*) as source_models,
       count(*) filter (where g.catalog_model_id is not null) as models_with_generation_history,
       count(*) filter (where g.catalog_model_id is null) as research_backlog
from public.motorcycle_catalog_models m
left join (select distinct catalog_model_id from public.motorcycle_catalog_generations) g
 on g.catalog_model_id=m.id
group by m.manufacturer
order by research_backlog desc,m.manufacturer;

select m.id,m.manufacturer,m.model,m.production_start_year,m.production_end_year
from public.motorcycle_catalog_models m
where not exists (
 select 1 from public.motorcycle_catalog_generations g where g.catalog_model_id=m.id
)
order by case when m.manufacturer='BMW' then 0 else 1 end,
 m.manufacturer,m.model
limit 100;

select m.manufacturer,m.model,g.id as generation_id,g.generation_name,
       g.start_year,g.end_year,g.verification_status,g.source_name,g.source_url
from public.motorcycle_catalog_generations g
join public.motorcycle_catalog_models m on m.id=g.catalog_model_id
where g.verification_status='pending_review'
order by m.manufacturer,m.model,g.start_year nulls last,g.id;
