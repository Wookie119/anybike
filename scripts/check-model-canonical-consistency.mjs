// Check source and rendered SEO identity for the public model URL pairs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import {hasLegacyModelCanonical,legacyModelCanonical,legacyModelRoutes} from './legacy-model-canonical.mjs';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const origin='https://www.anybike.co.uk';
const permanent=JSON.parse(read('data/universal-v2-model-routes.json')).models;
const sitemap=read('sitemap.xml');
const renderer=read('model-template/approved-v2-universal-preview.mjs');
const start=renderer.indexOf("  const canonicalNode=$('modelCanonical');");
const end=renderer.indexOf("  $('heading').textContent=title;",start);
assert(start>=0&&end>start,'Model SEO rendering block missing');
const updateHead=new Script('(async()=>{'+renderer.slice(start,end)+'})()');

async function renderCanonical(path,href,approvedDedicatedRoute,identity){
 const canonicalNode={href,getAttribute:()=>href};
 const schema={};
 const social={};
 const result=await updateHead.runInNewContext({
  $:id=>id==='modelCanonical'?canonicalNode:schema,
  location:{pathname:path},approvedDedicatedRoute,
  make:identity.make,model:identity.model,canonicalId:identity.model_id,
  pageTitle:'Model title',description:'Model description',title:'Model',
  URL,arr:value=>Array.isArray(value)?value:[],
  normalize:value=>String(value).toLowerCase(),
  document:{querySelector:selector=>({setAttribute:(name,value)=>{social[selector]=value;}})},
  fetch:async path=>{
   assert.equal(path,'/data/universal-v2-model-routes.json','Only lookup routes may fetch a canonical');
   assert(!approvedDedicatedRoute,'Permanent canonical must be available without a fetch');
   return {ok:true,json:async()=>({models:permanent})};
  }
 });
 assert.equal(result,undefined);
 assert.equal(canonicalNode.href,social['meta[property="og:url"]']);
 assert.equal(canonicalNode.href,JSON.parse(schema.textContent).url);
 return canonicalNode.href;
}

for(const {url} of legacyModelRoutes){
 const preferred=legacyModelCanonical(url);
 const route=new URL(preferred).pathname;
 const before=read(url.slice(1));
 const after=read(route.slice(1));
 const identity=permanent.find(row=>row.url===route);
 assert(hasLegacyModelCanonical(before,url),url+' legacy canonical');
 assert(after.includes('rel="canonical" href="'+preferred+'"'),route+' self canonical');
 assert(sitemap.includes('<loc>'+preferred+'</loc>'),route+' missing in sitemap');
 assert(!sitemap.includes('<loc>'+origin+url+'</loc>'),url+' duplicate sitemap target');
 if(url==='/bmw-r1300gs.html'){
  const schema=JSON.parse(before.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
  assert.equal(schema.url,preferred,'Protected R 1300 GS structured data canonical');
 }
 if(url==='/harley-davidson-xr1000.html'){
  const article=JSON.parse(before.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
  assert.equal(article.mainEntityOfPage,preferred,'XR1000 article structured data canonical');
 }
 for(const [path,html] of [[url,before],[route,after]]){
  const head=html.split('</head>',1)[0];
  assert(head.includes('property="og:url" content="'+preferred+'"'),path+' social URL');
  assert.equal(await renderCanonical(path,preferred,path,identity),preferred,path+' rendered canonical');
 }
}
const example=permanent.find(row=>row.url==='/models/suzuki/rm250.html');
assert.equal(await renderCanonical('/motorcycle-model-guide.html',origin+'/motorcycle-manufacturers.html',null,example),
 origin+example.url,'Exact query route should resolve to permanent model');
console.log('PASS: '+legacyModelRoutes.length+' model URL pairs agree in source, rendered metadata and sitemap');
