// Standalone catalogue audit; deliberately independent of stock ingestion.
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=process.cwd();
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8')).models;
const catalogue=read('data/motorcycle-catalogue-master.json');
const routes=read('data/universal-v2-model-routes.json');
const norm=x=>String(x??'').toLowerCase().replace(/[^a-z0-9]/g,'');
const key=x=>norm(x.make)+'|'+norm(x.model);
const errors=[];
const aliases=JSON.parse(readFileSync(resolve(root,'data/approved-model-aliases.json'),'utf8')).aliases;
const canonical=new Map(aliases.map(x=>[String(x.alias_model_id),String(x.canonical_model_id)]));
const identity=x=>canonical.get(String(x.model_id))||String(x.model_id);
function index(rows,label){
 const map=new Map();
 for(const row of rows){
  const k=String(row.model_id);
  if(!norm(row.make)||!norm(row.model)||!row.model_id||map.has(k))errors.push(label+': invalid or duplicate '+k);
  map.set(k,row);
 }
 return map;
}
const c=index(catalogue,'catalogue'),r=index(routes,'routes');
for(const [k,row] of c){
 if(!String(row.category??'').trim()||norm(row.category)==='other')errors.push('Missing category: '+k);
 if(!r.has(k))errors.push('Missing route: '+k);
}
for(const [k,row] of r){
 if(!c.has(k))errors.push('Missing catalogue entry: '+k);
 if(!/^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/.test(row.url??'')||!existsSync(resolve(root,'.'+row.url)))errors.push('Missing or invalid HTML: '+k);
 if(c.has(k)&&key(c.get(k))!==key(row))errors.push('Model ID mismatch: '+k);
}
for(const [alias,target] of canonical){
 if(!c.has(alias)||!c.has(target)||alias===target||canonical.has(target))errors.push('Invalid approved alias: '+alias+' -> '+target);
}
for(const rows of [catalogue,routes]){
 const seen=new Map();
 for(const row of rows){
  const k=key(row),id=identity(row);
  if(seen.has(k)&&seen.get(k)!==id)errors.push('Unapproved normalized identity collision: '+k);
  seen.set(k,id);
 }
}
console.log(JSON.stringify({manufacturers:new Set(catalogue.map(x=>x.make)).size,catalogue:catalogue.length,routes:routes.length,errors},null,2));
if(errors.length)process.exitCode=1;
