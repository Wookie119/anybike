import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {approvedPhotoForModelYear,documentedCardYear,approvedPhotoCoverage} from './approved-photo-matcher.mjs';

const approved={manufacturer:'BMW',model:'R 1300 GS',approval_status:'approved',
 subject_category:'whole_motorcycle',model_year_start:2025,model_year_end:2025,
 image_url:'https://example.com/triple-black.jpg',source_page_url:'https://example.com/source',
 licence:'CC BY-SA 4.0',licence_url:'https://creativecommons.org/licenses/by-sa/4.0/',
 attribution:'Photographer and source',title:'2025 BMW R 1300 GS'};
const target={make:'BMW',model:'R 1300 GS',card:{cardType:'documented_model_year',modelYear:2025}};
test('only exact BMW make/model and documented model year may use approved photo',()=>{
 assert.equal(approvedPhotoForModelYear([approved],target),approved);
 for(const change of [
   {manufacturer:'Honda'},{model:'R 1250 GS'},{model:'R 1300 GS Adventure'},
   {approval_status:'pending_review'},{subject_category:'engine'},
   {model_year_start:2024,model_year_end:2024},{model_year_end:null},
   {image_url:'javascript:alert(1)'},{source_page_url:''},
   {licence:''},{licence_url:''},{attribution:''}
 ]){
  assert.equal(approvedPhotoForModelYear([{...approved,...change}],target),null,JSON.stringify(change));
 }
});
test('never assign announced or broad generation dates as exact model-year photographs',()=>{
 assert.equal(documentedCardYear({period:'September 2023'}),null);
 assert.equal(documentedCardYear({period:'2025 model year'}),null);
 assert.equal(documentedCardYear({cardType:'documented_generation',modelYear:2025}),null);
 assert.equal(documentedCardYear({card_type:'documented_generation',model_year:2025}),null);
 assert.equal(documentedCardYear({cardType:'documented_model_year',modelYear:2025}),2025);
 assert.equal(approvedPhotoForModelYear([approved],{...target,card:{period:'2025 model year'}}),null);
 assert.equal(approvedPhotoForModelYear([approved],{...target,card:{modelYear:2024}}),null);
});
test('photo-coverage report never borrows a BMW photograph for another BMW model',()=>{
 const report=approvedPhotoCoverage([approved],[
 {make:'BMW',model:'R 1250 GS',cards:[{period:'2025',modelYear:2025}]},
 {make:'BMW',model:'R 1300 GS',cards:[{period:'2025',modelYear:2025}]}
 ]);
 assert.equal(report[0].years[0].approved,false);
 assert.equal(report[1].years[0].approved,true);
});
test('universal V2 fetches only approved photo bank data for the exact model',()=>{
 const page=fs.readFileSync('motorcycle-model-universal-development.html','utf8');
 const module=fs.readFileSync('model-template/universal-motorcycle-v2.mjs','utf8');
 assert.match(page,/\.eq\("approval_status","approved"\)\.eq\("manufacturer",selectedModel\.make\)\.eq\("model",selectedModel\.model\)/);
 assert.match(page,/approvedPhotoForModelYear\(approvedPhotos/);
 assert.match(page,/photo\.licence_url/);
 assert.match(page,/photo\.attribution/);
 assert.match(page,/recordSlug!=="bmw-r-1300-gs"/);
 assert.doesNotMatch(page,/img\.src=year\.imageUrl/);
 assert.match(module,/imageUrl:null/);
});
