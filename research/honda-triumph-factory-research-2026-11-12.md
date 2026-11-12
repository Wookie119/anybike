# Honda and Triumph verified factory research — 12 November 2026

**19 audited, manufacturer-sourced public research facts** added to the
existing Supabase catalogue. Each has a matching verification audit entry.
No model-specific HTML, new public layout, or photo approval was created.

| Exact model in AnyBike | Catalogue ID | New facts | Scope |
|---|---:|---:|---|
| Honda CB750 Hornet | 805 | 5 | 2023 European launch |
| Honda XL750 TRANSALP | 184 | 4 | 2023 European revival |
| Triumph TIGER 900 | 256 | 3 | Updated 2024 T-Plane engine family |
| Triumph TIGER 900 GT PRO | 257 | 3 | Updated 2024 GT Pro |
| Triumph TIGER 900 RALLY PRO | 258 | 4 | Updated 2024 Rally Pro |

## Primary manufacturer sources

- [Honda 23YM CB750 Hornet full press kit](https://hondanews.eu/gb/en/motorcycles/media/pressreleases/416779/23ym-honda-cb750-hornet-47)
- [Honda CB750 Hornet Intermot unveiling](https://hondanews.eu/eu/en/motorcycles/media/pressreleases/415509/the-new-cb750-hornet-lands-at-intermot)
- [Honda 23YM XL750 Transalp full press kit](https://hondanews.eu/gb/en/motorcycles/media/pressreleases/428524/23ym-honda-xl750-transalp)
- [Honda XL750 Transalp engineering](https://global.honda/en/tech/XL750_TRANSALP/)
- [Honda European 2023 range reveal](https://global.honda/en/newsroom/news/2022/c221108eng.html)
- [Triumph Tiger 900 GT Pro 2024 factory specifications](https://www.triumphmotorcycles.co.uk/motorcycles/adventure/tiger-900/tiger-900-gt-pro-2024)
- [Triumph Tiger 900 Rally Pro 2024 factory specifications](https://www.triumphmotorcycles.co.uk/motorcycles/adventure/tiger-900/tiger-900-rally-pro-2024)
- [Triumph Tiger 900 engine engineering](https://www.triumphmotorcycles.co.uk/motorcycles/adventure/tiger-900/reasons-to-ride/engine)
- [Triumph Tiger 900 factory Q&A](https://www.triumphmotorcycles.co.uk/for-the-ride/news/motorcycles/tiger-900-q-and-a-2024-05-28)

## Editorial guardrails

- Honda CB750 Hornet (catalogue ID 805) and the separately listed
  `Hornet CB750` (catalogue ID 456) **must not be silently merged**.
  The latter remains unresearched until the catalogue identity is reviewed.
- The 2023 CB750 Hornet is not the historic CB900F Hornet.
- The XL750 Transalp is not the earlier XL650V or XL700V.
- The 2024 Tiger 900 GT Pro has road-oriented Marzocchi suspension and
  a 19-inch front wheel; the Rally Pro has longer-travel Showa suspension
  and a 21-inch front wheel. Never copy those chassis specifications
  between variants.
- Launch and announcement dates are not factory production dates.
- The initial SQL transaction was rejected by the existing publication
  registry because `equipment` was not an approved research category.
  It was **not** bypassed; the approved `specification` category was
  used instead and the transaction then committed with 19 audit rows.
- No manufacturer images were copied or published without permission.

The exact-model public Supabase RPC was checked after publication for all
five motorcycles. Browser regression cases were added for all five.
