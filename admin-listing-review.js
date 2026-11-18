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
    const fields={mileage:"Mileage",postcode:"Collection postcode",minimum:"Confidential seller minimum (£)",notes:"Description changes",condition:"Condition and paperwork"};
    for(const [k,label] of Object.entries(fields)){const v=t.proposed?.[k];if(v!==undefined&&v!==null&&v!==""){const p=el("p");p.style.whiteSpace="pre-wrap";p.append(el("strong",label+": "),document.createTextNode(String(v)));card.append(p);}}
    const guidance=t.response_type==="sold"?"Use the existing withdrawal workflow before resolving. This does not mark a motorcycle as an agreed sale.":t.response_type==="update"?"Apply core updates only after checking the proposed changes. This updates mileage, collection postcode and confidential minimum; description, condition and photographs must be reviewed separately. Active bidding and buyer selection are protected by the database.":"Record that availability was confirmed.";
    card.append(el("p",guidance));
    const photoLink=el("a","Review motorcycle details and photographs →");photoLink.href="/admin-seller-underwrites.html?submission="+Number(s.submission_id);photoLink.style.cssText="display:inline-block;margin:6px 0;color:#ff777b;font-weight:bold";card.append(photoLink);
    const label=el("label","Review note (required)");const note=el("textarea");note.rows=2;note.maxLength=1000;note.style.cssText="display:block;width:100%;box-sizing:border-box;margin:5px 0";label.append(note);card.append(label);
    const msg=el("p");msg.setAttribute("role","status");
    const actions=el("div");actions.style.cssText="display:flex;gap:8px;flex-wrap:wrap";
    const submit=async(outcome)=>{
     if(saving||loading)return;
     if(note.value.trim().length<5){msg.textContent="Enter a review note of at least five characters.";note.focus();return;}
     if(!confirm(outcome==="apply_core"?"Apply mileage, postcode and minimum to the existing listing?":outcome==="dismissed"?"Dismiss this response without applying changes?":"Record this response as reviewed without applying changes?"))return;
     saving=true;panel.querySelectorAll("button").forEach(b=>b.disabled=true);msg.textContent="Saving review…";
     try{const data=await rpc("admin_review_listing_refresh_v1",{p_request_id:Number(t.id),p_outcome:outcome,p_note:note.value.trim()});if(!data?.success)throw Error("Review not confirmed");msg.textContent="Review saved.";saving=false;await load();if(onReviewed)try{await onReviewed();}catch(e){body.append(el("p","Review saved; refresh the desk to see updated listing details."));}}
     catch(e){msg.textContent=e.message||"Review not saved";saving=false;panel.querySelectorAll("button").forEach(b=>b.disabled=false);}
    };
    if(t.response_type==="update")actions.append(button("Apply core updates",()=>submit("apply_core")));
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
