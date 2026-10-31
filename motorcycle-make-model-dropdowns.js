(function(){
"use strict";
const make=document.getElementById("make"),model=document.getElementById("model");
if(!make||!model)return;
const norm=x=>String(x||"").toLowerCase().replace(/[^a-z0-9]/g,"");
fetch("/data/motorcycle-catalogue-master.json",{cache:"no-cache"}).then(r=>{
 if(!r.ok)throw Error("Catalogue unavailable");return r.json();
}).then(data=>{
 if(!Array.isArray(data.models)||!data.models.length)throw Error("Catalogue empty");
 const groups=new Map();
 for(const row of data.models){
  if(!row.make||!row.model)continue;
  if(!groups.has(row.make))groups.set(row.make,new Set());
  groups.get(row.make).add(row.model);
 }
 const initialMake=make.value,initialModel=model.value;
 make.replaceChildren(new Option("Select manufacturer",""));
 for(const name of [...groups.keys()].sort((a,b)=>a.localeCompare(b)))make.add(new Option(name,name));
 function update(){
  const previous=model.value;
  model.replaceChildren(new Option("Select model",""));
  for(const name of [...(groups.get(make.value)||[])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})))model.add(new Option(name,name));
  model.disabled=!make.value;
  const matching=[...model.options].find(o=>norm(o.value)===norm(previous));
  if(matching)model.value=matching.value;
 }
 make.addEventListener("change",update);
 const selected=[...make.options].find(o=>norm(o.value)===norm(initialMake));
 if(selected)make.value=selected.value;
 update();
 const matching=[...model.options].find(o=>norm(o.value)===norm(initialModel));
 if(matching)model.value=matching.value;
}).catch(error=>{
 console.error("Motorcycle catalogue could not load",error);
 make.replaceChildren(new Option("Motorcycle list unavailable — please try again",""));
 model.replaceChildren(new Option("Motorcycle list unavailable",""));
 make.disabled=true;model.disabled=true;
});
})();
