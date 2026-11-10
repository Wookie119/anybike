import assert from 'node:assert/strict';
import {createPublicModelDirectory}
 from '../model-template/public-model-directory-export.mjs';
const catalogue={schema_version:1,models:[
 {make:'Suzuki',model:'Hayabusa',category:'Sport',verification:'pending',
  production_years:null},
 {make:'Honda',model:'Africa Twin',category:'Adventure',verification:'pending',
  production_years:null}
]};
const manufacturers=[
 {id:1,display_name:'Suzuki'},{id:2,display_name:'Honda'},
 {id:3,display_name:'BMW'},{id:4,display_name:'Indian Motorcycle'}
];
const models=[
 {id:100,manufacturer:'Suzuki',model:'RM250',motorcycle_type:'Motocross',
  overview:'Never expose private draft notes'},
 {id:101,manufacturer:'Honda',model:'Super Cub C100',motorcycle_type:'Underbone'},
 {id:200,manufacturer:'Suzuki',model:'GSX1300R',motorcycle_type:null},
 {id:201,manufacturer:'Suzuki',model:'GSX 1300 R',motorcycle_type:null},
 {id:300,manufacturer:'BMW',model:'R 1300 GS',motorcycle_type:'Adventure'},
 {id:400,manufacturer:'Indian',model:'Scout',motorcycle_type:'Cruiser'},
 {id:500,manufacturer:'Honda',model:'CB750 7.9% APR',motorcycle_type:null}
];
const args={catalogue,models,manufacturers,aliases:[],
 approvedModelIds:[101,100]};
const planned=createPublicModelDirectory(args);
assert.equal(planned.added.length,2);
assert.equal(planned.catalogue.models.length,4);
assert.equal(planned.publicationApproved,false);
assert.deepEqual(planned.canonicalIds,[100,101]);
const rm=planned.catalogue.models.find(x=>x.catalogue_model_id===100);
assert.deepEqual(rm,{
 make:'Suzuki',model:'RM250',category:'Off-road',production_years:null,
 verification:'pending',catalogue_model_id:100
});
assert(!JSON.stringify(planned).includes('Never expose private draft notes'));
const repeat=createPublicModelDirectory({
 ...args,catalogue:planned.catalogue
});
assert.equal(repeat.added.length,0,'Repeated export added duplicate cards');
assert.deepEqual(repeat.catalogue,planned.catalogue);
for(const id of [200,201,300,400,500,999]){
 assert.throws(()=>createPublicModelDirectory({
  ...args,approvedModelIds:[id]
 }),/export blocked/,
 'Unsafe canonical model ID was silently imported: '+id);
}
assert.throws(()=>createPublicModelDirectory({
 ...args,approvedModelIds:[100,100]
}),/duplicate public label approval/);
assert.throws(()=>createPublicModelDirectory({
 ...args,aliases:[{alias_model_id:100,review_status:'pending_review'}]
}),/export blocked/);
const changed={...planned.catalogue,
 models:planned.catalogue.models.map(x=>x.catalogue_model_id===100?
 {...x,catalogue_model_id:999}:x)};
assert.throws(()=>createPublicModelDirectory({...args,catalogue:changed}),
 /export blocked/);
assert.throws(()=>createPublicModelDirectory({
 ...args,catalogue:{models:[catalogue.models[0],catalogue.models[0]]}
}),/Duplicate public make\/model identity/);
console.log('PASS: canonical model ID allowlist exports only reviewed public labels; finance, alias, duplicates and dedicated make rows blocked');
