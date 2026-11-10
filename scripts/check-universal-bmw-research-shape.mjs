import assert from 'node:assert/strict';
import {renderUniversalPage} from '../model-template/universal-page-renderer.mjs';

// Representative, intentionally synthetic schema fixtures for the fifteen
// R 1300 GS section slots currently staged. NOT publication approvals or
// copied facts. The test verifies that the ONE renderer supports the schema.
class Element {
 constructor(tag,doc){
  this.tagName=tag;this.ownerDocument=doc;this.childNodes=[];
  this.dataset={};this.textContent='';this.className='';this.href='';
 }
 append(...items){this.childNodes.push(...items);}
 replaceChildren(...items){this.childNodes=[...items];}
}
const document={
 createElement(tag){return new Element(tag,this);},
 createDocumentFragment(){return new Element('#fragment',this)}
};
const entity={type:'model',id:77,manufacturer_id:15,name:'R 1300 GS',
 manufacturer_name:'BMW'};
const record=(n,title,content)=>({
 entity_type:'model',entity_id:77,manufacturer_id:15,
 section_number:n,section_key:'section_'+String(n).padStart(2,'0'),
 section_title:title,content,editorial_status:'published',
 publication_eligible:true,published_at:'2026-11-09T00:00:00Z'
});
const source='https://www.press.bmwgroup.com/example';
const sections=[
 record(1,'Model introduction',{summary:'Introductory research',years:'2024 model year',
  hero:{photo:{url:'https://example.org/unreviewed-photo.jpg'}}}),
 record(3,'Model history',{timeline:[{period:'September 2023',description:'Dated history'}]}),
 record(4,'Manufacturing evidence',{production_evidence:[{date:'2023-09',
  evidence:'Documented factory milestone',source}]}),
 record(5,'Engineering',{engineering:{verification_status:'approved',
  rows:[['Transmission','Six speed'],['Suspension','Factory equipment']]}}),
 record(6,'Model generations',{generations:[{title:'Generation details',
  description:'Documented generation'}],milestones:[{change:'Engineering update',source}]}),
 record(7,'Historical timeline',{milestones:[{year:2024,event:'Historical event',source}]}),
 record(9,'Motorcycle types',{types:[{label:'Adventure',url:'/motorcycle-type-adventure.html'}]}),
 record(12,'Technical specifications',{specifications:[{summary:'Factory technical data'}],
  verified_catalogue_facts:[{label:'Documented engine',source_verification_status:'verified',
   editorial_status:'approved',publication_eligible:true,
   source_url:source,value:{amount:1300,unit:'cc'}}]}),
 record(13,'Factory colours and editions',{colours:[{name:'Approved colour name'}],
  editions:[{label:'Documented edition'}]}),
 record(15,'Photography references',{photography:{publication_status:'awaiting_rights',
  display_policy:'Do not embed photography without explicit rights.',
  source_url:'https://example.org/unlicensed-photo.jpg'}}),
 record(16,'Ownership and buying',{deep_dive:[{title:'Ownership',
  paragraphs:[{text:'Buying guidance'},{
   text:'',link:['https://www.press.bmwgroup.com/example','BMW launch documentation']
  },{text:'',link:['javascript:alert(1)','Unsafe reference blocked']}
  ]}]}),
 record(17,'AnyBike Global research',{global_stories:{title:'Stories',
  description:'Explore approved articles',url:'/bmw-motorcycles.html#stories'}}),
 record(18,'Related motorcycles',{related_model_links:[{
  label:'R 1250 GS',url:'/bmw-r1250gs.html'}]}),
 record(19,'UK motorcycle services',{actions:[{label:'Sell this motorcycle',
  url:'/uk-motorcycle-selling.html'}]}),
 record(20,'International sourcing',{customer_copy:{
  uk_selling:{heading:'Sell your BMW',paragraphs:['Sell from the UK']},
  international_stock:{heading:'Available model stock',paragraphs:['Exact-model stock only']},
  international_enquiry:{heading:'Customer enquiries',paragraphs:['Contact AnyBike']},
  international_sourcing:{heading:'International sourcing',paragraphs:['Source from the UK']}
 },enquiry_form_copy:{labels:{email:'Email address'},submit:'Send'}})
];
const root=new Element('main',document);
root.dataset.anybikeUniversalRoot='true';
const view=renderUniversalPage(root,{entity,sections,stock:[]});
assert.equal(view.sections.length,15,'Expected all fifteen approved-schema research slots');
const children=root.childNodes[0].childNodes;
assert.deepEqual(children.map(x=>x.dataset.anybikeRole||x.tagName),
 ['header','stock','research','customer-actions']);
const visible=children[2].childNodes;
assert.equal(visible.length,14,
 'All genuinely readable research cards must render; photo-rights metadata must not');
assert(!visible.some(x=>x.dataset.sectionKey==='section_15'),
 'Unlicensed photography references cannot become a public research card');
const keys=visible.map(x=>x.dataset.sectionKey);
for(const n of [1,3,4,5,6,7,9,12,13,16,17,18,19,20])
 assert(keys.includes('section_'+String(n).padStart(2,'0')),
  'Missing visible research slot '+n);
const nodes=n=>[n,...(n.childNodes||[]).flatMap(nodes)];
const all=nodes(root),displayed=all.map(x=>x.textContent||'').join(' | ');
for(const expected of [
 '2024 model year','Documented factory milestone','Factory equipment',
 'Documented engine','1300 cc','Explore approved articles',
 'Sell this motorcycle','International sourcing','Source from the UK'
])assert(displayed.includes(expected),'Lost reviewed research: '+expected);
assert(!displayed.includes('Email address'),
 'Enquiry form labels must not imply a functioning form');
assert(!all.some(x=>x.tagName==='img'),
 'Unlicensed source photograph was embedded');
assert(all.some(x=>x.href==='/bmw-r1250gs.html'),
 'Related canonical model links were lost');
assert(all.some(x=>x.href==='https://www.press.bmwgroup.com/example'&&
 x.textContent==='BMW launch documentation'&&
 x.rel==='noopener noreferrer'),'Reviewed source paragraph link lost');
assert(!all.some(x=>String(x.href).startsWith('javascript:')),
 'Unsafe paragraph reference was displayed');
console.log('PASS: fifteen-section BMW schema covers fourteen readable cards, preserves stock order and excludes photo-rights-only content');
