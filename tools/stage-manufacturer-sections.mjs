#!/usr/bin/env node
/**
 * Regenerate lossless STATIC manufacturer section archives from protected backups.
 * This intentionally does not publish or write to Supabase.
 * Usage: node tools/stage-manufacturer-sections.mjs [repository-root] [output-folder]
 * Dynamic photograph-credit blocks and model galleries must be reviewed separately.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve(process.argv[2]||'.');
const dest=resolve(process.argv[3]||'development-data');
mkdirSync(dest,{recursive:true});
const specs=[
 {brand:'BMW',slug:'bmw',source:'bmw-motorcycles-numbered-backup-20261102.html',sections:12,map:[[9],[2],[3],[17],[18],[9],[19],[18],[20],[15],[10,11,17],[15]]},
 {brand:'Harley-Davidson',slug:'harley-davidson',source:'harley-davidson-motorcycles-numbered-backup-20261102.html',sections:22,map:[[9],[2],[3],[4,7],[5,8,10,12],[12,13],[12,17],[5,12,13],[9,16],[5,6,8],[3,6,7],[16,20],[5,16],[17],[18],[9],[19],[18],[20],[15],[10,11,17],[15]]}
];
const text=s=>s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const hash=s=>createHash('sha256').update(s).digest('hex');
function archive(spec) {
 const html=readFileSync(resolve(root,spec.source),'utf8');
 const events=/<script\b[^>]*>[\s\S]*?<\/script>|<\/?section\b[^>]*>|<h2\b[^>]*>[\s\S]*?<\/h2>/gi;
 const stack=[], headings=[];let m;
 while((m=events.exec(html))) {
  const tag=m[0];
  if(/^<script\b/i.test(tag))continue; // never parse JS strings as DOM
  if(/^<section\b/i.test(tag)){stack.push({start:m.index,opening:tag});continue;}
  if(/^<\/section\b/i.test(tag)){stack.pop();continue;}
  const title=text(tag);
  if(!/^\d{2}\./.test(title))continue;
  const number=Number(title.slice(0,2));
  const parent=stack.at(-1);
  headings.push({number,title,parent});
 }
 function extract(start){
  const re=/<\/?section\b[^>]*>/gi;re.lastIndex=start;
  let depth=0,node;
  while((node=re.exec(html))) {
   depth+=/^<section\b/i.test(node[0])?1:-1;
   if(depth===0)return html.slice(start,re.lastIndex);
  }
  throw Error('Missing </section> at '+start);
 }
 const records=spec.map.map((universal_sections,i)=>{
  const number=i+1,entry=headings.find(h=>h.number===number);
  const raw=entry?.parent?extract(entry.parent.start):null;
  const anchor=entry?.parent?.opening.match(/\bid=['"]([^'"]+)['"]/)?.[1]||null;
  if(i<spec.sections-1&&!raw)throw Error('Missing source section '+spec.brand+' #'+number);
  if(raw&&!raw.includes('<h2'))throw Error('Bad extraction '+spec.brand+' #'+number);
  return {source_heading_number:number,heading:entry?.title||null,universal_sections,source_anchor:anchor,source_html:raw,import_status:raw?'raw_html_preserved_pending_review':'requires_dynamic_script_extraction',source_kind:raw?'static_html':'javascript_generated'};
 });
 if(records.filter(r=>r.source_html).length!==spec.sections-1)throw Error('Wrong static count for '+spec.brand);
 const result={manufacturer:spec.brand,source_file:spec.source,source_sha256:hash(html),expected_sections:spec.sections,detected_numbered_headings:headings.map(x=>x.number),archival_extract_version:2,records};
 const path=resolve(dest,'manufacturer-source-archive-'+spec.slug+'-20261103.json');
 writeFileSync(path,JSON.stringify(result,null,2)+'\n');
 console.log(spec.brand+': '+records.filter(x=>x.source_html).length+' sections preserved; dynamic credit section pending. '+path);
}
for(const spec of specs)archive(spec);
