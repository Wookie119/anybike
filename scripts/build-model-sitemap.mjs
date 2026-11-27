#!/usr/bin/env node
// Keep the two model URL lists in sync with the published V2 route registry.
import {readFileSync,writeFileSync} from 'node:fs';

const base='https://www.anybike.co.uk';
const files={
 main:new URL('../sitemap.xml',import.meta.url),
 models:new URL('../sitemap-motorcycle-models.xml',import.meta.url)
};
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const registry=JSON.parse(read('../data/universal-v2-model-routes.json')).models;
const routes=new Set(registry.map(row=>row.url));
if(routes.size!==registry.length)throw Error('Duplicate published model routes');

const canonical=new Map();
for(const route of routes){
 if(!/^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/.test(route))throw Error('Invalid model route: '+route);
 const head=read('..'+route).split(/<\/head\s*>/i,1)[0];
 const href=head.match(/<link id="modelCanonical" rel="canonical" href="([^"]+)"/)?.[1];
 if(!href?.startsWith(base+'/models/')||!routes.has(href.slice(base.length))){
  throw Error('Missing or unregistered canonical on '+route);
 }
 const robots=[...head.matchAll(/<meta\b[^>]*>/gi)].map(match=>match[0])
  .filter(tag=>/\bname=["'](?:robots|[\w-]*bot(?:-[\w-]+)?)["']/i.test(tag));
 if(robots.some(tag=>/\bcontent=["'][^"']*\b(?:noindex|none)\b/i.test(tag))){
  throw Error('Published model route blocks indexing: '+route);
 }
 canonical.set(base+route,href);
}
for(const target of canonical.values()){
 if(canonical.get(target)!==target)throw Error('Model canonical points to another alias: '+target);
}
const models=[...canonical].filter(([url,target])=>url===target).map(([url])=>url)
 .sort((a,b)=>a.slice(0,-5).localeCompare(b.slice(0,-5),'en'));
const modelSet=new Set(models);
const main=read(files.main);
const modelEntry=/\s*<url>\s*<loc>(https:\/\/www\.anybike\.co\.uk\/models\/[^<]+|https:\/\/www\.anybike\.co\.uk\/motorcycle-model-guide\.html\?[^<]+)<\/loc>[\s\S]*?<\/url>/g;
const included=new Set();
const retained=main.replace(modelEntry,(entry,url)=>{
 if(!modelSet.has(url)||included.has(url))return '';
 included.add(url);
 return entry;
});
const entry=url=>'  <url><loc>'+url+'</loc></url>';
const additions=models.filter(url=>!included.has(url));
const expectedMain=additions.length
 ? retained.replace(/\s*<\/urlset>\s*$/,'\n'+additions.map(entry).join('\n')+'\n</urlset>\n')
 : retained;
if(!/<\/urlset>\s*$/.test(expectedMain))throw Error('Invalid main sitemap');
const expectedModels='<?xml version="1.0" encoding="UTF-8"?>\n'+
 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+models.map(entry).join('\n')+'\n</urlset>\n';

if(process.argv.includes('--check')){
 if(main!==expectedMain||read(files.models)!==expectedModels){
  throw Error('Model sitemaps are out of sync. Run node scripts/build-model-sitemap.mjs');
 }
 console.log('PASS: both sitemaps contain all '+models.length+' canonical V2 model routes');
}else{
 writeFileSync(files.main,expectedMain);
 writeFileSync(files.models,expectedModels);
 console.log('Updated both sitemaps with '+models.length+' canonical V2 model routes');
}
