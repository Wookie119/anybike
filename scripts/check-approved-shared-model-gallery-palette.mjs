import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../model-template/public-approved-model-gallery.mjs',import.meta.url),'utf8');
const guide=readFileSync(new URL('../motorcycle-model-guide.html',import.meta.url),'utf8');
for(const fragment of ['background:#252525;color:#fff','border:2px solid #ed1c24','background:#303030;color:#fff','aspect-ratio:16/9;object-fit:cover','border-left:3px solid #ed1c24'])
 assert(src.includes(fragment),'Approved gallery style missing: '+fragment);
for(const fragment of ['background:#fff','background:#fafafa','color:#171717','color:#333','border:1px solid #dedede'])
 assert(!src.includes(fragment),'Unapproved white gallery treatment returned: '+fragment);
assert(src.includes("db.rpc('public_anybike_verified_model_gallery_v1'"),'Approved public gallery projection missing');
assert(src.includes('approvedExactModelGallery(data,make,model)'),'Exact model gallery isolation missing');
assert(guide.includes('/model-template/public-approved-model-gallery.mjs'),'Shared model guide must mount approved gallery');
console.log('PASS: shared model photography retains exact-model approval and approved charcoal/red styling');
