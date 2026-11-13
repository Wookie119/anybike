#!/usr/bin/env node
import assert from 'node:assert/strict';
import {supplementPublishedV2Guide} from '../model-template/approved-v2-published-guide-supplements.mjs';
const identity={make:'BMW',model:'R 1250 GS'};
const existing={...identity,summary:'Approved V2 editorial',production:{official_colours:[{model_year:2024,name:'V2 verified colour',source:'https://www.bmw.com/official'}]}};
const legacy={...identity,summary:'Older public summary',production:{
 documented_milestones:[{year:2018,event:'BMW ShiftCam launch',source:'https://www.press.bmwgroup.com/global/example'}],
 specifications:[{model_year:2019,engine_cc:1254,source:'https://www.press.bmwgroup.com/global/specification'}],
 official_colours:[{model_year:2023,name:'Older publication',source:'https://www.press.bmwgroup.com/global/colour'}]
}};
const merged=supplementPublishedV2Guide(existing,legacy,identity);
assert.equal(merged.summary,'Approved V2 editorial');
assert.equal(merged.production.official_colours[0].name,'V2 verified colour');
assert.equal(merged.production.documented_milestones[0].year,2018);
assert.equal(merged.production.specifications[0].engine_cc,1254);
assert.equal(supplementPublishedV2Guide(existing,{...legacy,model:'R 1300 GS'},identity),existing);
assert.equal(supplementPublishedV2Guide(existing,legacy,{make:'Yamaha',model:'R 1250 GS'}),existing);
assert.equal(supplementPublishedV2Guide(null,legacy,identity),null);
const unsafe={...legacy,production:{documented_milestones:[
 {year:2018,event:'Unapproved link',source:'javascript:alert(1)'},
 {year:2019,event:'Unknown source',source:''},
 {year:2020,event:'Official record',source:'https://www.bmw.com/example'}
 ]}};
const screened=supplementPublishedV2Guide({...identity},unsafe,identity);
assert.deepEqual(screened.production.documented_milestones.map(x=>x.year),[2020]);
console.log('PASS: published V2 retains editorial priority; exact identity and source-attributed historical rows only');
