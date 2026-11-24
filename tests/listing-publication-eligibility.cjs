async function run(source,check){
 const start=source.indexOf("async function listingPublicationEligibility("),end=source.indexOf("async function publicationEligibility(",start);
 if(start<0||end<0)throw Error("Missing listing eligibility function");
 const path="/trade-opportunities.html",slot="AB-UK-TRADE-LISTING-GALLERY",id="campaign-1";
 const listingLocations=["GALLERY","DESCRIPTION","BOTTOM"].map(s=>({page_path:path,slot_code:"AB-UK-TRADE-LISTING-"+s,retailPending:false})).concat([{page_path:"/bike-details.html",slot_code:"AB-UK-STOCK-LISTING-GALLERY",retailPending:true}]);
 async function scenario(o={}){
  const creative={id,countries:["GB"],placement:"below_hero",campaign_category:"house",partner_kind:"transport",destination_url:"https://example.invalid",...o.creative};
  const inventory={page_category:"public",placement_enabled:true,excluded:false,...o.inventory};
  let reads=0;
  const db={from(table){reads++;const data=table==="advertising_page_inventory"?inventory:table==="public_advertising_creatives_v1"?creative:o.other||[];const result={data,error:o.error&&table==="advertising_page_inventory"?new Error("Unavailable"):null};const q={select:()=>q,eq:()=>q,maybeSingle:async()=>result,in:async()=>result};return q}};
  const eligible=new Function("db","listingLocations","canPublishListing","options",source.slice(start,end)+"return listingPublicationEligibility")(db,listingLocations,()=>o.enabled!==false,()=>o.artwork===false?[]:[{id}]);
  try{return {result:await eligible({pagePath:o.path||path,slotCode:o.slot||slot},o.ids||[id],o.formats||["slim"]),reads}}catch(e){return {error:e.message,reads}}
 }
 const cases=[
 ["release gate is disabled in saved source",null,()=>/const TRADE_LISTING_PUBLICATION_ENABLED=false;/.test(source)],
 ["enabled trade position eligible",{},s=>s.result.ready],
 ["disabled gate makes no database requests",{enabled:false},s=>!s.result.ready&&s.reads===0],
 ["retail blocked",{path:"/bike-details.html",slot:"AB-UK-STOCK-LISTING-GALLERY"},s=>!s.result.ready&&s.reads===0],
 ["unknown slot blocked",{slot:"AB-UK-TRADE-LISTING-UNKNOWN"},s=>!s.result.ready&&s.reads===0],
 ["multiple campaigns blocked",{ids:[id,"second"]},s=>!s.result.ready],
 ["wrong artwork shape blocked",{formats:["square"]},s=>!s.result.ready],
 ["disabled inventory blocked",{inventory:{placement_enabled:false}},s=>!s.result.ready],
 ["excluded inventory blocked",{inventory:{excluded:true}},s=>!s.result.ready],
 ["non-UK campaign blocked",{creative:{countries:["FR"]}},s=>!s.result.ready],
 ["finance blocked",{creative:{campaign_category:"finance"}},s=>!s.result.ready],
 ["nontransport partner blocked",{creative:{partner_kind:"insurance"}},s=>!s.result.ready],
 ["restricted audience blocked",{creative:{customer_types:["private"]}},s=>!s.result.ready],
 ["wrong page blocked",{creative:{page_paths:["/about-us.html"]}},s=>!s.result.ready],
 ["wrong category blocked",{creative:{page_categories:["model"]}},s=>!s.result.ready],
 ["non HTTPS destination blocked",{creative:{destination_url:"http://example.invalid"}},s=>!s.result.ready],
 ["unavailable artwork blocked",{artwork:false},s=>!s.result.ready],
 ["duplicate assignment blocked",{other:[{campaign_ids:[id]}]},s=>!s.result.ready],
 ["different campaign allowed",{other:[{campaign_ids:["another"]}]},s=>s.result.ready],
 ["database failure does not approve",{error:true},s=>s.error==="Unavailable"]
 ];
 for(const [label,o,verify] of cases)check(label,!!verify(o===null?null:await scenario(o)));
}

const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
let passed=0;run(fs.readFileSync(path.join(__dirname,"../advertising/admin-slot-layout-manager.js"),"utf8"),(label,ok)=>{assert.ok(ok,label);console.log("PASS",label);passed++}).then(()=>console.log(passed+" checks passed")).catch(e=>{console.error(e);process.exitCode=1});
