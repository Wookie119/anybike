/**
 * AnyBike strict source-level Google crawlability check for catalogue guide routes.
 * Run: node scripts/check-registered-editorial-indexability.mjs
 *
 * These checks verify source HTML and sitemap/robots evidence, NOT server
 * responses, X-Robots-Tag headers, crawlability from Googlebot, or indexing.
 * Source fixture is a read-only model-ID snapshot and is not a publication flag.
 */
import fs from 'node:fs';
import path from 'node:path';
import {inventoryEditorialUrls} from './build-editorial-url-inventory.mjs';
import {matchCatalogueGuides} from './match-catalogue-guides.mjs';

const BASE='https://www.anybike.co.uk';
function tags(html,element) {
 return [...html.matchAll(new RegExp('<'+element+'\\b[^>]*>', 'gi'))].map(x=>x[0]);
}
function attr(tag,name) {
 return tag.match(new RegExp('\\b'+name+'\\s*=\\s*["\\x27]([^"\\x27]*)["\\x27]','i'))?.[1] || '';
}
export function checkRegisteredEditorialIndexability({root,manufacturers,models,expectedPaths=[]}) {
 const inventory=inventoryEditorialUrls(root,{manufacturers,models});
 const match=matchCatalogueGuides({inventory,manufacturers,models});
 const issues=[],checked=[];
 const robotFile=path.join(root,'robots.txt');
 const robots=fs.existsSync(robotFile)?fs.readFileSync(robotFile,'utf8'):'';
 // The current robots policy is intentionally broad. Fail if it changes in a
 // way that could block editorial routes, rather than guessing robots syntax.
 if(!/^User-agent:\s*\*\s*$/mi.test(robots) ||
    !/^Allow:\s*\/\s*$/mi.test(robots) ||
    /(?:^\s*Disallow:\s*\/(?:\s|$)|^\s*Sitemap:.*(?:localhost|127\.0\.0\.1))/im.test(robots) ||
    !robots.includes('Sitemap: '+BASE+'/sitemap.xml')) {
   issues.push({code:'robots-crawl-policy-needs-review'});
 }
 const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 const listed=[...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>m[1].trim());
 const unique=new Set(listed);
 if(unique.size!==listed.length)issues.push({code:'duplicate-sitemap-loc'});
 const byPath=new Map(match.pages.map(p=>[p.url,p]));
 for(const p of expectedPaths) {
   if(!byPath.has(p))issues.push({code:'expected-route-not-source-eligible',path:p});
 }
 for(const page of match.pages) {
  const filename=page.url.slice(1);
  const html=fs.readFileSync(path.join(root,filename),'utf8');
  const meta=tags(html,'meta');
  const robotsMeta=meta.filter(t=>attr(t,'name').toLowerCase()==='robots' ||
     attr(t,'name').toLowerCase()==='googlebot');
  const directive=robotsMeta.map(t=>attr(t,'content')).join(',');
  const canon=tags(html,'link').filter(t=>attr(t,'rel').toLowerCase()==='canonical');
  const canonical=canon.length===1?attr(canon[0],'href'):'';
  const expected=BASE+page.url;
  const problems=[];
  if(!unique.has(expected))problems.push('sitemap-missing');
  if(canonical!==expected)problems.push('canonical-mismatch');
  if(/\b(?:noindex|none|nofollow|noarchive)\b/i.test(directive))problems.push('robots-meta-restriction');
  if(!/<h1\b/i.test(html))problems.push('missing-h1');
  if(/http-equiv\s*=\s*["']refresh["']/i.test(html))problems.push('meta-redirect');
  checked.push({path:page.url,id:page.id,sourceIndexable:problems.length===0});
  for(const problem of problems)issues.push({code:problem,path:page.url});
 }
 return {scope:'source HTML only; cannot confirm Google indexing or live HTTP headers',
   checkedCount:checked.length,sourceEligibleCount:checked.filter(x=>x.sourceIndexable).length,
   issues,checked,skippedAmbiguous:match.diagnostics};
}
if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const dataset=JSON.parse(fs.readFileSync('scripts/fixtures/bmw-harley-catalogue-ids-20261104.json','utf8'));
 const routeFixture=JSON.parse(fs.readFileSync('scripts/fixtures/registered-editorial-indexability-20261104.json','utf8'));
 const report=checkRegisteredEditorialIndexability({root:process.cwd(),
   manufacturers:dataset.manufacturers,models:dataset.models,expectedPaths:routeFixture.expectedPaths});
 fs.mkdirSync('reports',{recursive:true});
 fs.writeFileSync('reports/editorial-indexability-audit.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({checked:report.checkedCount,eligible:report.sourceEligibleCount,
    issues:report.issues,skippedAmbiguous:report.skippedAmbiguous,scope:report.scope},null,2));
 if(report.issues.length)process.exitCode=1;
}
