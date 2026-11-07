// node --test model-template/universal-motorcycle-v2.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {normalizeMotorcycleV2,auditMotorcycleV2,REQUIRED_V2_SECTIONS} from "./universal-motorcycle-v2.mjs";
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
