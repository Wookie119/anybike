select cron.schedule('anybike-dealerwebs-recover-stalled-photos', '14,44 * * * *', $job$
  update public.junction_stock_images as im
  set buyer_safe_status='waiting', buyer_safe_updated_at=now(), buyer_safe_next_attempt_at=now()
  where im.source_provider='dealerwebs' and im.source_active
    and im.buyer_safe_status='processing' and im.moderation_status='pending'
    and not im.approved_for_buyer_display
    and greatest(im.buyer_safe_updated_at,im.buyer_safe_last_attempt_at)<now()-interval '2 hours'
    and exists (select 1 from public.junction_stock j
                where j.id=im.junction_stock_id and j.source_provider='dealerwebs' and j.ended_at is null);
$job$);
