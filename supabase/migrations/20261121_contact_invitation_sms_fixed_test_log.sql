-- Log one-off administrator invitation test SMS to the fixed owner number.
-- No contact_id; this table cannot change customer contact or invitation status.
create table if not exists public.anybike_contact_invitation_sms_test_log (
 id bigint generated always as identity primary key,
 sent_by uuid not null,
 recipient text not null default '+447772024763',
 message_body text not null,
 status text not null default 'sending' check(status in ('sending','submitted','failed')),
 provider_message_id text,
 error_message text,
 requested_at timestamptz not null default now(),
 sent_at timestamptz
);
alter table public.anybike_contact_invitation_sms_test_log enable row level security;
revoke all on public.anybike_contact_invitation_sms_test_log from anon, authenticated;
comment on table public.anybike_contact_invitation_sms_test_log is 'Administrator-only fixed mobile test SMS. No customer records affected.';
