alter table public.anybike_master_contacts
 add column if not exists sms_marketing_permission text,
 add column if not exists sms_permission_verified_at timestamptz,
 add column if not exists sms_permission_verified_by uuid;
comment on column public.anybike_master_contacts.sms_marketing_permission is 'Evidence supporting SMS marketing independent of email opt-in.';
comment on column public.anybike_master_contacts.sms_permission_verified_at is 'Time admin verified specific consent or other lawful SMS marketing basis.';