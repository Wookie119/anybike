// Offline simulated DOM and network; no live advertising events.
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
async function run(source,check){
 const keys=["listing_after_gallery","listing_after_description","listing_bottom"];
 class El{constructor(){this.children=[];this.dataset={};this.style={};this.listeners={};this.hidden=true;this.isConnected=true}append(...n){this.children.push(...n)}replaceChildren(){this.children.forEach(n=>n.detach());this.children=[]}detach(){this.isConnected=false;this.children.forEach(n=>n.detach())}contains(n){return this===n||this.children.some(c=>c.contains(n))}addEventListener(k,f){this.listeners[k]=f}fire(k,e={}){this.listeners[k]?.(e)}}
 const slots=keys.map(()=>new El()),root={isConnected:true,querySelector:s=>slots[keys.findIndex(k=>s.includes(k))]},calls=[],observers=[];
 class Observer{constructor(cb){this.cb=cb;observers.push(this)}observe(){}disconnect(){this.closed=true}show(r){this.cb([{isIntersecting:true,intersectionRatio:r}])}}
 let reply={placements:[]};const send=async b=>{calls.push(b);if(reply instanceof Error)throw reply;return await reply};
 const render=new Function("send","node","https","advertDisclosure","window","IntersectionObserver","ensureAdvertHoverStyles","styleAdvertDisclosure",source.slice(source.indexOf("export async function renderListingAdvertising")).replaceAll("export async function","async function")+"\nreturn renderListingAdvertising;")(send,()=>new El(),v=>typeof v==="string"&&v.startsWith("https://")?v:null,()=>"Advertisement",{IntersectionObserver:Observer},Observer,()=>{},()=>{});
 const ctx={country:"GB",pagePath:"/trade-opportunities.html",manufacturer:"Honda",model:"VFR400R",registration:"private",seller:"private",bid:123};
 const ad=(id,key,extra={})=>({id,placement_key:key,token:"signed-"+id,eligible_audiences:["trade_dealer"],commercial_category:"transport",desktop_image_url:"https://example.com/desktop.png",mobile_image_url:"https://example.com/mobile.png",destination_url:"https://example.com/",...extra});
 const image=i=>slots[i].children[0].children[0].children[0].children[1];
 await render(root,ctx);check("Empty campaigns collapse",slots.every(s=>s.hidden&&!s.children.length));
 reply={placements:[ad("a",keys[0]),ad("a",keys[1]),ad("b",keys[2])]};await render(root,ctx);check("Duplicate suppressed",slots[1].children.length===0);check("Independent valid slots",slots[0].children.length===1&&slots[2].children.length===1);
 check("No impressions before artwork load",!calls.some(x=>x.action==="event"));image(0).fire("load");check("Artwork visible on load",!slots[0].hidden);observers.at(-1).show(.4);check("No impression below threshold",!calls.some(x=>x.action==="event"));observers.at(-1).show(.6);observers.at(-1).show(.8);check("One impression",calls.filter(x=>x.event_type==="impression").length===1);
 const link=slots[0].children[0].children[0];link.fire("click");link.fire("click");check("One click per displayed creative",calls.filter(x=>x.event_type==="click").length===1);check("Sponsored link",link.rel.includes("sponsored"));
 check("No private seller or bid data",Object.keys(calls.find(x=>x.action==="select_listing")).sort().join(",")==="action,audience,country,manufacturer,model,page_path");
 reply={placements:[ad("c",keys[0],{eligible_audiences:["retail_private"]}),ad("d",keys[1],{commercial_category:"finance"}),ad("e",keys[2],{destination_url:"http://example.com"})]};await render(root,ctx);check("Ineligible ads rejected",slots.every(s=>s.hidden&&!s.children.length));
 reply={placements:[ad("f",keys[0])]};await render(root,ctx);image(0).fire("error");check("Failed artwork collapses",slots[0].hidden&&!slots[0].children.length);
 let resolve;reply=new Promise(r=>resolve=r);const pending=render(root,ctx);await render(root,{...ctx,country:"FR"});resolve({placements:[ad("g",keys[0])]});await pending;check("Stale request cannot repopulate slots",slots.every(s=>s.hidden&&!s.children.length));
 reply=new Error("offline");await render(root,ctx);check("Service outage fails closed",slots.every(s=>s.hidden&&!s.children.length));
}

let n=0;run(fs.readFileSync(path.join(__dirname,'../advertising/universal-banner.mjs'),'utf8'),(label,ok)=>{assert.ok(ok,label);n++;console.log('PASS '+label)}).then(()=>console.log(n+' checks passed')).catch(e=>{console.error(e);process.exitCode=1});
