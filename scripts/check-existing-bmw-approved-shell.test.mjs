import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const pages=[
 'bmw-c400gt.html','bmw-c400x.html','bmw-ce02.html','bmw-ce04.html',
 'bmw-f850gs.html','bmw-f900gs.html','bmw-f900r.html','bmw-f900xr.html',
 'bmw-g650gs.html','bmw-hp4.html','bmw-k1600gt.html','bmw-k1600gtl.html',
 'bmw-m1000rr.html','bmw-r1200gs.html','bmw-r1200rt.html',
 'bmw-r1250gs.html','bmw-r1250r.html','bmw-r1250rt.html',
 'bmw-r18.html','bmw-r32.html','bmw-r80gs.html','bmw-r90s.html',
 'bmw-rninet.html','bmw-s1000r.html','bmw-s1000rr.html','bmw-s1000xr.html'
];
test('26 current BMW pages share the approved shell and preserve their canonical URLs',()=>{
 assert.equal(pages.length,26);
 for(const path of pages){
  const s=fs.readFileSync(path,'utf8');
  assert.ok(s.includes('type="module" src="/model-template/approved-bmw-page-shell.mjs?v=20261107-bmw-db-hero-v3"'),path+' shared shell');
  assert.ok(s.includes('/public-header.css?v=20261107-bmw-db-hero-v3'),path+' shared CSS');
  assert.ok(s.includes('id="generationPanel"'),path+' specification');
  assert.ok(s.includes('id="body"'),path+' research');
  assert.ok(s.includes('/public-header.js'),path+' shared stock renderer');
  assert.ok(s.includes('name="robots" content="index,follow"'),path+' indexability');
  assert.ok(s.includes('https://www.anybike.co.uk/'+path),path+' existing canonical');
 }
});
test('stock is independent, development follows specifications, R1250 gallery stays intact',()=>{
 const m=fs.readFileSync('model-template/approved-bmw-page-shell.mjs','utf8');
 assert.ok(m.includes("main.classList.add('anybike-approved-bmw-live-shell')"));
 assert.ok(m.includes('panel.after(section)'));
 assert.ok(m.includes("querySelector('#ukR1250ModelGallery,#ukR1250HistoryCards')"));
 assert.ok(m.includes('specs.after(existing)'));
 assert.ok(m.includes('const reconcileHistory=()=>'));
 assert.ok(m.includes('duplicate.hidden=documented'));
 assert.ok(m.includes('copied.hidden=documented'));
 assert.ok(m.includes("if(generationPanel&&!generationPanel.hidden"));
 assert.ok(!m.includes('existing.append(details)'));
 assert.ok(m.includes('publishedBmwResearch()'));
 assert.ok(m.includes('Array.isArray(published?.references)'));
 assert.ok(m.includes("section.className='anybike-master-model-sources'"));
 assert.ok(m.includes('existingSources.has(url)||seen.has(url)'));
 assert.ok(m.includes("client.rpc('public_bmw_model_history_v1'"));
 assert.ok(m.includes("applyBmwDatabaseSections(body,published)"));
 const research=fs.readFileSync('model-template/bmw-db-research-sections.mjs','utf8');
 assert.ok(research.includes('Source record year: '));
 assert.ok(!research.includes('Reference year: '));
 assert.ok(research.includes('nav.className=\'anybike-db-model-links\''));
 assert.ok(research.includes('primary.replaceWith(card)'), 'Database facts must replace old cards at their original positions');
 assert.ok(research.includes('for(const duplicate of others.slice(1))duplicate.remove()'), 'Remove repeat sections only');
 assert.ok(!research.includes('for(const legacy of others)legacy.remove();'), 'Do not drop source section order');
 assert.ok(research.includes('if(last)last.after(card);else body.append(card)'), 'New cards stay in the research group');

 assert.ok(m.includes('requested_path:location.pathname'));
 assert.ok(m.includes('normalise(published.model)!==normalise(model)'));
 assert.ok(!m.includes('preview_visible=true'));
 const css=fs.readFileSync('public-header.css','utf8');
 assert.ok(css.includes('APPROVED R1300 MODEL SHELL FOR EXISTING BMW GUIDES'));
 const r1250=fs.readFileSync('bmw-r1250gs.html','utf8');
 assert.ok(r1250.includes('id="r1250LiveStock"'));
 assert.ok(r1250.includes('id="ukR1250ModelGallery"'));
 const r1300=fs.readFileSync('bmw-r1300gs.html','utf8');
 assert.ok(!r1300.includes('approved-bmw-page-shell.mjs'));
 assert.ok(r1300.includes('id="internationalModelStock"'));
});
test('limited public model feed preserves row-level permissions and exact identities',()=>{
 const m=fs.readFileSync('model-template/approved-bmw-page-shell.mjs','utf8');
 assert.ok(m.includes("client.rpc('public_bmw_model_history_v1'"));
 assert.ok(m.includes('requested_path:location.pathname'));
 assert.ok(m.includes('if(!events.length&&!existing)'));
 assert.ok(!m.includes('service_role'));
 assert.ok(m.includes("client.rpc('public_bmw_model_hero_v1'"));
 assert.ok(m.includes('void applyBmwHero(hero,model)'));
 assert.ok(!m.includes('void hydrateHero(model)'));
 assert.ok(m.includes('anybike-bmw-master-hero-media'));
 assert.ok(m.includes('normalise(data.model)!==normalise(model)'));
 assert.ok(m.includes('hero.dataset.anybikeDatabaseModel=published.slug'));
 assert.ok(m.includes('published.hero_summary'));
 assert.ok(m.includes('published.hero_years'));
 assert.ok(m.includes('void applyBmwHero(hero,model)'));
 assert.ok(m.includes("client.rpc('public_bmw_model_hero_v1'"));
 assert.ok(m.includes("client.rpc('public_bmw_model_history_v1'"));
 assert.ok(m.includes('data.image_url'));
 assert.ok(!m.includes('service_role'));
});
