#!/usr/bin/env node
// Audit the *published source HTML* for all 978 permanent motorcycle model pages.
// Run from repository root: node scripts/audit-universal-v2-model-copy.mjs
// This is a complete source-copy audit, NOT a browser/Supabase live-content audit.
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync('data/universal-v2-model-routes.json','utf8'));
const issues=[];
const summary={total:manifest.models.length,passed:0,failed:0,manufacturers:new Set(),issueCounts:{}};
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const normal=s=>String(s).normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const report=(row,code,detail)=>{issues.push({url:row.url,make:row.make,model:row.model,code,detail});summary.issueCounts[code]=(summary.issueCounts[code]||0)+1;};
const readMeta=(html,name)=>html.match(new RegExp('<meta\\s+name="'+name+'"\\s+content="([^"]*)"','i'))?.[1]||'';
const get=(html,regex)=>html.match(regex)?.[1]||'';
const canonicalMaster=fs.readFileSync('motorcycle-v2-master.html','utf8');
const masterMain=get(canonicalMaster,/(<main>[\s\S]*?<\/main>)/);
const masterStyle=get(canonicalMaster,/(<style>[\s\S]*?<\/style>)/);
for(const row of manifest.models){
 summary.manufacturers.add(row.make);
 let html;
 try{html=fs.readFileSync('.'+row.url,'utf8');}catch(e){report(row,'MISSING_FILE',e.message);continue;}
 const title=decode(get(html,/<title>([^<]*)<\/title>/i));
 const description=decode(readMeta(html,'description'));
 const h1=get(html,/<h1[^>]*>([^<]*)<\/h1>/i);
 const identityText=get(html,/<script id="anybikeV2RouteIdentity" type="application\/json">([^<]*)<\/script>/);
 let identity;
 try{identity=JSON.parse(identityText);}catch{report(row,'INVALID_IDENTITY','Missing/invalid JSON identity');}
 if(identity&&(identity.make!==row.make||identity.model!==row.model||identity.model_id!==row.model_id))report(row,'WRONG_MODEL_IDENTITY',JSON.stringify(identity));
 if(!title||!normal(title).includes(normal(row.make+' '+row.model)))report(row,'TITLE_MISMATCH',title);
 if(!description||!normal(description).includes(normal(row.make+' '+row.model)))report(row,'DESCRIPTION_MISMATCH',description);
 if(description.length<65||description.length>170)report(row,'DESCRIPTION_LENGTH',String(description.length));
 if(title.length>85)report(row,'TITLE_LENGTH',String(title.length));
 if(/\b(?:undefined|null|nan|loading|lorem ipsum|coming soon|tbd)\b/i.test(title+' '+description))report(row,'PLACEHOLDER_COPY',title+' / '+description);
 if(/&amp;amp;|&amp;#|&amp;lt;|&amp;gt;/i.test(html.slice(0,2500)))report(row,'DOUBLE_ESCAPED_ENTITY','HTML head');
 if(get(html,/(<main>[\s\S]*?<\/main>)/)!==masterMain)report(row,'TEMPLATE_MAIN_DRIFT','Differs from universal master');
 if(get(html,/(<style>[\s\S]*?<\/style>)/)!==masterStyle)report(row,'TEMPLATE_STYLE_DRIFT','Differs from universal master');
 if(!/approved-v2-universal-preview\.mjs\?v=/.test(html))report(row,'WRONG_RENDERER','Missing shared renderer');
 if(!/name="robots" content="index,follow"/.test(html))report(row,'NOINDEX_OR_ROBOTS','Expected index,follow');
 if(h1&&/^(motorcycle model|undefined|null)$/i.test(decode(h1).trim()))report(row,'GENERIC_STATIC_H1',h1);
 if(!issues.some(issue=>issue.url===row.url))summary.passed++;
}
summary.failed=summary.total-summary.passed;
const output={audit:'universal-v2-source-copy',scope:'978 route HTML files, before runtime Supabase editorial rendering',total:summary.total,manufacturers:summary.manufacturers.size,passed:summary.passed,failed:summary.failed,issueCounts:summary.issueCounts,issues};
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/universal-v2-model-copy-audit.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({...output,issues:issues.slice(0,30)},null,2));
if(summary.total!==978||summary.failed)process.exitCode=1;
