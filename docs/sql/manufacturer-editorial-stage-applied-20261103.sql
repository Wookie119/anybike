-- Applied to Supabase project tuehtnezhdnkqbbhttgp on 2026-11-03.
-- ADDITIVE development-only stage. No existing published pages or model-v2 tables altered.
create table if not exists public.motorcycle_manufacturer_sections_v1 (
  id bigint generated always as identity primary key,
  manufacturer_id bigint not null references public.motorcycle_catalog_manufacturers(id),
  section_number smallint not null check (section_number between 1 and 20),
  section_key text not null,
  section_title text not null,
  editorial_status text not null default 'draft' check (editorial_status in ('draft','review','approved','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (manufacturer_id, section_number),
  check (editorial_status <> 'published' or published_at is not null)
);
create table if not exists public.motorcycle_manufacturer_source_blocks_v1 (
  id bigint generated always as identity primary key,
  manufacturer_id bigint not null references public.motorcycle_catalog_manufacturers(id),
  source_file text not null,
  source_blob_sha text not null,
  source_heading_number smallint not null check (source_heading_number between 1 and 99),
  source_heading text,
  universal_sections smallint[] not null default '{}',
  source_anchor text,
  source_html text,
  source_kind text not null check (source_kind in ('static_html','javascript_generated')),
  import_status text not null default 'draft' check (import_status in ('draft','review','approved')),
  source_html_sha256 text,
  created_at timestamptz not null default now(),
  unique (manufacturer_id, source_file, source_heading_number),
  check ((source_kind='javascript_generated' and source_html is null) or (source_kind='static_html' and source_html is not null)),
  check (array_length(universal_sections,1) is not null)
);
create index if not exists idx_manufacturer_blocks_parent on public.motorcycle_manufacturer_source_blocks_v1(manufacturer_id);
alter table public.motorcycle_manufacturer_sections_v1 enable row level security;
alter table public.motorcycle_manufacturer_source_blocks_v1 enable row level security;
revoke all on public.motorcycle_manufacturer_sections_v1 from public, anon, authenticated;
revoke all on public.motorcycle_manufacturer_source_blocks_v1 from public, anon, authenticated;
revoke all on sequence public.motorcycle_manufacturer_sections_v1_id_seq from public, anon, authenticated;
revoke all on sequence public.motorcycle_manufacturer_source_blocks_v1_id_seq from public, anon, authenticated;
comment on table public.motorcycle_manufacturer_sections_v1 is 'Private staged 20-slot manufacturer editorial structure; no public access until approved publication migration';
comment on table public.motorcycle_manufacturer_source_blocks_v1 is 'Private immutable-source-derived editorial archive staging; not suitable for direct unsanitised HTML rendering';
