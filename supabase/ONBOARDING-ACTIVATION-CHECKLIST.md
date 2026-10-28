# AnyBike onboarding automation activation

Status 28 October 2026: Global sending OFF; hourly local-time checker remains a dry run; Edge worker version 7 enforces separate production approval and stale queue protection.

## Next release checks

1. Keep the existing hourly dry-run cron job unchanged until a secure authenticated database-to-worker dispatch is validated.
2. Store service credentials only in Supabase Vault. Do not commit credentials or expose them to client pages.
3. Introduce a restricted dispatcher that first checks global sending OFF and does not send when disabled.
4. Confirm only the approved testing account Quotes can receive trial emails; 5-Ways and all other dealers remain excluded.
5. Validate local 10:00 time and one-message-per-customer-per-day controls using a dry run.
6. Audit pending queue and email outbox to prevent old/duplicate sends before production approval.
7. After a successful test, separately approve and monitor a limited cohort before wider rollout.

Do not treat the independently scheduled Quotes test as proof that production cron invokes the worker.
