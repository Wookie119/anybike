import test from 'node:test';
import assert from 'node:assert/strict';
import {extractApprovedModelHero} from './extract-approved-model-hero.mjs';
const base='/harley-davidson-road-glide.html';
const title='Harley-Davidson Road Glide';
const hash='a'.repeat(40);
const html='<html><head><meta name="robots" content="index,follow">'+
 '<link rel="canonical" href="https://www.anybike.co.uk'+base+'"></head>'+
 '<body><main><section class="hero"><h1>'+title+'</h1>'+
 '<p class="intro">Frame-mounted sharknose fairing with touring specifications that vary by model year.</p>'+
 '<h2>Model years and generations</h2><p>Compare the year and engine family.</p>'+
 '</section></main></body></html>';
const args={html,sourcePath:base,modelName:title,sourceSha:hash};
test('preserves approved hero text verbatim and records provenance',()=>{
 const r=extractApprovedModelHero(args);
 assert.equal(r.eligible,true);
 assert.equal(r.record.source_sha,hash);
 assert.equal(r.record.original_title,title);
 assert.equal(r.record.generation_note,'Compare the year and engine family.');
 assert.equal(r.record.extraction_status,'source_capture_only');
});
test('blocks wrong model identity, changed canonical and noindex',()=>{
 assert.equal(extractApprovedModelHero({...args,modelName:'Harley-Davidson Fat Boy'}).eligible,false);
 assert.equal(extractApprovedModelHero({...args,html:html.replace(base,'/some-other.html')}).eligible,false);
 assert.equal(extractApprovedModelHero({...args,html:html.replace('index,follow','noindex')}).eligible,false);
});
test('does not infer missing introductions, unsafe source path or source hash',()=>{
 assert.equal(extractApprovedModelHero({...args,html:html.replace('class="intro"','class="advert"')}).eligible,false);
 assert.equal(extractApprovedModelHero({...args,sourcePath:'/../private.html'}).eligible,false);
 assert.equal(extractApprovedModelHero({...args,sourceSha:'invalid'}).eligible,false);
});
