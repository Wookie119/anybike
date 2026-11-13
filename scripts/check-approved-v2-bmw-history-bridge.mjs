#!/usr/bin/env node
// BMW historical data bridge must preserve exact identities and prefer verified
// approved V2 editorial to legacy history; no model-specific HTML is needed.
import assert from 'node:assert/strict';
import {mergeApprovedBmwHistory} from '../model-template/approved-v2-bmw-history-bridge.mjs';
const context={make:'BMW',model:'R 1250 GS',approvedRoute:'/bmw-r1250gs.html'};
const history={
 make:'BMW',model:'R 1250 GS',
 hero_summary:'Manufacturer description',hero_years:'2019–2023',
 generations:[{label:'2019 ShiftCam',description:'Documented launch',source:'https://www.press.bmwgroup.com/example',engine_cc:1254}]
};
const result=mergeApprovedBmwHistory(null,history,context);
assert.equal(result.model,'R 1250 GS');
assert.equal(result.production.generations[0].engine_cc,1254);
assert.deepEqual(result.hero.paragraphs,['Manufacturer description']);
assert.equal(mergeApprovedBmwHistory(null,{...history,model:'R 1300 GS'},context),null);
assert.equal(mergeApprovedBmwHistory(null,history,{...context,approvedRoute:'/bmw-invalid.html?unsafe'}),null);
assert.equal(mergeApprovedBmwHistory(null,history,{...context,make:'Harley-Davidson'}),null);
const rejected=mergeApprovedBmwHistory(null,{...history,generations:[{label:'Unsupported',description:'No source',source:'javascript:alert(1)'}],hero_summary:'',hero_years:''},context);
assert.equal(rejected,null,'Unreferenced historical generations must not display');
const editorial={
 make:'BMW',model:'R 1250 GS',
 hero:{paragraphs:['Reviewed editorial'],years:'Reviewed model years'},
 production:{generations:[{label:'Approved model revision',source:'https://www.bmw.com/review'}]},
 sections:[['Official engineering','Verified editorial copy']]
};
const preserved=mergeApprovedBmwHistory(editorial,history,{...context,preferExisting:true});
assert.equal(preserved.production.generations[0].label,'Approved model revision');
assert.deepEqual(preserved.hero.paragraphs,['Reviewed editorial']);
assert.equal(preserved.hero.years,'Reviewed model years');
assert.deepEqual(preserved.sections,editorial.sections);
const older=mergeApprovedBmwHistory(editorial,history,context);
assert.equal(older.production.generations[0].label,'2019 ShiftCam','Public canonical BMW history supersedes older static guide facts');
assert.deepEqual(older.sections,editorial.sections,'Source-linked editorials must not be discarded');
const extra=mergeApprovedBmwHistory({make:'BMW',model:'R 1250 GS',sections:editorial.sections},history,{...context,preferExisting:true});
assert.equal(extra.production.generations[0].label,'2019 ShiftCam');
console.log('PASS: exact-route public BMW history bridge, rejected unsafe sources, no cross-model leakage, V2 editorial precedence');
