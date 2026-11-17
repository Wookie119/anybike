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
  function clear(){record=null;lookupToken="";details.hidden=true;details.replaceChildren();}
  function invalidate(){requestIndex++;clear();status.textContent="";button.disabled=false;}
  reg.addEventListener("input",()=>{if(!record||normalRegistration(reg.value)!==record.registration)invalidate();});
  reg.addEventListener("change",()=>{if(record&&normalRegistration(reg.value)!==record.registration)invalidate();});
  form.addEventListener("reset",invalidate);
  form.addEventListener("formdata",e=>{if(record&&lookupToken&&normalRegistration(reg.value)===record.registration)e.formData.set("dvsa_lookup_token",lookupToken);});
  function render(vehicle){
   details.replaceChildren();
   const heading=document.createElement("strong");heading.textContent="DVSA vehicle record";details.append(heading);
   const grid=document.createElement("dl");grid.style.cssText="display:grid;grid-template-columns:minmax(105px,auto) minmax(0,1fr);gap:4px 12px;margin:8px 0 0;font-size:13px;line-height:1.45";
   const fields=[
    ["Manufacturer",vehicle.make],["DVSA model",vehicle.model],["Engine capacity",vehicle.engineSize?vehicle.engineSize+" cc":""],
    ["Primary colour",vehicle.colour],["Secondary colour",vehicle.secondaryColour],["Fuel type",vehicle.fuelType],
    ["First used",dateLabel(vehicle.firstUsedDate)],["Registration date",dateLabel(vehicle.registrationDate)],["Manufacture date",dateLabel(vehicle.manufactureDate)],
    ["Latest MOT test",dateLabel(vehicle.latestMotDate)],["MOT result",vehicle.latestMotResult],
    ["Latest MOT mileage",vehicle.latestMotMileage!==""&&vehicle.latestMotMileage!=null&&String(vehicle.latestMotMileageResultType||"").toUpperCase()!=="NO_ODOMETER"?String(vehicle.latestMotMileage)+(vehicle.latestMotMileageUnit?" "+vehicle.latestMotMileageUnit:""):""],
    ["Last recorded MOT pass expiry",dateLabel(vehicle.latestPassingMotExpiryDate||vehicle.latestMotExpiryDate)],
    ["MOT tests returned",Number.isInteger(vehicle.motTestsCount)?String(vehicle.motTestsCount):""]
   ];
   for(const [label,value] of fields){
    if(value===undefined||value===null||String(value).trim()==="")continue;
    const dt=document.createElement("dt"),dd=document.createElement("dd");dt.style.cssText="color:#bbb;margin:0";dd.style.cssText="margin:0;font-weight:600;overflow-wrap:anywhere";dt.textContent=label;dd.textContent=value;grid.append(dt,dd);
   }
   details.append(grid);
   const help=document.createElement("div");help.style.cssText="margin-top:10px;color:#ddd";help.textContent="Confirm the exact make, model and motorcycle year. Enter the current mileage yourself; MOT mileage is historical. These records do not establish ownership, finance status or HPI clearance.";details.append(help);
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
