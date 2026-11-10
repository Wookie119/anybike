import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const source=readFileSync(
 new URL('../market-global-editorial-links.js',import.meta.url),'utf8');
const loader=readFileSync(
 new URL('../public-header.js',import.meta.url),'utf8');
assert(loader.includes('/market-global-editorial-links.js?v='),
 'Country pages must install Global links from the existing shared header');
assert(loader.includes('data-anybike-global-market-links'),
 'Shared loader must prevent duplicates');
const script=new Script(source,{filename:'market-global-editorial-links.js'});
const knownLocal=[
 '/anybike-global.html','/anybike-global.html#features',
 '/anybike-global.html#voices','/anybike-global.html#racing-legends',
 '/anybike-global.html#bmw-r1300gsa-manual-asa',
 '/motorcycle-manufacturers.html','/bmw-motorcycles.html',
 '/buy-motorcycles.html',
 '/global/honda-nm4-vultus-did-you-know.html',
 '/global/suzuki-hayabusa-japan-design-speed.html',
 '/global/yamaha-niken-leaning-three-wheel-design.html',
 '/global/bimota-tesi-h2-blimey-look-at-that.html',
 '/global/ducati-diavel-v4-i-want-one.html',
 '/global/royal-enfield-himalayan-india-mountain-roads.html',
 '/global/bajaj-pulsar-indian-motorcycle-evolution.html',
 '/global/harley-ss-screamin-eagle-cvo-history.html',
 '/global/harley-tyre-buying-guide.html'
];
const localPaths=new Set(knownLocal.map(x=>x.split('#')[0]));
for(const path of localPaths){
 assert(readFileSync(new URL('..'+path,import.meta.url),'utf8').includes('<html'),
  'Global country research link points to missing HTML '+path);
}
const local=['japan','italy','india','germany','united-states',
 'united-kingdom','isle-of-man','australia','canada',
 'new-zealand','south-africa','france','spain'];
function node(tag){
 const children=[];
 return {tagName:tag,children,style:{},dataset:{},textContent:'',
  href:'',id:'',isConnected:true,
  append(...items){children.push(...items)},
  appendChild(item){children.push(item);return item;},
  setAttribute(name,value){this[name]=value;},
  querySelector(selector){
   if(selector==='[data-anybike-global-market-research]')
    return children.find(x=>x.dataset?.anybikeGlobalMarketResearch)||null;
   return null;
  }
 };
}
function render(slug){
 const main=node('main');
 const doc={
  readyState:'complete',documentElement:{dataset:{country:
   slug.replace(/-/g,' ').replace(/\b\w/g,s=>s.toUpperCase())}},
  querySelector(selector){return selector==='main'?main:null},
  createElement:node,
  addEventListener(){throw Error('Unnecessary ready event');}
 };
 script.runInNewContext({document:doc,location:{pathname:'/markets/'+slug+'.html'}});
 script.runInNewContext({document:doc,location:{pathname:'/markets/'+slug+'.html'}});
 const result=main.children.filter(x=>x.dataset.anybikeGlobalMarketResearch);
 assert.equal(result.length,1,'Research links duplicated on '+slug);
 const links=result[0].children.find(x=>x.tagName==='nav').children;
 assert(links.length>=2,'Global/country navigation missing on '+slug);
 assert(links.some(x=>x.href==='/anybike-global.html'),'Global hub missing on '+slug);
 assert(links.some(x=>x.href==='/motorcycle-manufacturers.html'),'Manufacturer research missing on '+slug);
 for(const a of links){
  assert(a.href.startsWith('/')&&!a.href.startsWith('//'),
   'External or unsafe research link on '+slug);
  assert(localPaths.has(a.href.split('#')[0]),
   'Unknown internal link '+a.href+' on '+slug);
 }
 if(local.includes(slug))assert(links.length>=3,
  'Locally relevant editorial story missing on '+slug);
 return links.length;
}
for(const slug of local)render(slug);
for(let i=1;i<=217;i++){
 const slug='catalogue-test-'+i;
 assert.equal(render(slug),2,
  'Generic market cannot imply unsupported local motorcycle expertise');
}
console.log('PASS: 217 generic market routes get safe Global links, 13 named countries gain relevant articles, all links exist and duplicate mounts are blocked');
