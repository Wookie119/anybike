// Regenerate the crawlable model links in the manufacturer directory.
import {readFileSync,writeFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const read=file=>readFileSync(new URL(file,root),'utf8');
const directory='motorcycle-models.html';
const gateways=['index.html','motorcycle-manufacturers.html','motorcycle-brand.html','how-anybike-export-works.html'];
const manufacturers=read('motorcycle-manufacturers.html');
const manufacturerRoutes=new Map([...manufacturers.matchAll(
 /<a class="brand" data-name="([^"]+)" href="([^"]+)"/g
)].map(([,name,url])=>[name,url]));
const sitemapRoutes=new Set([...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)]
 .map(([,url])=>url.replaceAll('&amp;','&')));
const origin='https://www.anybike.co.uk';
const registry=JSON.parse(read('data/universal-v2-model-routes.json')).models;
const routePattern=/^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/;
const escapeHtml=text=>text.replace(/[&<>"']/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));
const byMake=new Map(),routes=new Set();
let count=0;
for(const {make,model,url} of registry){
 if(!make?.trim()||!model?.trim()||!routePattern.test(url)||routes.has(url)){
  throw Error('Invalid or duplicate published model route: '+url);
 }
 routes.add(url);
 const head=read(url.slice(1)).split(/<\/head\s*>/i,1)[0];
 const canonical=head.match(/<link id="modelCanonical" rel="canonical" href="([^"]+)"/)?.[1];
 if(!canonical)throw Error('Missing canonical on '+url);
 if(canonical!==origin+url)continue;
 const robots=head.match(/<meta name="robots" content="([^"]+)"/)?.[1]||'';
 if(/\b(?:noindex|nofollow|none)\b/i.test(robots))throw Error('Published model blocks discovery: '+url);
 if(!byMake.has(make))byMake.set(make,[]);
 byMake.get(make).push({model,url});
 count++;
}
if(!count)throw Error('No canonical model routes available');
for(const file of gateways){
 if(!/<a\b[^>]*href="\/motorcycle-models\.html"/i.test(read(file))){
  throw Error(file+' must link directly to the model directory');
 }
}

const compare=(a,b)=>a.localeCompare(b,'en',{numeric:true,sensitivity:'base'});
const groups=[...byMake].sort(([a],[b])=>compare(a,b)).map(([make,models])=>{
 const manufacturerRoute=manufacturerRoutes.get(make.toLowerCase());
 if(!manufacturerRoute||!sitemapRoutes.has(origin+manufacturerRoute)){
  throw Error('Missing public manufacturer route for '+make);
 }
 const items=models.sort((a,b)=>compare(a.model,b.model)||compare(a.url,b.url))
  .map(({model,url})=>'      <li><a href="'+url+'">'+escapeHtml(model)+'</a></li>').join('\n');
 return '  <details><summary>'+escapeHtml(make)+'</summary>\n'+
  '    <a class="manufacturer-guide-link" href="'+escapeHtml(manufacturerRoute)+'">Explore '+escapeHtml(make)+' motorcycles →</a>\n'+
  '    <ul>\n'+items+'\n    </ul>\n  </details>';
});
const start='<!-- Published model routes start -->';
const end='<!-- Published model routes end -->';
const page=read(directory);
const before=page.indexOf(start),after=page.indexOf(end);
if(before<0||after<before||page.lastIndexOf(start)!==before||page.lastIndexOf(end)!==after){
 throw Error('Expected one generated model directory block in '+directory);
}
const updated=page.slice(0,before+start.length)+'\n'+groups.join('\n')+'\n'+page.slice(after);
if(process.argv.includes('--check')){
 if(page!==updated)throw Error('Model directory is outdated. Run node scripts/build-manufacturer-model-directory.mjs');
 console.log('PASS: '+gateways.length+' entry pages link to '+count+' canonical model guides and '+byMake.size+' manufacturer groups');
}else{
 writeFileSync(new URL(directory,root),updated);
 console.log('Updated directory with '+count+' canonical model guides');
}
