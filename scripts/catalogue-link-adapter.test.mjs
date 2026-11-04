import test from 'node:test';
import assert from 'node:assert/strict';
import { graphFromCatalogueRows } from './catalogue-link-adapter.mjs';

const publicPages = [
 { id: 'model:7', type: 'model', title: 'R 1300 GS', url: '/bmw-r1300gs.html', published: true },
 { id: 'model:8', type: 'model', title: 'R 1250 GS', url: '/bmw-r1250gs.html', published: true },
 { id: 'country:KE', type: 'country', title: 'Kenya', url: '/markets/kenya.html', published: true },
 { id: 'manufacturer:15', type: 'manufacturer', title: 'BMW', url: '/bmw-motorcycles.html', published: true },
 { id: 'global:2', type: 'global', title: 'GS Story', url: '/global/bmw-story.html', published: true },
 { id: 'global:3', type: 'global', title: 'Draft Story', url: '/global/draft.html', published: false }
];

test('existing table relationships produce reciprocal public links without duplicates', () => {
 const r=graphFromCatalogueRows({
   publicPages,
   countryLinks:[
     {model_id:7,country_code:'ke',market_url:'/markets/kenya.html',is_published:true},
     {model_id:7,country_code:'ke',market_url:'/markets/kenya.html',is_published:true},
     {model_id:8,country_code:'ke',market_url:'/markets/wrong.html',is_published:true}
   ],
   globalStories:[
     {id:2,story_url:'/global/bmw-story.html',editorial_status:'published'},
     {id:3,story_url:'/global/draft.html',editorial_status:'draft'}
   ],
   storyManufacturers:[{story_id:2,manufacturer_id:15},{story_id:3,manufacturer_id:15}],
   modelRelationships:[{parent_model_id:7,child_model_id:8,relationship_type:'related-model',review_status:'approved'}]
 });
 const byId=Object.fromEntries(r.pages.map(p=>[p.id,p]));
 assert.equal(byId['country:KE'].links.length,1);
 assert.equal(byId['model:7'].links.length,2);
 assert.equal(byId['model:8'].links.length,1);
 assert.equal(byId['manufacturer:15'].links[0].id,'global:2');
 assert.equal(byId['global:2'].links[0].id,'manufacturer:15');
 assert.equal(r.pages.some(p=>p.id==='global:3'),false);
});
test('drafts, URL mismatches, non-published country rows and unreviewed model relationships are excluded', () => {
 const r=graphFromCatalogueRows({
   publicPages,
   countryLinks:[
     {model_id:7,country_code:'KE',market_url:'/markets/kenya.html',is_published:false},
     {model_id:7,country_code:'KE',market_url:'/markets/another.html',is_published:true}
   ],
   globalStories:[{id:2,story_url:'/global/incorrect.html',editorial_status:'published'}],
   storyManufacturers:[{story_id:2,manufacturer_id:15}],
   modelRelationships:[{parent_model_id:7,child_model_id:8,review_status:'draft'}]
 });
 assert.equal(r.pages.reduce((sum,p)=>sum+p.links.length,0),0);
});
test('empty input is safe', () => {
 assert.deepEqual(graphFromCatalogueRows(),{pages:[],diagnostics:[]});
});
