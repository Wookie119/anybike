-- Read-only regression suite. Synthetic inputs; no seller, listing or campaign writes.
WITH a AS (
 SELECT '{"service_history":"Unknown","mot":"Unknown","keys":"Unknown","v5c":"Unknown","accident":"Unknown","tyres":"Unknown","brakes":"Unknown","drive":"Unknown","mechanical":"Unknown"}'::jsonb AS v
), cases AS (
 SELECT 'complete unknown answers' AS test, jsonb_build_object('condition_answers',v) AS input,true AS expected FROM a
 UNION ALL SELECT 'missing '||k,jsonb_build_object('condition_answers',v-k),false FROM a CROSS JOIN LATERAL jsonb_object_keys(v) k
 UNION ALL SELECT 'invalid '||k,jsonb_build_object('condition_answers',jsonb_set(v,ARRAY[k],'"INVALID"'::jsonb)),false FROM a CROSS JOIN LATERAL jsonb_object_keys(v) k
 UNION ALL SELECT 'empty object','{"condition_answers":{}}'::jsonb,false
 UNION ALL SELECT 'null input',NULL::jsonb,false
)
SELECT test,(public.anybike_listing_refresh_condition_answers_v1(input) IS NOT NULL)=expected AS passed FROM cases ORDER BY test;
