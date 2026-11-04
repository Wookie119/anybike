-- AnyBike: private editorial evidence research schema (reference DDL)
-- Keep this in source control alongside the already-applied Supabase schema.
-- DO NOT expose this schema or its tables through public browser clients.
-- Research categories are NOT a change to approved 13/20-section HTML layouts.
--
-- Prerequisite: anybike_publishing schema, existing public catalogue tables.
create table if not exists anybike_publishing.editorial_content_categories (
 entity_type text not null check (entity_type in ('model','manufacturer')),
 category_key text not null check(category_key ~ '^[a-z][a-z0-9_]{2,63}$'),
 category_label text not null check(length(btrim(category_label)) between 3 and 120),
 research_order smallint not null check(research_order between 1 and 20),
 description text not null,
 primary key(entity_type,category_key),
 unique(entity_type,research_order)
);

insert into anybike_publishing.editorial_content_categories
(entity_type,category_key,category_label,research_order,description)
values
('model','introduction','Model introduction',1,'Existing introduction and model character'),
('model','chronology','Model timeline',2,'Verified dated changes'),
('model','generations','Model years and generations',3,'Year changes and model variants'),
('model','factory_colours','Factory colours and editions',4,'Factory paint and special editions by year'),
('model','engine','Engine and performance',5,'Factory engine specifications and development'),
('model','chassis','Chassis and suspension',6,'Frames, suspension, braking and tyres'),
('model','equipment','Technology and equipment',7,'Electronic and mechanical options by year'),
('model','technical_specifications','Technical specifications',8,'Technical data with sources and year'),
('model','production','Production and factories',9,'Factory sites and documented volumes'),
('model','racing','Racing and works riders',10,'Relevant documented competitions and riders'),
('model','ownership','Ownership and maintenance',11,'Ownership, servicing and recalls'),
('model','buying_guidance','Buying guidance and pricing',12,'Careful buying and price evidence'),
('model','factory_media','Factory imagery and media',13,'Rights-reviewed media with model years'),
('manufacturer','overview','Manufacturer introduction',1,'Brand and overview'),
('manufacturer','origins','Origins and founders',2,'Company founding'),
('manufacturer','milestones','Manufacturer timeline',3,'Dated manufacturer milestones'),
('manufacturer','markets','Markets and worldwide reach',4,'Markets and distribution'),
('manufacturer','model_ranges','Model ranges and families',5,'Current and historical ranges'),
('manufacturer','engines','Engine families',6,'Powertrain development'),
('manufacturer','engineering','Chassis and engineering',7,'Engineering and manufacturing'),
('manufacturer','design','Design and character',8,'Design and model identity'),
('manufacturer','innovation','Innovation and AI',9,'Documented AI and innovation'),
('manufacturer','factories','Factories and production sites',10,'Factory and engine locations'),
('manufacturer','production','Manufacturing volumes',11,'Verified manufacturing counts'),
('manufacturer','road_racing','Road racing',12,'Factory racing programmes'),
('manufacturer','offroad_racing','Off-road and motocross',13,'Motocross and other off-road racing'),
('manufacturer','works_riders','Works riders',14,'Works competition riders'),
('manufacturer','factory_media','Factory archive and media',15,'Factory images with checked licensing'),
('manufacturer','registrations','Registrations and sales',16,'Official registrations by country and period'),
('manufacturer','pricing','Prices and valuations',17,'Documented retail and historical prices'),
('manufacturer','heritage_models','Notable historical motorcycles',18,'Historic models and museum specimens'),
('manufacturer','ownership','Ownership and support',19,'Owner care, repairs and service'),
('manufacturer','global_links','AnyBike Global and country links',20,'Verified reciprocal published stories and country pages')
on conflict(entity_type,category_key) do nothing;

create table if not exists anybike_publishing.editorial_content_evidence (
 id bigint generated always as identity primary key,
 entity_type text not null,
 model_id bigint references public.motorcycle_catalog_models(id) on delete restrict,
 manufacturer_id bigint references public.motorcycle_catalog_manufacturers(id) on delete restrict,
 category_key text not null,
 source_public_path text not null check(source_public_path ~ '^/[a-z0-9-]+[.]html$'),
 source_git_blob_sha text not null check(source_git_blob_sha ~ '^[a-f0-9]{40}$'),
 evidence_text text not null check(length(btrim(evidence_text)) between 15 and 15000),
 source_section_label text not null check(length(btrim(source_section_label)) between 2 and 130),
 evidence_type text not null check(evidence_type in ('approved_html_excerpt','factory_document','verified_reference')),
 review_state text not null default 'source_captured'
   check(review_state in ('source_captured','fact_checked','editorial_approved','rejected')),
 captured_at timestamptz not null default now(),
 reviewed_at timestamptz,
 notes text,
 source_rechecked_at timestamptz,
 source_recheck_basis text,
 constraint editorial_evidence_entity_check check(
  (entity_type='model' and model_id is not null and manufacturer_id is null)
  or (entity_type='manufacturer' and manufacturer_id is not null and model_id is null)),
 constraint editorial_evidence_review_check check(
  (review_state='source_captured' and reviewed_at is null)
  or (review_state='rejected')
  or (review_state in ('fact_checked','editorial_approved') and reviewed_at is not null)),
 constraint editorial_source_recheck_pair_consistent check(
  (source_rechecked_at is null and source_recheck_basis is null)
  or (source_rechecked_at is not null and source_recheck_basis='exact-reextract-from-approved-repository-html')),
 foreign key(entity_type,category_key)
  references anybike_publishing.editorial_content_categories(entity_type,category_key)
);
create unique index if not exists editorial_content_model_source_unique
 on anybike_publishing.editorial_content_evidence(model_id,category_key,source_public_path,source_git_blob_sha)
 where model_id is not null;
create unique index if not exists editorial_content_manufacturer_source_unique
 on anybike_publishing.editorial_content_evidence(manufacturer_id,category_key,source_public_path,source_git_blob_sha)
 where manufacturer_id is not null;
create index if not exists editorial_content_evidence_review_queue
 on anybike_publishing.editorial_content_evidence(entity_type,review_state,category_key);

alter table anybike_publishing.editorial_content_categories enable row level security;
alter table anybike_publishing.editorial_content_evidence enable row level security;
revoke all on anybike_publishing.editorial_content_categories from public,anon,authenticated;
revoke all on anybike_publishing.editorial_content_evidence from public,anon,authenticated;
grant select on anybike_publishing.editorial_content_categories to service_role;
grant select,insert,update on anybike_publishing.editorial_content_evidence to service_role;

comment on table anybike_publishing.editorial_content_categories is
 'Backend research categories only; no visual template changes.';
comment on table anybike_publishing.editorial_content_evidence is
 'Private source-only evidence, with independent source recheck and editorial approval states; not automatically public.';
-- Material source text is intentionally NOT copied into a public repository SQL file.
-- See scripts/stage-model-content-evidence.mjs for private, trusted extraction.
