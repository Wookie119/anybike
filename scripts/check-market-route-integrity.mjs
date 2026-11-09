// AnyBike: automatic public market-route integrity audit.
// Country pages remain authored by the existing approved templates.
// This check verifies actual repository files and sitemap discovery; it does
// not assert the live site is reachable or mark any route publication-approved.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const marketFolder=path.join(root,'markets');
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const prefix='https://www.anybike.co.uk/markets/';
const sitemapMarkets=locs.filter(x=>x.startsWith(prefix)&&/^https:\/\/www\.anybike\.co\.uk\/markets\/[a-z0-9-]+\.html$/.test(x));
const folderMarkets=fs.readdirSync(marketFolder).filter(name=>/^[a-z0-9-]+\.html$/.test(name));
const issues=[];
if(sitemapMarkets.length!==217)issues.push('Expected 217 canonical country URLs; found '+sitemapMarkets.length);
if(new Set(sitemapMarkets).size!==sitemapMarkets.length)issues.push('Duplicate market URLs in sitemap');
if(new Set(folderMarkets).size!==folderMarkets.length)issues.push('Duplicate market filenames');
const sitemapFiles=new Set(sitemapMarkets.map(x=>x.slice(prefix.length)));
for(const filename of folderMarkets){
 const file=path.join(marketFolder,filename);
 const html=fs.readFileSync(file,'utf8');
 if(!sitemapFiles.has(filename))issues.push('Market page not discoverable in sitemap: '+filename);
 if(!/<h1\b/i.test(html))issues.push('Missing market heading: '+filename);
 const robots=[...html.matchAll(/<meta\b[^>]*>/gi)].map(x=>x[0])
  .find(x=>/\bname\s*=\s*['"]robots['"]/i.test(x))||'';
 if(/\bnoindex\b/i.test(robots))issues.push('Noindex market in public directory: '+filename);
 const canonical=[...html.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0])
  .find(x=>/\brel\s*=\s*['"]canonical['"]/i.test(x))||'';
 const canonicalHref=canonical.match(/\bhref\s*=\s*['"]([^'"]+)/i)?.[1];
 if(canonicalHref&&canonicalHref!==prefix+filename)
  issues.push('Country canonical mismatch: '+filename+' -> '+canonicalHref);
}
for(const filename of sitemapFiles)if(!folderMarkets.includes(filename))
 issues.push('Sitemap points to missing market file: '+filename);
if(issues.length){
 issues.forEach(x=>console.error('FAIL: '+x));
 process.exitCode=1;
}else{
 assert.equal(sitemapMarkets.length,217);
 console.log('PASS: 217 indexed market routes exist with headings, permitted robots and matching canonicals.');
 console.log('NOTE: Repository checks do not constitute a live HTTP or country editorial review.');
}
