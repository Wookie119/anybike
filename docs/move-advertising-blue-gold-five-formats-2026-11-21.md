# Move Motorcycles — blue-and-gold five-format advertising demo

Date: 21 November 2026. Keep the user's existing APPROVED RED Move Motorcycles advert completely unchanged. The actual Move Motorcycles logo and van photographs supplied by the user are the visual references; the five blue-and-gold renders are a separate proposed set.

## What is implemented
- A TEST/DRAFT campaign `Move Motorcycles — Blue & Gold · 5-size demonstration` exists in Supabase, UK/GB only, connected to the Move Motorcycles partner and not active.
- Admin Advertising & Affiliates campaign editor now has a protected five-format WebP upload panel. It uploads to public Supabase Storage bucket `advertising-creatives`, with ADMIN-ONLY write policies and a public image URL once uploaded.
- The upload panel recognises exactly these five WebP filenames and maps them to the five already existing campaign artwork fields:
  - `move-motorcycles-large-landscape.webp` → `desktop_image_url`
  - `move-motorcycles-large-portrait.webp` → `mobile_image_url`
  - `move-motorcycles-slim-landscape.webp` → `slim_image_url`
  - `move-motorcycles-compact-mobile.webp` → `compact_image_url`
  - `move-motorcycles-stock-card.webp` → `stock_card_image_url`
- Uploaded artwork can be previewed individually from the editor. A local HTML sample-page preview is bundled with the artwork ZIP.
- A test campaign cannot be activated by the campaign editor while `is_test` is true.

## How to see the work
1. Download `Move_Motorcycles_5_Ads.zip` from the conversation and extract it.
2. Optionally open `preview-five-sizes.html` in a browser to see all five proportions on a sample AnyBike-style page. This is a LOCAL preview only.
3. Open `/admin-advertising.html` as a signed-in AnyBike admin, refresh the page, find the new Move Motorcycles blue-and-gold draft, click Edit.
4. Select the five extracted WebP files in the `Upload five advertising sizes` section, click `Upload selected advert sizes`, then `Preview five sizes`.
5. To select motorcycle model pages for a **pending** assignment, use the existing `Model page advertising coverage` table, tick desired models, choose the draft campaign, then `Assign campaign`. This is not a live activation.
6. Existing public renderer currently only supports selected UK model/general pages at `below_hero`; support for other formats/pages needs a separate renderer rollout and testing. Do not claim all five formats are live.

## Safety / approvals
- The actual red advert is unchanged.
- No campaign was activated, no partner permissions or commercial agreement set to approved, and no quotation or invoice issued.
- Public advert delivery requires the established independent review (accurate targeting, compliant creative, partner approval, supported placement, test off, explicit active status).
- Do not manually upload to 123-reg. GitHub is source-of-truth for website code, Supabase Storage for uploaded advertising artwork.
- Image renders are design previews; inspect brand accuracy versus the true provided logo before marking them production approved.
