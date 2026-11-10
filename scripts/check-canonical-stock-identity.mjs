import assert from 'node:assert/strict';
import {canonicalStockMatches,stockForCanonicalModel} from '../model-template/canonical-public-stock-identity.mjs';
const target={catalog_model_id:68}; // BMW R 1250 GS
const ok={catalog_model_id:68,catalogue_identity_status:'verified',publication_eligible:true,item_id:201};
assert(canonicalStockMatches(ok,target));
assert(!canonicalStockMatches({...ok,catalog_model_id:77},target),'R 1300 GS leaked into R 1250 GS');
assert(!canonicalStockMatches({...ok,catalog_model_id:69},target),'Adventure leaked into base GS');
assert(!canonicalStockMatches({...ok,catalog_model_id:70},target),'TE leaked into base GS');
assert(!canonicalStockMatches({...ok,catalog_model_id:null,model:'R 1250 GS'},target),'Text fallback allowed');
assert(!canonicalStockMatches({...ok,catalogue_identity_status:'candidate'},target),'Candidate was published');
assert(!canonicalStockMatches({...ok,publication_eligible:false},target),'Unpublished item leaked');
assert(!canonicalStockMatches({...ok,item_id:null},target));
assert(!canonicalStockMatches({...ok,item_id:'stock-1'},target),
 'Non-numeric stock ID accepted');
assert(!canonicalStockMatches({...ok,item_id:'0'},target),'Zero stock ID accepted');
assert(!canonicalStockMatches({...ok,item_id:-7},target),'Negative stock ID accepted');
assert(!canonicalStockMatches({...ok,item_id:1.5},target),'Fractional stock ID accepted');
assert(canonicalStockMatches({...ok,item_id:'203'},target),
 'Valid numeric string stock ID rejected');

assert(!canonicalStockMatches({...ok,model:'R 1300 GS'},{...target,model_name:'R 1250 GS'}),'Conflicting advert model accepted despite verified ID');
assert(canonicalStockMatches({...ok,model:'R1250GS'},{...target,model_name:'R 1250 GS'}),'Equivalent spacing should match');
assert(canonicalStockMatches({...ok,model:''},{...target,model_name:'R 1250 GS'}),'Missing feed label cannot override trusted canonical ID');
assert(!canonicalStockMatches({...ok,make:'Harley-Davidson'},
 {...target,model_name:'R 1250 GS',manufacturer_name:'BMW'}),'Conflicting make accepted despite canonical identity');
assert(canonicalStockMatches({...ok,make:'B.M.W.',model:'R1250GS'},
 {...target,model_name:'R 1250 GS',manufacturer_name:'BMW'}),'Normalized make and model should pass');
assert(canonicalStockMatches({...ok,make:''},
 {...target,manufacturer_name:'BMW'}),'Blank legacy make does not override a verified ID');

const picked=stockForCanonicalModel([ok,ok,{...ok,item_id:202},{...ok,catalog_model_id:77}],target);
assert.deepEqual(picked.map(x=>x.item_id),[201,202]);
assert.deepEqual(stockForCanonicalModel([ok],{catalog_model_id:null}),[]);
console.log('PASS: canonical ID-only public stock identity, no cross-model/trim/candidate fallback');
