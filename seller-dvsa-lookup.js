/* Shared DVSA registration lookup for all seller intake forms. */
(function(){
 "use strict";
 const normalRegistration=x=>String(x||"").toUpperCase().replace(/\s+/g,"");
 const normalName=x=>String(x||"").toLowerCase().replace(/[^a-z0-9]/g,"");
 const dateLabel=x=>{const m=String(x||"").match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[3]+"/"+m[2]+"/"+m[1]:String(x||"");};
 function matchOption(select,value){
  if(!select||select.disabled||!normalName(value))return false;
  const option=Array.from(select.options).find(o=>o.value&&normalName(o.value)===normalName(value));
  if(!option)return false;
  if(select.value!==option.value){select.value=option.value;select.dispatchEvent(new Event("change",{bubbles:true}));}
  return true;
 }
 function mount(config){
  const form=document.getElementById(config.formId),reg=document.getElementById(config.registrationId),button=document.getElementById("dvsaMotLookupBtn"),status=document.getElementById("dvsaMotLookupStatus"),details=document.getElementById("dvsaMotLookupDetails");
  if(!form||!reg||!button||!status||!details)return null;
  const make=document.getElementById("make"),model=document.getElementById("model"),year=document.getElementById("bike_year")||document.getElementById("year");
  let record=null,lookupToken="",requestIndex=0;
  const mileageInput=document.getElementById("mileage");
  const mileageWarning=document.createElement("div");
  mileageWarning.setAttribute("role","status");mileageWarning.hidden=true;
  mileageWarning.style.cssText="border:1px solid #d6a449;border-left:4px solid #d6a449;border-radius:8px;background:#fff3d4;color:#593700;padding:10px 12px;font-size:13px;line-height:1.5;margin-top:6px";
  mileageInput?.insertAdjacentElement("afterend",mileageWarning);
  function updateMileageWarning(){
   mileageWarning.hidden=true;mileageWarning.textContent="";
   if(!record||!mileageInput||normalRegistration(reg.value)!==record.registration)return;
   const current=String(mileageInput.value||"").trim().replace(/,/g,""),historical=String(record.latestMotMileage??"").trim(),unit=String(record.latestMotMileageUnit||"").toUpperCase(),kind=String(record.latestMotMileageResultType||"").toUpperCase();
   if(!/^\d+$/.test(current)||!/^\d+$/.test(historical)||kind!=="READ"||!["MI","MILES","KM","KILOMETRES"].includes(unit))return;
   const miles=Number(historical)*(["KM","KILOMETRES"].includes(unit)?0.621371192237:1);
   if(Number(current)>=Math.floor(miles))return;
   mileageWarning.textContent="Mileage discrepancy — you entered "+Number(current).toLocaleString("en-GB")+" miles, but DVSA recorded "+formatMileage(record)+" at the last MOT"+(record.latestMotDate?" on "+dateLabel(record.latestMotDate):"")+". Please double-check the odometer. You can still submit if your entry is correct.";
   mileageWarning.hidden=false;
  }
  mileageInput?.addEventListener("input",updateMileageWarning);
  mileageInput?.addEventListener("change",updateMileageWarning);
  let family=null;
  const filteredOptions=new Map();
  const familyHint=document.createElement("div");
  familyHint.style.cssText="font-size:12px;line-height:1.4;margin-top:6px";
  familyHint.hidden=true;
  const familyText=document.createElement("span"),showAll=document.createElement("button");
  showAll.type="button";showAll.textContent="Show all models";showAll.style.cssText="background:transparent;color:inherit;border:0;text-decoration:underline;cursor:pointer;padding:4px 0;margin-left:8px;font:inherit";
  familyHint.append(familyText,showAll);
  model?.insertAdjacentElement("afterend",familyHint);
  function restoreModels(){
   for(const [option,original] of filteredOptions){option.hidden=original.hidden;option.disabled=original.disabled;}
   filteredOptions.clear();
  }
  function clearFamily(){family=null;restoreModels();familyHint.hidden=true;}
  function familyMatches(value,target){
   const full=normalName(value),base=normalName(target);
   if(base.length<3||!/\d/.test(base))return false;
   return full===base||(full.startsWith(base)&&/^[a-z]/.test(full.slice(base.length)));
  }
  function applyFamily(){
   restoreModels();
   if(!family||!model||model.disabled||normalName(make?.value)!==family.make){familyHint.hidden=true;return 0;}
   const options=Array.from(model.options),matches=options.filter(o=>o.value&&!o.value.startsWith("__")&&familyMatches(o.value,family.model));
   if(!matches.length||(model.value&&!matches.some(o=>o.value===model.value))){familyHint.hidden=true;return 0;}
   for(const option of options){
    if(!option.value||matches.includes(option))continue;
    filteredOptions.set(option,{hidden:option.hidden,disabled:option.disabled});option.hidden=true;option.disabled=true;
   }
   familyText.textContent="Select the exact "+family.label+" model from "+matches.length+" matching option"+(matches.length===1?"":"s")+".";
   familyHint.hidden=false;return matches.length;
  }
  showAll.addEventListener("click",clearFamily);
  make?.addEventListener("change",()=>{if(family&&normalName(make.value)!==family.make)clearFamily();});
  if(model)new MutationObserver(()=>{if(family)applyFamily();}).observe(model,{childList:true});
  function clear(){clearFamily();clearMotSuggestion();document.getElementById("ab-dvsa-mot-history")?.remove();record=null;lookupToken="";updateMileageWarning();details.hidden=true;details.replaceChildren();}
  function invalidate(){requestIndex++;clear();status.textContent="";button.disabled=false;}
  reg.addEventListener("input",()=>{if(!record||normalRegistration(reg.value)!==record.registration)invalidate();});
  reg.addEventListener("change",()=>{if(record&&normalRegistration(reg.value)!==record.registration)invalidate();});
  form.addEventListener("reset",()=>{invalidate();motInputTouched=false;});
  form.addEventListener("formdata",e=>{if(record&&lookupToken&&normalRegistration(reg.value)===record.registration)e.formData.set("dvsa_lookup_token",lookupToken);});
  function formatMileage(vehicle){
   const raw=String(vehicle.latestMotMileage??"").trim(),kind=String(vehicle.latestMotMileageResultType||"").toUpperCase();
   if(!/^\d+$/.test(raw)||(kind&&kind!=="READ"))return "";
   const unit=String(vehicle.latestMotMileageUnit||"").toUpperCase();
   return Number(raw).toLocaleString("en-GB")+(unit==="MI"||unit==="MILES"?" miles":unit==="KM"||unit==="KILOMETRES"?" km":unit?" "+unit:"");
  }
  function motStatus(vehicle){
   const expiry=String(vehicle.latestPassingMotExpiryDate||((String(vehicle.latestMotResult).toUpperCase()==="PASSED")?vehicle.latestMotExpiryDate:"")||"").slice(0,10);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(expiry)||!Number.isFinite(Date.parse(expiry)))return null;
   const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
   const part=k=>parts.find(p=>p.type===k)?.value;
   const today=part("year")+"-"+part("month")+"-"+part("day");
   return {expiry,valid:expiry>=today,latestPass:String(vehicle.latestMotResult||"").toUpperCase()==="PASSED"};
  }
  let suggestedMot="";
  let motInputTouched=false;
  const motSelect=()=>document.getElementById("ab-condition-mot");
  form.addEventListener("change",e=>{if(e.target?.id==="ab-condition-mot"&&e.isTrusted){motInputTouched=true;suggestedMot="";}});
  function clearMotSuggestion(){
   const input=motSelect();
   if(suggestedMot&&input?.value===suggestedMot){input.value="";input.dispatchEvent(new Event("change",{bubbles:true}));}
   suggestedMot="";
  }
  function suggestMot(vehicle){
   const state=motStatus(vehicle),input=motSelect();
   if(!state||!input||input.value||motInputTouched||!state.latestPass)return;
   const choice=state.valid?"Valid — expiry known":"Expired";
   if(Array.from(input.options).some(o=>o.value===choice)){
    suggestedMot=choice;input.value=choice;input.dispatchEvent(new Event("change",{bubbles:true}));
   }
  }
  function renderDeclarationMot(vehicle,tests){
   document.getElementById("ab-dvsa-mot-history")?.remove();
   const select=motSelect(),field=select?.closest("label");
   if(!field)return;
   const panel=document.createElement("div");panel.id="ab-dvsa-mot-history";panel.style.cssText="grid-column:1/-1;border:1px solid #666;border-left:3px solid #ed1c24;border-radius:7px;padding:10px 12px;font-size:13px;line-height:1.5;min-width:0";
   const heading=document.createElement("strong");heading.textContent="DVSA MOT record · confirm your declaration";panel.append(heading);
   const state=motStatus(vehicle),summary=document.createElement("div");summary.style.marginTop="5px";
   const statusText=state?(state.latestPass?(state.valid?"Valid until ":"Expired on ")+dateLabel(state.expiry):"Last MOT pass expiry: "+dateLabel(state.expiry)+" — check latest test result"):"MOT expiry not confirmed";
   const parts=[statusText,vehicle.latestMotDate?"Last test: "+dateLabel(vehicle.latestMotDate):"",formatMileage(vehicle)?"Last MOT mileage: "+formatMileage(vehicle):""].filter(Boolean);
   summary.textContent=parts.join(" · ");panel.append(summary);
   const history=document.createElement("details"),toggle=document.createElement("summary");toggle.style.cssText="cursor:pointer;font-weight:700;margin-top:8px";const rows=Array.isArray(tests)?tests:[];toggle.textContent="View MOT history"+(rows.length?" ("+rows.length+" tests)":"");history.append(toggle);history.open=true;
   const updateHistoryToggle=()=>{toggle.textContent=(history.open?"Hide MOT history":"Show MOT history")+(rows.length?" ("+rows.length+" tests)":"");};
   history.addEventListener("toggle",updateHistoryToggle);updateHistoryToggle();
   if(!rows.length){const empty=document.createElement("p");empty.textContent=vehicle.motTestsCount?"Individual test details not returned.":"No individual MOT tests returned by DVSA.";history.append(empty);}
   for(const test of rows){
    const item=document.createElement("div");item.style.cssText="padding:9px 0;border-top:1px solid #777;margin-top:6px";
    const title=document.createElement("strong"),result=String(test.testResult||"").toUpperCase();title.textContent=[dateLabel(test.completedDate),result||"Result not supplied"].filter(Boolean).join(" · ");if(result==="PASSED")title.style.color="#36a852";if(result==="FAILED")title.style.color="#ed1c24";item.append(title);
    const mileage=formatMileage({latestMotMileage:test.odometerValue,latestMotMileageUnit:test.odometerUnit,latestMotMileageResultType:test.odometerResultType});
    const facts=document.createElement("div");facts.textContent=[mileage?"Recorded mileage: "+mileage:"",test.expiryDate?"Expiry: "+dateLabel(test.expiryDate):""].filter(Boolean).join(" · ");if(facts.textContent)item.append(facts);
    const defects=Array.isArray(test.defects)?test.defects:[];
    if(defects.length){const list=document.createElement("ul");list.style.cssText="margin:5px 0 0;padding-left:18px";for(const defect of defects){const li=document.createElement("li");li.textContent=[defect.dangerous?"DANGEROUS":defect.type,defect.text].filter(Boolean).join(": ");list.append(li);}item.append(list);}
    else{const note=document.createElement("div");note.textContent="No defects or advisories returned for this test.";item.append(note);}
    history.append(item);
   }
   panel.append(history);
   const note=document.createElement("div");note.style.cssText="font-size:12px;margin-top:6px";note.textContent="Historical DVSA records are not a current condition or HPI check. Confirm or correct the MOT declaration above.";panel.append(note);
   field.insertAdjacentElement("afterend",panel);
  }
  function render(vehicle){
   details.replaceChildren();
   const heading=document.createElement("strong");heading.textContent="DVSA vehicle record";details.append(heading);
   const columns=document.createElement("div");columns.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px 28px;margin-top:10px";
   const state=motStatus(vehicle);
   function group(title,fields){
    const box=document.createElement("section"),h=document.createElement("div"),grid=document.createElement("dl");
    h.textContent=title;h.style.cssText="font-weight:700;font-size:13px;color:#fff;border-bottom:1px solid #414141;padding-bottom:5px;margin-bottom:6px";
    grid.style.cssText="display:grid;grid-template-columns:minmax(95px,auto) minmax(0,1fr);gap:3px 12px;margin:0;font-size:13px;line-height:1.35";
    for(const [label,value] of fields){
     if(value===undefined||value===null||String(value).trim()==="")continue;
     const dt=document.createElement("dt"),dd=document.createElement("dd");dt.style.cssText="color:#bbb;margin:0";dd.style.cssText="margin:0;font-weight:600;overflow-wrap:anywhere";dt.textContent=label;dd.textContent=value;grid.append(dt,dd);
    }
    box.append(h,grid);columns.append(box);return box;
   }
   group("Motorcycle details",[
    ["Manufacturer",vehicle.make],["DVSA model",vehicle.model],["Engine capacity",vehicle.engineSize?vehicle.engineSize+" cc":""],
    ["Primary colour",vehicle.colour],["Secondary colour",vehicle.secondaryColour],["Fuel type",vehicle.fuelType],
    ["First used",dateLabel(vehicle.firstUsedDate)],["Registration date",dateLabel(vehicle.registrationDate)],["Manufacture date",dateLabel(vehicle.manufactureDate)]
   ]);
   const mot=group("MOT information",[
    ["Latest MOT test",dateLabel(vehicle.latestMotDate)],["MOT result",vehicle.latestMotResult],
    ["Latest MOT mileage",formatMileage(vehicle)],["Last MOT pass expiry",dateLabel(state?.expiry)],
    ["MOT tests returned",Number.isInteger(vehicle.motTestsCount)?String(vehicle.motTestsCount):""]
   ]);
   if(state){
    const badge=document.createElement("div");badge.style.cssText="margin-top:8px;font-weight:700;color:"+(state.valid&&state.latestPass?"#90e6a2":!state.valid?"#ffc787":"#ddd");
    badge.textContent=state.latestPass?(state.valid?"MOT valid until ":"MOT expired on ")+dateLabel(state.expiry):"Last pass expiry: "+dateLabel(state.expiry)+" — check latest test result";
    mot.append(badge);
   }
   details.append(columns);
   const help=document.createElement("div");help.style.cssText="margin-top:9px;color:#ddd;font-size:12px";help.textContent="Confirm the exact model, year, MOT status and current mileage. MOT mileage is historical. DVSA is not an ownership, finance or HPI check.";details.append(help);
   details.hidden=false;
  }
  button.addEventListener("click",async()=>{
   const registration=normalRegistration(reg.value),request=++requestIndex;
   clear();
   if(!/^[A-Z0-9]{2,8}$/.test(registration)){status.textContent="Please enter a valid registration first.";return;}
   button.disabled=true;status.textContent="Checking DVSA MOT records…";
   try{
    const response=await fetch(config.url+"/functions/v1/dvsa-mot-registration-lookup",{method:"POST",headers:{"Content-Type":"application/json",apikey:config.key},body:JSON.stringify({registration})});
    const result=await response.json();
    if(request!==requestIndex||normalRegistration(reg.value)!==registration)return;
    if(!response.ok||!result.success||!result.vehicle)throw new Error(result.error||"Lookup unavailable");
    const vehicle=result.vehicle;
    if(normalRegistration(vehicle.registration)!==registration)throw new Error("The returned registration did not match. Please verify it.");
    record=vehicle;lookupToken=typeof result.lookupToken==="string"?result.lookupToken:"";reg.value=registration;
    updateMileageWarning();
    render(vehicle);
    suggestMot(vehicle);
    renderDeclarationMot(vehicle,result.motHistory);
    details.style.scrollMarginTop="110px";
    requestAnimationFrame(()=>{
     if(request!==requestIndex||details.hidden)return;
     details.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});
    });
    let makeMatched=false,modelMatched=false,familyCount=0;
    const makeConflict=make?.value&&normalName(make.value)!==normalName(vehicle.make);
    if(!makeConflict)makeMatched=matchOption(make,vehicle.make);
    if(makeMatched){
     for(let i=0;i<12;i++){
      if(request!==requestIndex)return;
      if(model?.value&&normalName(model.value)!==normalName(vehicle.model))break;
      const related=Array.from(model?.options||[]).filter(o=>o.value&&familyMatches(o.value,vehicle.model));
      const exact=related.find(o=>normalName(o.value)===normalName(vehicle.model));
      if(related.length>1&&(!exact||/\d$/.test(normalName(vehicle.model)))){
       family={make:normalName(make.value),model:vehicle.model,label:vehicle.model};
       familyCount=applyFamily();
       if(familyCount)break;
      }
      modelMatched=matchOption(model,vehicle.model);
      if(modelMatched)break;
      if(related.length){
       family={make:normalName(make.value),model:vehicle.model,label:vehicle.model};
       familyCount=applyFamily();
       if(familyCount)break;
      }
      await new Promise(resolve=>setTimeout(resolve,150));
     }
    }
    if(request!==requestIndex)return;
    const yearHint=String(vehicle.manufactureDate||vehicle.firstUsedDate||vehicle.registrationDate||"").match(/^\d{4}/)?.[0];
    if(year&&!year.value&&yearHint&&Number(yearHint)>=1900&&Number(yearHint)<=new Date().getFullYear()+1){
     if(year.tagName==="SELECT"){if(Array.from(year.options).some(o=>o.value===yearHint))year.value=yearHint;}else year.value=yearHint;
     if(year.value)year.dispatchEvent(new Event("change",{bubbles:true}));
    }
    status.textContent=(makeConflict?"Record found; check the selected manufacturer and model.":makeMatched&&modelMatched?"Make and model selected; please confirm.":familyCount?"Matching models shortlisted; please select the exact model.":makeMatched?"Make selected; please select the correct model.":"Record found; please select the matching make and model.")+(lookupToken?"":" DVSA snapshot could not be saved; manual entry is still available.");
   }catch(error){if(request===requestIndex){clear();status.textContent=(error instanceof Error?error.message:"Lookup unavailable")+" You can still enter the details manually.";}}
   finally{if(request===requestIndex)button.disabled=false;}
  });
  return {invalidate};
 }
 window.AnyBikeDvsaLookup={mount};
})();
