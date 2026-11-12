#!/usr/bin/env node
// Rebuild only the model URL entries. Preserve manually curated routes and country pages.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sitemapPath=resolve(root,'sitemap.xml');
const catalogue=JSON.parse(readFileSync(resolve(root,'data/motorcycle-index-identities.json'),'utf8'));
const original=readFileSync(sitemapPath,'utf8');
const encode=s=>encodeURIComponent(String(s).trim());
const escapeXml=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const identities=new Map();
for(const item of catalogue.models){
 const make=String(item.make||'').trim(),model=String(item.model||'').trim();
 if(!make||!model)throw Error('Blank make or model in published catalogue');
 const key=make.toLowerCase()+'|'+model.toLowerCase();
 if(identities.has(key))throw Error('Duplicate model identity: '+key);
 identities.set(key,{make,model});
}
const withoutModels=original.replace(/\s*<url>\s*<loc>https:\/\/www\.anybike\.co\.uk\/motorcycle-model-guide\.html\?make=[^<]*<\/loc>\s*<\/url>/g,'');
const modelLines=[...identities.values()].sort((a,b)=>a.make.localeCompare(b.make)||a.model.localeCompare(b.model)).map(({make,model})=>{
 const url='https://www.anybike.co.uk/motorcycle-model-guide.html?make='+encode(make)+'&model='+encode(model);
 return '  <url><loc>'+escapeXml(url)+'</loc></url>';
}).join('\n');
const updated=withoutModels.replace(/\s*<\/urlset>\s*$/, '\n'+modelLines+'\n</urlset>\n');
if(!updated.includes('</urlset>'))throw Error('Malformed sitemap; missing urlset close');
if(process.argv.includes('--check')){
 const existing=[...original.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 const expected=[...updated.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 const actualModels=existing.filter(x=>x.includes('/motorcycle-model-guide.html?')).sort();
 const desiredModels=expected.filter(x=>x.includes('/motorcycle-model-guide.html?')).sort();
 if(JSON.stringify(actualModels)!==JSON.stringify(desiredModels))throw Error('Model sitemap is out of sync; run node scripts/build-model-sitemap.mjs');
 console.log('PASS: sitemap contains '+identities.size+' current model identities');
}else{
 writeFileSync(sitemapPath,updated);
 console.log('Updated model sitemap from '+identities.size+' published identities');
}
