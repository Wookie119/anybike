# Public research coverage discrepancy — BMW excluded models
12 November 2026

## Confirmed cause
Five verified BMW facts are stored and audited, but are not published by the existing exact-model public RPC because their **four catalogue model identities are absent from** `public.motorcycle_catalog_dropdown_clean`. The public RPC deliberately resolves identities through this cleaned dropdown, requiring a unique matching make/model. The coverage view has 965 dropdown models, so these four do not count among 965.

| Catalogue model ID | Model | Verified facts | Public RPC |
|---:|---|---:|---:|
| 37 | BMW F 900 GS Adventure | 2 | 0 |
| 42 | BMW F450 GS | 1 | 0 |
| 60 | BMW R 12 | 1 | 0 |
| 62 | BMW R 12 S | 1 | 0 |

**This is not missing audits or source URLs.** All verified facts had audit rows and URLs in the earlier integrity check. No attempt was made to bypass the cleaned-dropdown guard or alter the security-definer public RPC.

## Required next investigation before any change
Inspect the cleaned dropdown view's underlying definition and intentional exclusions, canonical aliases and live catalogue route. Determine whether these four are legitimate missing public catalogue models, deliberate exclusions, or naming collisions. Add them only via the approved canonical catalogue publishing process, preserving the one-identity rule and model-page templates. Do not count them as publicly available until the exact-model public RPC returns audited facts and browser rendering passes.

## CI
The previous 68-case live exact-model browser smoke run succeeded. The subsequent 70-case run and latest deployment were separately checked and should be reported by final GitHub Actions conclusions.
