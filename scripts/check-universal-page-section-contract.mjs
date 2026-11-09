import assert from 'node:assert/strict';
import {SECTION_COUNT,SECTION_KEYS,canonicalPageEntity,buildUniversalPageSections,visibleUniversalSections,auditUniversalPage} from '../model-template/universal-page-section-contract.mjs';
assert.equal(SECTION_COUNT,20);
assert.equal(SECTION_KEYS[0],'section_01');assert.equal(SECTION_KEYS[19],'section_20');
const bmw={type:'manufacturer',id:15,name:'BMW'};
const gs={type:'model',id:68,manufacturer_id:15,name:'R 1250 GS'};
const published=(entity,n,content)=>({entity_type:entity.type,entity_id:entity.id,
 section_number:n,section_key:SECTION_KEYS[n-1],section_title:'Section '+n,
 editorial_status:'published',published_at:'2026-11-09T00:00:00Z',publication_eligible:true,content});
const sections=buildUniversalPageSections(gs,[published(gs,1,'Research'),published(gs,3,['Dated evidence']),
 {...published(gs,5,'Draft'),editorial_status:'draft'}, {...published(gs,7,'Not approved'),publication_eligible:false}]);
assert.equal(sections.length,20);assert.equal(visibleUniversalSections(sections).length,2);
assert.equal(sections[0].content,'Research');assert.equal(sections[4].content,null);
assert.equal(auditUniversalPage(gs,[published(gs,2,'Technical')]).populated,1);
assert.equal(visibleUniversalSections(buildUniversalPageSections(bmw,[published(bmw,20,'Export')])).length,1);
assert.throws(()=>canonicalPageEntity({type:'model',id:68,name:'GS'}));
assert.throws(()=>buildUniversalPageSections(gs,[published(bmw,1,'Wrong manufacturer')]),/Cross-entity/);
assert.throws(()=>buildUniversalPageSections(gs,[published({type:'model',id:77},1,'Wrong GS')]),/Cross-entity/);
assert.throws(()=>buildUniversalPageSections(gs,[published(gs,1,'A'),published(gs,1,'B')]),/Duplicate/);
assert.throws(()=>buildUniversalPageSections(gs,[{...published(gs,1,'A'),section_key:'section_02'}]),/Incorrect section key/);
assert.equal(buildUniversalPageSections(gs,[]).length,20);
console.log('PASS: shared 20-section manufacturer/model contract, strict ID segregation and draft filtering');
