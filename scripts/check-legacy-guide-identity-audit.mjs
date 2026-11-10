import assert from 'node:assert/strict';
import {auditLegacyGuideIdentity}
 from '../model-template/legacy-guide-identity-audit.mjs';

const models=[
 {id:107,manufacturer:'Ducati',model:'PANIGALE V4'},
 {id:108,manufacturer:'Ducati',model:'Panigale V4 Speciale'},
 {id:176,manufacturer:'Honda',model:'CRF1000L AFRICA TWIN'},
 {id:442,manufacturer:'Honda',model:'Africa Twin CRF1100L'},
 {id:77,manufacturer:'BMW',model:'R 1300 GS'},
 {id:1000,manufacturer:'Aprilia',model:'RS 660'},
 {id:1001,manufacturer:'Aprilia',model:'RS660'}
];
const guides={
 ducati:{make:'Ducati',model:'Panigale V4',summary:'Draft research'},
 honda:{make:'Honda',model:'Africa Twin',summary:'Family-level guide'},
 bmw:{make:'BMW',model:'R 1300 GS'},
 aprilia:{make:'Aprilia',model:'RS660'},
 finance:{make:'BMW',model:'CE 02 APR Representative'}
};
const result=auditLegacyGuideIdentity(guides,models);
const get=k=>result.find(x=>x.sourceKey===k);
assert.equal(result.length,5);
assert.equal(get('ducati').catalogueModelId,107);
assert.equal(get('ducati').status,'exact_id_match');
assert.equal(get('honda').status,'no_exact_catalogue_match');
assert.equal(get('honda').catalogueModelId,null);
assert.equal(get('bmw').catalogueModelId,77);
assert.equal(get('aprilia').status,'ambiguous_multiple_catalogue_matches');
assert.deepEqual(get('aprilia').matchingCatalogueIds,[1000,1001]);
assert.equal(get('finance').status,'promotional_identity');
assert(result.every(x=>x.publicationApproved===false));
const reorder=auditLegacyGuideIdentity(Object.fromEntries(
 Object.entries(guides).reverse()),[...models].reverse());
assert.deepEqual(reorder,result,'Guide identity result varies with source order');
assert.throws(()=>auditLegacyGuideIdentity([],models),/Guide map/);
assert.throws(()=>auditLegacyGuideIdentity({broken:null},models),/Malformed legacy/);
console.log('PASS: legacy guide migration uses exact canonical matches, rejects family ambiguity and never publishes');
