-- Harley-Davidson model research INTAKE: 18 exactly mapped guide introductions.
-- PRIVATE draft-only, source-verification pending; not verified factory research.
-- Source page HTML and canonical model IDs were checked before generating.
-- Prevent duplicate inserts; fail entire transaction if registry, source or counts drift.
DO $$
DECLARE eligible integer; wrote integer;
BEGIN
 WITH input(id,name,slug,summary,source_sha) AS (VALUES
 (143,'Road Glide','road-glide','Frame-mounted sharknose-style fairing; touring equipment and engine specifications changed across generations.','d9ed17e761080d2076bdd138581f4083cdbd9b6e'),
 (157,'Street Glide','street-glide','Batwing-style fairing and long-distance touring character; do not assume current Milwaukee-Eight figures apply to older examples.','dc7e9d67bfe9091902029cf76a1ce0c12d6ea404'),
 (144,'Road King','road-king','Traditional Harley-Davidson touring style, usually without a large fixed front fairing.','77aed96085c7c7d997c129c9af55f1c7e5076ec6'),
 (125,'Electra Glide','electra-glide','Historic Harley-Davidson touring family with changing equipment over decades.','624a5db19e24c595995818393b55977a0383e7a6'),
 (437,'Ultra Limited','ultra-limited','Passenger-oriented touring motorcycle with large luggage and weather protection.','ca56fc47f658da253d31a3ddd4b75e7a25a74d20'),
 (127,'Fat Boy','fat-boy','Distinctive solid-look wheel design; introduced in 1990 and substantially revised with later Softail generations.','32ac86f007fcc480dce46d0dc4cadab72effe930'),
 (115,'Breakout','breakout','Custom-inspired low cruiser with long wheelbase styling and wide rear tyre.','0c6c42e43d47bc27c71bb262d70aafb317de0c34'),
 (430,'Low Rider S','low-rider-s','Performance-influenced cruiser with a model history spanning changing platforms.','e1c6b25a40d7203ed7c0a6859414fc60b1d4c363'),
 (149,'Softail Standard','softail-standard','Stripped-back cruiser with classic styling and year-specific Softail engineering.','3cc1f1dbc0c0fbcc23c911c8a8dd72d495c52111'),
 (429,'Iron 883','iron-883','Traditional air-cooled Evolution Sportster model, distinct from modern Revolution Max-powered models.','aa64aa70ce648374ac9afcc926327dfcb2a757fa'),
 (153,'Sportster S','sportster-s','Liquid-cooled Revolution Max-powered Sportster introduced in 2021.','667f5f40082a442f89ecee03478ae6155437f40c'),
 (431,'Pan America 1250','pan-america-1250','Adventure-touring motorcycle with a liquid-cooled 1,252 cc Revolution Max engine.','bc3f7a27dac481465285723af601347275c9e825'),
 (868,'Heritage Classic','heritage-classic','Traditional Softail styling with touring-oriented equipment and luggage options.','3e935cd321067a2c97b0a4ea630f3421f69c6fd3'),
 (156,'Street Bob','street-bob','Factory-custom style cruiser; later models belong to the redesigned Softail family.','15e10be1ccb141452586fbb75901dd4d5802c3cd'),
 (140,'Nightster','nightster','Liquid-cooled Revolution Max-powered Sport-family model, distinct from the traditional XL Sportsters.','9ebe6021fc56c0b0fd7bb32a797f3c8000c10b92'),
 (856,'V-Rod','v-rod','The V-Rod changed Harley-Davidson''s engineering direction with the liquid-cooled Revolution V-twin, a hydroformed frame and drag-bike-inspired styling.','8fd20f1401cba7aff882d1193b898696d43689f7'),
 (142,'Pan America 1250 ST','pan-america-1250-st','The road-focused member of the Pan America family, launched for model year 2025 with 17-inch road wheels, lower suspension, Michelin Scorcher Sport tyres and the liquid-cooled Revolution Max 1250 engine.','e76fd00f3baba026fad98c433e84f9a664b3cf74'),
 (119,'CVO Pan America','cvo-pan-america','The premium, factory-equipped adventure-touring Pan America from Harley-Davidson Custom Vehicle Operations (CVO). The 2025 CVO Pan America is distinct from the Pan America 1250 Special and the road-focused Pan America 1250 ST. This 2025 CVO edition is one chapter in the Pan America model family''s development; specifications and equipment depend on the exact model year.','a8c48746fd97741ff06b726e2cc9d1d76b4fabb8')
 )
 SELECT count(*) INTO eligible FROM input i
 JOIN public.motorcycle_catalog_models m ON m.id=i.id
 WHERE m.manufacturer='Harley-Davidson'
   AND lower(regexp_replace(m.model,'[^a-z0-9]','','gi')) =
       lower(regexp_replace(i.name,'[^a-z0-9]','','gi'))
   AND length(trim(i.summary))>=35
   AND NOT EXISTS (
     SELECT 1 FROM public.motorcycle_universal_page_sections_v1 s
     WHERE s.entity_type='model' AND s.model_id=i.id
   );
 IF eligible<>18 THEN
  RAISE EXCEPTION 'Harley draft import cancelled; exact-match candidates % of 18',eligible;
 END IF;
 INSERT INTO public.motorcycle_universal_page_sections_v1
   (entity_type,manufacturer_id,model_id,section_number,section_title,
    content,editorial_status,source_reference,published_at)
 SELECT 'model',NULL,i.id,1,'Model introduction',
   jsonb_build_object(
     'summary',i.summary,
     'source_verification_status','pending_review',
     'editorial_status','draft',
     'source_origin','harley-davidson-'||i.slug||'.html',
     'source_revision',i.source_sha,
     'editorial_note','Existing AnyBike guide introductory copy; requires factual verification before publication'
   ),'draft','harley-davidson-'||i.slug||'.html@'||i.source_sha,NULL
 FROM (VALUES
 (143,'Road Glide','road-glide','Frame-mounted sharknose-style fairing; touring equipment and engine specifications changed across generations.','d9ed17e761080d2076bdd138581f4083cdbd9b6e'),
 (157,'Street Glide','street-glide','Batwing-style fairing and long-distance touring character; do not assume current Milwaukee-Eight figures apply to older examples.','dc7e9d67bfe9091902029cf76a1ce0c12d6ea404'),
 (144,'Road King','road-king','Traditional Harley-Davidson touring style, usually without a large fixed front fairing.','77aed96085c7c7d997c129c9af55f1c7e5076ec6'),
 (125,'Electra Glide','electra-glide','Historic Harley-Davidson touring family with changing equipment over decades.','624a5db19e24c595995818393b55977a0383e7a6'),
 (437,'Ultra Limited','ultra-limited','Passenger-oriented touring motorcycle with large luggage and weather protection.','ca56fc47f658da253d31a3ddd4b75e7a25a74d20'),
 (127,'Fat Boy','fat-boy','Distinctive solid-look wheel design; introduced in 1990 and substantially revised with later Softail generations.','32ac86f007fcc480dce46d0dc4cadab72effe930'),
 (115,'Breakout','breakout','Custom-inspired low cruiser with long wheelbase styling and wide rear tyre.','0c6c42e43d47bc27c71bb262d70aafb317de0c34'),
 (430,'Low Rider S','low-rider-s','Performance-influenced cruiser with a model history spanning changing platforms.','e1c6b25a40d7203ed7c0a6859414fc60b1d4c363'),
 (149,'Softail Standard','softail-standard','Stripped-back cruiser with classic styling and year-specific Softail engineering.','3cc1f1dbc0c0fbcc23c911c8a8dd72d495c52111'),
 (429,'Iron 883','iron-883','Traditional air-cooled Evolution Sportster model, distinct from modern Revolution Max-powered models.','aa64aa70ce648374ac9afcc926327dfcb2a757fa'),
 (153,'Sportster S','sportster-s','Liquid-cooled Revolution Max-powered Sportster introduced in 2021.','667f5f40082a442f89ecee03478ae6155437f40c'),
 (431,'Pan America 1250','pan-america-1250','Adventure-touring motorcycle with a liquid-cooled 1,252 cc Revolution Max engine.','bc3f7a27dac481465285723af601347275c9e825'),
 (868,'Heritage Classic','heritage-classic','Traditional Softail styling with touring-oriented equipment and luggage options.','3e935cd321067a2c97b0a4ea630f3421f69c6fd3'),
 (156,'Street Bob','street-bob','Factory-custom style cruiser; later models belong to the redesigned Softail family.','15e10be1ccb141452586fbb75901dd4d5802c3cd'),
 (140,'Nightster','nightster','Liquid-cooled Revolution Max-powered Sport-family model, distinct from the traditional XL Sportsters.','9ebe6021fc56c0b0fd7bb32a797f3c8000c10b92'),
 (856,'V-Rod','v-rod','The V-Rod changed Harley-Davidson''s engineering direction with the liquid-cooled Revolution V-twin, a hydroformed frame and drag-bike-inspired styling.','8fd20f1401cba7aff882d1193b898696d43689f7'),
 (142,'Pan America 1250 ST','pan-america-1250-st','The road-focused member of the Pan America family, launched for model year 2025 with 17-inch road wheels, lower suspension, Michelin Scorcher Sport tyres and the liquid-cooled Revolution Max 1250 engine.','e76fd00f3baba026fad98c433e84f9a664b3cf74'),
 (119,'CVO Pan America','cvo-pan-america','The premium, factory-equipped adventure-touring Pan America from Harley-Davidson Custom Vehicle Operations (CVO). The 2025 CVO Pan America is distinct from the Pan America 1250 Special and the road-focused Pan America 1250 ST. This 2025 CVO edition is one chapter in the Pan America model family''s development; specifications and equipment depend on the exact model year.','a8c48746fd97741ff06b726e2cc9d1d76b4fabb8')
 ) AS i(id,name,slug,summary,source_sha);
 GET DIAGNOSTICS wrote=ROW_COUNT;
 IF wrote<>18 THEN RAISE EXCEPTION 'Harley draft intake rolled back; inserted %',wrote; END IF;
END $$;
