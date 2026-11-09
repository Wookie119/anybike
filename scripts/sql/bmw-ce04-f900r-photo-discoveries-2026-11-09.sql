-- More Commons file-page candidates for exact BMW model review.
-- These are private discoveries, not verified model-year photos or approved image assets.
WITH examples(make,model,file_title,photographer,licence_url,observed,subject) AS (
 VALUES
 ('BMW','CE 04','2024-06_BMW_CE_04.jpg','Wikisympathisant',
 'https://creativecommons.org/licenses/by-sa/4.0/','2024-06-07'::date,'CE 04 at BMW Motorrad Welt'),
 ('BMW','CE 04','2022_BMW_CE-04.jpg','Calreyn88',
 'https://creativecommons.org/licenses/by-sa/4.0/','2022-06-25'::date,'CE 04 scooter observed in England'),
 ('BMW','CE 04','BMW_CE_04_2026.jpg','MotorideSA',
 'https://creativecommons.org/licenses/by-sa/4.0/','2025-11-07'::date,'CE 04 displayed at EICMA 2025; file title includes 2026'),
 ('BMW','F 900 R','BMW_F900R_(1crop).jpg','Wiki LIC',
 'https://creativecommons.org/licenses/by-sa/4.0/','2020-07-21'::date,'F 900 R, cropped photograph, derivatives listed on Commons')
)
INSERT INTO anybike_publishing.model_photo_discovery_queue_v1
 (model_id,commons_file_page,photographer,licence_name,licence_url,photo_observed_on,image_subject)
SELECT m.id,'https://commons.wikimedia.org/wiki/File:'||e.file_title,
 e.photographer,'CC BY-SA 4.0',e.licence_url,e.observed,e.subject
FROM examples e
JOIN public.motorcycle_catalog_models m ON m.manufacturer=e.make AND m.model=e.model
ON CONFLICT(model_id,commons_file_page) DO NOTHING;