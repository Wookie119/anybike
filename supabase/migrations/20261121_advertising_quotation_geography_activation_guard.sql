-- Extend the one existing activation guard. Quotation-derived ads must stay within the accepted audience.
create or replace function public.validate_commercial_campaign_activation()
returns trigger language plpgsql set search_path=''
as $function$
declare v_quote record;
begin
 if new.status='active' then
   if coalesce(array_length(new.countries,1),0)=0
      or exists(select 1 from unnest(new.countries) as cc(code)
                where code is null or code !~ '^[A-Z]{2}$' or code='UK') then
     raise exception 'Active advertising requires explicit two-letter ISO countries (GB for UK)';
   end if;
   if coalesce(new.destination_url,'') !~* '^https://[^[:space:]/?#]+'
     or coalesce(new.desktop_image_url,'') !~* '^https://[^[:space:]/?#]+'
     or coalesce(new.mobile_image_url,'') !~* '^https://[^[:space:]/?#]+' then
     raise exception 'Active advertising requires secure HTTPS destination and desktop/mobile artwork';
   end if;
   if nullif(btrim(coalesce(new.disclosure,'')),'') is null then
     raise exception 'Active advertising requires an advertising disclosure';
   end if;
   if new.source_quotation_item_id is not null then
     select q.status,q.audience,q.partner_id,q.advertiser_name
       into v_quote
     from public.advertising_quotation_items i
     join public.advertising_quotations q on q.id=i.quotation_id
     where i.id=new.source_quotation_item_id;
     if not found or v_quote.status <> 'accepted' then
       raise exception 'Originating advertising quotation must still be accepted';
     end if;
     if v_quote.partner_id is not null and v_quote.partner_id<>new.partner_id then
       raise exception 'Campaign partner must match accepted quotation partner';
     end if;
     if v_quote.audience='UK' and (new.countries<>array['GB']::text[]) then
       raise exception 'UK quotation campaign may target Great Britain only';
     end if;
     if v_quote.audience='International' and 'GB'=any(new.countries) then
       raise exception 'International quotation campaign cannot target GB';
     end if;
     if v_quote.audience not in ('UK','International','Worldwide') then
       raise exception 'Unknown quotation audience requires manual review';
     end if;
   end if;
   if not exists(
     select 1 from public.commercial_partners p
     where p.id=new.partner_id and p.status='approved'
       and p.agreement_approved and p.branding_approved
       and (p.kind<>'finance' or (
         new.compliance_approved_at is not null
         and nullif(btrim(new.compliance_reference),'') is not null
         and exists(select 1 from public.finance_partner_terms t
                    where t.partner_id=p.id and t.formal_approval_at is not null)
       ))
   ) then
     raise exception 'Partner agreement, branding and applicable finance compliance approval are required';
   end if;
 end if;
 return new;
end;
$function$;