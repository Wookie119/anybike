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
function index(rows,label){
 const map=new Map();
 for(const row of rows){
  const k=key(row);
  if(!norm(row.make)||!norm(row.model)||map.has(k))errors.push(label+': invalid or duplicate '+k);
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
 if(c.has(k)&&String(c.get(k).model_id)!==String(row.model_id))errors.push('Model ID mismatch: '+k);
}
console.log(JSON.stringify({manufacturers:new Set(catalogue.map(x=>x.make)).size,catalogue:catalogue.length,routes:routes.length,errors},null,2));
if(errors.length)process.exitCode=1;
