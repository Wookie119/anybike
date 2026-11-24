async function run(source,check){
 const keys=["service_history","mot","keys","v5c","accident","tyres","brakes","drive","mechanical"];
 const complete=Object.fromEntries(keys.map(k=>[k,"Unknown"]));
 class Node{
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.style={};this.events={};this.textContent="";this.value="";this.disabled=false;}
  append(...x){this.children.push(...x)} prepend(...x){this.children.unshift(...x)} replaceChildren(...x){this.children=x} addEventListener(k,f){this.events[k]=f} setAttribute(){} focus(){} 
  querySelectorAll(tag){return this.children.flatMap(n=>n instanceof Node?[...(n.tag===tag?[n]:[]),...n.querySelectorAll(tag)]:[])} querySelector(tag){return this.querySelectorAll(tag)[0]} 
  get allText(){return this.textContent+this.children.map(n=>n instanceof Node?n.allText:String(n)).join(" ")}
 }
 const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve()};
 const photo=(id,status="pending")=>({image_id:id,image_position:id,final_status:status,buyer_safe_url:"https://example.invalid/photo"});
 async function scenario({proposed={condition_answers:complete},status="live",initial=[],latest=initial,after=[],loadImages=true,failPhotos=false,failReview=false}={}){
  const host=new Node("host"),window={},calls=[];let reads=0,reviewed=false;
  const document={createElement:t=>new Node(t),createTextNode:s=>String(s)};
  const client={rpc:async(name)=>{calls.push(name);let data;switch(name){
   case "admin_listing_refresh_status_v1":data=reviewed?[]:[{submission_id:1,responded_at:"2026-11-23"}];break;
   case "admin_get_listing_refresh_responses_v1":data=[{id:1,responded_at:"2026-11-23",response_type:"update",proposed}];break;
   case "admin_listing_refresh_reminders_due_v1":data=[];break;
   case "admin_get_submission_delivery_v1":data={};break;
   case "admin_get_seller_original_paths_v1":data=initial.map(p=>({image_id:p.image_id,original_storage_path:"photo"}));break;
   case "admin_get_seller_submission_images_v2":data=++reads<=2?initial:reads===3?latest:after;break;
   default:if(failReview)return {error:{message:"Review failed"}};reviewed=true;data={success:true};
  }return {data}},storage:{from:()=>({createSignedUrl:async()=>({data:{signedUrl:"https://example.invalid/photo"}})})},functions:{invoke:async(name,opts)=>{calls.push("photo-approve");calls.push("snapshot:"+JSON.stringify(opts.body.reviewed_photo_ids));return {data:failPhotos?{success:false,errors:["Photo failed"]}:{success:true}}}}};
  new Function("window","document","confirm",source)(window,document,()=>true);window.AnyBikeListingReview.mount(client,host,()=>[{submission_id:1,underwrite_status:status}]);await flush();
  if(loadImages)host.querySelectorAll("img").forEach(n=>n.onload?.());
  const buttons=host.querySelectorAll("button"),button=buttons.find(n=>/Approve & Update|Approve & Relist|Use Seller|Approve listing details/.test(n.textContent));
  return {host,calls,button,click:async()=>{if(button&&!button.disabled)await button.events.click();await flush()}};
 }
 const cases=[
 ["legacy reply uses legacy route",{proposed:{notes:"Existing reply"}},s=>s.calls.includes("admin_apply_legacy_seller_update_v1")],
 ["partial new questionnaire cannot use legacy route",{proposed:{condition_answers:{keys:"Unknown"}}},s=>!s.button&&s.host.allText.includes("incomplete new questionnaire")],
 ["null structured answers not legacy",{proposed:{condition_answers:null}},s=>!s.button],
 ["whitespace answer not complete",{proposed:{condition_answers:{...complete,keys:" "}}},s=>!s.button],
 ["complete live uses protected condition route",{},s=>s.calls.includes("admin_approve_listing_refresh_condition_only_v1")],
 ["closed complete uses relist route",{status:"closed"},s=>s.calls.includes("admin_approve_and_relist_seller_refresh_v1")],
 ["closed incomplete cannot approve",{status:"closed",proposed:{condition_answers:{}}},s=>s.button?.disabled&&!s.calls.includes("admin_approve_and_relist_seller_refresh_v1")],
 ["new photo blocks approval",{latest:[photo(1)]},s=>!s.calls.includes("photo-approve")&&s.host.allText.includes("Photographs changed")],
 ["unloaded photo blocks approval",{initial:[photo(1)],loadImages:false},s=>!s.calls.includes("photo-approve")&&s.host.allText.includes("Please view all")],
 ["failed photo approval blocks update",{initial:[photo(1)],failPhotos:true},s=>!s.calls.includes("admin_approve_listing_refresh_condition_only_v1")&&s.host.allText.includes("Photo failed")],
 ["pending photo after approval blocks update",{initial:[photo(1)],after:[photo(1)]},s=>!s.calls.includes("admin_approve_listing_refresh_condition_only_v1")&&s.host.allText.includes("incomplete")],
 ["verified photo approval precedes review",{initial:[photo(1)],after:[photo(1,"approved")]},s=>s.calls.indexOf("photo-approve")>=0&&s.calls.indexOf("admin_approve_listing_refresh_condition_only_v1")>s.calls.indexOf("photo-approve")],
 ["partial success communicated",{initial:[photo(1)],after:[photo(1,"approved")],failReview:true},s=>s.host.allText.includes("Photographs were approved separately")],
 ["reviewed photo IDs passed to server",{initial:[photo(2),photo(1)],after:[photo(1,"approved"),photo(2,"approved")]},s=>s.calls.includes("snapshot:[1,2]")],
 ["legacy route also blocks changed photos",{proposed:{notes:"Existing"},latest:[photo(1)]},s=>!s.calls.includes("admin_apply_legacy_seller_update_v1")&&s.host.allText.includes("Photographs changed")]
 ];
 for(const [label,options,verify] of cases){const s=await scenario(options);await s.click();check(label,!!verify(s));}
}

const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
let passed=0;run(fs.readFileSync(path.join(__dirname,"../admin-listing-review.js"),"utf8"),(label,ok)=>{assert.ok(ok,label);console.log("PASS",label);passed++}).then(()=>console.log(passed+" checks passed")).catch(e=>{console.error(e);process.exitCode=1});
