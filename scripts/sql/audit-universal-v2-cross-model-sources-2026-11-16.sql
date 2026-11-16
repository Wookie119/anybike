-- AnyBike universal V2: cross-model evidence reuse audit.
-- READ ONLY. A multi-model announcement can be legitimate. Flag it for
-- exact make/model/year/source review instead of assuming approval.
with shared_sources as (
 select q.source_url,count(distinct q.model_id) as distinct_model_ids,
  count(*) as draft_sections
 from public.anybike_model_editorial_review_queue_v1 q
 where nullif(btrim(q.source_url),'') is not null
 group by q.source_url having count(distinct q.model_id)>=3
)
select s.source_url,s.distinct_model_ids,s.draft_sections,
 string_agg(distinct m.manufacturer||' '||m.model,' | ' order by m.manufacturer||' '||m.model) as affected_models
from shared_sources s
join public.anybike_model_editorial_review_queue_v1 q on q.source_url=s.source_url
join public.motorcycle_catalog_models m on m.id=q.model_id
group by s.source_url,s.distinct_model_ids,s.draft_sections
order by s.distinct_model_ids desc,s.draft_sections desc,s.source_url;

-- Detect verified fact categories that cannot reach a published slot.
select id,catalog_model_id,category,label
from public.anybike_model_research_unrenderable_verified_v1
order by catalog_model_id,category,id
limit 250;
