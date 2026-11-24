/* Shared AnyBike listing refresh approval panel. Uses existing admin-only RPCs. */
(function(){
"use strict";
const conditionLabels={service_history:"Service history",mot:"MOT",keys:"Keys",v5c:"V5C logbook",accident:"Accident / damage history",tyres:"Tyres",brakes:"Brakes",drive:"Final drive",mechanical:"Mechanical faults"};
function assessUpdate(proposed,currentMileage,photos){
 const p=proposed||{},answers=p.condition_answers||{};
 const missing=Object.keys(conditionLabels).filter(k=>typeof answers[k]!=="string"||!answers[k].trim()).map(k=>conditionLabels[k]);
 const uncertain=Object.keys(conditionLabels).filter(k=>typeof answers[k]==="string"&&/not sure|unknown|not supplied|not known|unsure/i.test(answers[k])).map(k=>conditionLabels[k]);
 const flags=[];
 const numeric=v=>v!==null&&v!==undefined&&String(v).trim()!==""&&Number.isFinite(Number(v));
 if(numeric(p.mileage)&&numeric(currentMileage)&&Number(p.mileage)<Number(currentMileage))flags.push("Reported mileage is lower than current mileage — check before applying.");
 if(String(answers.mechanical||"").trim()==="Faults declared in description"&&!String(p.condition_fault_description||p.fault_description||p.notes||"").trim())flags.push("Mechanical faults declared; supporting details not found in this response.");
 if(!Array.isArray(photos))flags.push("Photograph status unavailable — refresh before approval.");
 else if(!photos.length)flags.push("No photographs returned — check existing advert.");
 return {missing,uncertain,flags};
}
window.AnyBikeListingReview = {assessUpdate,mount(client, host, getRows, onReviewed){
 if(!host || host.dataset.mounted) return;
 host.dataset.mounted="1";
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=String(txt);return n;};
 const button=(label,fn)=>{const b=el("button",label);b.type="button";b.addEventListener("click",fn);return b;};
 const rpc=async(name,args={})=>{const r=await client.rpc(name,args);if(r.error)throw Error(r.error.message);return r.data;};
 const panel=el("details");panel.style.cssText="border:1px solid #454545;border-radius:8px;padding:12px;margin:10px 0;background:#191919;color:#fff";
 const summary=el("summary","Listing update approvals");summary.style.cssText="cursor:pointer;font-weight:700";panel.append(summary);
 const body=el("div");body.style.paddingTop="10px";panel.append(body);host.append(panel);
 let loading=false, saving=false;
 async function load(){
  if(loading||saving)return;loading=true;
  body.replaceChildren(el("p","Checking customer responses…"));
  try{
   const states=await rpc("admin_listing_refresh_status_v1");
   if(!Array.isArray(states))throw Error("Unexpected status response");
   const pending=states.filter(s=>s.responded_at&&!s.reviewed_at);
   const results=await Promise.allSettled(pending.map(async s=>({state:s,responses:await rpc("admin_get_listing_refresh_responses_v1",{p_submission_id:Number(s.submission_id)})})));
   body.replaceChildren(button("Refresh responses",load));
   const totals=[
     ["Awaiting response",states.filter(s=>s.eligible&&s.delivery_state==="sent"&&!s.responded_at).length],
     ["Requires review",pending.length],
     ["Availability confirmed",states.filter(s=>s.response_type==="available"&&s.responded_at).length],
     ["Reported sold",states.filter(s=>s.response_type==="sold"&&s.responded_at).length],
     ["Updates reviewed",states.filter(s=>s.response_type==="update"&&s.reviewed_at).length]
   ];
   const overview=el("div");overview.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0";
   for(const [label,count] of totals){
     const item=el("div");item.style.cssText="flex:1 1 125px;background:#101010;border:1px solid #454545;border-radius:6px;padding:8px";
     const number=el("strong",count);number.style.cssText="display:block;font-size:20px";
     if(label==="Requires review"&&count)number.style.color="#ffb85c";
     item.append(number,el("span",label));overview.append(item);
   }
   body.append(overview);
   const reminders=el("details");reminders.style.cssText="margin:12px 0;padding:10px;border:1px solid #555;border-radius:7px";
   let candidates=[],reminderError=false;
   try{candidates=await rpc("admin_listing_refresh_reminders_due_v1");if(!Array.isArray(candidates))throw Error("Unexpected reminder response");}
   catch(e){reminderError=true;reminders.append(el("p","Reminder eligibility could not be checked. Refresh to retry."));}
   reminders.prepend(el("summary","Availability reminders · "+(reminderError?"Unavailable":candidates.length+" due for review")));
   if(!reminderError){
    reminders.append(el("p",candidates.length?"These motorcycles are due for a 14-day availability check. Emails are not sent automatically.":"No motorcycles currently require a 14-day reminder."));
    for(const s of candidates){
     const p=el("p",[s.reference,s.make,s.model,s.reminder_reason,"Due "+new Date(s.due_at).toLocaleDateString("en-GB",{timeZone:"Europe/London"})].filter(Boolean).join(" · "));
     reminders.append(p);
    }
   }
   body.append(reminders);
   const failed=results.filter(r=>r.status==="rejected").length;
   const entries=results.filter(r=>r.status==="fulfilled").flatMap(r=>Array.isArray(r.value.responses)?r.value.responses.filter(t=>t.responded_at&&!t.reviewed_at).map(t=>({t,s:r.value.state})):[]);
   summary.textContent="Listing update approvals · "+entries.length+" pending · "+(reminderError?"reminder check unavailable":candidates.length+" reminders")+(failed?" (partial)":"");
   if(failed)body.append(el("p",failed+" listing(s) could not be loaded. Refresh to retry."));
   if(!entries.length)body.append(el("p",failed?"No responses could be displayed.":"No pending customer responses."));
   for(const {t,s} of entries){
    const row=(typeof getRows==="function"?getRows():[]).find(r=>Number(r.submission_id)===Number(s.submission_id));
    const card=el("section");card.dataset.reviewSubmission=String(s.submission_id);card.style.cssText="border-top:1px solid #555;padding:12px 0;margin-top:8px";
    card.append(el("strong",[row?.submission_reference||row?.reference||"Submission "+s.submission_id,row?.make,row?.model].filter(Boolean).join(" · ")));
    card.append(el("p",({update:"Changes requested",available:"Availability confirmed",sold:"Reported sold / withdrawn"})[t.response_type]||"Customer response"));
    const date=new Date(t.responded_at);if(!isNaN(date))card.append(el("p",date.toLocaleString("en-GB",{timeZone:"Europe/London"})));
    let pendingPhotoCount=0,inspectedPhotoCount=0,photoCheckReady=false;
    if(t.response_type==="update"){
     const details=await Promise.allSettled([rpc("admin_get_submission_delivery_v1",{p_submission_id:Number(s.submission_id)}),rpc("admin_get_seller_submission_images_v2",{p_submission_id:Number(s.submission_id)})]);
     const current=details[0].status==="fulfilled"?details[0].value:{};
     const photos=details[1].status==="fulfilled"?details[1].value:[];
     const fmtMoney=v=>v===null||v===undefined||v===""?"Not confirmed":Number.isFinite(Number(v))?"£"+Number(v).toFixed(2):"Not available";
     const fmtMileage=v=>v===null||v===undefined||v===""?"Not recorded":Number(v).toLocaleString("en-GB")+" miles";
     const fmtPostcode=v=>v?String(v).replace(/\s+/g,"").replace(/(.{3})$/," $1").trim():"Not recorded";
     const grid=el("div");grid.style.cssText="display:grid;grid-template-columns:minmax(90px,1fr) repeat(2,minmax(75px,1fr));gap:8px;padding:10px;background:#101010;border:1px solid #444;border-radius:8px;margin:8px 0;font-size:14px;overflow-wrap:anywhere";
     for(const title of ["Details","Current","Customer update"])grid.append(el("strong",title));
     for(const [label,oldValue,newValue] of [["Mileage",fmtMileage(row?.mileage),fmtMileage(t.proposed?.mileage)],["Collection postcode",fmtPostcode(current?.collection_postcode),fmtPostcode(t.proposed?.postcode)],["Confidential minimum",fmtMoney(current?.reserve_gbp),fmtMoney(t.proposed?.minimum)]]){
      grid.append(el("span",label),el("span",oldValue));const value=el("strong",newValue);value.style.color=newValue===oldValue?"#ddd":"#91e9ac";grid.append(value);
     }
     card.append(grid);
     const duration=t.proposed?.listing_duration;
     if(duration)card.append(el("p","Seller's preferred advertising period: "+({30:"at least 30 days",60:"at least 60 days",90:"at least 90 days",ongoing:"keep advertised while available; check periodically"}[duration]||"Review required")));
     if(details[0].status!=="fulfilled")card.append(el("p","Current price and postcode could not be retrieved. Refresh before comparing."));
     for(const [k,label] of Object.entries({notes:"Description changes",condition:"Condition and paperwork"})){
      const p=el("p");p.style.whiteSpace="pre-wrap";p.style.margin="8px 0";p.append(el("strong",label+": "),document.createTextNode(String(t.proposed?.[k]||"No changes requested")));card.append(p);
     }
     const assessment=assessUpdate(t.proposed,row?.mileage,details[1].status==="fulfilled"?photos:null);
     const quality=el("section");quality.style.cssText="border:1px solid #555;border-radius:8px;padding:10px;margin:8px 0;background:#191919";
     const issues=assessment.missing.length+assessment.uncertain.length+assessment.flags.length;
     quality.append(el("strong",issues?"Advert quality check · "+issues+" item(s) to review":"Advert quality check · no automated exceptions found"));
     for(const [label,values] of [["Missing from this reply",assessment.missing],["Seller explicitly uncertain",assessment.uncertain],["Review flags",assessment.flags]]){
      if(values.length){const p=el("p");p.append(el("strong",label+": "),document.createTextNode(values.join(" · ")));quality.append(p);}
     }
     quality.append(el("p","Check the existing record first. Do not request answers already supplied. Automated checks do not verify condition or replace photograph inspection."));
     card.append(quality);
     const answers=t.proposed?.condition_answers;
     if(answers&&typeof answers==="object"){
       const facts=el("div");facts.style.cssText="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px;border:1px solid #444;border-radius:8px;margin:8px 0";
       facts.append(el("strong","Seller-declared paperwork & condition"),el("span","Not independently verified"));
       for(const [key,label] of Object.entries({service_history:"Service history",mot:"MOT",keys:"Keys",v5c:"V5C logbook",accident:"Accident / damage history",tyres:"Tyres",brakes:"Brakes",drive:"Final drive",mechanical:"Mechanical faults"})){
         facts.append(el("span",label),el("strong",typeof answers[key]==="string"&&answers[key].trim()?answers[key]:"Not supplied"));
       }
       card.append(facts);
     }
     const photoSection=el("div");photoSection.style.cssText="border:1px solid #444;border-radius:8px;padding:10px;margin:10px 0";
     const title=el("strong","Photographs");photoSection.append(title);
     const photoStatus=el("p");photoStatus.style.margin="6px 0";
     const photoTools=el("div");
     const updatePhotoSummary=async()=>{
       photoCheckReady=false;photoTools.replaceChildren(el("p","Loading photographs…"));
       const [list,paths]=await Promise.all([rpc("admin_get_seller_submission_images_v2",{p_submission_id:Number(s.submission_id)}),rpc("admin_get_seller_original_paths_v1",{p_submission_id:Number(s.submission_id)})]);
       const pending=list.filter(p=>!["approved","rejected"].includes(p.final_status));pendingPhotoCount=pending.length;inspectedPhotoCount=0;
       const originals=new Map((paths||[]).map(p=>[Number(p.image_id),p.original_storage_path]));
       photoStatus.textContent=list.length+" photographs · "+pending.length+" awaiting approval";
       const thumbs=el("div");thumbs.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,240px));gap:12px";
       const loaded=new Set();let busy=false;
       const approve=button("Approve original photographs →",async()=>{
         if(busy||loaded.size!==pending.length||!pending.length)return;
         if(!confirm("Publish the "+pending.length+" original photographs? Confirm you have inspected them and they contain no private details, unwanted branding or number plates requiring removal."))return;
         busy=true;approve.disabled=true;photoStatus.textContent="Approving photographs…";
         try{
           const {data,error}=await client.functions.invoke("admin-approve-seller-originals",{body:{submission_id:Number(s.submission_id),confirmed_inspected:true}});
           if(error||!data)throw Error(error?.message||"Approval not confirmed");
           await updatePhotoSummary();
           if(data.errors?.length)photoStatus.textContent=data.approved+" approved. "+data.errors.join(" · ");
         }catch(e){photoStatus.textContent=e.message||"Approval failed";busy=false;approve.disabled=loaded.size!==pending.length;}
       });
       approve.style.cssText="background:#ed1c24;color:#fff;font-weight:bold;margin:10px 0";approve.disabled=true;
       for(const p of list.filter(p=>p.final_status!=="rejected")){
         const tile=el("div");tile.style.cssText="border:1px solid #555;border-radius:8px;padding:8px;background:#101010";
         const waiting=pending.includes(p);
         let url=p.buyer_safe_url;
         if(waiting){const path=originals.get(Number(p.image_id));url=null;if(path){const {data,error}=await client.storage.from("seller-intake").createSignedUrl(path,600);if(!error)url=data?.signedUrl;}}
         tile.append(el("strong","Photo "+p.image_position+" · "+(waiting?"Awaiting approval":"Approved")));
         if(url){
           const a=el("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.style.display="block";
           const img=el("img");img.alt="Photograph "+p.image_position;img.style.cssText="width:100%;height:160px;object-fit:contain;margin:6px 0;background:#080808";
           img.onload=()=>{if(waiting){loaded.add(Number(p.image_id));inspectedPhotoCount=loaded.size;approve.disabled=busy||loaded.size!==pending.length;}};
           img.onerror=()=>{if(waiting){loaded.delete(Number(p.image_id));approve.disabled=true;}img.alt="Preview unavailable — use photo tools";};
           img.src=url;a.append(img);tile.append(a);
         }else tile.append(el("p","Preview unavailable — use photo tools."));
         thumbs.append(tile);
       }
       photoTools.replaceChildren(thumbs);
       if(pending.length){
         photoTools.append(el("p","Inspect each pending original above. When all are suitable, use the single Approve & Update / Relist button below. Use photo editing tools only for photographs needing changes."));
       }
       photoCheckReady=true;return pending.length;
     };
     const advanced=button("Photo editing tools (only if needed)",()=>{
       if(photoSection.querySelector("iframe"))return;
       const frame=el("iframe");frame.title="Advanced photograph editing";frame.src="/admin-buyer-safe-images.html?submission="+Number(s.submission_id);frame.style.cssText="width:100%;height:680px;border:1px solid #555;border-radius:8px;margin:8px 0";
       const close=button("Close editing tools",async()=>{frame.remove();close.remove();advanced.disabled=false;try{await updatePhotoSummary();}catch(e){photoStatus.textContent="Could not refresh photograph status: "+e.message;}});
       advanced.disabled=true;photoSection.append(frame,close);
     });
     photoSection.append(photoStatus,photoTools,advanced);card.append(photoSection);
     try{await updatePhotoSummary();}catch(e){photoStatus.textContent="Photo previews unavailable. "+(e.message||"Use photo editing tools.");photoTools.replaceChildren();}
    }
    const guidance=t.response_type==="sold"?"The seller reports this motorcycle is no longer available. Trade bidding is paused. Confirm withdrawal below to remove the listing without recording an AnyBike sale.":t.response_type==="update"?"Review the nine answers, seller price and photo thumbnails together. The one-action approval also approves inspected pending photos. Live auctions keep their bids and pricing protected; closed eligible auctions can be relisted.":"Record that availability was confirmed.";
    card.append(el("p",guidance));
    
    const label=el("label","Review note (optional)");const note=el("textarea");note.rows=2;note.maxLength=1000;note.style.cssText="display:block;width:100%;box-sizing:border-box;margin:5px 0;background:#101010;color:white;border:1px solid #555;border-radius:6px;padding:8px";label.append(note);card.append(label);
    const msg=el("p");msg.setAttribute("role","status");
    const actions=el("div");actions.style.cssText="display:flex;gap:8px;flex-wrap:wrap";
    const submit=async(outcome)=>{
     if(saving||loading)return;
     if(note.value.trim()&&note.value.trim().length<5){msg.textContent="Enter at least five characters or leave the note blank.";note.focus();return;}
     if(!["apply_core","withdrawn","approve_all_live","approve_all_relist","apply_legacy_reply"].includes(outcome)&&!confirm(outcome==="dismissed"?"Dismiss this response without applying changes?":"Record this response as reviewed without applying changes?"))return;
     saving=true;panel.querySelectorAll("button").forEach(b=>b.disabled=true);msg.textContent="Saving review…";
     try{if(outcome==="approve_all_live"||outcome==="approve_all_relist"){
       if(!photoCheckReady)throw Error("Photograph status could not be verified. Refresh responses before approving.");
       if(pendingPhotoCount>0){
         if(inspectedPhotoCount!==pendingPhotoCount)throw Error("Please view all pending photographs before approving.");
         const result=await client.functions.invoke("admin-approve-seller-originals",{body:{submission_id:Number(s.submission_id),confirmed_inspected:true}});
         if(result.error||!result.data?.success)throw Error(result.error?.message||(result.data?.errors||[]).join(" · ")||"Photograph approval not confirmed");
         pendingPhotoCount=0;
       }
     }
     const data=outcome==="apply_legacy_reply"?await rpc("admin_apply_legacy_seller_update_v1",{p_request_id:Number(t.id),p_note:note.value.trim()||"Original seller response reviewed; no repeat invitation needed"}):outcome==="approve_all_live"?await rpc("admin_approve_listing_refresh_condition_only_v1",{p_request_id:Number(t.id),p_note:note.value.trim()||"Seller nine declarations and approved photographs reviewed together"}):outcome==="approve_all_relist"?await rpc("admin_approve_and_relist_seller_refresh_v1",{p_request_id:Number(t.id),p_note:note.value.trim()||"Seller refresh and inspected photographs approved for relisting"}):outcome==="condition_only_live"?await rpc("admin_approve_listing_refresh_condition_only_v1",{p_request_id:Number(t.id),p_note:note.value.trim()||"Seller condition declarations approved during active bidding"}):outcome==="withdrawn"?await rpc("admin_withdraw_sale_reported_listing_v1",{p_request_id:Number(t.id),p_note:note.value.trim()||null}):await rpc("admin_review_listing_refresh_v1",{p_request_id:Number(t.id),p_outcome:outcome,p_note:note.value.trim()||"Reviewed by Admin: "+outcome});if(!data?.success)throw Error("Review not confirmed");msg.textContent="Review saved.";saving=false;await load();if(onReviewed)try{await onReviewed();}catch(e){body.append(el("p","Review saved; refresh the desk to see updated listing details."));}const saved=el("p",(row?.submission_reference||row?.reference||"Submission "+s.submission_id)+" · "+(outcome==="apply_legacy_reply"?"Existing seller reply applied to the advert; no further invitation needed.":outcome==="approve_all_live"?"Seller answers and photographs approved; live bidding preserved.":outcome==="approve_all_relist"?"Seller answers and photographs approved; closed auction relisted.":outcome==="condition_only_live"?"Nine seller declarations updated on live advert; prices, mileage and bids unchanged.":outcome==="apply_core"?"Listing details approved and saved.":outcome==="withdrawn"?"Motorcycle withdrawn. Trade bidding stopped.":"Review saved."));saved.setAttribute("role","status");saved.style.cssText="color:#91e9ac;font-weight:bold;border:1px solid #386446;border-radius:8px;padding:10px;margin:8px 0";body.prepend(saved);panel.open=true;}
     catch(e){msg.textContent=e.message||"Review not saved";saving=false;panel.querySelectorAll("button").forEach(b=>b.disabled=false);}
    };
    if(t.response_type==="update"){
      const structured=t.proposed?.condition_answers;
      const complete=structured&&["service_history","mot","keys","v5c","accident","tyres","brakes","drive","mechanical"].every(k=>typeof structured[k]==="string"&&structured[k].length>0);
      const auctionLive=(row?.underwrite_status==="live");
      if(auctionLive){
        if(complete){
          const approve=button("✓ Photos inspected — Approve & Update Live Advert →",()=>{if(confirm("Confirm you inspected every new photograph and approve the nine seller declarations? Active bids and auction terms stay protected."))submit("approve_all_live");});
          approve.style.cssText="background:#ed1c24;color:white;font-weight:bold";
          actions.append(approve);
          card.append(el("p","Live auction: this updates condition declarations only. Existing bids, reserve, mileage and closing time are protected. Review any requested core changes separately after bidding closes."));
        }else{
          card.append(el("p","This seller already replied to our previous form. Use their existing description and condition update; unconfirmed questions will be labelled Not supplied, not guessed. No repeat invitation."));
          const apply=button("✓ Use Seller's Existing Reply — Update Advert →",()=>{if(confirm("Approve the existing seller reply for this live auction? The text will be shown as seller-declared, unknown information stays unconfirmed, and the existing bids, reserve and closing time remain unchanged."))submit("apply_legacy_reply");});
          apply.style.cssText="background:#ed1c24;color:white;font-weight:bold";
          actions.append(apply);
        }
      }else{
        const closedAuction=row?.underwrite_status==="closed";
        const approve=button(closedAuction?"✓ Photos inspected — Approve & Relist Auction →":"Approve listing details →",()=>closedAuction?(confirm("Confirm you checked the new photographs, nine seller answers and confidential minimum, and want to relist this unsold motorcycle for 14 days? Previous bids are preserved in audit history.")&&submit("approve_all_relist")):submit("apply_core"));
        approve.style.cssText="background:#ed1c24;color:white;font-weight:bold";
        if(!complete)approve.disabled=true;
        actions.append(approve);
        if(!complete)card.append(el("p","Some structured answers are missing from this response. Check existing declarations first; only request genuinely missing answers before approving."));
      }
    }
    if(t.response_type==="available")actions.append(button("✓ Record Seller Confirmed Available — No More Questions →",()=>submit("acknowledged")));else if(t.response_type!=="sold")actions.append(button("Acknowledge without applying",()=>submit("acknowledged")));
    if(t.response_type==="sold"){const withdraw=button("Confirm withdrawal →",()=>submit("withdrawn"));withdraw.style.cssText="background:#ed1c24;color:#fff;font-weight:bold";actions.append(withdraw);}else actions.append(button("Dismiss response",()=>submit("dismissed")));
    card.append(actions,msg);body.append(card);
   }
  }catch(e){body.replaceChildren(el("p",e.message||"Unable to load approvals"),button("Retry",load));}
  finally{loading=false;}
 }
 async function openReview(id){panel.open=true;await load();const target=Array.from(body.querySelectorAll("[data-review-submission]")).find(n=>n.dataset.reviewSubmission===String(id));(target||panel).scrollIntoView({block:"center",behavior:"smooth"});}
 host.addEventListener("anybike-open-listing-review",e=>openReview(e.detail));
 panel.addEventListener("toggle",()=>{if(panel.open)load();});
 load();
}};
})();
