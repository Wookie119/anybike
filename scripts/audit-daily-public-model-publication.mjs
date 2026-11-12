import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const catalogue=JSON.parse(readFileSync(resolve(root,'data/motorcycle-catalogue-master.json'),'utf8')).models;
const endpoint='https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/rpc/';
const publicKey='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
const core=[
 ['BMW','R 1300 GS'],['BMW','R 1250 GS'],['BMW','S 1000 RR'],
 ['BMW','F 900 GS'],['Suzuki','RM250'],['Yamaha','YZ250'],
 ['Honda','Africa Twin CRF1000L'],['Honda','Africa Twin CRF1100L'],
 ['Ducati','Panigale V4'],['Harley-Davidson','Fat Boy'],
 ['Kawasaki','Ninja ZX-10R']
];
// Audit the canonical clean public catalogue, not only the older checked-in
// snapshot. A failed catalogue lookup is reported, never silently described
// as complete coverage of the live database.
export async function fetchCleanCatalogue(fetcher=fetch){
 const response=await fetcher(endpoint+'public_anybike_manufacturer_names_v1',{
  method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json'},
  body:'{}'
 });
 if(!response.ok)throw Error('Public manufacturer catalogue HTTP '+response.status);
 const makes=await response.json();
 if(!Array.isArray(makes))throw Error('Public manufacturer catalogue is not an array');
 const models=[];let next=0;
 const workers=Array.from({length:6},async()=>{
  while(next<makes.length){
   const entry=makes[next++];
   const make=typeof entry==='string'?entry:entry?.make;
   if(typeof make!=='string'||!make.trim())throw Error('Invalid public manufacturer identity');
   const r=await fetcher(endpoint+'public_anybike_manufacturer_catalogue_names_v1',{
    method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json'},
    body:JSON.stringify({p_make:make})
   });
   if(!r.ok)throw Error('Public model catalogue HTTP '+r.status+' for '+make);
   const rows=await r.json();
   if(!Array.isArray(rows))throw Error('Public model catalogue is not an array for '+make);
   for(const row of rows){
    if(typeof row?.make!=='string'||typeof row?.model!=='string'||
       row.make.trim().toLowerCase()!==make.trim().toLowerCase())
     throw Error('Public model catalogue identity mismatch for '+make);
    models.push({make:row.make,model:row.model});
   }
  }
 });
 await Promise.all(workers);
 return [...new Map(models.map(x=>[identity(x.make,x.model),x])).values()];
}
export const identity=(make,model)=>JSON.stringify([String(make).trim().toLowerCase(),String(model).trim().toLowerCase()]);
export function selectDailyModels(models,date=new Date(),size=140){
 const unique=new Map();
 for(const m of models){
  if(!m?.make||!m?.model)continue;
  unique.set(identity(m.make,m.model),{make:m.make,model:m.model});
 }
 const sorted=[...unique.values()].sort((a,b)=>identity(a.make,a.model).localeCompare(identity(b.make,b.model)));
 const day=Math.floor(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())/86400000);
 // A weekly fixed anchor gives complete coverage within each Monday–Sunday
 // cycle even if the clean catalogue grows or changes between audit runs.
 const weekStart=day-((date.getUTCDay()+6)%7);
 const dayInWeek=day-weekStart;
 const offset=(dayInWeek*size)%Math.max(1,sorted.length);
 const selected=new Map(core.map(([make,model])=>[identity(make,model),{make,model}]));
 for(let i=0;i<Math.min(size,sorted.length);i++){
  const m=sorted[(offset+i)%sorted.length];
  selected.set(identity(m.make,m.model),m);
 }
 return [...selected.values()];
}
export function validatePublicRows(rows,make,model,kind){
 if(!Array.isArray(rows))throw new Error('Public RPC did not return a JSON array');
 for(const row of rows){
  if(identity(row.make,row.model)!==identity(make,model))
   throw new Error('Public '+kind+' returned another motorcycle identity');
  if(kind==='gallery'&&(!/^https:\/\//i.test(row.image_url||'')||
    !/^https:\/\//i.test(row.licence_url||'')||
    !row.attribution||!row.licence))
   throw new Error('Public gallery returned unlicensed or unsafe photo metadata');
 }
 return rows.length;
}
export async function fetchProjection(fetcher,make,model,kind){
 const rpc=kind==='facts'?'public_anybike_verified_model_facts_v1':'public_anybike_verified_model_gallery_v1';
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetcher(endpoint+rpc,{
   method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json'},
   body:JSON.stringify({p_make:make,p_model:model}),signal:controller.signal
  });
  if(!response.ok)throw new Error('Public '+kind+' HTTP '+response.status);
  return validatePublicRows(await response.json(),make,model,kind);
 }finally{clearTimeout(timeout);}
}
export async function runDailyAudit({fetcher=fetch,date=new Date(),models=catalogue}={}){
 const selected=selectDailyModels(models,date);
 const rows=[];let next=0;
 async function worker(){
  while(next<selected.length){
   const item=selected[next++];
   const row={...item,facts:null,gallery:null,error:null};
   try{
    row.facts=await fetchProjection(fetcher,item.make,item.model,'facts');
    row.gallery=await fetchProjection(fetcher,item.make,item.model,'gallery');
   }catch(error){row.error=String(error.message||error).slice(0,180);}
   rows.push(row);
  }
 }
 await Promise.all(Array.from({length:8},worker));
 rows.sort((a,b)=>identity(a.make,a.model).localeCompare(identity(b.make,b.model)));
 return {date:date.toISOString().slice(0,10),catalogueModels:models.length,
  checkedModels:rows.length,errors:rows.filter(x=>x.error).length,
  withFacts:rows.filter(x=>x.facts>0).length,
  withGallery:rows.filter(x=>x.gallery>0).length,
  factCount:rows.reduce((n,x)=>n+(x.facts||0),0),
  missingResearch:rows.filter(x=>!x.error&&x.facts===0).length,
  researchedWithoutGallery:rows.filter(x=>!x.error&&x.facts>0&&x.gallery===0).length,
  rows};
}
export function toMarkdown(report){
 const lines=['# AnyBike daily public research publication check','',
  'Date (UTC): '+report.date,'',
  'This is a rotating daily sample designed to cover the clean catalogue within seven days, **not** a full catalogue or live-browser rendering audit.',
  'No source research or photography is approved by this check.','',
  'Catalogue source: '+(report.catalogueSource||'provided test catalogue'),
  ...(report.catalogueError?['WARNING: clean catalogue unavailable: '+report.catalogueError]:[]),'',
  '| Measure | Result |','|---|---:|',
  '| Local catalogue entries | '+report.catalogueModels+' |',
  '| Exact-model RPC pairs checked | '+report.checkedModels+' |',
  '| Models with verified public facts | '+report.withFacts+' |',
  '| Models with approved public gallery entries | '+report.withGallery+' |',
  '| Verified facts returned in sample | '+report.factCount+' |',
  '| Sampled models awaiting verified research | '+report.missingResearch+' |',
  '| Researched models awaiting approved gallery | '+report.researchedWithoutGallery+' |',
  '| Errors / identity / photo guard failures | '+report.errors+' |','',
  '## Models checked','','| Manufacturer | Exact model | Facts | Gallery | Status |',
  '|---|---|---:|---:|---|'];
 for(const row of report.rows){
  const clean=x=>String(x??'').replace(/\|/g,'\\|').replace(/[\r\n]/g,' ');
  const url='https://www.anybike.co.uk/motorcycle-model-guide.html?make='+
   encodeURIComponent(row.make)+'&model='+encodeURIComponent(row.model);
  lines.push('| '+clean(row.make)+' | ['+clean(row.model)+']('+url+') | '+
   (row.facts??'—')+' | '+(row.gallery??'—')+' | '+
   clean(row.error||'Checked')+' |');
 }
 const researchQueue=report.rows.filter(x=>!x.error&&x.facts===0);
 const photoQueue=report.rows.filter(x=>!x.error&&x.facts>0&&x.gallery===0)
  .sort((a,b)=>b.facts-a.facts||identity(a.make,a.model).localeCompare(identity(b.make,b.model)));
 lines.push('','## Research and licensed photography queues','',
  'These are **review candidates only**. A missing public fact or image does not authorise publishing unsourced content.','',
  '### Models awaiting verified research');
 for(const row of researchQueue)lines.push('- '+row.make+' '+row.model);
 lines.push('','### Researched models awaiting approved gallery');
 for(const row of photoQueue)lines.push('- '+row.make+' '+row.model+' ('+row.facts+' verified facts)');
 return lines.join('\n')+'\n';
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let models=catalogue,catalogueError=null;
 try{models=await fetchCleanCatalogue();}
 catch(error){catalogueError=String(error.message||error);}
 const report=await runDailyAudit({models});
 report.catalogueSource=catalogueError?'checked-in fallback':'clean public Supabase RPC';
 report.catalogueError=catalogueError;
 const dir=resolve(root,'artifacts');mkdirSync(dir,{recursive:true});
 writeFileSync(resolve(dir,'daily-public-research-audit.json'),JSON.stringify(report,null,2)+'\n');
 const md=toMarkdown(report);
 writeFileSync(resolve(dir,'daily-public-research-audit.md'),md);
 if(process.env.GITHUB_STEP_SUMMARY)writeFileSync(process.env.GITHUB_STEP_SUMMARY,md,{flag:'a'});
 console.log('Daily public research audit:',JSON.stringify({
  checked:report.checkedModels,withFacts:report.withFacts,
  withGallery:report.withGallery,errors:report.errors
 }));
 if(report.errors||catalogueError)process.exitCode=1;
}
