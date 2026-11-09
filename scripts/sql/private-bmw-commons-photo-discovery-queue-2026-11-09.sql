-- AnyBike BMW factory-model Commons image discovery queue.
-- Candidate file URLs and licence metadata do not confer permission to
-- reuse on the live site. Neither model-year nor visual identity is approved.
-- Sources: individual Wikimedia Commons file pages with creator/licence data.
CREATE TABLE IF NOT EXISTS anybike_publishing.model_photo_discovery_queue_v1 (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 model_id bigint NOT NULL REFERENCES public.motorcycle_catalog_models(id),
 commons_file_page text NOT NULL CHECK (
  commons_file_page ~ '^https://commons[.]wikimedia[.]org/wiki/File[:][A-Za-z0-9_().,%+-]+$'),
 photographer text NOT NULL,
 licence_name text NOT NULL,
 licence_url text NOT NULL CHECK (licence_url ~ '^https://creativecommons[.]org/licenses/'),
 photo_observed_on date,
 image_subject text NOT NULL,
 model_year_verified boolean NOT NULL DEFAULT false,
 exact_model_review_status text NOT NULL DEFAULT 'candidate_needs_visual_review'
  CHECK (exact_model_review_status IN ('candidate_needs_visual_review','confirmed','rejected')),
 rights_review_status text NOT NULL DEFAULT 'licence_terms_need_review'
  CHECK (rights_review_status IN ('licence_terms_need_review','cleared','rejected')),
 publication_enabled boolean NOT NULL DEFAULT false CHECK(publication_enabled=false),
 captured_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(model_id,commons_file_page)
);
REVOKE ALL ON anybike_publishing.model_photo_discovery_queue_v1 FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS model_photo_discovery_model_idx
 ON anybike_publishing.model_photo_discovery_queue_v1(model_id);
WITH examples(make,model,file_title,photographer,licence_url,observed,subject) AS (
 VALUES
 ('BMW','F 900 GS','BMW_F900_GS_2024-06-v2.jpg','Wikisympathisant','https://creativecommons.org/licenses/by-sa/4.0/','2024-06-07'::date,'F 900 GS displayed at BMW Motorrad Welt'),
 ('BMW','F 900 GS','BMW_F900_GS_left_2024-06.jpg','Wikisympathisant','https://creativecommons.org/licenses/by-sa/4.0/','2024-06-07'::date,'F 900 GS, left side at BMW Motorrad Welt'),
 ('BMW','R 1250 GS','BMW_R_1250_GS_(1).jpg','Cjp24','https://creativecommons.org/licenses/by-sa/4.0/','2022-03-27'::date,'R 1250 GS photographed in France'),
 ('BMW','R 1250 GS','BMW_R1250_GS_Motorbike.jpg','TaurusEmerald','https://creativecommons.org/licenses/by-sa/4.0/','2025-04-07'::date,'R 1250 GS motorcycle'),
 ('BMW','S 1000 RR','2024-06_BMW_M_Motorrad_S1000RR.jpg','Wikisympathisant','https://creativecommons.org/licenses/by-sa/4.0/','2024-06-07'::date,'S 1000 RR at BMW Motorrad Welt'),
 ('BMW','S 1000 RR','BMW_S1000_RR_2025.jpg','AVMOTO','https://creativecommons.org/licenses/by-sa/4.0/','2024-11-10'::date,'S 1000 RR at EICMA 2024'),
 ('BMW','G 310 GS','BMW_G310_GS_front_2023-04.jpg','Wikisympathisant','https://creativecommons.org/licenses/by-sa/4.0/','2023-04-08'::date,'G 310 GS front view'),
 ('BMW','R 1200 GS','BMW_R_1200_GS.jpg','maudig','https://creativecommons.org/licenses/by-sa/3.0/','2007-08-17'::date,'R 1200 GS photographed in France')
)
INSERT INTO anybike_publishing.model_photo_discovery_queue_v1
 (model_id,commons_file_page,photographer,licence_name,licence_url,photo_observed_on,image_subject)
SELECT m.id,'https://commons.wikimedia.org/wiki/File:'||e.file_title,
 e.photographer,CASE WHEN e.licence_url LIKE '%/4.0/%' THEN 'CC BY-SA 4.0' ELSE 'CC BY-SA 3.0' END,
 e.licence_url,e.observed,e.subject
FROM examples e JOIN public.motorcycle_catalog_models m
 ON m.manufacturer=e.make AND m.model=e.model
ON CONFLICT(model_id,commons_file_page) DO NOTHING;
