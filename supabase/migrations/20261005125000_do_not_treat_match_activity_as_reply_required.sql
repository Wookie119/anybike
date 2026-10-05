do $do$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
    into v_def
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='anybike_notify_admin_buyer_match_interest_v1'
  limit 1;

  if v_def is null then
    raise exception 'Function anybike_notify_admin_buyer_match_interest_v1 not found';
  end if;

  v_def := replace(
    v_def,
    $old$      'New',
      'Bike Sales',
      case when new.buyer_response in ('Interested','Offer Made','Question Asked') then 'High' else 'Normal' end,$old$,
    $new$      case when new.buyer_response='Question Asked' then 'New' else 'Replied' end,
      'Bike Sales',
      case when new.buyer_response in ('Interested','Offer Made','Question Asked') then 'High' else 'Normal' end,$new$
  );

  v_def := replace(
    v_def,
    $old$      'Customer',
      now(),
      now()$old$,
    $new$      case when new.buyer_response='Question Asked' then 'Customer' else 'System' end,
      now(),
      now()$new$
  );

  v_def := replace(
    v_def,
    $old$      last_sender='Customer',
      status='New',
      department='Bike Sales',$old$,
    $new$      last_sender=case when new.buyer_response='Question Asked' then 'Customer' else 'System' end,
      status=case when new.buyer_response='Question Asked' then 'New' else 'Replied' end,
      department='Bike Sales',$new$
  );

  v_def := replace(
    v_def,
    $old$      'Customer',
      coalesce(v_buyer_name,'Customer'),
      v_buyer_email,$old$,
    $new$      case when new.buyer_response='Question Asked' then 'Customer' else 'System' end,
      coalesce(v_buyer_name,'Customer'),
      v_buyer_email,$new$
  );

  execute v_def;
end
$do$;
