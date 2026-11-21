# AnyBike handover — 21 November 2026

## Invitation batch results (live Supabase verification)
- Main batch 1: 97 branded email provider submissions and 97 SMS provider submissions recorded around 13:22–13:26 UTC.
- Second batch around 13:38–13:41: 65 branded emails provider-accepted, 3 failed due to Resend daily email quota. 66 SMS accepted in recovery around 13:46–13:47; two contact IDs (#383 and #482) returned non-2xx Edge Function errors and had no SMS log at the time checked. Avoid blind retries.
- Third batch around 13:54–13:57: 85 SMS provider-accepted, no SMS errors. 1 email submitted and 3 errors from exhausted daily email quota; 84 of the third batch's 85 emails outstanding (assuming no later sends).
- Provider acceptance is NOT inbox or handset delivery. Always requery logs before attempting any recovery.
- Existing single-button batch sender in `admin-contact-directory.html` processes authorised SMS first then branded emails; defaults both channels selected. Stops after three failures in current channel.
- Dedicated on-page SMS-only recovery for second batch and email-only recovery for third batch are committed; **not proof of live deployment or completed email recovery**.
- Private/trade audience filtering updated to use trade/retail tags, company and dealer profiles; verify live after existing work finishes.
- Do not send any more invitations until reviewing email provider quota and outstanding records. Do not retry accepted SMS or emails.
- User requested to leave invitation work and continue advertising.

## Advertising priorities retained
- One Supabase-backed campaign and quotation/invoice system, admin-only control; no design resets or individual page edits.
- UK vs international and country/manufacturer/model/page category/customer-type targeting, including future pages.
- Five advert sizes; slim placement on model pages, mobile responsiveness, accurate localised creatives and alt, compliant sponsored labels and links.
- Accurate impression/click/CTR/conversion accounting and commission earned/received/outstanding; avoid inventing tracking data.
- Advertising quotation, acceptance, invoice drafts and billing status; no automatic invoicing or activation unless explicitly reviewed.
- Q-Finance partner and Move integration priorities remain; future sportswear/insurance/finance affiliates and international variants.
- Preserve approved AnyBike black/white/charcoal/red #ed1c24 design and Harley orange exceptions.
- GitHub main is source of truth; do not manually upload to 123-reg.
