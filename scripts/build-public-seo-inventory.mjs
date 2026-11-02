// AnyBike public SEO inventory and sitemap builder.
// node scripts/build-public-seo-inventory.mjs          => audit only
// node scripts/build-public-seo-inventory.mjs --write  => rebuild sitemap and JSON inventory
import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd(), BASE='https://www.anybike.co.uk/';
const ignored=new Set(['.git','node_modules','.github','assets','images','img','supabase','scripts','tests','test','design','data','docs','backups','archive']);
const protectedNames=/^(admin[-.]|dealer[-.]|customer[-.]|my-|seller-add-photos|shipper-|move-driver|move-collection|candidate-motorcycle|final-invoice|proforma|verify|confirm-email|v\.html|login|register|sign-|auth|deal-360|stock-import|bike-details|available-stock|motorcycle-model-library|bmw-r1300gs-v2|international-stock-preview|underwrite\.html|contact-us\.html)/i;
const protectedTerms=/(dashboard|account|approval|auction|bid-|invitations|messages|checkout|payment|profile|preferences|conversation|upload|quick-bid|password|reset|onboard)/i;
const publicExceptions=new Set(['uk-dealer-guide.html','buy-motorcycles.html','sell-your-motorcycle.html','export-services.html','anybike-connect.html','motorcycle-manufacturers.html','motorcycle-types.html','international-markets.html','anybike-global.html','index.html']);
function walk(dir=''){
 let out=[];
 for(const entry of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){
  const rel=path.posix.join(dir,entry.name);
  if(entry.isDirectory()){if(!ignored.has(entry.name)&&!entry.name.startsWith('.'))out.push(...walk(rel));}
  else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(rel);
 }return out;
}
function meta(html,name){let m=[...html.matchAll(/<meta\b[^>]*>/gi)].find(x=>new RegExp('name=["\\\']'+name+'["\\\']','i').test(x[0]));return m?.[0].match(/content=["']([^"']*)/i)?.[1]||'';}
function canonical(html){return [...html.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0]).filter(x=>/rel=["']canonical["']/i.test(x)).map(x=>x.match(/href=["']([^"']*)/i)?.[1]).filter(Boolean)[0]||'';}
function classify(rel){
 const html=fs.readFileSync(path.join(ROOT,rel),'utf8');
 const robots=meta(html,'robots');const self=BASE+(rel==='index.html'?'':rel);
 const c=canonical(html);
 const reason=[];
 if(/noindex/i.test(robots))reason.push('noindex');
 if(/http-equiv=["']refresh["']/i.test(html)||/window\.location\.replace\(/i.test(html.slice(0,2000)))reason.push('redirect');
 if(c&&c!==self)reason.push('different canonical');
 const privatePage=!publicExceptions.has(rel)&&(protectedNames.test(path.posix.basename(rel))||protectedTerms.test(path.posix.basename(rel)));
 if(privatePage)reason.push('private, workflow or preview');
 if(/<title[^>]*>[^<]*(preview|test only|draft)[^<]*<\/title>/i.test(html))reason.push('preview');
 const publicCandidate=!privatePage&&!reason.includes('redirect')&&!reason.includes('different canonical')&&!reason.includes('preview');
 const published=publicCandidate&&!reason.includes('noindex')&&/<h1\b/i.test(html);
 const review=publicCandidate&&reason.includes('noindex');
 return {path:rel,url:self,robots:robots||'(none)',canonical:c,classification:published?'indexable':review?'review-public-noindex':'excluded',reason:reason.join('; '),inSitemap:false};
}
const items=walk().map(classify);
const current=fs.existsSync('sitemap.xml')?fs.readFileSync('sitemap.xml','utf8'):'';
const existing=new Set([...current.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]));
for(const item of items)item.inSitemap=existing.has(item.url);
const published=items.filter(x=>x.classification==='indexable');
const missing=published.filter(x=>!x.inSitemap);
const stale=[...existing].filter(url=>!published.some(p=>p.url===url));
const review=items.filter(x=>x.classification==='review-public-noindex');
const report={generated_at:new Date().toISOString(),counts:{html_files:items.length,indexable:published.length,missing_from_sitemap:missing.length,stale_sitemap_entries:stale.length,public_noindex_review:review.length},missing:missing.map(x=>x.path),stale,review:review.map(x=>({path:x.path,reason:x.reason})),pages:items};
console.log(JSON.stringify({counts:report.counts,missing:report.missing,stale:report.stale,review:report.review},null,2));
if(process.argv.includes('--write')){
 fs.writeFileSync('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+published.sort((a,b)=>a.url.localeCompare(b.url)).map(x=>'  <url><loc>'+x.url.replace(/&/g,'&amp;')+'</loc></url>').join('\n')+'\n</urlset>\n');
 fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/public-seo-inventory.json',JSON.stringify(report,null,2)+'\n');
 console.log('Saved sitemap.xml and reports/public-seo-inventory.json');
}
