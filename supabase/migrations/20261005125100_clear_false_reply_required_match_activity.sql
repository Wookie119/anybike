update public.message_centre_threads
set status='Replied',
    last_sender='System',
    updated_at=now()
where status in ('New','Needs Reply')
  and (
    last_message ~* '\\bmarked\\b.*\\bas Not Interested\\.?$'
    or last_message ~* '\\bmarked\\b.*\\bas Interested\\.'
  );
