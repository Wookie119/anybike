/* Shared AnyBike listing refresh approval panel. Uses existing admin-only RPCs. */
(function(){
"use strict";
window.AnyBikeListingReview = {mount(client, host, getRows, onReviewed){
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
   const now=Date.now(),day=86400000;
   const due=states.filter(s=>s.eligible===true&&s.requested_at&&s.sent_at&&s.delivery_state==="sent"&&!s.responded_at&&Date.parse(s.expires_at)<=now&&now-Date.parse(s.sent_at)>=14*day);
   const stale=states.filter(s=>s.eligible===true&&s.responded_at&&s.reviewed_at&&s.response_type==="update"&&now-Date.parse(s.reviewed_at)>=14*day||s.eligible===true&&s.response_type==="available"&&s.responded_at&&now-Date.parse(s.responded_at)>=14*day);
   const reminders=el("details");reminders.style.cssText="margin:12px 0;padding:10px;border:1px solid #555;border-radius:7px";
   const candidates=[...new Map([...due,...stale].map(s=>[Number(s.submission_id),s])).values()];
   reminders.append(el("summary","Availability reminders · "+candidates.length+" due for review"));
   reminders.append(el("p","Automatically identifies expired unanswered requests and availability confirmations or reviewed updates at least 14 days old. Emails are not sent automatically during testing. Check each motorcycle before requesting another update."));
   for(const s of candidates){
    const row=(typeof getRows==="function"?getRows():[]).find(r=>Number(r.submission_id)===Number(s.submission_id));
    const p=el("p",[row?.submission_reference||row?.reference||"Submission "+s.submission_id,row?.make,row?.model,s.responded_at?"Availability reconfirmation due":"Previous request expired"].filter(Boolean).join(" · "));
    reminders.append(p);
   }
   body.append(reminders);
   const failed=results.filter(r=>r.status==="rejected").length;
   const entries=results.filter(r=>r.status==="fulfilled").flatMap(r=>Array.isArray(r.value.responses)?r.value.responses.filter(t=>t.responded_at&&!t.reviewed_at).map(t=>({t,s:r.value.state})):[]);
   summary.textContent="Listing update approvals · "+entries.length+" pending · "+candidates.length+" reminders"+(failed?" (partial)":"");
   if(failed)body.append(el("p",failed+" listing(s) could not be loaded. Refresh to retry."));
   if(!entries.length)body.append(el("p",failed?"No responses could be displayed.":"No pending customer responses."));
   for(const {t,s} of entries){
    const row=(typeof getRows==="function"?getRows():[]).find(r=>Number(r.submission_id)===Number(s.submission_id));
    const card=el("section");card.dataset.reviewSubmission=String(s.submission_id);card.style.cssText="border-top:1px solid #555;padding:12px 0;margin-top:8px";
    card.append(el("strong",[row?.submission_reference||row?.reference||"Submission "+s.submission_id,row?.make,row?.model].filter(Boolean).join(" · ")));
    card.append(el("p",({update:"Changes requested",available:"Availability confirmed",sold:"Reported sold / withdrawn"})[t.response_type]||"Customer response"));
    const date=new Date(t.responded_at);if(!isNaN(date))card.append(el("p",date.toLocaleString("en-GB",{timeZone:"Europe/London"})));
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
     if(details[0].status!=="fulfilled")card.append(el("p","Current price and postcode could not be retrieved. Refresh before comparing."));
     for(const [k,label] of Object.entries({notes:"Description changes",condition:"Condition and paperwork"})){
      const p=el("p");p.style.whiteSpace="pre-wrap";p.style.margin="8px 0";p.append(el("strong",label+": "),document.createTextNode(String(t.proposed?.[k]||"No changes requested")));card.append(p);
     }
     const photoSection=el("div");photoSection.style.cssText="border:1px solid #444;border-radius:8px;padding:10px;margin:10px 0";
     const title=el("strong","Photographs");photoSection.append(title);
     const photoStatus=el("p");photoStatus.style.margin="6px 0";
     const photoTools=el("div");
     const updatePhotoSummary=async()=>{
       photoTools.replaceChildren(el("p","Loading photographs…"));
       const [list,paths]=await Promise.all([rpc("admin_get_seller_submission_images_v2",{p_submission_id:Number(s.submission_id)}),rpc("admin_get_seller_original_paths_v1",{p_submission_id:Number(s.submission_id)})]);
       const pending=list.filter(p=>!["approved","rejected"].includes(p.final_status));
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
           img.onload=()=>{if(waiting){loaded.add(Number(p.image_id));approve.disabled=busy||loaded.size!==pending.length;}};
           img.onerror=()=>{if(waiting){loaded.delete(Number(p.image_id));approve.disabled=true;}img.alt="Preview unavailable — use photo tools";};
           img.src=url;a.append(img);tile.append(a);
         }else tile.append(el("p","Preview unavailable — use photo tools."));
         thumbs.append(tile);
       }
       photoTools.replaceChildren(thumbs);
       if(pending.length){
         photoTools.append(el("p","Click a photo to enlarge. Approve only if every pending original is suitable for the advert."));
         photoTools.append(approve);
       }
       return pending.length;
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
    const guidance=t.response_type==="sold"?"Use the existing withdrawal workflow before resolving. This does not mark a motorcycle as an agreed sale.":t.response_type==="update"?"Approve the three listing details when checked. Review photographs using the tools above. Description and condition changes are shown for review but are not automatically published. Active bidding remains protected.":"Record that availability was confirmed.";
    card.append(el("p",guidance));
    if(t.response_type==="sold"){const link=el("a","Open existing withdrawal workflow →");link.href="/admin-seller-underwrites.html?submission="+Number(s.submission_id);card.append(link);}
    const label=el("label","Review note (optional)");const note=el("textarea");note.rows=2;note.maxLength=1000;note.style.cssText="display:block;width:100%;box-sizing:border-box;margin:5px 0;background:#101010;color:white;border:1px solid #555;border-radius:6px;padding:8px";label.append(note);card.append(label);
    const msg=el("p");msg.setAttribute("role","status");
    const actions=el("div");actions.style.cssText="display:flex;gap:8px;flex-wrap:wrap";
    const submit=async(outcome)=>{
     if(saving||loading)return;
     if(note.value.trim()&&note.value.trim().length<5){msg.textContent="Enter at least five characters or leave the note blank.";note.focus();return;}
     if(!confirm(outcome==="apply_core"?"Apply mileage, postcode and minimum to the existing listing?":outcome==="dismissed"?"Dismiss this response without applying changes?":"Record this response as reviewed without applying changes?"))return;
     saving=true;panel.querySelectorAll("button").forEach(b=>b.disabled=true);msg.textContent="Saving review…";
     try{const data=await rpc("admin_review_listing_refresh_v1",{p_request_id:Number(t.id),p_outcome:outcome,p_note:note.value.trim()||"Reviewed by Admin: "+outcome});if(!data?.success)throw Error("Review not confirmed");msg.textContent="Review saved.";saving=false;await load();if(onReviewed)try{await onReviewed();}catch(e){body.append(el("p","Review saved; refresh the desk to see updated listing details."));}}
     catch(e){msg.textContent=e.message||"Review not saved";saving=false;panel.querySelectorAll("button").forEach(b=>b.disabled=false);}
    };
    if(t.response_type==="update"){const approve=button("Approve listing details →",()=>submit("apply_core"));approve.style.cssText="background:#ed1c24;color:white;font-weight:bold";actions.append(approve);}
    if(t.response_type!=="sold")actions.append(button("Acknowledge without applying",()=>submit("acknowledged")));
    actions.append(button(t.response_type==="sold"?"Dismiss / resolve after withdrawal":"Dismiss response",()=>submit("dismissed")));
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
