import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const names=[
'c400gt','c400x','ce02','ce04','f850gs','f900gs','f900r','f900xr',
'g650gs','hp4','k1600gt','k1600gtl','m1000rr','r1200gs','r1200rt',
'r1250gs','r1250r','r1250rt','r1300gs','r18','r32','r80gs','r90s',
'rninet','s1000r','s1000rr','s1000xr'
];
test('27 live BMW model loaders cannot crash on retired breadcrumb IDs',()=>{
 for(const name of names){
  const file='bmw-'+name+'.html';
  const html=fs.readFileSync(file,'utf8');
  assert.ok(html.includes('id="heading"'),file);
  assert.ok(html.includes('id="generationPanel"'),file);
  assert.ok(html.includes('id="body"'),file);
  const script=html.slice(html.indexOf('const el=id=>document.getElementById(id)'));
  assert.ok(script.length>500,file+' original research loader missing');
  if(!html.includes('id="crumbModel"')){
   assert.ok(!script.includes(';el("crumbModel").textContent=actualModel;'),file+' null breadcrumb crash');
   assert.ok(script.includes('if(el("crumbModel"))')||script.includes('if(crumb)crumb.textContent'),file+' absent crumb requires guard');
  }
  if(!html.includes('id="parent"')){
   assert.ok(!script.includes(';el("parent").href=brandUrl;'),file+' null parent crash');
   assert.ok(script.includes('if(el("parent"))')||script.includes('if(parent){'),file+' absent parent requires guard');
  }
  for(const id of ['heading','category','summary','years','manufacturer','source','sourceBottom','nextAction','generationPanel','generationControls','generationDetail','generationCompareRows','generationCompare','body']){
   assert.ok(html.includes('id="'+id+'"'),file+' missing required '+id);
  }
 }
});
test('model research error fallback must not hide public sourcing actions',()=>{
 const f900=fs.readFileSync('bmw-f900gs.html','utf8');
 assert.ok(f900.includes('guide.sections.forEach'));
 const guide=JSON.parse(fs.readFileSync('data/motorcycle-model-guides.json','utf8'));
 const data=Object.values(guide.models).find(g=>g.make==='BMW'&&g.model==='F 900 GS');
 assert.ok(data);
 assert.ok(Array.isArray(data.sections));
 assert.ok(data.production.generations.length>0);
 assert.ok(data.production.official_colours.length>0);
});
