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
  const make=document.getElementById("make"),model=document.getElementById("model"),year=document.getElementById("bike_year");
  let record=null,lookupToken="",requestIndex=0;
  function clear(){clearMotSuggestion();record=null;lookupToken="";details.hidden=true;details.replaceChildren();}
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
    render(vehicle);
    suggestMot(vehicle);
    let makeMatched=false,modelMatched=false;
    const makeConflict=make?.value&&normalName(make.value)!==normalName(vehicle.make);
    if(!makeConflict)makeMatched=matchOption(make,vehicle.make);
    if(makeMatched){
     for(let i=0;i<12;i++){
      if(request!==requestIndex)return;
      if(model?.value&&normalName(model.value)!==normalName(vehicle.model))break;
      modelMatched=matchOption(model,vehicle.model);
      if(modelMatched)break;
      await new Promise(resolve=>setTimeout(resolve,150));
     }
    }
    if(request!==requestIndex)return;
    const yearHint=String(vehicle.manufactureDate||vehicle.firstUsedDate||vehicle.registrationDate||"").match(/^\d{4}/)?.[0];
    if(year&&!year.value&&yearHint&&Number(yearHint)>=1900&&Number(yearHint)<=new Date().getFullYear()+1){
     if(year.tagName==="SELECT"){if(Array.from(year.options).some(o=>o.value===yearHint))year.value=yearHint;}else year.value=yearHint;
     if(year.value)year.dispatchEvent(new Event("change",{bubbles:true}));
    }
    status.textContent=(makeConflict?"Record found; check the selected manufacturer and model.":makeMatched&&modelMatched?"Make and model selected; please confirm.":makeMatched?"Make selected; please select the correct model.":"Record found; please select the matching make and model.")+(lookupToken?"":" DVSA snapshot could not be saved; manual entry is still available.");
   }catch(error){if(request===requestIndex){clear();status.textContent=(error instanceof Error?error.message:"Lookup unavailable")+" You can still enter the details manually.";}}
   finally{if(request===requestIndex)button.disabled=false;}
  });
  return {invalidate};
 }
 window.AnyBikeDvsaLookup={mount};
})();
