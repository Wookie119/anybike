-- AnyBike: original BMW S 1000 RR factory technical reference.
-- Production database applied 9 November 2026; this statement is idempotent
-- and does NOT overwrite later researched generations or existing specifications.
-- Primary source: BMW Group PressClub UK, press kit 9 May 2009:
-- https://www.press.bmwgroup.com/united-kingdom/article/detail/T0018555EN_GB/the-new-bmw-s-1000-rr?language=en_GB
-- Source establishes 999 cc, 142 kW (193 hp), 112 Nm for ORIGINAL 2009 generation only.
UPDATE public.motorcycle_model_v2_editorial
SET editorial=jsonb_set(editorial,'{production,specifications}',
 jsonb_build_array(jsonb_build_object(
  'model_year','2009 launch specification',
  'market','UK launch press kit',
  'variant','Original S 1000 RR',
  'engine_cc',999,
  'power_hp',193,
  'torque_nm',112,
  'source','https://www.press.bmwgroup.com/united-kingdom/article/detail/T0018555EN_GB/the-new-bmw-s-1000-rr?language=en_GB'
  )),true)
WHERE slug='bmw-s-1000-rr'
 AND model_id=90
 AND editorial->>'make'='BMW'
 AND editorial->>'model'='S 1000 RR'
 AND jsonb_array_length(CASE
  WHEN jsonb_typeof(editorial#>'{production,specifications}')='array'
  THEN editorial#>'{production,specifications}'
  ELSE '[]'::jsonb END)=0;

-- Verify the exact public projection without touching other BMW models:
SELECT
 public.public_bmw_model_history_v1('/bmw-s1000rr.html')->>'model' AS model,
 public.public_bmw_model_history_v1('/bmw-s1000rr.html')->'technical_specifications' AS specifications,
 public.public_bmw_model_history_v1('/bmw-s1000r.html')->>'model' AS separate_model;
