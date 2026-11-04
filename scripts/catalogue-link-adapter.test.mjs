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
test('published country entries without a motorcycle model never create links', () => {
 const r=graphFromCatalogueRows({
   publicPages,
   countryLinks:[{model_id:null,country_code:'KE',market_url:'/markets/kenya.html',is_published:true}]
 });
 assert.equal(r.pages.reduce((sum,p)=>sum+p.links.length,0),0);
});

test('verified manufacturer-model identities link in both directions by exact canonical make',()=>{
 const r=graphFromCatalogueRows({
   publicPages,
   manufacturers:[{id:15,display_name:'BMW'},{id:28,display_name:'Harley-Davidson'}],
   models:[{id:7,manufacturer:' bmw ',model:'R 1300 GS'},{id:8,manufacturer:'BMW',model:'R 1250 GS'},{id:999,manufacturer:'BMW',model:'Unpublished model'}]
 });
 const byId=Object.fromEntries(r.pages.map(p=>[p.id,p]));
 assert.deepEqual(byId['manufacturer:15'].links.map(p=>p.id),['model:8','model:7']);
 assert.equal(byId['model:7'].links[0].id,'manufacturer:15');
 assert.equal(byId['model:8'].links[0].id,'manufacturer:15');
 assert.equal(r.pages.some(p=>p.id==='model:999'),false);
});
test('unknown or ambiguous manufacturer does not create a guessed link',()=>{
 const r=graphFromCatalogueRows({
   publicPages,
   manufacturers:[{id:15,display_name:'BMW'},{id:40,display_name:' bmw '}],
   models:[{id:7,manufacturer:'BMW'}]
 });
 assert.equal(r.pages.reduce((n,p)=>n+p.links.length,0),0);
});

test('empty input is safe', () => {
 assert.deepEqual(graphFromCatalogueRows(),{pages:[],diagnostics:[]});
});


test('private published country regions generate reciprocal navigation, not model availability',()=>{
 const pages=[
  {id:'country:kenya',type:'country',title:'Kenya',url:'/markets/kenya.html',published:true},
  {id:'country:ghana',type:'country',title:'Ghana',url:'/markets/ghana.html',published:true},
  {id:'country:france',type:'country',title:'France',url:'/markets/france.html',published:true},
  {id:'model:7',type:'model',title:'R 1300 GS',url:'/bmw-r1300gs.html',published:true}
 ];
 const mk=(slug,name,region)=>({
  entity_type:'country',country_slug:slug,country_name:name,country_region:region,
  public_path:'/markets/'+slug+'.html',publication_state:'published',
  source_verified_at:'2026-11-04',live_verified_at:'2026-11-04',
  editorial_verified_at:'2026-11-04'
 });
 const graph=graphFromCatalogueRows({
  publicPages:pages,
  regionalCountryRoutes:[mk('kenya','Kenya','Africa'),mk('ghana','Ghana','Africa'),
    mk('france','France','Europe')]
 });
 const byId=Object.fromEntries(graph.pages.map(p=>[p.id,p]));
 assert.deepEqual(byId['country:kenya'].links.map(p=>p.id),['country:ghana']);
 assert.deepEqual(byId['country:ghana'].links.map(p=>p.id),['country:kenya']);
 assert.equal(byId['country:france'].links.length,0);
 assert.equal(byId['model:7'].links.length,0);
 const blocked=graphFromCatalogueRows({
  publicPages:pages,
  regionalCountryRoutes:[mk('kenya','Kenya','Africa'),
    {...mk('ghana','Ghana','Africa'),live_verified_at:null}]
 });
 assert.equal(blocked.pages.reduce((n,p)=>n+p.links.length,0),0);
});
