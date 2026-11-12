# Honda CB750 Hornet and XL750 Transalp — factory research batch

Date: 12 November 2026. Supabase exact model IDs: CB750 Hornet **805**; XL750 TRANSALP **184**.

Six new verified `motorcycle_catalog_facts` entries were inserted and individually recorded in `motorcycle_catalog_fact_verification_audit` using the original manufacturer URL, model-year scope, and verification basis. The additions are data only, not blanket editorial approval or photo licensing.

| Canonical model | Fact label | Model year | Primary manufacturer source |
|---|---|---|---|
| Honda CB750 Hornet (805) | CB750 Hornet 2023 Honda design award and concept | 2023 | https://global.honda/en/topics/2023/c_2023-04-03eng.html |
| Honda CB750 Hornet (805) | CB750 Hornet 2023 position in Honda CB chronology | 2023 | https://global.honda/en/CB/models/ |
| Honda CB750 Hornet (805) | CB750 Hornet 2025 factory revised instrument panel | 2025 | https://global.honda/en/newsroom/news/2024/c241105beng.html |
| Honda XL750 TRANSALP (184) | XL750 Transalp 2023 factory adventure design recognition | 2023 | https://global.honda/en/topics/2023/c_2023-04-03eng.html |
| Honda XL750 TRANSALP (184) | XL750 Transalp 2023 270-degree crank and throttle control | 2023 | https://global.honda/en/newsroom/news/2022/c221108eng.html |
| Honda XL750 TRANSALP (184) | XL750 Transalp 2025 twin-projector front lighting | 2025 | https://global.honda/en/newsroom/news/2024/c241105beng.html |

## Verification SQL

```sql
select m.manufacturer,m.model,count(*) as verified_facts,
       count(distinct f.category) as research_categories
from public.motorcycle_catalog_facts f
join public.motorcycle_catalog_models m on m.id=f.catalog_model_id
where f.catalog_model_id in (805,184) and f.verification_status='verified'
group by m.manufacturer,m.model order by m.model;

select f.catalog_model_id,f.label
from public.motorcycle_catalog_facts f
where f.catalog_model_id in (805,184)
  and f.verification_status='verified'
  and not exists (
    select 1 from public.motorcycle_catalog_fact_verification_audit a
    where a.fact_id=f.id and a.source_url=f.source_url
  );
-- Second query should return no rows.
```

No universal draft sections, stock permissions, BMW/Harley layouts or photo rights were modified.
