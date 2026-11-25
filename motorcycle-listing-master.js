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

 // Feed presentation: preserve mixed-case source text and genuine model codes.
 function displayName(value,kind="model"){
  const v=String(value??"").trim().replace(/\s+/g," ");
  const brands={"HARLEY-DAVIDSON":"Harley-Davidson","BMW":"BMW","KTM":"KTM","CFMOTO":"CFMOTO","MV AGUSTA":"MV Agusta","BSA":"BSA","KYMCO":"Kymco","VMOTO":"VMoto","SYM":"SYM","BRP":"BRP"};
  if(kind==="make"&&brands[v.toUpperCase()])return brands[v.toUpperCase()];
  if(v!==v.toUpperCase())return v;
  const codes=/^(?:BMW|KTM|ABS|DCT|SP|ST|GT|RS|RR|GS|GSA|R|S|X|XR|MX|SX|EXC|XC|FX|FL[A-Z]{2,}|FX[A-Z]{2,}|XL[A-Z0-9]+|[A-Z]*\d+[A-Z0-9-]*|[A-Z]{1,3}-\d+[A-Z]*)$/;
  return v.split(" ").map(w=>kind!=="make"&&codes.test(w)?w:w.toLowerCase().replace(/(^|[-/])([a-z])/g,(_,p,c)=>p+c.toUpperCase())).join(" ");
 }
 function renderDealerDescription(host,value){
  if(!host)return;
  host.replaceChildren();
  const raw=String(value??"").trim();
  if(!raw)return;
  // Only split explicit separators. Never rewrite or remove dealer statements.
  const paragraphs=raw.replace(/\r\n?/g,"\n").replace(/\s+(?=Why buy from us\b)/gi,"\n\n").split(/\n\s*\n/);
  const doc=host.ownerDocument;
  for(const paragraph of paragraphs){
   const chunks=paragraph.split(/\s+-\s+/);
   if(chunks[0].trim()){const p=doc.createElement("p");p.textContent=chunks[0].trim();host.append(p);}
   if(chunks.length>1){const list=doc.createElement("ul");for(const chunk of chunks.slice(1)){if(!chunk.trim())continue;const li=doc.createElement("li");li.textContent=chunk.trim();list.append(li);}host.append(list);}
  }
 }
 global.AnyBikeListingMaster=Object.freeze({factsHTML,renderFacts,title,mileage,prepareDescription,displayName,renderDealerDescription});
})(window);
