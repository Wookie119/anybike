-- Exact factory engine source verification for six BMW models.
-- Read original BMW PressClub HTML 10 November 2026. F 850 GS Adventure
-- is NOT included: its separate PDF/attachment needs independent checking.
-- Inserts independent audit evidence only. No editorial publication, facts
-- rewrite, identity merge, stock entitlement or live HTML changes.
DO $$
DECLARE eligible integer; inserted integer;
BEGIN
 WITH candidates(fact_id,model_id,source_url,scope_note) AS (VALUES
 (188,28,'https://www.press.bmwgroup.com/global/article/detail/T0279024EN/the-new-bmw-f-750-gs-and-f-850-gs?language=en','BMW F 750 GS original 2018 press kit: 853 cc, 57 kW/77 hp, 83 Nm at 6000 rpm'),
 (189,33,'https://www.press.bmwgroup.com/global/article/detail/T0279024EN/the-new-bmw-f-750-gs-and-f-850-gs?language=en','BMW F 850 GS original 2018 press kit: 853 cc, 70 kW/95 hp, 92 Nm at 6250 rpm'),
 (191,43,'https://www.press.bmwgroup.com/global/article/detail/T0265624EN/the-new-bmw-g-310-gs?language=en','BMW G 310 GS 2016 press kit: 313 cc, 25 kW/34 hp at 9500 rpm, 28 Nm at 7500 rpm'),
 (192,44,'https://www.press.bmwgroup.com/usa/article/detail/T0243964EN_US/the-new-bmw-g-310-r','BMW G 310 R 2015 press release: 313 cc, 34 hp at 9500 rpm, 28 Nm at 7500 rpm'),
 (193,54,'https://www.press.bmwgroup.com/global/article/detail/T0404210EN/the-new-bmw-m-1000-r?language=en','BMW M 1000 R 2022 press kit: 154 kW/210 hp at 13750 rpm and 113 Nm at 11000 rpm'),
 (194,69,'https://www.press.bmwgroup.com/india/article/detail/T0291519EN/press-kit-the-all-new-bmw-r-1250-gs-adventure','BMW R 1250 GS Adventure 2019 press kit: 1254 cc, 100 kW/136 hp at 7750 rpm and 143 Nm at 6250 rpm')
 )
 SELECT count(*) INTO eligible
 FROM candidates i JOIN public.motorcycle_catalog_facts f
 ON f.id=i.fact_id AND f.catalog_model_id=i.model_id
  AND f.verification_status='verified' AND f.source_url=i.source_url
 WHERE NOT EXISTS(SELECT 1 FROM public.motorcycle_catalog_fact_verification_audit a
  WHERE a.fact_id=i.fact_id);
 IF eligible<>6 THEN RAISE EXCEPTION 'BMW audit cancelled: expected six, got %',eligible; END IF;
 INSERT INTO public.motorcycle_catalog_fact_verification_audit
 (fact_id,checked_at,verification_basis,source_url,scope_note,source_version)
 SELECT i.fact_id,now(),
 'BMW_pressclub_original_press_release_engine_specs_checked',
 i.source_url,i.scope_note,'BMW PressClub primary source checked 2026-11-10'
 FROM (VALUES
 (188,28,'https://www.press.bmwgroup.com/global/article/detail/T0279024EN/the-new-bmw-f-750-gs-and-f-850-gs?language=en','BMW F 750 GS original 2018 press kit: 853 cc, 57 kW/77 hp, 83 Nm at 6000 rpm'),
 (189,33,'https://www.press.bmwgroup.com/global/article/detail/T0279024EN/the-new-bmw-f-750-gs-and-f-850-gs?language=en','BMW F 850 GS original 2018 press kit: 853 cc, 70 kW/95 hp, 92 Nm at 6250 rpm'),
 (191,43,'https://www.press.bmwgroup.com/global/article/detail/T0265624EN/the-new-bmw-g-310-gs?language=en','BMW G 310 GS 2016 press kit: 313 cc, 25 kW/34 hp at 9500 rpm, 28 Nm at 7500 rpm'),
 (192,44,'https://www.press.bmwgroup.com/usa/article/detail/T0243964EN_US/the-new-bmw-g-310-r','BMW G 310 R 2015 press release: 313 cc, 34 hp at 9500 rpm, 28 Nm at 7500 rpm'),
 (193,54,'https://www.press.bmwgroup.com/global/article/detail/T0404210EN/the-new-bmw-m-1000-r?language=en','BMW M 1000 R 2022 press kit: 154 kW/210 hp at 13750 rpm and 113 Nm at 11000 rpm'),
 (194,69,'https://www.press.bmwgroup.com/india/article/detail/T0291519EN/press-kit-the-all-new-bmw-r-1250-gs-adventure','BMW R 1250 GS Adventure 2019 press kit: 1254 cc, 100 kW/136 hp at 7750 rpm and 143 Nm at 6250 rpm')
 ) i(fact_id,model_id,source_url,scope_note);
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted<>6 THEN RAISE EXCEPTION 'BMW audit rollback: inserted %',inserted; END IF;
END $$;
