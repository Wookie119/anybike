#!/usr/bin/env node
/**
 * Regenerate private manufacturer previews from an approved Supabase draft snapshot.
 * The snapshot is exported server-side by an authorised operator/connector; this
 * script never contacts Supabase and never embeds credentials in public JavaScript.
 *
 * node tools/build-manufacturer-from-snapshot.mjs [repo-root]
 *
 * Important: this renders a DEVELOPMENT snapshot, not a published page. The
 * originals remain unchanged and all generated pages are noindex.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(process.argv[2]||'.');
const snapshot=JSON.parse(readFileSync(resolve(root,'development-data/manufacturer-supabase-draft-snapshot-20261103.json'),'utf8'));
if(snapshot.publication_status!=='unpublished')throw Error('Unexpected snapshot status');
if(snapshot.sections.length!==40)throw Error('Incomplete database export');
const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
mkdirSync(resolve(root,'development-preview'),{recursive:true});
for(const slug of ['bmw','harley-davidson']){
 const input=resolve(root,'development-preview/manufacturer-'+slug+'-20-section-preview.html');
 const original=readFileSync(input,'utf8');
 const sourceRows=snapshot.sections.filter(s=>s.slug===slug).sort((a,b)=>a.section_number-b.section_number);
 if(sourceRows.length!==20)throw Error('Missing slot: '+slug);
 const first=original.indexOf('<section class="preview-section" id="section-01">');
 const last=original.indexOf('</main>',first);
 if(first<0||last<0)throw Error('Original preview boundaries missing: '+slug);
 const brand=slug==='bmw'?'BMW':'Harley-Davidson';
 const sections=sourceRows.map(row=>{
  const number=String(row.section_number).padStart(2,'0');
  let body=row.blocks.filter(x=>x.html!==null).map(x=>x.html).join('\n');
  if(!body&&row.section_number===1)body='<p class="preview-related">The approved '+brand+' manufacturer introduction, identity and main navigation are preserved in the original hero directly above this section. The existing editorial content is not replaced.</p>';
  if(!body&&row.section_number!==1)body='<p class="preview-pending">Dedicated researched content is not yet approved for this section.</p>';
  if(row.section_number===15){
   if(slug==='bmw')body+='<div id="manufacturer-photo-credits-slot"></div>';
   else {
    const a=original.indexOf('<details class="harley-editorial-attributions"');
    const b=original.indexOf('</details>',a);
    if(a<0||b<0)throw Error('Missing Harley attribution details');
    body+='<div id="harley-credits-mount"></div>'+original.slice(a,b+10);
   }
  }
  return '<section class="preview-section" id="section-'+number+'"><div class="preview-sectionhead"><h2><span>'+number+'.</span> '+esc(row.section_title)+'</h2></div>'+body+'</section>';
 }).join('\n');
 const output=original.slice(0,first)+'<!-- Development only: editorial exported from private Supabase drafts -->\n'+sections+'\n'+original.slice(last);
 if(!output.includes('noindex,nofollow'))throw Error('Preview would be indexable');
 if(sourceRows.some(x=>x.blocks.some(b=>b.html&&!output.includes(b.html))))throw Error('Loss of source content');
 const file=resolve(root,'development-preview/manufacturer-'+slug+'-db-20-section-preview.html');
 writeFileSync(file,output);
 console.log(brand+': saved '+file+' (20 slots, all draft content preserved)');
}
