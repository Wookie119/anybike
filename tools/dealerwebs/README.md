# DealerWebs DMS14 preparation (not production)
The official column order, encoding and snapshot semantics are unknown pending Chris's sample. The decoder takes a JSON mapping of canonical field names to zero-based CSV columns; never assume the provisional order is DMS14. It writes only a local JSON dry-run report. No live DB writes, FTP access, or photo downloads.
## BMW rehearsal
Run this read-only SQL against AnyBike and export its result as CSV with a header. Connector 1 currently contains the main BMW dataset. Use the source key as stock identity for this rehearsal only; seller name is a provisional grouping, not an authoritative dealer ID.
```sql
select seller_name as dealer_id, source_key as stock_id, make, model, variant, year, mileage, engine_cc, colour, source_price_gbp as price_gbp, vat_qualifying, description_original as description,
case when jsonb_typeof(source_image_urls)='array' then (select string_agg(v,';' order by n) from jsonb_array_elements_text(source_image_urls) with ordinality as x(v,n)) else null end as images
from public.live_source_items where connector_id=1 and lower(make)='bmw' and source_status='live' order by id;
```
Provisional mapping: {"dealer_id":0,"stock_id":1,"make":2,"model":3,"variant":4,"year":5,"mileage":6,"engine_cc":7,"colour":8,"price_gbp":9,"vat_qualifying":10,"description":11,"images":12}
Save mapping as JSON and run python tools/dealerwebs/stock_csv.py bmw.csv mapping.json > report.json.
## Activation gates
Confirm actual CSV specification, stable dealer and stock identifiers, currency, mileage units, VAT meanings, dealer permissions and image rights. Use server-side secret storage for SFTP credentials; no browser access. Reuse existing stock_source_connections, junction_stock and staging architecture after reviewing existing import code. Never treat a failed, partial or empty feed as sold stock. Reconcile only confirmed complete snapshots within the same authorised connection, holding large drops for review. Keep UK publication, international permission and photo permission independent. Validate model matches without guessing. Image worker must restrict hosts and redirects, reject private addresses, cap sizes and concurrency, verify image content and reuse unchanged content; no downloads in this rehearsal. Do not merge or deploy until verified.
