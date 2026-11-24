/* Shared presentation only. Does not fetch, approve, publish or mutate listings. */
(function(global){
 "use strict";
 const escape=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const valid=value=>value!==null&&value!==undefined&&String(value).trim()!=="";
 function rows(values,showMissing=false){
  return (Array.isArray(values)?values:[]).filter(row=>Array.isArray(row)&&row.length===2&&(showMissing||valid(row[1]))).map(([label,value])=>[String(label),valid(value)?String(value):null]);
 }
 function factsHTML(values,showMissing=false){
  return rows(values,showMissing).map(([label,value])=>'<div><dt>'+escape(label)+'</dt><dd'+(value===null?' class="missing"':'')+'>'+escape(value??"Not supplied")+'</dd></div>').join("");
 }
 function renderFacts(host,values,showMissing=false){
  if(!host)return;
  host.innerHTML=factsHTML(values,showMissing);
 }
 function title(values){return values.filter(valid).map(v=>String(v).trim()).join(" ");}
 function mileage(value){if(!valid(value)||!["string","number"].includes(typeof value)||!/^\d+(?:\.0+)?$/.test(String(value).trim()))return "";const n=Number(value);return Number.isSafeInteger(n)&&n>=0?n.toLocaleString("en-GB")+" miles":"";}
 // Generate a factual draft only from explicit seller answers. No inferred condition or history.
 function prepareDescription(input={}){
  input=input||{};
  const clean=v=>String(v??"").replace(/[\r\n]+/g," ").trim();
  const lines=[];
  const heading=title([input.year,input.make,input.model,input.variant].map(clean));
  if(heading)lines.push(heading+".");
  const miles=mileage(input.mileage);
  if(miles)lines.push("Seller-reported mileage: "+miles+".");
  for(const [label,value] of rows(input.declarations||[])){
   const v=clean(value);
   if(v&&!/^(unknown|not sure|not supplied|not provided)$/i.test(v))lines.push(label+" (seller-declared): "+v+".");
  }
  return lines.join("\n");
 }
 global.AnyBikeListingMaster=Object.freeze({factsHTML,renderFacts,title,mileage,prepareDescription});
})(window);
