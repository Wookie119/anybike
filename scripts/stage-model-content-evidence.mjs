/**
 * Stage existing model-guide factual sections into a private review queue.
 * Uses an authorised backend-only editorial registry export and the repository
 * source files; does not edit model descriptions, any live page or Supabase.
 *
 * node scripts/stage-model-content-evidence.mjs --data=reports/private-editorial-export.json
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {extractModelSectionCandidates} from './extract-model-section-candidates.mjs';

export function stageModelContentEvidence({root=process.cwd(),data}={}) {
 if(!Array.isArray(data?.routes)||!Array.isArray(data?.models))
   throw new TypeError('Private server-side catalogue and route export required');
 const knownModels=new Set(data.models.map(m=>m.id));
 const seenModels=new Set(),seenPaths=new Set(),skipped=[],candidates=[];
 for(const row of data.routes){
  if(row?.entity_type!=='model')continue;
  const modelId=row.model_id,p=row.public_path;
  if(!Number.isSafeInteger(modelId)||!knownModels.has(modelId)||
     !/^\/[a-z0-9-]+\.html$/.test(String(p||''))||
     !row.source_verified_at || seenModels.has(modelId)||seenPaths.has(p)){
    skipped.push({model_id:modelId,path:p,reason:'unverified-or-duplicate-model-route'});continue;
  }
  seenModels.add(modelId);seenPaths.add(p);
  const source=path.join(root,p.slice(1));
  if(!fs.existsSync(source)){
    skipped.push({model_id:modelId,path:p,reason:'source-file-missing'});continue;
  }
  const buf=fs.readFileSync(source);
  const sourceSha=crypto.createHash('sha1').update('blob '+buf.length+'\0').update(buf).digest('hex');
  const captured=extractModelSectionCandidates({
    html:buf.toString('utf8'),modelId,sourcePublicPath:p,sourceSha
  });
  if(!captured.eligible){
    skipped.push({model_id:modelId,path:p,reason:captured.reason});continue;
  }
  candidates.push(...captured.candidates);
 }
 candidates.sort((a,b)=>a.source_public_path.localeCompare(b.source_public_path)||
   a.category_key.localeCompare(b.category_key));
 return {
  scope:'private source-only candidates; no production mutations or fact approval',
  counts:{knownModelRoutes:seenModels.size,sectionCandidates:candidates.length,
    modelsWithSections:new Set(candidates.map(x=>x.model_id)).size,skipped:skipped.length},
  candidates,skipped
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const flag=process.argv.find(x=>x.startsWith('--data='));
 if(!flag){console.error('Usage: node scripts/stage-model-content-evidence.mjs --data=reports/private-editorial-export.json');process.exitCode=2;}
 else {
  const data=JSON.parse(fs.readFileSync(flag.slice('--data='.length),'utf8'));
  const result=stageModelContentEvidence({data});
  fs.mkdirSync('reports',{recursive:true});
  fs.writeFileSync('reports/model-content-evidence-candidates.json',
    JSON.stringify(result,null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log(JSON.stringify(result.counts));
 }
}
