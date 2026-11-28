// Keep the initial HTML of each indexed model guide useful before JavaScript.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const origin='https://www.anybike.co.uk';
const headingPattern=/<h1 id="heading">[^<]*<\/h1>/;
const summaryPattern=/<div class="intro" id="summary">(?:<p>[^<]*<\/p>)?<\/div>/;
const manufacturerPattern=/<a id="manufacturer" class="button secondary" href="[^"]*">[^<]*<\/a>/;
const schemaPattern=/<script id="modelStructuredData" type="application\/ld\+json">[^<]*<\/script>/;
const escapeHtml=value=>value.replace(/[&<>"']/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));
const unescapeHtml=value=>value.replace(/&(amp|lt|gt|quot|#39);/g,(_,entity)=>({
 amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"
}[entity]));

export function modelManufacturerRoutes(){
 const registry=new Map([...read('motorcycle-manufacturers.html').matchAll(
  /<a class="brand" data-name="([^"]+)" href="([^"]+)"/g
 )].map(([,name,href])=>[name,href]));
 registry.set('indian',registry.get('indian motorcycle'));
 return registry;
}

export function withStaticModelSeo(html,route,manufacturers){
 const {url,make,model}=route;
 const preferred=origin+url;
 const heading=make+' '+model;
 const head=html.split('</head>',1)[0];
 const title=head.match(/<title>([^<]+)<\/title>/)?.[1];
 const description=head.match(/<meta name="description" content="([^"]+)">/)?.[1];
 const canonical=head.match(/id="modelCanonical" rel="canonical" href="([^"]+)"/)?.[1];
 const manufacturer=manufacturers.get(make.toLowerCase());
 assert(canonical===preferred&&title&&description&&manufacturer,'Incomplete model metadata: '+url);
 for(const pattern of [headingPattern,summaryPattern,manufacturerPattern,schemaPattern]){
  assert(pattern.test(html),'Missing static metadata target on '+url);
 }
 const schema=JSON.stringify({
  '@context':'https://schema.org','@type':'WebPage',
  name:unescapeHtml(title),description:unescapeHtml(description),url:preferred,
  isPartOf:{'@type':'WebSite',name:'AnyBike',url:origin+'/'}
 }).replaceAll('<','\\u003c');
 return html.replace(headingPattern,()=>'<h1 id="heading">'+escapeHtml(heading)+'</h1>')
  .replace(summaryPattern,()=>'<div class="intro" id="summary"><p>'+description+'</p></div>')
  .replace(manufacturerPattern,()=>'<a id="manufacturer" class="button secondary" href="'+
   escapeHtml(manufacturer)+'">Explore '+escapeHtml(make)+' motorcycles →</a>')
  .replace(schemaPattern,()=>'<script id="modelStructuredData" type="application/ld+json">'+schema+'</script>');
}

export function modelSeoLayout(html){
 return html.replace(headingPattern,'<h1 id="heading"></h1>')
  .replace(summaryPattern,'<div class="intro" id="summary"></div>')
  .replace(manufacturerPattern,'<a id="manufacturer" class="button secondary" href="/motorcycle-manufacturers.html">View manufacturer models →</a>');
}

function main(){
 const indexed=new Set([...read('sitemap-motorcycle-models.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([,url])=>url));
 const registry=JSON.parse(read('data/universal-v2-model-routes.json')).models;
 const manufacturers=modelManufacturerRoutes();
 const ready=[];
 for(const route of registry){
  if(!indexed.has(origin+route.url))continue;
  const path=route.url.slice(1);
  const current=read(path);
  ready.push({path,current,expected:withStaticModelSeo(current,route,manufacturers)});
 }
 assert.equal(ready.length,indexed.size,'Missing model route in registry');
 const changed=ready.filter(page=>page.current!==page.expected);
 if(process.argv.includes('--check')){
  assert.equal(changed.length,0,'Run node scripts/build-static-model-seo.mjs to update model metadata');
  console.log('PASS: '+ready.length+' indexed model pages have crawlable headings and manufacturer links');
 }else{
  for(const page of changed)writeFileSync(new URL(page.path,root),page.expected);
  console.log('Updated static SEO on '+changed.length+' of '+ready.length+' indexed models');
 }
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)main();
