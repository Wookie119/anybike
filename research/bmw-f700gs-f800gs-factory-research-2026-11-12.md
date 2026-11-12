# BMW F 700 GS / F 800 GS — factory research publication

Published to the existing Supabase `motorcycle_catalog_facts` and
`motorcycle_catalog_fact_verification_audit` tables on 12 November 2026.

**Primary source:** BMW Group PressClub USA, *The new BMW F 700 GS and BMW
F 800 GS*, press kit dated **2 July 2012**:
https://www.press.bmwgroup.com/usa/article/detail/T0128179EN_US/the-new-bmw-f-700-gs-and-bmw-f-800-gs

## Exact-model scope

| Model | Catalogue ID | Verified records | Model-year scope |
|---|---:|---:|---|
| F 700 GS | 746 | 4 | 2013 update |
| F 800 GS | 30 | 4 | 2013 update |

Each model has a sourced `engine`, `factory_colours`,
`specification` and `market_launch` fact. The announcement date
is **not** presented as a first-production date. The F 700 GS uses the
**798 cc** parallel twin, not a 700 cc engine. The F 800 GS specification
is for the **2013 update**, not the later-generation motorcycle.

Both exact-model public RPC responses were checked after insertion and
returned four verified facts each. No images were imported or approved.
The existing approved universal renderer consumes these facts without
new model-specific HTML.

The live Chromium check now includes both models. This note records the
editorial evidence and scopes; it does not replace the authoritative
Supabase records or their verification-audit rows.
