// node scripts/audit-market-indexing-readiness.mjs
// Read-only audit: do not submit every market page to Google merely because it exists.
// Review all 217 country destinations from the actual international market directory.
import fs from 'node:fs';
const directory=fs.readFileSync('international-markets.html','utf8');
const slugs=[...new Set([...directory.matchAll(/\/markets\/([a-z0-9-]+)\.html/g)].map(x=>x[1]))];
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const rows=[];
for(const slug of slugs){
 const path='markets/'+slug+'.html';
 const url='https://www.anybike.co.uk/'+path;
 if(!fs.existsSync(path)){rows.push({slug,status:'missing file'});continue}
 const html=fs.readFileSync(path,'utf8');
 const head=html.split(/<\/head>/i)[0];
 const title=(head.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]||'';
 const description=(head.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']*)/i)||[])[1]||'';
 const canonical=(head.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)/i)||[])[1]||'';
 const robots=(head.match(/<meta\s+name=["']robots["'][^>]*content=["']([^"']*)/i)||[])[1]||'';
 const h1=(html.match(/<h1\b/gi)||[]).length;
 const h2=(html.match(/<h2\b/gi)||[]).length;
 const isListed=sitemap.includes('<loc>'+url+'</loc>');
 const checks={indexable:/\bindex\b/i.test(robots)&&!/noindex/i.test(robots),canonical:canonical===url,h1:h1===1,title:title.length>25,description:description.length>70,substantial:html.length>17000&&h2>=5};
 const ready=Object.values(checks).every(Boolean);
 rows.push({slug,status:ready?'candidate for editorial review':'needs improvement',inSitemap:isListed,failed:Object.keys(checks).filter(k=>!checks[k]).join(',')});
}
const summary={marketPages:slugs.length,candidates:rows.filter(r=>r.status==='candidate for editorial review').length,needsImprovement:rows.filter(r=>r.status==='needs improvement').length,missing:rows.filter(r=>r.status==='missing file').length,sitemapListed:rows.filter(r=>r.inSitemap).length};
console.log(JSON.stringify(summary,null,2));
console.log('Missing / incomplete (first 30):');
rows.filter(r=>r.status!=='candidate for editorial review').slice(0,30).forEach(x=>console.log(x.slug+' | '+x.status+' | '+(x.failed||'')));
const listedFailures=rows.filter(r=>r.inSitemap&&r.status!=='candidate for editorial review');
if(listedFailures.length){console.error('REVIEW: '+listedFailures.length+' included market pages require manual editorial checking.');process.exitCode=1}
