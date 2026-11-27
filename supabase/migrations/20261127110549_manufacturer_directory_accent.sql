alter table public.anybike_public_settings
  add column if not exists manufacturer_directory_accent_hex text not null default '#ED1C24'
  check (manufacturer_directory_accent_hex ~ '^#[0-9A-Fa-f]{6}$');

create or replace function public.public_anybike_manufacturer_directory_accent_v1()
returns text
language sql stable security definer
set search_path = ''
as $$
  select manufacturer_directory_accent_hex
  from public.anybike_public_settings
  where singleton_id is true
$$;

revoke all on function public.public_anybike_manufacturer_directory_accent_v1() from public, anon, authenticated;
grant execute on function public.public_anybike_manufacturer_directory_accent_v1() to anon, authenticated, service_role;
