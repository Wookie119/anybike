/* AnyBike shared country-page template contract v1.
 * Sweden provides the broad layout; Réunion contributes optional local-interest
 * content. This is a non-destructive compatibility layer for the 217 existing
 * static market pages. It never replaces regional text or manufactures facts.
 */
(function(){
 'use strict';
 const path=location.pathname.toLowerCase();
 if(!/^\/markets\/[a-z0-9-]+\.html$/.test(path)||window.AnyBikeCountryTemplate)return;
 const key=path.split('/').pop().replace(/\.html$/,'');
 const rules=Object.freeze({
  hero:'.hero',
  local_interest:'#market-interest, #countryBuyerInterestSection',
  manufacturer_grid:'.brand-grid',
  model_grid:'.model-grid',
  stock_section:'#available-stock, #availableStock, .market-stock',
  handover:'#handover',
  country_faq:'.faq',
  local_information:'.anybike-market-local-standard',
  editorial_links:'[data-anybike-market-links]'
 });
 const state={};
 function inspect(){
  return {family:'country',slug:key,path,template:'universal-country-v1',
   sections:{...state},source_reference:'Sweden base / Réunion local module',
   display_enabled:false};
 }
 function annotate(){
  if(!document.body)return;
  document.documentElement.dataset.anybikeTemplateFamily='country';
  document.body.dataset.anybikeCountryTemplate='universal-country-v1';
  for(const [name,selector] of Object.entries(rules)){
   const element=document.querySelector(selector);
   state[name]=!!element;
   if(element){
    element.dataset.anybikeSection=name;
    element.dataset.anybikeTemplateFamily='country';
   }
  }
 }
 const api=Object.freeze({family:'country',version:1,slug:key,path,
  reference_layout:'sweden',optional_local_module:'reunion',
  sections:rules,inspect,refresh:()=>{annotate();return inspect()}});
 window.AnyBikeCountryTemplate=api;
 const start=()=>{
  annotate();
  // Country scripts may add editorial and country-specific modules. Rescan
  // only as nodes are added, without changing markup, copy or visual styling.
  const observer=new MutationObserver(records=>{
   const added=records.some(r=>r.addedNodes.length);
   if(added)annotate();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();