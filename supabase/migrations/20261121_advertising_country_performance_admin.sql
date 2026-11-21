-- Admin-only country breakdown of verified ad traffic in the last 30 days.
-- Older rows with no verified country remain visible as "Unverified (legacy)".
create or replace view public.admin_advertising_country_performance_v1
with (security_invoker=true)
as
select e.campaign_id,c.name as campaign_name,
  coalesce(e.country_code,'--') as country_code,
  count(*) filter (where e.event_type='impression')::bigint as impressions,
  count(*) filter (where e.event_type='click')::bigint as clicks,
  count(*) filter (where e.event_type='conversion')::bigint as conversions,
  round(100.0*count(*) filter (where e.event_type='click')/
    nullif(count(*) filter (where e.event_type='impression'),0),2) as ctr_pct
from public.advertising_events e
join public.advertising_campaigns c on c.id=e.campaign_id
where e.occurred_at>=now()-interval '30 days'
  and (select public.anybike_is_admin())
group by e.campaign_id,c.name,coalesce(e.country_code,'--');
revoke all on public.admin_advertising_country_performance_v1 from public,anon;
grant select on public.admin_advertising_country_performance_v1 to authenticated;