# External motorcycle taxonomy crosswalk — 4 November 2026

Supabase migration applied: `motorcycle_catalog_private_external_ids`.
Created table `public.motorcycle_catalog_external_ids` for verified provider IDs at manufacturer, model and generation levels.

- AnyBike canonical IDs remain primary. Provider IDs are text to preserve leading zeros.
- Columns: provider_key, entity_type, external_id, manufacturer_id, model_id, generation_id, review_status, source_reference, source_checked_at, created_at, updated_at.
- Exactly one AnyBike FK per record; unique(provider_key, entity_type, external_id).
- review_status: pending / verified / rejected.
- RLS enabled; no client-facing policies; all privileges revoked from anon and authenticated (including sequence).
- Verified live: RLS true; anon SELECT false; authenticated SELECT false; anon INSERT false; 0 rows.
- No Auto Trader data imported or licensed. Never scrape, guess or publish third-party identifiers.
- Derivative IDs require a dedicated AnyBike canonical derivative entity; don't conflate derivative with model.
- Do not publish catalogue records or model-country links merely because an external ID mapping exists.

This is an internal identity crosswalk, not a public page renderer. The next phase is a verified URL inventory, then a safely sourced data-to-page link graph with batch tests. Preserve approved BMW, Harley-Davidson, country and Global layouts.
