-- Protected customer setup links.
-- A setup token identifies the intended customer but never authenticates them.
-- The customer must sign in, and the token is accepted only when auth.uid()
-- matches the customer the admin created the link for.

create table if not exists public.customer_setup_links (
  token uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  return_path text not null default '/customer-profile.html',
  created_by uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  last_used_at timestamptz
);

alter table public.customer_setup_links enable row level security;
revoke all on public.customer_setup_links from anon, authenticated;

create or replace function public.admin_create_customer_setup_link_v1(
  p_user_id uuid,
  p_return_path text default '/customer-profile.html'
)
returns table(token text, return_path text, expires_at timestamptz)
language plpgsql
security definer
set search_path='public','auth','pg_temp'
as $function$
declare
  v_token uuid;
  v_return text;
  v_expires timestamptz;
begin
  if not public.anybike_is_admin() then
    raise exception 'Admin access required';
  end if;

  if not exists(select 1 from auth.users where id=p_user_id) then
    raise exception 'Customer account not found';
  end if;

  v_return:=coalesce(nullif(btrim(p_return_path),''),'/customer-profile.html');
  if left(v_return,1)<>'/' or left(v_return,2)='//' or lower(v_return) like '%admin-%' then
    raise exception 'Invalid customer return path';
  end if;

  insert into public.customer_setup_links(customer_id,return_path,created_by)
  values(p_user_id,v_return,auth.uid())
  returning customer_setup_links.token,customer_setup_links.expires_at
  into v_token,v_expires;

  return query select v_token::text,v_return,v_expires;
end;
$function$;

revoke all on function public.admin_create_customer_setup_link_v1(uuid,text) from public;
grant execute on function public.admin_create_customer_setup_link_v1(uuid,text) to authenticated;

create or replace function public.customer_setup_token_matches_current_user_v1(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path='public','auth','pg_temp'
as $function$
declare
  v_match boolean;
begin
  if auth.uid() is null then
    return false;
  end if;

  select exists(
    select 1
    from public.customer_setup_links l
    where l.token=p_token
      and l.customer_id=auth.uid()
      and l.expires_at>now()
  ) into v_match;

  if v_match then
    update public.customer_setup_links
    set last_used_at=now()
    where token=p_token and customer_id=auth.uid();
  end if;

  return v_match;
end;
$function$;

revoke all on function public.customer_setup_token_matches_current_user_v1(uuid) from public;
grant execute on function public.customer_setup_token_matches_current_user_v1(uuid) to authenticated;
