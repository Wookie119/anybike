import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const names=[
'c400gt','c400x','ce02','ce04','f850gs','f900gs','f900r','f900xr',
'g650gs','hp4','k1600gt','k1600gtl','m1000rr','r1200gs','r1200rt',
'r1250gs','r1250r','r1250rt','r1300gs','r18','r32','r80gs','r90s',
'rninet','s1000r','s1000rr','s1000xr'
];
test('27 BMW models preserve model-specific identity and public sourcing in their actual renderer',()=>{
 for(const name of names){
  const file='bmw-'+name+'.html';
  const html=fs.readFileSync(file,'utf8');
  assert.ok(html.includes('id="heading"'),file+' missing model heading');
  assert.ok(html.includes('id="body"'),file+' missing research section');
  assert.ok(html.includes('id="generationPanel"'),file+' missing generation section');
  assert.ok(html.includes('id="nextAction"'),file+' missing public sourcing action');
  assert.ok(html.includes('id="sourceBottom"'),file+' missing sourcing link');
  assert.ok(html.includes('id="modelSources"'),file+' missing source references');
  assert.ok(html.includes('id="internationalGuestRequestForm"'),file+' missing guest enquiry form');
  if(name==='r1300gs'){
   // The approved BMW reference is deliberately not a generic model shell.
   assert.ok(html.includes('id="r1300gsModelHistory"'),file+' original model history removed');
   assert.ok(html.includes('id="ukR1300ModelGallery"'),file+' original gallery removed');
  }else{
   assert.ok(html.includes('approved-v2-universal-preview.mjs'),file+' missing shared research renderer');
   assert.ok(html.includes('approved-v2-dynamic-navigation.mjs'),file+' missing shared model navigation');
  }
  assert.ok(html.includes('href="/bulk-buying-request.html?make=BMW'),file+' missing sourcing URL');
  assert.ok(html.includes('name="robots" content="index,follow"'),file+' accidentally deindexed');
  const oldLoader=html.indexOf('const el=id=>document.getElementById(id)');
  if(oldLoader>=0){
   const script=html.slice(oldLoader);
   if(!html.includes('id="crumbModel"'))
    assert.ok(!script.includes(';el("crumbModel").textContent=actualModel;'),file+' unsafe retired breadcrumb');
   if(!html.includes('id="parent"'))
    assert.ok(!script.includes(';el("parent").href=brandUrl;'),file+' unsafe retired parent link');
  }
 }
});
test('F 900 GS verified research remains available and its public sourcing survives errors',()=>{
 const f900=fs.readFileSync('bmw-f900gs.html','utf8');
 const renderer=fs.readFileSync('model-template/approved-v2-universal-preview.mjs','utf8');
 const guide=JSON.parse(fs.readFileSync('data/motorcycle-model-guides.json','utf8'));
 const data=Object.values(guide.models).find(g=>g.make==='BMW'&&g.model==='F 900 GS');
 assert.ok(f900.includes('approved-v2-universal-preview.mjs'));
 assert.ok(f900.includes('id="sourceBottom"'));
 assert.ok(f900.includes('id="internationalGuestRequestForm"'));
 assert.ok(renderer.includes('installVerifiedModelFacts'));
 assert.ok(data&&Array.isArray(data.sections)&&data.sections.length>0);
 assert.ok(data.production.generations.length>0);
 assert.ok(data.production.official_colours.length>0);
});
