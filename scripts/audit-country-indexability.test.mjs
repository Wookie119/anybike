import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditCountryIndexability } from './audit-country-indexability.mjs';

const BASE='https://www.anybike.co.uk/';
function fixture() {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-market-index-'));
 fs.mkdirSync(path.join(root,'markets'));
 fs.writeFileSync(path.join(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+BASE+'sitemap.xml\n');
 const page=slug=>'<html lang="en"><head><title>UK motorbikes for '+slug+'</title>'+
   '<meta name="description" content="Source a UK motorcycle">'+
   '<meta name="robots" content="index,follow"><link rel="canonical" href="'+BASE+'markets/'+slug+'.html">'+
   '</head><body><main><h1>'+slug+'</h1></main></body></html>';
 for(const slug of ['kenya','samoa'])fs.writeFileSync(path.join(root,'markets',slug+'.html'),page(slug));
 fs.writeFileSync(path.join(root,'sitemap.xml'),'<urlset>'+['kenya','samoa'].map(slug=>
   '<url><loc>'+BASE+'markets/'+slug+'.html</loc></url>').join('')+'</urlset>');
 return root;
}
test('indexable country pages with canonical, sitemap and metadata pass',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const report=auditCountryIndexability(root);
 assert.deepEqual(report.issues,[]);
 assert.equal(report.counts.sourceEligible,2);
 assert.equal(report.counts.sitemapMarketUrls,2);
});
test('noindex and canonical mismatch prevent a false clean report',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const file=path.join(root,'markets','kenya.html');
 fs.writeFileSync(file,fs.readFileSync(file,'utf8')
   .replace('index,follow','noindex,follow').replace('markets/kenya.html','markets/other.html'));
 const report=auditCountryIndexability(root);
 assert.ok(report.issues.some(x=>x.code==='robots-meta-block'));
 assert.ok(report.issues.some(x=>x.code==='non-self-canonical'));
});
test('sitemap removal, duplicate entry and missing source are detected',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const url=BASE+'markets/kenya.html';
 fs.writeFileSync(path.join(root,'sitemap.xml'),'<urlset><loc>'+url+'</loc><loc>'+url+'</loc><loc>'+BASE+'markets/ghost.html</loc></urlset>');
 const report=auditCountryIndexability(root);
 assert.ok(report.issues.some(x=>x.code==='duplicate-market-sitemap-loc'));
 assert.ok(report.issues.some(x=>x.code==='sitemap-market-source-missing'));
 assert.ok(report.issues.some(x=>x.code==='missing-or-duplicate-sitemap'));
});
test('blocking robots policy is detected without altering files',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.writeFileSync(path.join(root,'robots.txt'),'User-agent: *\nDisallow: /\n');
 const report=auditCountryIndexability(root);
 assert.ok(report.issues.some(x=>x.code==='robots-crawl-review'));
});


test('market-specific robots disallow is flagged even if homepage remains crawlable',t=>{
 const root=fixture();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.writeFileSync(path.join(root,'robots.txt'),'User-agent: *\\nAllow: /\\nDisallow: /markets/\\n');
 const report=auditCountryIndexability(root);
 assert.ok(report.issues.some(x=>x.code==='robots-crawl-review'));
});
