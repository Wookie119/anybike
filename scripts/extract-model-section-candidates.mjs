/**
 * Preserve selected literal H2 source sections from already-approved model
 * guides. Only explicit and conservative heading rules are supported.
 * Outputs source-captured editorial candidates, NOT verified facts, live pages,
 * factory specifications, licences or automatically approved model content.
 */
const normal=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/gi,'&')
 .replace(/&nbsp;/gi,' ').replace(/&#39;/gi,"'").replace(/&quot;/gi,'"')
 .replace(/\s+/g,' ').trim();
const headings=[
 {rule:/^UK buyer's model-specific checklist$/i,category:'buying_guidance',priority:10},
 {rule:/^What a UK buyer should check$/i,category:'buying_guidance',priority:9},
 {rule:/^What buyers should check$/i,category:'buying_guidance',priority:8},
 {rule:/^What to verify$/i,category:'buying_guidance',priority:3},
 {rule:/^Detailed model generations and factory references$/i,category:'chronology',priority:9},
 {rule:/^.+: (?:important production generations|documented generations and variants)$/i,category:'chronology',priority:8},
 {rule:/^2025 launch and 2026 development$/i,category:'chronology',priority:8},
 {rule:/^Compare documented specifications$/i,category:'technical_specifications',priority:8},
 {rule:/^2025 UK-market specifications$/i,category:'technical_specifications',priority:9},
 {rule:/^2026 UK manufacturer specifications$/i,category:'technical_specifications',priority:9},
 {rule:/^Different V-Rod models and generations$/i,category:'generations',priority:9}
];
export function extractModelSectionCandidates({html,modelId,sourcePublicPath,sourceSha}={}) {
 if(typeof html!=='string'||!Number.isSafeInteger(modelId)||modelId<=0||
 !/^\/[a-z0-9-]+\.html$/.test(String(sourcePublicPath||''))||
 !/^[a-f0-9]{40}$/.test(String(sourceSha||'')))
  return {eligible:false,reason:'invalid-source',candidates:[]};
 const canons=[...html.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0])
   .filter(x=>/\brel\s*=\s*["']canonical["']/i.test(x));
 const href=canons.length===1?canons[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]:null;
 if(href!=='https://www.anybike.co.uk'+sourcePublicPath)
  return {eligible:false,reason:'canonical-mismatch',candidates:[]};
 const robots=[...html.matchAll(/<meta\b[^>]*>/gi)].map(x=>x[0])
  .filter(x=>/\bname\s*=\s*["'](?:robots|googlebot)["']/i.test(x)).join(' ');
 if(/\b(?:noindex|nofollow|none)\b/i.test(robots))
  return {eligible:false,reason:'source-noindex',candidates:[]};
 const best=new Map();
 for(const section of html.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/gi)){
  const body=section[1];
  const h2=body.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
  if(!h2)continue;
  const title=normal(h2[1]);
  const matched=headings.find(x=>x.rule.test(title));
  if(!matched)continue;
  const contents=body.slice(body.indexOf(h2[0])+h2[0].length);
  // Page-specific explanatory content, not navigation, scripts, or HTML input.
  if(/<script\b|<form\b|<nav\b/i.test(contents))continue;
  const text=normal(contents);
  if(text.length<55||text.length>7000)continue;
  const prior=best.get(matched.category);
  if(prior && prior.priority>=matched.priority)continue;
  best.set(matched.category,{priority:matched.priority,
   model_id:modelId,category_key:matched.category,
   source_public_path:sourcePublicPath,source_git_blob_sha:sourceSha,
   source_section_label:title,evidence_text:text,
   evidence_type:'approved_html_excerpt',review_state:'source_captured'});
 }
 return {eligible:true,candidates:[...best.values()].sort((a,b)=>a.category_key.localeCompare(b.category_key))
  .map(({priority,...rest})=>rest)};
}
