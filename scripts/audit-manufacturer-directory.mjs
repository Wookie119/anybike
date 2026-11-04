/**
 * Verify the approved manufacturer directory against canonical database IDs.
 * Source-only SEO and routing audit; NEVER invent or publish manufacturer guides.
 * Existing full BMW and Harley guides are preserved. Other brands route to
 * the existing make-prefilled sourcing request until their guides are approved.
 */
import fs from 'node:fs';
import path from 'node:path';
const BASE='https://www.anybike.co.uk';
const normal=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
export function auditManufacturerDirectory({html,manufacturers,legacyHtml,requestHtml}={}){
 if(typeof html!=='string'||!Array.isArray(manufacturers)||typeof legacyHtml!=='string'||typeof requestHtml!=='string')
  throw new TypeError('Manufacturer catalogue and three HTML sources required');
 const issues=[],pages=[],seen=new Set();
 const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
 if(canonical!==BASE+'/motorcycle-manufacturers.html')issues.push('directory-non-self-canonical');
 if(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(html))
  issues.push('directory-noindex');
 const description=html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]||'';
 if(!description.includes(String(manufacturers.length)+' motorcycle manufacturers'))
  issues.push('directory-count-description-mismatch');
 const canonicalIds=new Map();
 for(const m of manufacturers){
  const k=normal(m.display_name);
  if(!k||canonicalIds.has(k))issues.push('duplicate-catalogue-manufacturer:'+m.display_name);
  canonicalIds.set(k,m);
 }
 const cards=[...html.matchAll(/<a\s+class=["']brand["'][^>]*>[\s\S]*?<\/a>/gi)];
 if(cards.length!==manufacturers.length)issues.push('directory-card-count-mismatch');
 for(const m of cards){
  const card=m[0];
  const name=card.match(/<strong>([^<]+)<\/strong>/i)?.[1]?.trim();
  const href=card.match(/\bhref=["']([^"']+)["']/i)?.[1];
  const row=canonicalIds.get(normal(name));
  if(!row){issues.push('not-in-manufacturer-catalogue:'+name);continue;}
  if(seen.has(row.id)){issues.push('duplicate-directory-manufacturer:'+name);continue;}
  seen.add(row.id);
  const expected=name==='BMW'?'/bmw-motorcycles.html':
   name==='Harley-Davidson'?'/harley-davidson-motorcycles.html':
   '/bulk-buying-request.html?make='+encodeURIComponent(name);
  if(href!==expected)issues.push('unexpected-brand-destination:'+name);
  pages.push({manufacturerId:row.id,name,href});
 }
 for(const row of manufacturers)if(!seen.has(row.id))
  issues.push('missing-directory-manufacturer:'+row.display_name);
 if(!/<meta\b[^>]*name=["']robots["'][^>]*content=["']noindex,follow["']/i.test(legacyHtml))
  issues.push('legacy-unapproved-brand-not-noindex');
 if(!legacyHtml.includes('href="https://www.anybike.co.uk/motorcycle-manufacturers.html"'))
  issues.push('legacy-brand-canonical-not-directory');
 if(!/new URLSearchParams\(location\.search\)/.test(requestHtml)||
    !/\.get\(["']make["']\)/.test(requestHtml))
  issues.push('manufacturer-sourcing-query-not-supported');
 return {scope:'repository source SEO and routing only; not proof of live 123-reg deployment or Google indexing',
  counts:{catalogueManufacturers:manufacturers.length,directoryCards:cards.length,
   linksToApprovedGuides:pages.filter(p=>p.href.endsWith('-motorcycles.html')).length,
   linksToSourcing:pages.filter(p=>p.href.startsWith('/bulk-buying-request.html?make=')).length,
   issues:issues.length},issues,pages};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const root=process.cwd();
 const catalogue=JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/manufacturer-directory-50-20261104.json'),'utf8'));
 const report=auditManufacturerDirectory({
  html:fs.readFileSync(path.join(root,'motorcycle-manufacturers.html'),'utf8'),
  legacyHtml:fs.readFileSync(path.join(root,'motorcycle-brand.html'),'utf8'),
  requestHtml:fs.readFileSync(path.join(root,'bulk-buying-request.html'),'utf8'),
  manufacturers:catalogue.manufacturers
 });
 fs.mkdirSync(path.join(root,'reports'),{recursive:true});
 fs.writeFileSync(path.join(root,'reports/manufacturer-directory-audit.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({counts:report.counts,issues:report.issues},null,2));
 if(report.issues.length)process.exitCode=1;
}
