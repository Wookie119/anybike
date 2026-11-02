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
assert.ok(preview.includes("guide.hero||{}"),"Hero editorial content must originate from Supabase");
assert.ok(preview.includes('id="databaseHeroPhoto"'),"Hero photo must use database metadata");
assert.ok(preview.includes("guide.development_cards"),"Development cards must originate from Supabase");
assert.ok(preview.includes("guide.development_section_labels||{}"),"Timeline and card section labels must originate from Supabase");
assert.ok(preview.includes("guide.model_section_introductions||{}"),"Timeline and documented specification introductions must come from Supabase");
assert.ok(preview.includes("guide.page_metadata?.description"),"Preview metadata description must come from Supabase");
assert.ok(preview.includes("guide.supplemental_factory_colours||{}"),"2026 colour additions must originate in Supabase");
assert.ok(preview.includes("guide.production?.reference_model_year"),"Reference technical year must be model data, not fixed to 2024");
assert.ok(!preview.includes('if(!(actualMake==="BMW"&&actualModel==="R 1300 GS"))el("summary")'),"Hero summary must not be gated by literal model identity");
assert.ok(!preview.includes('const additions=[{name:"Racingred non-metallic"'),"Factory colour additions cannot be hardcoded in the preview");
assert.ok(preview.includes('id="modelStructuredData"'),"JSON-LD script must be dynamically populated from Supabase");
assert.ok(preview.includes("structuredData.textContent=JSON.stringify"),"Structured data must be sourced from model metadata");
assert.ok(!preview.includes('"name":"BMW R 1300 GS motorcycle model guide"'),"Structured data may not hardcode model name");
assert.ok(!preview.includes('img.alt="BMW R 1300 GS"'),"Photo alternate text may not hardcode the model name");
assert.ok(preview.includes("guide.page_metadata?.manufacturer_url"),"Manufacturer navigation must come from Supabase");
assert.ok(preview.includes("data-v2-development-label=\"engineering_label\""),"Engineering label must have a database hook");
assert.ok(preview.includes("engineering_card_references"),"Engineering-card manufacturer references must be database-driven");
assert.ok(preview.includes("engineering_gallery_media"),"Engineering-card media metadata must come from Supabase");
assert.ok(!preview.includes("credit.href=\"https://commons.wikimedia.org/wiki/File:Engine_BMW_R1300-GS.jpg\""),"Engine photo credit link must not be hardcoded");
assert.ok(!preview.includes("const sources={"),"Engineering-card sources must not be hardcoded");
assert.ok(preview.includes("window.__r1300CardsReady=true"),"Database cards must signal when ready");
assert.ok(preview.includes('document.addEventListener("anybike:r1300-cards-ready",renderUkGallery'),"UK gallery must wait until database cards exist");
assert.ok(preview.includes('document.querySelector("#r1300gsModelHistory [data-model-card-group=\'engineering\']")'),"Engineering card selector must be valid");
assert.ok(preview.includes('document.querySelector("#r1300gsModelHistory [data-model-card-group=\'buying\']")'),"Buying card selector must be valid");
assert.ok(!preview.includes('heading.textContent=modelDisplayCopy.model_development_heading||""'),"Gallery must not read asynchronously loaded copy before initialization");

for(const section of ["uk_selling","international_stock","international_enquiry","international_sourcing"]){assert.ok(preview.includes(`data-v2-copy="${section}:heading"`),`Missing Supabase customer content hook: ${section}`);}
assert.ok(preview.includes("guide.customer_copy||{}"),"Customer editorial content must be loaded from Supabase");
for(const section of ["related_models","motorcycle_types","country_markets"]){assert.ok(preview.includes(`data-v2-section="${section}:heading"`),`Navigation section ${section} must use Supabase editorial copy`);}
assert.ok(preview.includes("guide.navigation_copy||{}"),"Navigation copy must come from Supabase");
assert.ok(preview.includes("guide.technical_section_copy?.colours?.heading"),"Factory colours introduction must be database-driven");
assert.ok(preview.includes("guide.technical_section_copy?.engineering?.heading"),"Engineering overview introduction must be database-driven");
assert.ok(preview.includes("guide.original_generation_description"),"Generation introduction must be Supabase-driven");
assert.ok(preview.includes("guide.global_stories||{}"),"AnyBike Global story section must be Supabase-driven");
assert.ok(preview.includes("guide.model_year_timeline_reference"),"Model timeline manufacturer source must come from Supabase");
assert.ok(preview.includes("guide.action_links"),"Model-specific customer CTAs must come from Supabase");
assert.ok(preview.includes("guide.enquiry_form_copy||{}"),"Enquiry form display copy must come from Supabase");
assert.ok(preview.includes("gallery_display_copy||{}"),"Gallery headings must come from Supabase");
assert.ok(preview.includes('data-form-label="name"'),"Form labels must be rendered from data");
assert.ok(preview.includes('data-form-placeholder="message"'),"Form placeholders must be rendered from data");
assert.ok(preview.includes('id="v2UkSellAction"'),"UK sell action must be database-rendered");
assert.ok(!preview.includes("motorcycle-model-market-links.json"),"Country links must not use bundled JSON fallback");
assert.ok(preview.includes('from("motorcycle_model_country_links")'),"Country links must read Supabase");
assert.ok(preview.includes('<nav class="guide-links" aria-label="Country market links"></nav>'),"Country links must not be hardcoded into HTML");
assert.ok(!preview.includes("Unveiled in September 2023 for the 2024 model year, with an all-new"),"Development copy must not remain embedded in HTML");
assert.ok(preview.includes("editorialPhotoCaptions"),"Approved edition photo captions must use Supabase data");
assert.ok(preview.includes("captionRow?.editorial?.gallery_edition_asset_keys"),"Approved editions must be selected from Supabase");
assert.ok(preview.includes("captionRow?.editorial?.engineering_photo_categories"),"Engineering photo slots must be selected from Supabase");
assert.ok(preview.includes("const approvedPhotos=data.filter("),"Gallery photos must be verified for images and attribution");
assert.ok(preview.includes("editionKeys.map(key=>approvedPhotos.find("),"Edition gallery must retain database ordering and approved photos");
assert.ok(preview.includes("asset_key,title,model,subject_category"),"Gallery must load the actual approved photograph title");
assert.ok(preview.includes("const chosen=approvedPhotos.find("),"Engineering cards must use validated photo records");
assert.ok(!preview.includes("const descriptions={"),"Photo edition captions must not remain hardcoded");
assert.ok(preview.includes('normalizeModelGuide("bmw-r1300gs",guide,row)'),"V2 must validate published model identity");
assert.ok(preview.includes('editorial.specifications.find('),"Technical figures must consume source-backed shared specifications");
for(const section of ["generations","milestones","specifications","colours"]){
 assert.ok(preview.includes("const "+({generations:"generations",milestones:"milestones",specifications:"specs",colours:"colours"}[section])+"=editorial."+section+";"),"V2 must use shared "+section);
}

console.log("PASS: locked preview and both model records retain safe shared data contract");
