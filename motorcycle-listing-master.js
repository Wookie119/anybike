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
 function mileage(value){if(!valid(value))return "";const n=Number(value);return Number.isFinite(n)&&n>=0?n.toLocaleString("en-GB")+" miles":"";}
 global.AnyBikeListingMaster=Object.freeze({factsHTML,renderFacts,title,mileage});
})(window);
