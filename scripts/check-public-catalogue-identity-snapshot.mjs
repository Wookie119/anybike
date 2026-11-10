/**
 * Public static model-directory identity gate.
 * The directory is only a route/index source, not an approved fact set.
 * Future all-brand imports must retain canonical IDs and avoid publishing
 * finance advert titles, cross-make aliases or researched specifications.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=JSON.parse(readFileSync(
 new URL('../data/motorcycle-catalogue-master.json',import.meta.url),'utf8'));
assert(Array.isArray(file.models),'Missing catalogue model array');
const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]/g,'');
const seen=new Set(),ids=new Set(),added=[];
for(const entry of file.models){
 assert(entry&&typeof entry.make==='string'&&entry.make.trim()&&
  typeof entry.model==='string'&&entry.model.trim(),'Empty model identity');
 const key=norm(entry.make)+'/'+norm(entry.model);
 assert(!seen.has(key),'Two public cards map to the same normalized make/model: '+key);
 seen.add(key);
 assert(!/\b(?:apr|representative|finance|financing|pcp|monthly payment)\b|\d+(?:\.\d+)?\s*%/i.test(entry.model),
  'Financial advertisement shown as motorcycle model: '+entry.model);
 if(entry.catalogue_model_id===undefined)continue; // legacy historical snapshot
 const id=entry.catalogue_model_id;
 assert(Number.isSafeInteger(id)&&id>0,'Imported catalogue source ID invalid');
 assert(!ids.has(id),'Imported canonical model ID repeated: '+id);
 ids.add(id);
 assert(entry.verification==='pending',
  'Import silently promoted research status for model ID '+id);
 assert(entry.production_years===null,
  'Unreviewed production years added to public catalogue');
 assert(['Other','Classics','Off-road','Adventure'].includes(entry.category),
  'Unreviewed or unsupported inferred category: '+entry.category);
 assert(!['BMW','Harley-Davidson','Indian','Mugen','VMoto'].includes(entry.make),
  'Dedicated page or unresolved manufacturer alias auto-imported');
 added.push(entry);
}
assert.equal(added.length,104,
 'Canonical additive intake has changed: review sources before adding or removing model IDs');
assert.equal(file.models.length,889,'Unexpected master catalogue record count');
for(const make of ['Suzuki','Honda','Yamaha','Ducati','Triumph']){
 assert(added.some(x=>x.make===make),make+' missing from approved identity intake');
}
assert(added.some(x=>x.make==='Suzuki'&&x.model==='RM250'&&x.catalogue_model_id===1054));
assert(added.some(x=>x.make==='Honda'&&x.model==='Super Cub C100'&&x.catalogue_model_id===1042));
console.log('PASS: 104 public model labels retain exact canonical IDs, remain research pending, and exclude finance/alias/dedicated-page variants');
