/**
 * Build a protected, non-publishing photo reference review queue from verified
 * public model guides. Uses a private server-side route export; never downloads
 * images, copies private seller photos or approves any licence/photograph.
 *
 * node scripts/stage-approved-model-photo-references.mjs --data=reports/private-editorial-export.json
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {inspectApprovedModelPhotoReferences} from './extract-approved-model-photo-references.mjs';

export function stageApprovedModelPhotoReferences({root=process.cwd(),data}={}) {
 if(!Array.isArray(data?.routes)||!Array.isArray(data?.models))
   throw new TypeError('Private editorial route and model export required');
 const ids=new Set(data.models.map(m=>m.id));
 const paths=new Set(),modelIds=new Set(),candidates=[],skipped=[];
 for(const r of data.routes){
  if(r?.entity_type!=='model')continue;
  const url=r.public_path,modelId=r.model_id;
  if(!Number.isSafeInteger(modelId)||!ids.has(modelId)||
     !/^\/[a-z0-9-]+\.html$/.test(String(url||''))||
     !r.source_verified_at || paths.has(url) || modelIds.has(modelId)){
    skipped.push({model_id:modelId,source_path:url,reason:'invalid-or-duplicate-route'});continue;
  }
  paths.add(url);modelIds.add(modelId);
  const location=path.join(root,url.slice(1));
  if(!fs.existsSync(location)){
    skipped.push({model_id:modelId,source_path:url,reason:'source-file-not-found'});continue;
  }
  const bytes=fs.readFileSync(location);
  const sha=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  const result=inspectApprovedModelPhotoReferences({
   html:bytes.toString('utf8'),sourcePath:url,
   sourceGitBlobSha:sha,modelId
  });
  if(!result.eligible){
   skipped.push({model_id:modelId,source_path:url,reason:result.reason});continue;
  }
  candidates.push(...result.candidates);
 }
 return {scope:'private source-only photo candidates; licences and model years unverified',
  counts:{modelRoutes:paths.size,candidates:candidates.length,skipped:skipped.length},
  candidates,skipped};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const flag=process.argv.find(x=>x.startsWith('--data='));
 if(!flag){console.error('Usage: node scripts/stage-approved-model-photo-references.mjs --data=private-export.json');process.exitCode=2;}
 else {
  const data=JSON.parse(fs.readFileSync(flag.slice(7),'utf8'));
  const report=stageApprovedModelPhotoReferences({data});
  const output=path.join(process.cwd(),'reports','approved-model-photo-reference-candidates.json');
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify(report.counts));
 }
}
