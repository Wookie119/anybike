/**
 * AnyBike international-market SEO source audit (non-mutating).
 * Verifies every /markets/*.html source against sitemap, canonical, robots,
 * H1 and indexability. These are source signals, not live Google indexing.
 * Usage: node scripts/audit-country-indexability.mjs [--strict]
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.anybike.co.uk/';
function tags(html, name) {
  return [...html.matchAll(new RegExp('<' + name + '\\b[^>]*>', 'gi'))].map(x => x[0]);
}
function attr(tag, name) {
  const escaped = name.replace(/[^a-z0-9-]/gi, '');
  return tag.match(new RegExp('\\b' + escaped + '\\s*=\\s*["\\x27]([^"\\x27]*)["\\x27]', 'i'))?.[1] ?? '';
}
function isRobotsBlocked(robots) {
  // Conservative check for blocking the site or the markets subtree.
  // Full Googlebot-specific matching and server headers require a live audit.
  return robots.split(/\r?\n/).some(line => {
    const m=line.replace(/#.*/, '').match(/^\s*Disallow:\s*(\S+)/i);
    if(!m)return false;
    const rule=m[1].toLowerCase();
    return rule==='/' || rule==='/*' || rule==='/markets' ||
      rule.startsWith('/markets/');
  });
}
export function auditCountryIndexability(root) {
  const sitemap = fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
  const locs=[...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m=>m[1].trim());
  const expectedBase=BASE+'markets/';
  const sitemapMarkets=locs.filter(u=>u.startsWith(expectedBase));
  const siteCounts=new Map();
  for(const u of sitemapMarkets)siteCounts.set(u,(siteCounts.get(u)||0)+1);
  const dir=path.join(root,'markets');
  const filenames=fs.readdirSync(dir,{withFileTypes:true})
    .filter(f=>f.isFile() && f.name.endsWith('.html')).map(f=>f.name).sort();
  const fileSet=new Set(filenames);
  const issues=[],pages=[];
  const robotsPath=path.join(root,'robots.txt');
  const robots=fs.existsSync(robotsPath)?fs.readFileSync(robotsPath,'utf8'):'';
  if(!/User-agent:\s*\*/i.test(robots) || isRobotsBlocked(robots)) {
    issues.push({code:'robots-crawl-review',path:'robots.txt'});
  }
  for(const file of filenames){
    const rel='markets/'+file,expected=BASE+rel;
    const html=fs.readFileSync(path.join(dir,file),'utf8');
    const meta=tags(html,'meta'),links=tags(html,'link');
    const directives=meta.filter(t=>['robots','googlebot'].includes(attr(t,'name').toLowerCase()))
      .map(t=>attr(t,'content')).join(',');
    const canonTags=links.filter(t=>attr(t,'rel').toLowerCase().split(/\s+/).includes('canonical'));
    const canonical=canonTags.length===1?attr(canonTags[0],'href'):null;
    const titles=[...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/gi)]
      .map(x=>x[1].trim()).filter(Boolean);
    const desc=meta.filter(t=>attr(t,'name').toLowerCase()==='description')
      .map(t=>attr(t,'content').trim()).filter(Boolean);
    const found=[];
    if((siteCounts.get(expected)||0)!==1)found.push('missing-or-duplicate-sitemap');
    if(!/^[a-z0-9-]+\.html$/i.test(file))found.push('invalid-market-filename');
    if(canonTags.length!==1||canonical!==expected)found.push('non-self-canonical');
    if(/\b(?:noindex|none|nofollow)\b/i.test(directives))found.push('robots-meta-block');
    if(titles.length!==1)found.push('title-missing-or-duplicate');
    if(desc.length!==1)found.push('description-missing-or-duplicate');
    if(!/<h1\b/i.test(html))found.push('h1-missing');
    if(/http-equiv\s*=\s*["']refresh["']/i.test(html))found.push('redirect');
    pages.push({path:rel,url:expected,sourceEligible:found.length===0,issues:found});
    for(const code of found)issues.push({code,path:rel});
  }
  for(const url of sitemapMarkets) {
    const relative=url.slice(expectedBase.length);
    if(!/^[a-z0-9-]+\.html$/i.test(relative)||!fileSet.has(relative))
      issues.push({code:'sitemap-market-source-missing',path:url});
    if((siteCounts.get(url)||0)>1)
      issues.push({code:'duplicate-market-sitemap-loc',path:url});
  }
  const eligible=pages.filter(p=>p.sourceEligible).length;
  return {
    scope:'repository source only — live server headers and Google indexing not confirmed',
    counts:{sitemapMarketUrls:sitemapMarkets.length,marketHtmlFiles:filenames.length,
      sourceEligible:eligible,needsReview:pages.length-eligible,issues:issues.length},
    issues,pages
  };
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
  const report=auditCountryIndexability(process.cwd());
  console.log(JSON.stringify(report,null,2));
  if(process.argv.includes('--strict')&&report.issues.length)process.exitCode=1;
}
