create or replace function public.anybike_reject_self_underwrite_invitation_v1()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner bigint;
begin
 select s.dealer_organisation_id into v_owner
 from public.anybike_trade_underwrite_opportunities o
 join public.seller_motorcycle_submissions s on s.id=o.submission_id
 where o.id=new.opportunity_id;
 if v_owner is not null and v_owner=new.dealer_organisation_id then
   raise exception 'The submitting dealership cannot be invited to its own motorcycle';
 end if;
 return new;
end $$;
drop trigger if exists trg_reject_self_underwrite_invitation on public.anybike_trade_underwrite_invitations;
create trigger trg_reject_self_underwrite_invitation before insert or update of dealer_organisation_id,opportunity_id
on public.anybike_trade_underwrite_invitations for each row
execute function public.anybike_reject_self_underwrite_invitation_v1();