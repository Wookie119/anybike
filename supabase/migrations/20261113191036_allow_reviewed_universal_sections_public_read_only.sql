-- Applied to Supabase project tuehtnezhdnkqbbhttgp as migration 20261113191036.
-- No staged/draft rows are published. The public browser may read only
-- independently reviewed, non-future-dated sections in the dedicated
-- published projection; the staging and source-audit tables stay private.
alter table public.motorcycle_universal_published_sections_v1 enable row level security;

drop policy if exists "Read released universal page sections"
 on public.motorcycle_universal_published_sections_v1;

create policy "Read released universal page sections"
on public.motorcycle_universal_published_sections_v1
as permissive for select to anon, authenticated
using (
 publication_eligible is true
 and editorial_status='published'
 and published_at is not null
 and published_at<=now()
 and source_section_id>0
 and entity_id>0
 and manufacturer_id>0
 and section_number between 1 and 20
 and section_key='section_'||lpad(section_number::text,2,'0')
 and nullif(btrim(publication_review_reference),'') is not null
 and content is not null
 and jsonb_typeof(content)='object'
 and content<>'{}'::jsonb
 and not (
  content::text ~* $review$"(verification_status|source_verification_status|content_status|editorial_status|review_state)"[[:space:]]*:[[:space:]]*"(pending[^"]*|draft|unverified|source_captured)"$review$
  or content::text ~* $review$"publication_eligible"[[:space:]]*:[[:space:]]*false$review$
 )
);

revoke all on table public.motorcycle_universal_published_sections_v1
 from anon, authenticated;
grant select on table public.motorcycle_universal_published_sections_v1
 to anon, authenticated;
