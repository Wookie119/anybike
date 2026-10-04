-- Fix split-payment customer notifications so each Deal gets its own
-- allocated amount and destination link. The authoritative payment ledger,
-- allocations and motorcycle security state are not changed by this trigger.

create or replace function public.anybike_notify_customer_verified_payment_posted_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_deal record;
  v_invoice_id bigint;
  v_thread_id bigint;
  v_message text;
  v_link text;
begin
  if coalesce(new.ledger_status,'') <> 'Posted'
     or coalesce(old.ledger_status,'') = 'Posted'
     or coalesce(new.advice_status,'') <> 'Verified'
  then
    return new;
  end if;

  for v_deal in
    select
      al.deal_id,
      d.deal_number,
      round(sum(al.proposed_amount_gbp),2) as deal_amount
    from public.anybike_payment_advice_allocations al
    join public.anybike_deals d on d.id = al.deal_id
    where al.payment_advice_id = new.id
      and al.allocation_status = 'Posted'
    group by al.deal_id,d.deal_number
    order by al.deal_id
  loop
    select i.id
    into v_invoice_id
    from public.anybike_invoices i
    where i.deal_id = v_deal.deal_id
      and i.invoice_type = 'Proforma'
      and i.invoice_status = 'Issued'
    order by coalesce(i.issued_at,i.updated_at,i.created_at) desc,i.id desc
    limit 1;

    v_link := case
      when v_invoice_id is not null then '/proforma.html?invoice='||v_invoice_id::text
      when v_deal.deal_number is not null then '/accounts-documents.html?deal='||v_deal.deal_number
      else '/accounts-documents.html'
    end;

    insert into public.customer_notifications(
      customer_id,title,message,icon,type,link,is_read,created_at
    )
    select
      new.customer_id,
      'Payment received' || case when v_deal.deal_number is not null then ' — '||v_deal.deal_number else '' end,
      '£'||to_char(v_deal.deal_amount,'FM999999990.00')||
        ' has been verified and allocated to your purchase.',
      '✓',
      'payment_received',
      v_link,
      false,
      now()
    where not exists(
      select 1
      from public.customer_notifications n
      where n.customer_id = new.customer_id
        and n.type = 'payment_received'
        and n.link = v_link
        and n.message = '£'||to_char(v_deal.deal_amount,'FM999999990.00')||
          ' has been verified and allocated to your purchase.'
        and n.created_at > now()-interval '1 day'
    );

    select t.id
    into v_thread_id
    from public.message_centre_threads t
    where t.customer_id = new.customer_id
      and t.related_deal_id = v_deal.deal_id
    order by t.updated_at desc nulls last,t.id desc
    limit 1;

    if v_thread_id is not null then
      v_message :=
        'AnyBike has verified and allocated your payment of £'||
        to_char(v_deal.deal_amount,'FM999999990.00')||
        case when nullif(btrim(coalesce(new.advice_number,'')),'') is not null
          then ' · Payment Advice '||new.advice_number
          else ''
        end||
        case when v_deal.deal_number is not null then ' · '||v_deal.deal_number else '' end||
        E'.\n\nYour purchase balance has now been updated.'||
        E'\nWhat happens next: '||
        case
          when exists(
            select 1
            from public.anybike_deal_motorcycles dm
            where dm.deal_id = v_deal.deal_id
              and coalesce(dm.bike_secured,false) = false
          )
          then 'AnyBike will complete the seller / motorcycle security stage before confirming the motorcycle is secured.'
          else 'AnyBike will continue with the next purchase, collection or delivery stage.'
        end||
        case when v_invoice_id is not null
          then E'\n\nView Proforma: /proforma.html?invoice='||v_invoice_id::text
          when v_deal.deal_number is not null
          then E'\n\nAccounts & Documents: /accounts-documents.html?deal='||v_deal.deal_number
          else ''
        end;

      if not exists(
        select 1
        from public.message_centre_messages m
        where m.thread_id = v_thread_id
          and m.sender_type = 'AnyBike'
          and m.message ilike '%Payment Advice '||coalesce(new.advice_number,'')||'%verified and allocated%'
          and m.message ilike '%'||coalesce(v_deal.deal_number,'')||'%'
          and m.created_at > now()-interval '1 day'
      ) then
        insert into public.message_centre_messages(
          thread_id,sender_type,sender_name,sender_email,message,is_internal_note,created_at
        )
        values(
          v_thread_id,'AnyBike','AnyBike','admin@anybike.co.uk',v_message,false,now()
        );

        update public.message_centre_threads
        set
          last_message = v_message,
          last_message_at = now(),
          last_sender = 'AnyBike',
          status = 'Replied',
          lead_status = 'Payment / Deposit',
          updated_at = now()
        where id = v_thread_id;
      end if;
    end if;
  end loop;

  return new;
end;
$function$;

revoke execute on function public.anybike_notify_customer_verified_payment_posted_v1()
from public, anon, authenticated;
