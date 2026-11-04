import test from 'node:test';
import assert from 'node:assert/strict';
import {assessEditorialReleaseReadiness} from './editorial-release-gate.mjs';
const path='/markets/kenya.html';
const url='https://www.anybike.co.uk'+path;
const row={
  entity_type:'country',country_slug:'kenya',public_path:path,
  publication_state:'published',source_verified_at:'2026-11-04',
  live_verified_at:'2026-11-04',editorial_verified_at:'2026-11-04'
};
const live={url,finalUrl:url,status:200,checked:true,issues:[]};
const setup={routes:[row],selectedPaths:[path],liveResponses:[live],
  testsPassed:true,sourceAuditPassed:true,approvedByOwner:true};
test('all independent verification checks are required for release readiness',()=>{
 const result=assessEditorialReleaseReadiness(setup);
 assert.equal(result.ready,true);
 assert.equal(result.blockers.length,0);
 assert.match(result.status,/ready-for-separate/);
});
test('current candidate route never becomes release-ready',()=>{
 const result=assessEditorialReleaseReadiness({...setup,
   routes:[{...row,publication_state:'candidate',live_verified_at:null,editorial_verified_at:null}],
   testsPassed:false,approvedByOwner:false,liveResponses:[]});
 assert.equal(result.ready,false);
 assert.ok(result.blockers.some(x=>x.includes('not-published-in-registry')));
 assert.ok(result.blockers.some(x=>x.includes('live-publication-not-verified')));
 assert.ok(result.blockers.some(x=>x.includes('editorial-not-approved')));
 assert.ok(result.blockers.includes('automated-tests-not-confirmed-passed'));
});
test('server-level noindex or HTTP network failure blocks release',()=>{
 const failed=assessEditorialReleaseReadiness({...setup,liveResponses:[{...live,issues:['x-robots-tag-block']}]});
 assert.equal(failed.ready,false);
 assert.ok(failed.blockers.some(x=>x.startsWith('live-http-indexability-unconfirmed:')));
 const missing=assessEditorialReleaseReadiness({...setup,liveResponses:[]});
 assert.equal(missing.ready,false);
});
test('external, duplicate, missing route and empty selection are blocked',()=>{
 const missing=assessEditorialReleaseReadiness({...setup,selectedPaths:['/markets/fake.html']});
 assert.ok(missing.blockers.some(x=>x.includes('missing-private-registry-route')));
 const unsafe=assessEditorialReleaseReadiness({...setup,selectedPaths:['//evil.example']});
 assert.ok(unsafe.blockers.some(x=>x.startsWith('invalid-selected-path')));
 const duplicate=assessEditorialReleaseReadiness({...setup,selectedPaths:[path,path]});
 assert.ok(duplicate.blockers.some(x=>x.startsWith('duplicate-selected-path')));
 const empty=assessEditorialReleaseReadiness({...setup,selectedPaths:[]});
 assert.equal(empty.ready,false);
});
