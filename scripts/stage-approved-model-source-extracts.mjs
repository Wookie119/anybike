/**
 * Stage exact source-backed model introductions from existing approved HTML,
 * using the server-only Supabase route export. Does NOT publish, update model
 * research, scrape third-party photos, or choose among ambiguous model pages.
 *
 * node scripts/stage-approved-model-source-extracts.mjs --data=reports/private-editorial-export.json
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {extractApprovedModelHero} from './extract-approved-model-hero.mjs';

export function stageApprovedModelSourceExtracts({root=process.cwd(),data}={}) {
 if(!Array.isArray(data?.routes)||!Array.isArray(data?.models))
  throw new TypeError('Trusted private catalogue export required');
 const modelById=new Map(data.models.map(m=>[m.id,m]));
 const candidates=[],skipped=[];
 const seenIds=new Set(),seenUrls=new Set();
 for(const row of data.routes) {
  if(row?.entity_type!=='model')continue;
  const page=row.public_path;
  if(!Number.isSafeInteger(row.model_id) ||
   !/^\/[a-z0-9-]+\.html$/.test(String(page||'')) ||
   !row.source_verified_at || row.publication_state==='rejected' ||
   seenIds.has(row.model_id) || seenUrls.has(page)){
    skipped.push({model_id:row.model_id,path:page,reason:'invalid-or-duplicate-source-route'});
    continue;
  }
  seenIds.add(row.model_id);seenUrls.add(page);
  const model=modelById.get(row.model_id);
  if(!model){
   skipped.push({model_id:row.model_id,path:page,reason:'model-not-in-catalogue'});
   continue;
  }
  const absolute=path.join(root,page.slice(1));
  if(!fs.existsSync(absolute)){
   skipped.push({model_id:row.model_id,path:page,reason:'source-file-missing'});
   continue;
  }
  const bytes=fs.readFileSync(absolute);
  const sha=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  const extracted=extractApprovedModelHero({
   html:bytes.toString('utf8'),sourcePath:page,
   modelName:model.manufacturer+' '+model.model,sourceSha:sha
  });
  if(!extracted.eligible){
   skipped.push({model_id:row.model_id,path:page,reason:extracted.reason});
   continue;
  }
  candidates.push({model_id:row.model_id,...extracted.record});
 }
 candidates.sort((a,b)=>a.public_path.localeCompare(b.public_path));
 return {
  scope:'private candidate source extraction only; no DB writes or live deployment',
  summary:{modelRoutes:data.routes.filter(r=>r?.entity_type==='model').length,
   captured:candidates.length,skipped:skipped.length},
  candidates,skipped
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) {
 const flag=process.argv.find(x=>x.startsWith('--data='));
 if(!flag){console.error('Usage: node scripts/stage-approved-model-source-extracts.mjs --data=private-export.json');process.exitCode=2;}
 else{
  const data=JSON.parse(fs.readFileSync(flag.slice(7),'utf8'));
  const report=stageApprovedModelSourceExtracts({data});
  const output=path.join(process.cwd(),'reports','approved-model-source-extracts.json');
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log(JSON.stringify(report.summary));
 }
}
