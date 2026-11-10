import assert from 'node:assert/strict';
import {loadUniversalPublishedPage,UNIVERSAL_PUBLIC_SECTIONS} from '../model-template/universal-page-data.mjs';
const rows=[{entity_type:'model',entity_id:68,entity_name:'R 1250 GS',manufacturer_id:15,
 source_section_id:1001,publication_review_reference:'BMW-REVIEW-2026-11-10',
 section_number:1,section_key:'section_01',section_title:'History',content:{summary:'Approved research'},
 editorial_status:'published',publication_eligible:true,published_at:'2026-11-09T00:00:00Z'}];
const makeClient=(result)=>({from(table){
 assert.equal(table,UNIVERSAL_PUBLIC_SECTIONS);
 const req={select(){return req},eq(){return req},order(){return req},limit(){return Promise.resolve(result)}};
 return req;
}});
const published=await loadUniversalPublishedPage(makeClient({data:rows,error:null}),{type:'model',id:68});
assert.equal(published.entity.manufacturer_id,15);
assert.equal(published.sections.length,1);
assert.deepEqual(published.stock,[],'Public editorial API must not assume permission to show stock');
assert.equal(await loadUniversalPublishedPage(makeClient({data:[],error:null}),{type:'model',id:68}),null);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],entity_id:77}],error:null}),{type:'model',id:68}),/identity mismatch/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[rows[0],{...rows[0],manufacturer_id:28}],error:null}),{type:'model',id:68}),/Mixed/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],publication_eligible:false}],error:null}),{type:'model',id:68}),/Unpublished/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[],error:{message:'Denied'}}),{type:'model',id:68}),/unavailable/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],entity_name:'CE 02 AM 7.9% APR Representative'}],error:null}),{type:'model',id:68}),/promotional catalogue identity blocked/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],entity_name:'S 1000 RR PCP finance offer'}],error:null}),{type:'model',id:68}),/promotional catalogue identity blocked/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[rows[0],{...rows[0]}],error:null}),{type:'model',id:68}),/duplicate universal section identity/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],section_number:21}],error:null}),{type:'model',id:68}),/Invalid or duplicate universal section identity/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],section_number:0}],error:null}),{type:'model',id:68}),/Invalid or duplicate universal section identity/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],section_key:''}],error:null}),{type:'model',id:68}),/Invalid or duplicate universal section identity/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],section_key:'section_02'}],error:null}),{type:'model',id:68}),/Invalid or duplicate universal section identity/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],section_key:'section_1'}],error:null}),{type:'model',id:68}),/Invalid or duplicate universal section identity/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[rows[0],{...rows[0],section_number:2}],error:null}),{type:'model',id:68}),/Invalid or duplicate universal section identity/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:Array.from({length:21},(_,i)=>({...rows[0],section_number:i+1,section_key:'section_'+String(i+1).padStart(2,'0')})),error:null}),{type:'model',id:68}),/exceeds 20 sections/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:null,error:null}),{type:'model',id:68}),/Invalid published catalogue response/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],section_title:'   '}],error:null}),{type:'model',id:68}),/Empty published research section blocked/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],content:{}}],error:null}),{type:'model',id:68}),/Empty published research section blocked/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],content:null}],error:null}),{type:'model',id:68}),/Empty published research section blocked/);

await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],publication_review_reference:' '}],error:null}),{type:'model',id:68}),/Missing reviewed publication provenance/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],source_section_id:null}],error:null}),{type:'model',id:68}),/Missing reviewed publication provenance/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],published_at:'2099-01-01T00:00:00Z'}],error:null}),{type:'model',id:68}),/Publication date is invalid or not yet reached/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],published_at:'not-a-real-date'}],error:null}),{type:'model',id:68}),/Publication date is invalid or not yet reached/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],content:{
 source_blocks:[{source_file:'old-bmw-page.html',import_status:'draft'}]
}}],error:null}),{type:'model',id:68}),/Unreviewed source-only research section blocked/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[{...rows[0],content:{
 engineering:{verification_status:'pending_editorial_review',rows:[['Power','unreviewed']]}
}}],error:null}),{type:'model',id:68}),/Unverified engineering-only section blocked/);
await assert.rejects(loadUniversalPublishedPage(makeClient({data:[],error:null}),{type:'model',id:0}),/Canonical/);
console.log('PASS: public-only universal Supabase projection and strict manufacturer/model identity checks');
