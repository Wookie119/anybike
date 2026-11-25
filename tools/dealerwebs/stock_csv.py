"""Offline stock CSV preparation. No network, publication, or database writes."""
import csv, json, argparse, re
from decimal import Decimal, InvalidOperation
from urllib.parse import urlsplit
FIELDS = ("dealer_id","stock_id","make","model","variant","year","mileage","engine_cc","colour","price_gbp","vat_qualifying","description","images")
REQUIRED = ("dealer_id","stock_id","make","model","price_gbp")
def normalize(row):
    out = {k: str(row.get(k) if row.get(k) is not None else "").strip() for k in FIELDS}
    for k in REQUIRED:
        if not out[k]: raise ValueError("missing "+k)
    try:
        price=Decimal(out["price_gbp"])
        if not price.is_finite() or price<=0: raise ValueError("invalid price")
        out["price_gbp"]=str(price)
    except InvalidOperation: raise ValueError("invalid price")
    for k in ("year","mileage","engine_cc"):
        if out[k]:
            if not re.fullmatch(r"[0-9]+",out[k]): raise ValueError("invalid "+k)
            out[k]=int(out[k])
        else: out[k]=None
    vat=out["vat_qualifying"].lower()
    if vat not in ("","true","false","unknown"): raise ValueError("unmapped VAT value")
    out["vat_qualifying"]={"true":True,"false":False}.get(vat)
    urls=[]
    for raw in out["images"].split(";"):
        u=raw.strip()
        if not u: continue
        p=urlsplit(u)
        if p.scheme not in ("http","https") or not p.hostname or p.username or p.password: raise ValueError("invalid image URL")
        if u not in urls: urls.append(u)
    out["images"]=urls
    out["primary_image"]=urls[0] if urls else None
    return out
def decode(stream, mapping, header=True):
    if any(k not in mapping for k in REQUIRED): raise ValueError("required mappings missing")
    if len(set(mapping.values()))!=len(mapping): raise ValueError("duplicate column mapping")
    if not all(type(i) is int and i>=0 for i in mapping.values()): raise ValueError("invalid column index")
    reader=csv.reader(stream,strict=True)
    width=None
    if header:
        first=next(reader,None)
        if first is None: raise ValueError("empty file")
        width=len(first)
    records=[]; errors=[]; seen=set()
    for row in reader:
        try:
            if width is None: width=len(row)
            if len(row)!=width: raise ValueError("inconsistent column count")
            if max(mapping.values())>=len(row): raise ValueError("missing column")
            rec=normalize({k:row[i] for k,i in mapping.items()})
            key=(rec["dealer_id"],rec["stock_id"])
            if key in seen: raise ValueError("duplicate dealer/stock identifier")
            seen.add(key); records.append(rec)
        except ValueError as e: errors.append({"line":reader.line_num,"error":str(e)})
    return {"mode":"dry_run","publish":False,"records":records,"errors":errors,"ready_for_review":bool(records) and not errors}
def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("csv_file"); p.add_argument("mapping"); p.add_argument("--no-header",action="store_true")
    args=p.parse_args()
    with open(args.mapping,encoding="utf-8") as f: mapping=json.load(f)
    with open(args.csv_file,encoding="utf-8-sig",newline="") as f: report=decode(f,mapping,not args.no_header)
    print(json.dumps(report,ensure_ascii=False))
    return 0 if report["ready_for_review"] else 1
if __name__=="__main__": raise SystemExit(main())
