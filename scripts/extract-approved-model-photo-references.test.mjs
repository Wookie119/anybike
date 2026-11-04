import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectApprovedModelPhotoReferences} from './extract-approved-model-photo-references.mjs';
const sourcePath='/harley-davidson-fat-boy.html';
const image='https://commons.wikimedia.org/wiki/Special:FilePath/Fat%20Boy.jpg?width=1100';
const credit='https://commons.wikimedia.org/wiki/File:Fat_Boy.jpg';
const html='<html><head><link rel="canonical" href="https://www.anybike.co.uk'+sourcePath+'">'+
 '<meta name="robots" content="index,follow"></head><body><main>'+
 '<img src="'+image+'" alt="Harley Davidson Fat Boy">'+
 '<img src="'+image+'" alt="same image">'+
 '<a href="'+credit+'">Photo attribution</a>'+
 '<img src="https://example.com/seller-private.jpg" alt="not a photo bank candidate">'+
 '</main></body></html>';
const args={html,sourcePath,sourceGitBlobSha:'a'.repeat(40),modelId:127};
test('deduplicates static Commons photos and preserves unapproved rights status',()=>{
 const r=inspectApprovedModelPhotoReferences(args);
 assert.equal(r.eligible,true);
 assert.equal(r.candidates.length,1);
 assert.equal(r.candidates[0].attribution_link,credit);
 assert.equal(r.candidates[0].rights_review_status,'requires_review');
 assert.equal(r.candidates[0].year_accuracy_status,'unverified');
 assert.equal(r.candidates[0].image_url,image);
});
test('never imports external seller images or invents a Commons credit',()=>{
 const r=inspectApprovedModelPhotoReferences({...args,html:html.replace('<a href="'+credit+'">Photo attribution</a>','')});
 assert.equal(r.candidates.length,1);
 assert.equal(r.candidates[0].attribution_link,null);
});
test('rejects wrong canonical, source noindex, invalid SHA and unsafe paths',()=>{
 assert.equal(inspectApprovedModelPhotoReferences({...args,html:html.replace(sourcePath,'/other.html')}).eligible,false);
 assert.equal(inspectApprovedModelPhotoReferences({...args,html:html.replace('index,follow','noindex')}).eligible,false);
 assert.equal(inspectApprovedModelPhotoReferences({...args,sourcePath:'/../secret.html'}).eligible,false);
 assert.equal(inspectApprovedModelPhotoReferences({...args,sourceGitBlobSha:'invalid'}).eligible,false);
});
