"""Read-only reconciliation plan. Never writes stock or marks vehicles sold."""
from decimal import Decimal

def plan(previous, incoming, feed_id, *, complete_snapshot=False, drop_limit=0.20):
    if not 0 <= drop_limit <= 1: raise ValueError("invalid drop limit")
    def index(rows):
        result={}
        for row in rows:
            if row["feed_id"] != feed_id: continue
            key=row["source_stock_id"]
            if not key or key in result: raise ValueError("missing or duplicate stock ID")
            result[key]=row
        return result
    old=index(previous)
    if incoming.get("errors") or not incoming.get("ready_for_review") or incoming.get("publish") is not False:
        return {"held":True,"reason":"invalid import","new":[],"changed":[],"missing":[]}
    new=index(incoming["records"])
    if not new:
        return {"held":True,"reason":"empty feed","new":[],"changed":[],"missing":[]}
    missing=sorted(old.keys()-new.keys())
    added=sorted(new.keys()-old.keys())
    changed=[]
    fields=("make","model","variant","year","mileage","engine_cc","colour","description","image_urls","vat_qualifying")
    for key in sorted(old.keys()&new.keys()):
        a,b=old[key],new[key]
        diff=[f for f in fields if a.get(f)!=b.get(f)]
        if Decimal(str(a["price_gbp"]))!=Decimal(str(b["price_gbp"])): diff.append("price_gbp")
        if diff: changed.append({"stock_id":key,"fields":diff})
    large_drop=bool(old) and len(missing)/len(old)>drop_limit
    held=bool(missing) and (not complete_snapshot or large_drop)
    return {"held":held,"reason":"snapshot incomplete or large stock loss" if held else None,
            "new":added,"changed":changed,"missing":missing,
            "eligible_for_missing_review":bool(missing) and not held,"publish":False}
