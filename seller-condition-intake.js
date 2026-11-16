/* AnyBike shared seller declaration intake. No new tables or automatic publication.
   Values are added to the existing private submission notes for admin review.
   These are seller statements, NOT verified motorcycle condition. */
(function(){
"use strict";
const definitions=[
 ["service_history","Service history",["Full","Partial","None","Unknown"]],
 ["mot","MOT",["Valid — expiry known","Valid — date unknown","Expired","No MOT","Unknown"]],
 ["keys","Number of keys",["1","2","3 or more","None","Unknown"]],
 ["v5c","V5C logbook",["In my name","Present — another name","Missing","Unknown"]],
 ["accident","Accident / damage history",["None known","Previous damage or accident","Unknown"]],
 ["tyres","Front and rear tyres",["Good","Fair","Replacement needed","Unknown"]],
 ["brakes","Brakes",["Good","Fair","Attention needed","Unknown"]],
 ["drive","Chain / belt / final drive",["Good","Fair","Attention needed","Not applicable","Unknown"]],
 ["mechanical","Known mechanical faults",["None known","Faults declared in description","Unknown"]]
];
const normalise=v=>String(v||"").replace(/[\r\n\[\]]/g," ").slice(0,180).trim();
function setup(){
 const form=document.getElementById("underwriteForm")||document.getElementById("sellBikeForm");
 if(!form||form.dataset.abDeclarations==="1")return;
 form.dataset.abDeclarations="1";
 const isDealer=form.id==="underwriteForm";
 const anchor=form.querySelector("#notes")?.closest(".field");
 if(!anchor)return;
 const wrapper=document.createElement("section");
 wrapper.className="ab-condition-intake"+(isDealer?"":" full");
 wrapper.setAttribute("aria-label","Seller motorcycle information");
 wrapper.innerHTML='<div class="ab-condition-head"><strong>Motorcycle condition & paperwork</strong><span id="abConditionCount">0 / '+definitions.length+' answered</span></div>'+
 '<p class="ab-condition-note">Please answer every question to the best of your knowledge. Select Unknown rather than guess. These are seller declarations, not independently verified checks.</p>'+
 '<div id="abConditionBar" class="ab-condition-bar" aria-label="Completion progress" role="progressbar" aria-valuemin="0" aria-valuemax="'+definitions.length+'" aria-valuenow="0">'+definitions.map(()=>'<i></i>').join("")+'</div><div id="abConditionFields" class="ab-condition-fields"></div>';
 anchor.parentNode.insertBefore(wrapper,anchor);
 const host=wrapper.querySelector("#abConditionFields");
 for(const [key,title,choices] of definitions){
  const label=document.createElement("label");label.className="ab-condition-field";
  const titleNode=document.createElement("span");titleNode.textContent=title+" *";
  const select=document.createElement("select");select.id="ab-condition-"+key;select.required=true;select.dataset.abField=key;
  const empty=document.createElement("option");empty.value="";empty.textContent="Please select";select.appendChild(empty);
  for(const option of choices){const node=document.createElement("option");node.value=option;node.textContent=option;select.appendChild(node);}
  label.append(titleNode,select);host.appendChild(label);
 }
 // Collection postcodes are essential for delivery quotes. Keep full postcodes internal.
 const postcode=form.querySelector("#postcode");
 if(postcode){postcode.required=true;const lbl=form.querySelector('label[for="postcode"]');if(lbl)lbl.textContent="Motorcycle collection postcode *";}
 const bar=wrapper.querySelector("#abConditionBar");
 function update(){
  const selectors=[...wrapper.querySelectorAll("select[data-ab-field]")],done=selectors.filter(s=>s.value).length;
  wrapper.querySelector("#abConditionCount").textContent=done+" / "+selectors.length+" answered";
  bar.setAttribute("aria-valuenow",String(done));
  [...bar.children].forEach((segment,i)=>segment.classList.toggle("filled",i<done));
 }
 wrapper.addEventListener("change",update);form.addEventListener("reset",()=>setTimeout(update,0));update();
}
window.AnyBikeSellerDetails={
 appendToNotes(fd){
  const declarations=[];
  for(const [key,title] of definitions){
   const select=document.getElementById("ab-condition-"+key);
   if(select)declarations.push(title+": "+normalise(select.value||"Not answered"));
  }
  if(declarations.length)fd.set("notes",String(fd.get("notes")||"")+"\n[SELLER-DECLARED CONDITION — NOT VERIFIED]\n"+declarations.join("\n"));
  return fd;
 }
};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup);else setup();
})();
