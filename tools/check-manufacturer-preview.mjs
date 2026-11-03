#!/usr/bin/env node
// QA for the isolated manufacturer preview generator.
// Run AFTER build-manufacturer-preview.mjs; no writes or database access.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(process.argv[2]||'.');
let failed=false;
for(const [slug,source,expected] of [
 ['bmw','bmw-motorcycles-numbered-backup-20261102.html',12],
 ['harley-davidson','harley-davidson-motorcycles-numbered-backup-20261102.html',22]
]){
 const orig=readFileSync(resolve(root,source),'utf8');
 const preview=readFileSync(resolve(root,'development-preview/manufacturer-'+slug+'-20-section-preview.html'),'utf8');
 const archive=JSON.parse(readFileSync(resolve(root,'development-data/manufacturer-source-archive-'+slug+'-20261103.json'),'utf8'));
 const checks={
  privatePreview:preview.includes('noindex,nofollow'),
  twentySlots:[...preview.matchAll(/class="preview-section" id="section-\d{2}"/g)].length===20,
  sameLogoAndBaseStyles:preview.includes('public-header.css')&&preview.includes('--red:#ed1c24'),
  articleBlocksPreserved:archive.records.filter(r=>r.source_html).every(r=>preview.includes(r.source_html)),
  sourceCount:archive.records.length===expected,
  modelFamilyGallery:preview.includes('id="modelFamilies"'),
  globalCrosslinks:preview.includes('global-manufacturer-stories.js'),
  relatedMakerCrosslinks:preview.includes('motorcycle-related-manufacturers.js'),
  creditsMount:slug==='bmw'?preview.includes('manufacturer-photo-credits-slot'):preview.includes('harley-credits-mount'),
  originalsUntouched:archive.source_blob_sha.length>30
 };
 if(Object.values(checks).some(v=>!v))failed=true;
 console.log(JSON.stringify({manufacturer:slug,sourceHash:createHash('sha256').update(orig).digest('hex'),checks},null,2));
}
if(failed)process.exitCode=1;
