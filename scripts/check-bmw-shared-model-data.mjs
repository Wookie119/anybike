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
 console.log("PASS",result.heading,"milestones:",result.milestones.length,"specifications:",result.specifications.length);
}
assert.throws(()=>normalizeModelGuide("bmw-unknown",{},{}));
assert.ok(fs.readFileSync("bmw-r1300gs-v2.html","utf8").includes('content="noindex,follow"'),"V2 preview must remain noindex");
console.log("PASS: locked preview and both model records retain safe shared data contract");
