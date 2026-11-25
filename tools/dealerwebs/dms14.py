"""DealerWebs DMS14 sample adapter. Offline only; never publishes stock."""
import csv, re, json, argparse
from decimal import Decimal, InvalidOperation
from urllib.parse import urlsplit
HEADER='Feed_Id Vehicle_ID FullRegistration Colour FuelType Year Mileage Bodytype Doors Make Model Variant EngineSize Price Transmission PictureRefs ServiceHistory PreviousOwners Category FourWheelDrive Options Comments New Used Site Origin v5 Condition ExDemo FranchiseApproved TradePrice TradePriceExtra ServiceHistoryText Cap_Id Attention_Grabber Glass_ID Video_URL'.split()

def decode(stream):
    reader=csv.reader(stream,strict=True)
    if next(reader,None)!=HEADER: raise ValueError('Unexpected DMS14 header; review mapping')
    records=[]; errors=[]; seen=set()
    for cells in reader:
        try:
            if len(cells)!=len(HEADER): raise ValueError('Unexpected column count')
            r=dict(zip(HEADER,cells)); key=(r['Feed_Id'].strip(),r['Vehicle_ID'].strip())
            if not all(key) or key in seen: raise ValueError('Missing or duplicate feed/vehicle ID')
            if not r['Make'].strip() or not r['Model'].strip(): raise ValueError('Missing make/model')
            price=Decimal(r['Price']);
            if not price.is_finite() or price<=0: raise ValueError('Invalid price')
            def integer(k):
                v=r[k].strip()
                if not v: return None
                if not re.fullmatch(r'[0-9]+',v): raise ValueError('Invalid '+k)
                return int(v)
            images=[]
            for v in re.split(r'[,;](?=\s*https?://)',r['PictureRefs'].strip()):
                v=v.strip()
                if not v: continue
                u=urlsplit(v)
                if u.scheme!='https' or u.hostname!='autocdn.co.uk' or u.username or u.password or u.port not in (None,443): raise ValueError('Unapproved image URL')
                if v not in images: images.append(v)
            seen.add(key)
            records.append(dict(feed_id=key[0],source_stock_id=key[1],make=r['Make'],model=r['Model'],variant=r['Variant'],registration=r['FullRegistration'],colour=r['Colour'],year=integer('Year'),mileage=integer('Mileage'),engine_cc=integer('EngineSize'),price_gbp=str(price),description=r['Comments'],category=r['Bodytype'],image_urls=images,vat_qualifying=None,raw_data=r,public_visible=False,export_visible=False))
        except (ValueError,InvalidOperation) as e: errors.append(dict(line=reader.line_num,error=str(e)))
    return dict(mode='dry_run',publish=False,ready_for_review=bool(records) and not errors,records=records,errors=errors)

def main():
    p=argparse.ArgumentParser();p.add_argument('file');a=p.parse_args()
    with open(a.file,encoding='utf-8-sig',newline='') as f: report=decode(f)
    print(json.dumps(report,ensure_ascii=False)); return 0 if report['ready_for_review'] else 1
if __name__=='__main__': raise SystemExit(main())
