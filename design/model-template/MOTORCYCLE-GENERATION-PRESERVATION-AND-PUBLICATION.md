# Motorcycle generations: preservation and publication contract

Updated 12 November 2026. The database **already contains** `public.motorcycle_catalog_generations`; do not create a competing generations table.

## Verified database inventory

- 979 source catalogue model records, 965 currently approved clean public identities.
- 92 existing generation records across 71 source models.
- All 92 generation rows currently have `verification_status = 'pending_review'`. All have a source URL and a start year; **none is approved for public factual rendering**.
- 74 of the 92 have no end year. **NULL end year means unknown, not still in production.**
- No invalid start/end ordering found in existing rows.
- The main catalogue has only 67 known start years, 9 known end years, and one introduction date. Generation history is a separate richer source and must not be collapsed into those single fields.

## Existing database columns

`motorcycle_catalog_generations(id, catalog_model_id, generation_name, start_year, end_year, engine_description, engine_cc, notes, source_name, source_url, verification_status, created_at)`.

Keep `catalog_model_id` as the stable source model relationship. Do not use `make + model` as a unique historical generation key.

## Non-destructive publication pipeline

1. Collect dated primary factory evidence for the exact generation, including model-year versus announcement-year distinction.
2. Preserve all previous generation rows. Insert a separate generation record for a genuinely reintroduced model or materially different platform, with distinct source and time period.
3. Use `pending_review` for research. Do not publish technical claims from pending rows, even when a source URL is present.
4. Verify the exact production start/end years, factory codes, markets, engine and model family; promote individual generation rows only after source review.
5. Public model pages must render **verified generations only**, grouped under the same approved R 1300 GS template. Distinguish historical and modern name reuse; show unknown dates as unknown.
6. Do not delete alias, retired or uncertain source rows. Keep dealer feed names and original identifiers.
7. SEO canonical model pages must not be used as proof that all generations share specifications.

## Repeatable read-only SQL checks

```sql
select verification_status, count(*) as records,
       count(distinct catalog_model_id) as models,
       count(*) filter (where source_url is not null) as sourced,
       count(*) filter (where end_year is null) as end_unknown
from public.motorcycle_catalog_generations
group by verification_status order by verification_status;

select m.manufacturer,m.model,g.generation_name,g.start_year,g.end_year,
       g.verification_status,g.source_url
from public.motorcycle_catalog_generations g
join public.motorcycle_catalog_models m on m.id=g.catalog_model_id
where m.manufacturer='BMW' and m.model in ('R 12','R 12 S','R 1200 GS','R 1300 GS')
order by m.model,g.start_year nulls last,g.id;
```

**Do not bulk-approve** the 92 pending records or infer end dates from successor introductions. They require per-generation source checks.
