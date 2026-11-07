// node --test model-template/universal-motorcycle-v2.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {normalizeMotorcycleV2,auditMotorcycleV2,buildMotorcycleV2Sections,REQUIRED_V2_SECTIONS} from "./universal-motorcycle-v2.mjs";
const sample=(make,model,slug)=>({model_id:1,slug,preview_visible:true,editorial:{
 make,model,hero:{summary:"Test model introduction"},
 production:{generations:[{label:"First generation"}],official_colours:[{name:"Red"}],specifications:[{engine_cc:1000}]},
 global_stories:{url:"/motorcycle-manufacturers.html",title:"Stories"},
 deep_dive:[{title:"History"}],related_model_links:[{label:"Another model",url:"/another-model.html"}],
 motorcycle_type_links:[{label:"Adventure",url:"/motorcycle-type-adventure.html"}],
 action_links:[{label:"Sell motorcycle",url:"/uk-motorcycle-selling.html?make=Honda"}]
}});
test("same renderer accepts unrelated manufacturers",()=>{
 for(const [make,model,slug] of [["BMW","R 1300 GS","bmw-r-1300-gs"],["Honda","Africa Twin","honda-africa-twin"],["Harley-Davidson","Fat Boy","harley-davidson-fat-boy"]]){
  const data=normalizeMotorcycleV2(sample(make,model,slug));
  assert.equal(data.make,make);assert.equal(data.model,model);assert.equal(data.title,make+" "+model);
  assert.equal(auditMotorcycleV2(sample(make,model,slug)).errors.length,0);
 }
});
test("never loads unpublished editorial",()=>{assert.throws(()=>normalizeMotorcycleV2({...sample("Honda","Africa Twin","honda-africa-twin"),preview_visible:false}),/not published/);});
test("rejects malformed slugs and unsafe navigation",()=>{const bad=sample("Honda","Africa Twin","../admin");assert.throws(()=>normalizeMotorcycleV2(bad));const entry=sample("Honda","Africa Twin","honda-africa-twin");entry.editorial.related_model_links.push({label:"Unsafe",url:"javascript:alert(1)"});assert.equal(normalizeMotorcycleV2(entry).relatedModels.length,1);});
test("13-section contract remains stable",()=>{assert.equal(REQUIRED_V2_SECTIONS.length,13);assert.equal(new Set(REQUIRED_V2_SECTIONS).size,13);});

test("single locked preview renderer accepts any published model slug without an identity allowlist",()=>{
 const page=fs.readFileSync("motorcycle-model-universal-development.html","utf8");
 assert.match(page,/\.eq\("slug",selectedModel\)\.eq\("preview_visible",true\)/);
 assert.match(page,/normalizeMotorcycleV2\(publishedEditorial\)/);
 assert.doesNotMatch(page,/selectedModel\s*!==\s*"bmw-r-1300-gs"/);
 assert.doesNotMatch(page,/\.eq\("model_id",77\)/);
 assert.match(page,/<meta name="robots" content="noindex/);
 assert.doesNotMatch(page,/CHAT GPT - CHAT GPT/);
 const locked=fs.readFileSync("design\/model-template\/DESIGN-LOCK.md","utf8");
 assert.match(locked,/approved-bmw-r1300gs-v2-2026-11-02\.html/);
});

test("R 1250 GS staging research fits the same 13-section data contract without being published",()=>{
 const staged=JSON.parse(fs.readFileSync("model-template/staging/bmw-r1250gs-v2-source.json","utf8"));
 assert.equal(staged.preview_only,true);
 assert.throws(()=>normalizeMotorcycleV2(staged),/not published/);
 const previewRecord={...staged,preview_visible:true};
 const slots=buildMotorcycleV2Sections(previewRecord);
 assert.deepEqual(slots.map(x=>x.id),REQUIRED_V2_SECTIONS);
 const lookup=id=>slots.find(x=>x.id===id);
 assert.equal(lookup("introduction").ready,true);
 assert.equal(lookup("model_development").ready,true);
 assert.equal(lookup("factory_colours").ready,true);
 assert.equal(lookup("technical_specifications").ready,true);
 assert.equal(lookup("heritage").ready,true);
 assert.equal(lookup("engineering_gallery").ready,false);
 assert.equal(lookup("related_models").ready,false);
 assert.equal(lookup("country_markets").ready,false);
 const audit=auditMotorcycleV2(previewRecord);
 assert.equal(audit.readyToRollout,false);
 assert.ok(audit.missingSections.includes("engineering_gallery"));
 assert.ok(audit.missingSections.includes("country_markets"));
 assert.equal(staged.editorial.make,"BMW");
 assert.equal(staged.editorial.model,"R 1250 GS");
});
test("missing editorial data leaves empty slots rather than showing another model's facts",()=>{
 const model=sample("Honda","Africa Twin","honda-africa-twin");
 const slots=buildMotorcycleV2Sections(model);
 assert.equal(slots.length,13);
 assert.equal(slots.find(x=>x.id==="technical_specifications").ready,true);
 assert.equal(slots.find(x=>x.id==="engineering_gallery").ready,false);
 assert.equal(slots.find(x=>x.id==="country_markets").ready,false);
 assert.equal(slots.find(x=>x.id==="related_models").content[0].url,"/another-model.html");
});

test("locked R 1300 GS presentation contract is retained in the universal renderer",()=>{
 const approved=fs.readFileSync("design/model-template/approved-bmw-r1300gs-v2-2026-11-02.html","utf8");
 const preview=fs.readFileSync("motorcycle-model-universal-development.html","utf8");
 const requiredIds=["generationPanel","generationCompare","ukR1300ModelGallery","r1300gsModelHistory","internationalModelCards","internationalGuestRequestForm","modelSources"];
 const requiredClasses=["r1300-approved-variant-grid","model-tech-grid","model-notes-label","r1300-deep-dive","bmw-explore"];
 for(const id of requiredIds){
  assert.ok(approved.includes('id="'+id+'"'),"Approved reference changed: "+id);
  assert.ok(preview.includes('id="'+id+'"'),"Universal preview missing approved slot: "+id);
 }
 for(const cls of requiredClasses){
  assert.ok(approved.includes(cls),"Approved layout lacks "+cls);
  assert.ok(preview.includes(cls),"Universal layout lost "+cls);
 }
 assert.match(preview,/#ed1c24/);
 assert.match(fs.readFileSync("public-header.css","utf8"),/--anybike-approved-panel/);
});
