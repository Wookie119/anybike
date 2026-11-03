// AnyBike public SEO quality guard. Read-only, no files or pages are rewritten.
// Run: node scripts/check-public-seo-quality.mjs
// This verifies every sitemap entry, all published market pages and all public Global articles.
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const base='https://www.anybike.co.uk/';
const xml=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
const issues=[], warnings=[];
const titles=new Map(), descriptions=new Map();
const stats={sitemap:urls.length,market_pages:0,global_articles:0,manufacturer_queries:0,static_urls:0,missing_titles:0,missing_descriptions:0,missing_language_tags:0,short_descriptions:0,missing_h1:0,missing_canonicals:0,blocked_by_noindex:0,missing_files:0,duplicates:0};
const deny=/(^|\/)(admin[^/]*|private[^/]*|customer[^/]*|dashboard[^/]*|login|signup|register|deal-360|my-purchases|my-watchlist|my-searches|bike-details)([./?]|$)/i;
function attrs(tag){
  const a={};
  for(const m of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) a[m[1].toLowerCase()]=m[2]??m[3];
  return a;
}
function tags(html,pattern){return [...html.matchAll(pattern)].map(m=>attrs(m[0]));}
function meta(html,name){return tags(html,/<meta\b[^>]*>/gi).find(x=>x.name?.toLowerCase()===name)?.content||'';}
function canonical(html){return tags(html,/<link\b[^>]*>/gi).find(x=>(x.rel||'').toLowerCase().split(/\s+/).includes('canonical'))?.href||'';}
function capture(map,key,url){if(!key)return;const normalized=key.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim().toLowerCase();map.set(normalized,[...(map.get(normalized)||[]),url]);}
if(new Set(urls).size!==urls.length){issues.push('Duplicate sitemap URLs');stats.duplicates=urls.length-new Set(urls).size;}
for(const url of urls){
  if(!url.startsWith(base)){issues.push('Noncanonical host: '+url);continue;}
  let parsed;try{parsed=new URL(url)}catch{issues.push('Invalid URL: '+url);continue;}
  const relative=decodeURIComponent(parsed.pathname.slice(1));
  const file=relative||'index.html';
  if(file.includes('..')||deny.test(file)){issues.push('Private/workflow URL in sitemap: '+url);continue;}
  if(parsed.search){
    if(relative!=='motorcycle-brand.html'||![...parsed.searchParams.keys()].every(k=>k==='make')||!parsed.searchParams.get('make'))issues.push('Unapproved query URL: '+url);
    else stats.manufacturer_queries++;
  }else stats.static_urls++;
  if(relative.startsWith('markets/')&&relative.endsWith('.html')&&relative!=='markets/index.html')stats.market_pages++;
  if(relative.startsWith('global/')&&relative.endsWith('.html'))stats.global_articles++;
  if(!fs.existsSync(path.join(root,file))){issues.push('Missing sitemap HTML file: '+file);stats.missing_files++;continue;}
  const html=fs.readFileSync(path.join(root,file),'utf8');
  const robots=meta(html,'robots');
  if(/\bnoindex\b/i.test(robots)){issues.push('Noindex URL present in sitemap: '+url);stats.blocked_by_noindex++;}
  if(!/<h1\b/i.test(html)){issues.push('Missing H1 on public page: '+url);stats.missing_h1++;}
  const title=html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()||'';
  const description=meta(html,'description').trim();
  const language=html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)/i)?.[1]||'';
  const canon=canonical(html);
  if(!title){issues.push('Missing title: '+url);stats.missing_titles++;}
  if(!description){issues.push('Missing description: '+url);stats.missing_descriptions++;}
  else if(description.length<50){stats.short_descriptions++;warnings.push('Short description: '+url);}
  if(!language){stats.missing_language_tags++;warnings.push('No HTML language tag: '+url);}
  if(!canon){issues.push('Missing canonical: '+url);stats.missing_canonicals++;}
  else if(!parsed.search&&canon!==url){issues.push('Non-self canonical: '+url+' -> '+canon);}
  // Shared manufacturer query pages intentionally update title/canonical in JS.
  // This checks that the mechanism exists; it cannot prove Google renders it.
  if(parsed.search&&relative==='motorcycle-brand.html'){
    if(!html.includes('document.getElementById("canonicalLink").href=')||
       !html.includes('document.title=make+')){
      issues.push('Shared brand route lacks JS SEO updater: '+url);
    }
    continue;
  }
  if(/\b(refresh)\b/i.test(tags(html,/<meta\b[^>]*>/gi).find(x=>x['http-equiv']?.toLowerCase()==='refresh')?.['http-equiv']||''))issues.push('Meta refresh page in sitemap: '+url);
  capture(titles,title,url);
  capture(descriptions,description,url);
}
// Market pages are a primary AnyBike acquisition channel; index coverage must not regress.
const marketDir=path.join(root,'markets');
const marketFiles=fs.readdirSync(marketDir).filter(p=>p.endsWith('.html')&&p!=='index.html');
const known=new Set(urls);
for(const p of marketFiles)if(!known.has(base+'markets/'+p))issues.push('Market missing from sitemap: markets/'+p);
if(stats.market_pages!==marketFiles.length)issues.push('Market count mismatch: '+stats.market_pages+' in sitemap, '+marketFiles.length+' published country pages');
const globalDir=path.join(root,'global');
for(const p of fs.readdirSync(globalDir).filter(x=>x.endsWith('.html'))){
 const html=fs.readFileSync(path.join(globalDir,p),'utf8');
 const can=canonical(html), robots=meta(html,'robots');
 const url=base+'global/'+p;
 if(!/\bnoindex\b/i.test(robots)&&can===url&&!known.has(url))issues.push('Indexable Global story omitted from sitemap: '+p);
 if(/\bnoindex\b/i.test(robots)&&known.has(url))issues.push('Noindex Global story included in sitemap: '+p);
}
for(const [title,pages] of titles)if(pages.length>1)warnings.push('Duplicate public title: '+JSON.stringify({title,pages:pages.slice(0,6),count:pages.length}));
for(const [desc,pages] of descriptions)if(pages.length>1)warnings.push('Duplicate public description: '+JSON.stringify({description:desc.slice(0,75),pages:pages.slice(0,6),count:pages.length}));
if(stats.manufacturer_queries!==47)issues.push('Expected 47 approved manufacturer view URLs, got '+stats.manufacturer_queries);
console.log(JSON.stringify({result:issues.length?'FAIL':'PASS',stats,errors:issues.slice(0,100),warnings_count:warnings.length,warnings_sample:warnings.slice(0,20)},null,2));
if(issues.length)process.exitCode=1;
