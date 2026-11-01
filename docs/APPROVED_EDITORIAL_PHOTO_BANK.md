# AnyBike approved editorial photo bank

Database: `public.anybike_editorial_photo_bank` (Supabase project `tuehtnezhdnkqbbhttgp`).

## Status
Created and seeded with two previously used, attributed BMW R 1300 GS Creative Commons photographs: the model hero and the boxer engine. These are **externally hosted references**, not downloaded copies or uploaded storage objects. Their existing page credits must remain visible.

## Mandatory selection and presentation rules
- Match manufacturer, exact model, applicable model year/generation, and actual subject/feature.
- Prefer a detailed engineering photo for engineering cards, an exact-year motorcycle for model-year cards.
- Only published `approval_status='approved'` rows may be used publicly. All new discoveries enter as `candidate` until source, identity, licence and attribution are checked.
- Images and AnyBike placeholders must fill the 16:9 slot edge to edge; do not distort. If the important subject would be cropped off, use a better original or a curated crop. No tiny isolated logo or letterboxing.
- Preserve photographer, licence, linked original and alteration credit with CC images; never assume BMW press photos may be republished.
- Editorial bank is independent from dealer/customer stock photography, stock access and international sales permissions.

## Reuse
`/shared-editorial-photo-bank.js` exposes `AnyBikeEditorialPhotos.findPhotos(existingSupabaseClient,{manufacturer,model,category,year,context})` and `selectPhoto(photos,{manufacturer,model,category,year,feature,context})`. Both require an existing site Supabase client; no privileged credentials are embedded. If no approved photo matches, render the approved AnyBike full-bleed placeholder. Do not guess an image.

## Later improvements
- Curated, licensed resized images in a dedicated editorial-only storage bucket; do not mix with dealer stock.
- Review queue and admin crop controls; automated thumbnail derivatives and attribution audit.
- Integrate lookup into the unified database-driven manufacturer/model/AnyBike Global page renderer. Existing live page behaviour is unchanged by adding the bank.
