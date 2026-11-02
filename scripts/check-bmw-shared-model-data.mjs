// node scripts/check-bmw-shared-model-data.mjs
// Read-only validation: two BMW entries share one renderer contract.
// No live page or design snapshot is changed by this test.
import fs from "node:fs";
import assert from "node:assert/strict";
import {normalizeModelGuide} from "../model-template/bmw-model-data.mjs";
const guides=JSON.parse(fs.readFileSync("data/motorcycle-model-guides.json","utf8")).models;
const catalogue=JSON.parse(fs.readFileSync("data/motorcycle-catalogue-base.json","utf8")).models;
for(const [key,name] of [["bmw-r1300gs","R 1300 GS"],["bmw-r1250gs","R 1250 GS"]]){
 const row=catalogue.find(x=>x.make==="BMW"&&x.model===name);
 assert.ok(row,"Missing catalogue model "+name);
 const result=normalizeModelGuide(key,guides[key],row);
 assert.equal(result.heading,"BMW "+name);
 assert.ok(result.summary.length>40,"Missing model overview "+name);
 assert.ok(result.history.length>40,"Missing model history "+name);
 assert.equal(result.gallery.length,0,"Unlicensed photographs must not publish");
 assert.equal(result.publicationStatus,"preview-only");
 if(key==="bmw-r1300gs")assert.equal(result.engineeringRows.length,14,"Engineering detail must be sourced from shared editorial data");
 console.log("PASS",result.heading,"milestones:",result.milestones.length,"specifications:",result.specifications.length);
}
assert.throws(()=>normalizeModelGuide("bmw-unknown",{},{}));
const preview=fs.readFileSync("bmw-r1300gs-v2.html","utf8");
assert.ok(preview.includes('content="noindex,follow"'),"V2 preview must remain noindex");
assert.ok(preview.includes('import("/model-template/bmw-model-data.mjs")'),"V2 must import the shared model adapter");
assert.ok(preview.includes('.from("motorcycle_model_v2_editorial")'),"V2 must read Supabase editorial database");
assert.ok(!preview.includes('fetch("/data/motorcycle-model-guides.json"'),"V2 must not load editorial JSON at runtime");
assert.ok(preview.includes('id="databaseModelTimeline"'),"Timeline container must be database-driven");
assert.ok(preview.includes("guide.model_year_timeline"),"Timeline must be read from Supabase editorial");
assert.ok(preview.includes('id="databaseDeepDive"'),"Deep-dive panel must use database content");
assert.ok(preview.includes("guide.deep_dive"),"Factory, ownership and heritage content must be read from Supabase");
assert.ok(preview.includes('id="databaseRelatedModels"'),"Related model pills must retain their original container");
assert.ok(preview.includes("guide.related_model_links"),"Related BMW models must come from Supabase");
assert.ok(preview.includes('id="databaseMotorcycleTypes"'),"Motorcycle types must retain the approved pills container");
assert.ok(preview.includes("guide.motorcycle_type_links"),"Motorcycle type links must load from Supabase");
assert.ok(preview.includes("editorialPhotoCaptions"),"Approved edition photo captions must use Supabase data");
assert.ok(preview.includes("captionRow?.editorial?.gallery_edition_asset_keys"),"Approved editions must be selected from Supabase");
assert.ok(preview.includes("captionRow?.editorial?.engineering_photo_categories"),"Engineering photo slots must be selected from Supabase");
assert.ok(!preview.includes("const descriptions={"),"Photo edition captions must not remain hardcoded");
assert.ok(preview.includes('normalizeModelGuide("bmw-r1300gs",guide,row)'),"V2 must validate published model identity");
assert.ok(preview.includes('editorial.specifications.find('),"Technical figures must consume source-backed shared specifications");
for(const section of ["generations","milestones","specifications","colours"]){
 assert.ok(preview.includes("const "+({generations:"generations",milestones:"milestones",specifications:"specs",colours:"colours"}[section])+"=editorial."+section+";"),"V2 must use shared "+section);
}

console.log("PASS: locked preview and both model records retain safe shared data contract");
