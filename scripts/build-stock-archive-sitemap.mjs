// Automatic archive sitemap builder: publish only currently eligible, crawlable canonical URLs.
// Uses the public archive service, never privileged database credentials.
import {writeFile,rename} from 'node:fs/promises';
const origin='https://www.anybike.co.uk';
const endpoint='https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/stock-archive-public';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
async function read(url){const r=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'error',cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status+' '+url);return r;}
async function eligible(url){
 const r=await read(url),html=await r.text();
 if(/noindex|none/i.test(r.headers.get('x-robots-tag')||''))return false;
 const tags=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
 if(tags.some(t=>/name\s*=\s*["'](?:robots|googlebot)["']/i.test(t)&&/\b(?:noindex|none)\b/i.test(t)))return false;
 const canonical=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]).find(t=>/rel\s*=\s*["']canonical["']/i.test(t));
 const href=canonical?.match(/href\s*=\s*["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g,'&');
 if(href!==url)return false;
 return /<h1\b[^>]*>\s*[^<\s]/i.test(html);
}
const ids=new Set();let after=0;
for(;;){
 const data=await (await read(endpoint+'?after='+after)).json();
 if(!Array.isArray(data.items))throw Error('Invalid archive response');
 for(const item of data.items){
  const id=Number(item.item_id);
  if(!Number.isSafeInteger(id)||id<=after||ids.has(id))throw Error('Invalid archive identity');
  ids.add(id);
 }
 if(data.next===null)break;
 const next=Number(data.next);
 if(!Number.isSafeInteger(next)||next<=after||!ids.has(next)||ids.size>=50000)throw Error('Invalid archive cursor or sitemap limit');
 after=next;
}
// The existing interactive shell is deliberately noindex. Do not enumerate
// its query URLs until server-rendered per-record canonical content is enabled.
const shell=await (await read(origin+'/international-vq-motorcycle.html')).text();
const noindex=[...shell.matchAll(/<meta\b[^>]*>/gi)].some(m=>/name\s*=\s*["']robots["']/i.test(m[0])&&/\bnoindex\b/i.test(m[0]));
const urls=[];
if(!noindex){
 const candidates=[...ids].map(id=>origin+'/international-vq-motorcycle.html?id='+id);
 for(let i=0;i<candidates.length;i+=8){
  const chunk=candidates.slice(i,i+8);
  const checks=await Promise.all(chunk.map(eligible));
  chunk.forEach((url,j)=>{if(checks[j])urls.push(url)});
 }
}
// Include the already-public archive directory so the sitemap is useful even
// when individual records are not eligible. Never publish partial results.
const directory=origin+'/motorcycle-archive.html';
if(await eligible(directory))urls.unshift(directory);
const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(url=>'  <url><loc>'+esc(url)+'</loc></url>').join('\n')+'\n</urlset>\n';
await writeFile('sitemap-motorcycle-archive.xml.tmp',xml);await rename('sitemap-motorcycle-archive.xml.tmp','sitemap-motorcycle-archive.xml');
console.log('Archive records '+ids.size+'; indexable sitemap URLs '+urls.length);
