// Read-only regression for historically grounded manufacturer links on
// /markets/*.html. Brand origin must not be presented as guaranteed current
// ownership, local stock or a legal right to import a motorcycle.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const source=readFileSync(new URL('../market-global-editorial-links.js',import.meta.url),'utf8');
const catalogue=JSON.parse(readFileSync(
 new URL('../data/motorcycle-catalogue-master.json',import.meta.url),'utf8'));
const script=new Script(source);
const approved=new Set(catalogue.models.map(m=>m.make));
const expected={
 japan:['Honda','Yamaha','Suzuki','Kawasaki'],
 italy:['Ducati','Aprilia','Moto Guzzi','Benelli','Bimota','MV Agusta',
  'Beta','Fantic','Piaggio','Vespa','Moto Morini','Italjet'],
 germany:['BMW'],
 'united-kingdom':['Triumph','BSA','Norton','AJS','CCM','Maeving'],
 'united-states':['Harley-Davidson','Indian Motorcycle','Zero Motorcycles'],
 india:['Royal Enfield'],
 austria:['KTM'],
 sweden:['Husqvarna'],
 spain:['GASGAS','Rieju'],
 france:['Peugeot Motocycles'],
 taiwan:['Kymco','SYM'],
 china:['CFMOTO','QJMotor','Voge','NIU','KOVE','Surron','Talaria','Zontes']
};
function node(tag){
 return{tagName:tag,dataset:{},style:{},textContent:'',href:'',
  children:[],setAttribute(name,value){this[name]=value;},
  append(...x){this.children.push(...x);},
  appendChild(x){this.children.push(x);return x;},
  querySelector(selector){
   if(selector==='[data-anybike-global-market-research]')
    return this.children.find(x=>x.dataset.anybikeGlobalMarketResearch)||null;
   return null;
  }};
}
function render(slug){
 const main=node('main');
 const doc={
  readyState:'complete',documentElement:{dataset:{country:slug}},
  querySelector(s){return s==='main'?main:null;},
  createElement:node
 };
 const args={document:doc,location:{pathname:'/markets/'+slug+'.html'}};
 script.runInNewContext(args);
 script.runInNewContext(args);
 assert.equal(main.children.length,1,'Market research duplicated: '+slug);
 const block=main.children[0];
 const sections=block.children.filter(x=>x.dataset.anybikeManufacturerHeritage);
 assert.equal(sections.length,expected[slug]?1:0,
  'Origin section missing or inferred for unsupported market '+slug);
 if(!sections.length)return [];
 const countrySection=sections[0],brands=countrySection.children.find(x=>x.tagName==='nav');
 const history=countrySection.children.find(x=>x.dataset?.anybikeRegionalHistory);
 assert(history&&history.textContent.length>80,
  'Country regional manufacturing history missing: '+slug);
 assert(!/currently made in|available in stock|import approved/i.test(history.textContent),
  'Regional history may not imply current production or import eligibility: '+slug);
 assert(brands,'Brand links missing for '+slug);
 const links=brands.children.map(item=>item.children[0]);
 assert.equal(links.length,expected[slug].length,
  'Unexpected country-to-brand links for '+slug);
 for(let i=0;i<links.length;i++){
  const a=links[i],make=expected[slug][i],detail=brands.children[i].children[1];
  assert.equal(a.textContent,make+' →');
  assert(approved.has(make),'Link to brand without a public manufacturer directory: '+make);
  const path=make==='BMW'?'/bmw-motorcycles.html':
   make==='Harley-Davidson'?'/harley-davidson-motorcycles.html':
   '/motorcycle-brand.html?make='+encodeURIComponent(make);
  assert.equal(a.href,path,'Wrong or unsafe manufacturer link: '+make);
  assert(!a.href.includes('#models'),
   'Country manufacturer link must open top of manufacturer guide: '+make);
  assert(!a.href.includes('#'),
   'Country heritage link must not jump past manufacturer introduction: '+make);
  assert(detail.textContent.length>10,'Manufacturer history note missing: '+make);
  assert(!/stock available|ships to|import approved/i.test(detail.textContent),
   'Country brand history implied eligibility or stock');
 }
 assert(countrySection.children.some(x=>x.textContent.includes('ownership')),
  'Historical origins must be distinguished from current ownership');
 return links;
}
let checkedLinks=0;
for(const slug of Object.keys(expected))checkedLinks+=render(slug).length;
assert.equal(checkedLinks,42,'Unexpected number of researched brand-country links');
for(const slug of ['kenya','argentina','new-zealand','isle-of-man'])
 assert.deepEqual(render(slug),[],'Unreviewed local manufacturer invented');
console.log('PASS: '+checkedLinks+' verified top-of-brand heritage links across '+
 Object.keys(expected).length+' country groups, with regional origin caveats and no false stock claims');
