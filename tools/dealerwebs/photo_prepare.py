"""Offline image preparation; no network or database writes."""
import hashlib, io, json, warnings
from PIL import Image, ImageOps
MAX_BYTES=25*1024*1024
MAX_PIXELS=40_000_000

def prepare(data):
    if not data or len(data)>MAX_BYTES: raise ValueError('Image size rejected')
    with warnings.catch_warnings():
        warnings.simplefilter('error',Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(data)) as src:
            if src.format not in ('JPEG','PNG','WEBP'): raise ValueError('Unsupported image format')
            if src.width*src.height>MAX_PIXELS: raise ValueError('Image dimensions rejected')
            if getattr(src,'n_frames',1)!=1: raise ValueError('Animated image rejected')
            img=ImageOps.exif_transpose(src).convert('RGB')
            result={}
            for name,size in [('card',640),('detail',1600)]:
                copy=img.copy(); copy.thumbnail((size,size),Image.Resampling.LANCZOS)
                out=io.BytesIO(); copy.save(out,format='WEBP',quality=85,method=4)
                result[name]=out.getvalue()
            return hashlib.sha256(data).hexdigest(),result

def manifest(report):
    if report.get('publish') is not False or not report.get('ready_for_review') or report.get('errors'): raise ValueError('Unvalidated report')
    assets={}; links=[]
    for r in report['records']:
        for i,url in enumerate(r['image_urls']):
            key=hashlib.sha256(url.encode()).hexdigest()
            assets[key]=url
            links.append({'feed_id':r['feed_id'],'stock_id':r['source_stock_id'],'asset_key':key,'sort_order':i,'primary':i==0})
    return {'download_enabled':False,'assets':assets,'links':links}
