select cron.schedule(
 'anybike-dealerwebs-snapshot-hourly',
 '37 * * * *',
 $job$
 select net.http_post(
  url:='https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/dealerwebs-feed-diagnostic',
  headers:=jsonb_build_object('Content-Type','application/json','x-anybike-cron-key',decrypted_secret),
  body:='{"mode":"stage"}'::jsonb,
  timeout_milliseconds:=60000
 )
 from vault.decrypted_secrets where name='anybike_edge_secret_key_v2';
 $job$
);