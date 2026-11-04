import test from 'node:test';
import assert from 'node:assert/strict';
import {extractModelSectionCandidates} from './extract-model-section-candidates.mjs';

const source='/harley-davidson-fat-boy.html';
const sha='a'.repeat(40);
const section=(h,body)=>'<section class="card"><h2>'+h+'</h2>'+body+'</section>';
const html='<html><head><link rel="canonical" href="https://www.anybike.co.uk'+source+'">'+
 '<meta name="robots" content="index,follow"></head><body>'+
 section('UK buyer\'s model-specific checklist',
 '<p>Check the VIN and official build record, service history, brakes, chassis and original factory equipment before making an offer.</p>')+
 section('Fat Boy: important production generations',
 '<ul><li>Check the original early Softail examples against later factory changes and verify exact engine year and equipment.</li></ul>')+
 section('Compare documented specifications',
 '<p>Technical figures should be confirmed with the exact factory publication for the particular model year.</p>')+
 '</body></html>';
const args={html,sourcePublicPath:source,modelId:127,sourceSha:sha};
test('extracts only known factual sections as unapproved evidence',()=>{
 const result=extractModelSectionCandidates(args);
 assert.equal(result.eligible,true);
 assert.deepEqual(result.candidates.map(x=>x.category_key),['buying_guidance','chronology','technical_specifications']);
 assert.ok(result.candidates.every(x=>x.source_git_blob_sha===sha&&x.review_state==='source_captured'));
 assert.ok(result.candidates.every(x=>x.evidence_text.length>55));
});
test('rejects malformed identity, a different canonical and source noindex',()=>{
 assert.equal(extractModelSectionCandidates({...args,sourceSha:'invalid'}).eligible,false);
 assert.equal(extractModelSectionCandidates({...args,sourcePublicPath:'/../private.html'}).eligible,false);
 assert.equal(extractModelSectionCandidates({...args,html:html.replace(source,'/wrong.html')}).eligible,false);
 assert.equal(extractModelSectionCandidates({...args,html:html.replace('index,follow','noindex,follow')}).eligible,false);
});
test('disallows scripts or unrelated material in a matched section',()=>{
 const injected=html.replace('</section>','<script>document.write("bad")</script></section>');
 const r=extractModelSectionCandidates({...args,html:injected});
 assert.ok(r.candidates.every(x=>!x.evidence_text.includes('document.write')));
 assert.ok(!r.candidates.some(x=>x.category_key==='buying_guidance'));
});
test('does not invent model years or unrelated factory claims',()=>{
 const unmatched=html.replace('Fat Boy: important production generations','Marketing headline');
 const r=extractModelSectionCandidates({...args,html:unmatched});
 assert.ok(!r.candidates.some(x=>x.category_key==='chronology'));
});
