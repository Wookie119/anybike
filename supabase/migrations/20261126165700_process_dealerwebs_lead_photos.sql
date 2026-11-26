update public.junction_stock_images im
set source_active=true, source_ended_at=null
from anybike_private.uk_trade_feed_listings_v1 stock
where stock.junction_stock_id=im.junction_stock_id
  and im.source_provider='dealerwebs' and im.position=1 and not im.source_active
  and im.source_url ~ '^https://autocdn[.]co[.]uk/cdn-cgi/imagedelivery/[A-Za-z0-9_-]+/[0-9a-fA-F-]{36}/[A-Za-z0-9_-]+$';

select cron.schedule('anybike-dealerwebs-lead-photos','*/3 * * * *',$job$
 select net.http_post(
  url:='https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/process-buyer-safe-image',
  headers:=jsonb_build_object('Content-Type','application/json','apikey',key.decrypted_secret),
  body:=jsonb_build_object('junction_stock_id',photo.junction_stock_id),
  timeout_milliseconds:=120000
 )
 from vault.decrypted_secrets key
 cross join lateral (
  select s.junction_stock_id
  from anybike_private.uk_trade_feed_listings_v1 s
  join public.junction_stock_images im on im.junction_stock_id=s.junction_stock_id
  where im.source_provider='dealerwebs' and im.position=1 and im.source_active
    and im.buyer_safe_status='waiting'
    and (im.buyer_safe_next_attempt_at is null or im.buyer_safe_next_attempt_at<=now())
  order by s.item_id
  limit 1
 ) photo
 where key.name='anybike_edge_secret_key_v2';
$job$);
