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
  assert.match(s,/type="module" src="\/model-template\/approved-bmw-page-shell\.mjs\?v=[a-zA-Z0-9-]+"/,path+' shared shell');
  assert.match(s,/\/public-header\.css\?v=[a-zA-Z0-9-]+/,path+' shared CSS');
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
 assert.ok(m.includes("client.rpc('public_anybike_country_navigation_v1')"),'Regional links load from shared database endpoint');
 assert.ok(m.includes("if(!published.country_markets?.length)"),'Preserve editorially specified model-market links');
 assert.ok(m.includes('addDatabaseCountryNavigation(body,data)'), 'Use shared existing research renderer for markets');
 const research=fs.readFileSync('model-template/bmw-db-research-sections.mjs','utf8');
 const country=fs.readFileSync('model-template/public-country-market-navigation.mjs','utf8');
 assert.ok(country.includes("all.href='/international-markets.html'"),'Link to canonical markets directory');
 assert.ok(country.includes("details.addEventListener('toggle'"),'Render region links on demand');
 assert.ok(research.includes("from './public-country-market-navigation.mjs'"),'Single shared manufacturer and model navigation component');


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
test('dedicated BMW stock keeps authenticated ownership but displays above research',()=>{
 const shell=fs.readFileSync('model-template/approved-bmw-page-shell.mjs','utf8');
 assert.ok(shell.includes("querySelector(':scope > #internationalModelStock')"),'Existing dedicated international gallery is reused');
 assert.ok(shell.includes('currentHero.after(dedicatedStock)'),'Exact stock sits immediately below hero');
 assert.ok(!shell.includes('dedicatedStock.hidden=false'),'Only original protected stock feed controls visibility');
 const guide=fs.readFileSync('bmw-s1000rr.html','utf8');
 assert.ok(guide.includes('id="internationalModelStock" hidden'),'Original gallery permission gate stays intact');
 assert.ok(guide.includes('international-public-stock'),'Original authenticated international stock endpoint remains');
 const css=fs.readFileSync('public-header.css','utf8');
 assert.ok(css.includes('#body [data-anybike-db-section="country_markets"]'),'Market layout is compact on model pages');
});
test('BMW hero displays the photograph only after the exact approved file loads',()=>{
 const shell=fs.readFileSync('model-template/approved-bmw-page-shell.mjs','utf8');
 assert.ok(shell.includes("img.onload=()=>"),'Hero photograph needs a successful load signal');
 assert.ok(shell.includes("media.append(img,caption)"),'Photo and attribution appear together');
 assert.ok(shell.includes("fallback.remove()"),'Successful photograph replaces typographic fallback');
 assert.ok(shell.includes("img.onerror=tryNext"),'Broken image must retry or retain clean fallback');
 assert.ok(shell.includes("if(nextImage>=imageCandidates.length)"),'Unavailable image must not render a broken placeholder');
});
test('optional BMW guide data cannot blank existing approved model sections',()=>{
 const shell=fs.readFileSync('model-template/approved-bmw-page-shell.mjs','utf8');
 assert.ok(shell.includes("const guides=data&&data.models&&typeof data.models==='object'&&!Array.isArray(data.models)"));
 assert.ok(shell.includes("guides.find(g=>g&&typeof g.make==='string'&&typeof g.model==='string'"));
 assert.ok(shell.includes("Array.isArray(local?.production?.generations)"));
 assert.ok(shell.includes("typeof g.label==='string'&&typeof g.description==='string'"));
 assert.ok(shell.includes("if(main.querySelector('#ukR1300ModelGallery'))return false"),'Approved R 1300 GS must remain untouched');
 assert.ok(shell.includes('if(existing){'),'R 1250 GS approved model-year gallery must remain intact');
});

test('active shared public header protects exact-model stock above BMW research',()=>{
 const shared=fs.readFileSync('public-header.js','utf8');
 const segment=shared.slice(shared.indexOf('/* PROTECTED MODEL GALLERY'));
 assert.ok(segment.includes("if(hero)hero.after(section)"),'Sale stock follows model hero');
 assert.ok(segment.includes("else if(make==='BMW'&&main.querySelector('#generationPanel')){research.remove();}"),'No duplicate BMW research card');
 assert.ok(segment.includes("x.catalogue_identity_status!=='verified'"),'Only verified stock identities');
 assert.ok(segment.includes("x.publication_eligible!==true"),'Only published stock');
 assert.ok(segment.includes("return safe(x.model)===requested"),'Exact model names, not prefix matches');
 assert.ok(segment.includes('const matches=exactIds.size===1?candidates.slice(0,6):[]'),'Ambiguous catalogue IDs never publish');
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
