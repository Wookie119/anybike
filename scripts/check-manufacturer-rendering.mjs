// node scripts/check-manufacturer-rendering.mjs
// Execute the actual shared manufacturer script for multiple brand URLs.
// This guards against JavaScript errors that silently wipe models and categories.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('motorcycle-brand.html','utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(m=>m[1]).find(x=>x.includes('const guides='));
assert(script,'Shared manufacturer rendering code not found');
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const makes=['KTM','Honda','Yamaha','Suzuki','Kawasaki','Ducati','Triumph','Aprilia','Royal Enfield','Benelli','BSA','Moto Guzzi','Husqvarna','Indian Motorcycle'];
for(const make of makes){
  const elements=new Map();
  for(const id of ids)elements.set(id,{
    id,textContent:'',innerHTML:'',href:'',hidden:true,
    setAttribute(name,value){this[name]=value}
  });
  const doc={
    title:'',
    getElementById(id){return elements.get(id)||null},
    querySelector(selector){
      if(selector==='meta[name="description"]')return {content:''};
      throw Error('Unexpected selector '+selector);
    }
  };
  const location={search:'?make='+encodeURIComponent(make),replace(url){throw Error('Unexpected redirect '+url)}};
  vm.runInNewContext(script,{document:doc,location,URLSearchParams},{timeout:3000,filename:'motorcycle-brand.html'});
  const groups=elements.get('modelGroups').innerHTML;
  const cards=elements.get('categoryCards').innerHTML;
  assert(groups.includes('href='),make+': no rendered model links');
  assert(cards.includes('category-card'),make+': no rendered category cards');
  assert(!groups.includes('Loading manufacturer models'),make+': loading placeholder never replaced');
  assert(elements.get('title').textContent.startsWith(make+' '),make+': wrong manufacturer H1');
  assert(elements.get('requestLink').href.includes('make='+encodeURIComponent(make)),make+': sourcing link lacks manufacturer');
}
console.log('PASS: '+makes.length+' manufacturer pages execute and populate model groups and category cards.');
