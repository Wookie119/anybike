/* AnyBike approved V2 UNIVERSAL MASTER renderer.
   ONE template + ONE shared model identity contract + dynamically populated
   approved sections. No per-model HTML, no BMW-specific editorial lookup.
   Public catalogue identifies models; public verified RPC supplies facts;
   RLS-approved V2 editorial optionally enriches the SAME sections.
   Missing research produces no empty box. Existing live routes are untouched.
*/
import {installVerifiedModelFacts,approvedResearchSectionHeading} from '/model-template/public-verified-model-facts.mjs?v=20261115-research-runtime20';
const ENDPOINT='https://tuehtnezhdnkqbbhttgp.supabase.co';
const KEY='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
const $=id=>document.getElementById(id);
const str=x=>typeof x==='string'?x.trim():'';
const normalize=s=>str(s).toLocaleLowerCase('en-GB').replace(/[^a-z0-9]+/g,' ').trim();
const arr=x=>Array.isArray(x)?x:[];
const validURL=x=>typeof x==='string'&&/^https:\/\/[^\s]+$/.test(x);
// The published catalogue remains available when the optional Supabase JS
// browser bundle fails. Only this read-only RPC is exposed through fallback;
// never substitute an admin endpoint, service-role key or unaudited table.
async function publicCatalogueRpc(make){
 const response=await fetch(ENDPOINT+'/rest/v1/rpc/public_anybike_manufacturer_catalogue_names_v1',{
  method:'POST',
  headers:{apikey:KEY,'Content-Type':'application/json'},
  body:JSON.stringify({p_make:make}),
  cache:'no-store'
 });
 if(!response.ok)throw Error('Published model catalogue HTTP '+response.status);
 const rows=await response.json();
 if(!Array.isArray(rows))throw Error('Published model catalogue response invalid');
 return rows;
}
const node=(tag,text,cls)=>{
 const n=document.createElement(tag);
 if(text!==undefined)n.textContent=String(text);
 if(cls)n.className=cls;
 return n;
};
function showError(msg){
 const box=$('previewStatusError');
 box.textContent=msg;box.hidden=false;
}
function paragraph(parent,value){
 if(str(value))parent.append(node('p',value));
}
function sourceLink(parent,href,label){
 if(!validURL(href))return;
 const a=node('a',str(label)||'Manufacturer reference ↗');
 a.href=href;a.target='_blank';a.rel='noopener noreferrer';parent.append(a);
}
// The factory evidence remains in the DOM, with all original text and
// sources. Native details shorten the page without fetching or removing
// material on click, and are keyboard/mobile accessible.
// The database's canonical 20 slots are the only section identities. The
// same ordering applies to every manufacturer; empty slots stay in the DOM
// as non-rendered anchors, never as invented motorcycle specifications.
import {SECTION_KEYS as UNIVERSAL_SLOT_KEYS,SECTION_COUNT as UNIVERSAL_SLOT_COUNT}
 from '/model-template/universal-page-section-contract.mjs';
function organiseCanonicalResearchSlots(body){
 if(!body)return;
 let root=body.querySelector(':scope > [data-anybike-v2-section-slots]');
 if(!root){
  root=node('div',undefined,'anybike-v2-canonical-section-slots');
  root.dataset.anybikeV2SectionSlots=String(UNIVERSAL_SLOT_COUNT);
  root.hidden=true;
  body.prepend(root);
 }
 // Slot anchors are structural metadata, not twenty empty cards. Published
 // content remains in its existing verified, accessible research groups.
 for(const key of UNIVERSAL_SLOT_KEYS){
  if(root.querySelector('[data-section-key="'+key+'"]'))continue;
  const anchor=node('span');anchor.dataset.sectionKey=key;
  anchor.dataset.anybikeV2EmptySlot='true';root.append(anchor);
 }
 const published=[...body.querySelectorAll('.anybike-v2-reviewed-universal-section[data-section-key]')];
 // Mark the corresponding canonical slot as populated even when the reviewed
 // content is merged into an existing verified-facts category. This is a
 // display-only index; it never changes publication permissions.
 for(const anchor of root.querySelectorAll('[data-section-key]')){
  const occupied=published.some(section=>section.dataset.sectionKey===anchor.dataset.sectionKey);
  anchor.dataset.anybikeV2EmptySlot=occupied?'false':'true';
 }
 const standalone=published.filter(section=>section.parentElement===body);
 standalone.sort((a,b)=>UNIVERSAL_SLOT_KEYS.indexOf(a.dataset.sectionKey)-
  UNIVERSAL_SLOT_KEYS.indexOf(b.dataset.sectionKey));
 // Keep the 20-slot publication sequence stable even if database response
 // order changes. Do not reorder verified research or remove its citations.
 for(const section of standalone)body.append(section);
 body.dataset.anybikeV2PopulatedSlots=String(new Set(published.map(x=>x.dataset.sectionKey)).size);
 body.dataset.anybikeV2SectionContract=String(UNIVERSAL_SLOT_COUNT);
}
// Build the visible model-research navigation from published content, never
// from a hard-coded make/model list or unpublished database slots. It updates
// automatically as approved 20-slot editorial and verified facts arrive.
function updateDynamicResearchNavigation(body){
 if(!body)return;
 let nav=document.getElementById('anybikeV2ResearchNavigation');
 const verified=body.querySelector('[data-anybike-verified-model-facts]');
 const categories=verified?[...verified.querySelectorAll(':scope > [data-anybike-research-category]')]:[];
 const editorial=[...body.querySelectorAll(':scope > .anybike-v2-reviewed-universal-section[data-section-key]')];
 const entries=[];
 for(const group of categories){
  // Category headings move inside <details><summary> when the approved
  // compact research layout is applied. Read the actual visible heading.
  const title=(group.querySelector(':scope > details[data-v2-factory-category] > summary > h3')||
   group.querySelector(':scope > h3'))?.textContent?.trim();
  if(title&&group.querySelector('article, .anybike-v2-reviewed-universal-section'))entries.push([group,title]);
 }
 for(const section of editorial){
  const title=section.querySelector(':scope > h2')?.textContent?.trim();
  if(title)entries.push([section,title]);
 }
 // A model with no approved research still retains the SAME navigation
 // and factory-research position as a fully researched motorcycle.
 if(!entries.length&&verified)entries.push([verified,'Documented factory research']);
 if(!entries.length){nav?.remove();return;}
 if(!nav){
  nav=node('nav',undefined,'anybike-v2-dynamic-research-navigation');
  nav.id='anybikeV2ResearchNavigation';
  nav.setAttribute('aria-label','Documented motorcycle research sections');
  const heading=node('h2','Explore documented research');
  const links=node('div',undefined,'anybike-v2-dynamic-research-links');
  nav.append(heading,links);
  body.before(nav);
 }
 const links=nav.querySelector('.anybike-v2-dynamic-research-links');
 links.replaceChildren();
 entries.forEach(([section,title],i)=>{
  const id='anybike-v2-research-'+String(i+1);
  section.id=id;
  const a=node('a',title);a.href='#'+id;
  a.addEventListener('click',()=>{
   // Research cards are intentionally collapsed by default. Opening the
   // selected card makes a section jump useful on mobile and desktop.
   const details=section.querySelector(':scope > details[data-v2-factory-category]');
   if(details)details.open=true;
  });
  links.append(a);
 });
}
// Preserve the approved research panel position on every model, including
// models without released facts. Never invent specifications or sources.
function ensureUniversalResearchPanel(body,make,model){
 if(!body)return;
 const identity=JSON.stringify([String(make).toLowerCase(),String(model).toLowerCase()]);
 let panel=body.querySelector('[data-anybike-verified-model-facts]');
 if(panel){
  // A pre-existing panel may be an empty container, not published research.
  // Keep the identical panel and provide an honest empty state until approved
  // records arrive. Never remove the message merely because a panel exists.
  const hasPublishedResearch=Boolean(panel.querySelector('[data-anybike-research-category] article, .anybike-v2-reviewed-universal-section, article[data-verified-model-fact]'));
  const awaiting=panel.querySelector('[data-anybike-research-awaiting-publication]');
  if(hasPublishedResearch){awaiting?.remove();}
  else if(!awaiting){
   const status=node('p','Verified factory research for this exact model has not yet been published. Specifications and model-year information will appear here once source-checked and approved.');
   status.dataset.anybikeResearchAwaitingPublication='1';panel.append(status);
  }
  return;
 }
 panel=node('section',undefined,'card feature anybike-verified-model-research');
 panel.dataset.anybikeVerifiedModelFacts='1';
 panel.dataset.anybikeResearchIdentity=identity;
 panel.append(node('h2',make+' '+model+' — documented factory research'));
 const status=node('p','Verified factory research for this exact model has not yet been published. Specifications and model-year information will appear here once source-checked and approved.');
 status.dataset.anybikeResearchAwaitingPublication='1';
 panel.append(status);
 body.prepend(panel);
}
// Present RLS-approved editorial in the SAME documented-research panel as
// audited factory facts, rather than appending a second model-page layout.
// Only approved, already-rendered sections enter this projection.
function integratePublishedResearch(body,make,model){
 if(!body)return;
 const approved=[...body.querySelectorAll(':scope > .anybike-v2-reviewed-universal-section[data-section-key]')]
  .filter(section=>UNIVERSAL_SLOT_KEYS.includes(section.dataset.sectionKey)&&
   section.querySelector(':scope > h2')&&section.children.length>1);
 if(!approved.length)return;
 const identity=JSON.stringify([String(make).toLowerCase(),String(model).toLowerCase()]);
 let panel=body.querySelector('[data-anybike-verified-model-facts]');
 // A reused model route must not retain the previous motorcycle's evidence.
 if(panel&&panel.dataset.anybikeResearchIdentity!==identity){
  panel.remove();panel=null;
 }
 // Some models have approved editorial but no verified-facts RPC rows.
 // They still use the ONE research layout, not an orphaned second design.
 if(!panel){
  panel=node('section',undefined,'card feature anybike-verified-model-research');
  panel.dataset.anybikeVerifiedModelFacts='1';
  panel.dataset.anybikeResearchIdentity=identity;
  panel.append(node('h2','Documented factory research'));
  body.prepend(panel);
 }
 const seen=new Set();
 for(const section of approved.sort((a,b)=>UNIVERSAL_SLOT_KEYS.indexOf(a.dataset.sectionKey)-
  UNIVERSAL_SLOT_KEYS.indexOf(b.dataset.sectionKey))){
  if(seen.has(section.dataset.sectionKey)){
   // Do not discard a second already-approved record for the same slot.
   // Retain its sourced body inside the existing canonical category.
   const existing=[...panel.querySelectorAll(':scope > [data-anybike-v2-canonical-slot]')]
    .find(group=>group.dataset.anybikeV2CanonicalSlot===section.dataset.sectionKey);
   if(existing){
    const duplicateHeading=section.querySelector(':scope > h2');
    duplicateHeading?.remove();
    section.classList.remove('card');
    existing.append(section);
   }
   continue;
  }
  seen.add(section.dataset.sectionKey);
  const heading=section.querySelector(':scope > h2');
  const group=node('div',undefined,'anybike-v2-reviewed-category');
  group.dataset.anybikeResearchCategory='approved_'+section.dataset.sectionKey;
  group.dataset.anybikeResearchIdentity=identity;
  group.dataset.anybikeV2CanonicalSlot=section.dataset.sectionKey;
  group.append(node('h3',heading.textContent?.trim()||'Documented motorcycle research'));
  heading.remove();
  section.classList.remove('card');
  group.append(section);
  panel.append(group);
 }
}
function organiseUniversalFactoryResearch(body){
 const panel=body?.querySelector('[data-anybike-verified-model-facts]');
 if(!panel)return;
 const groups=[...panel.querySelectorAll(':scope > [data-anybike-research-category]')];
 if(!groups.length)return;
 panel.classList.add('anybike-v2-organised-research');
 if(groups.length>=3&&!panel.querySelector('[data-v2-research-controls]')){
  const controls=node('div',undefined,'anybike-v2-research-controls');
  controls.dataset.v2ResearchControls='1';
  const expand=node('button','Expand all research');
  const collapse=node('button','Collapse all research');
  expand.type='button';collapse.type='button';
  expand.addEventListener('click',()=>{
   panel.querySelectorAll('details[data-v2-factory-category]').forEach(item=>item.open=true);
  });
  collapse.addEventListener('click',()=>{
   panel.querySelectorAll('details[data-v2-factory-category]').forEach(item=>item.open=false);
  });
  controls.append(expand,collapse);
  groups[0].before(controls);
 }
 for(const [index,group] of groups.entries()){
  if(group.querySelector(':scope > details[data-v2-factory-category]'))continue;
  const heading=group.querySelector(':scope > h3');
  if(!heading||!heading.textContent?.trim())continue;
  const details=node('details');
  details.dataset.v2FactoryCategory='1';
  // All research categories start closed. The reader can expand any
  // source-backed record without losing text, attribution or links.
  details.open=false;
  const summary=node('summary');
  summary.append(heading);
  const evidenceCount=group.querySelectorAll('article').length;
  if(evidenceCount)summary.append(node('span',evidenceCount+' documented '+(evidenceCount===1?'record':'records')));
  details.append(summary);
  for(const child of [...group.children])details.append(child);
  group.append(details);
 }
 // The separately authored reference panels may add year-specific detail.
 // Keep their text and source citations, but avoid an additional large
 // permanently expanded sequence after the verified research.
 for(const id of ['v2FactoryColours','v2EngineeringOverview']){
  const section=$(id);
  if(!section||section.querySelector('[data-v2-compact-supplement]'))continue;
  const heading=section.querySelector(':scope > h2');
  if(!heading)continue;
  const detail=node('details');
  detail.dataset.v2CompactSupplement='1';
  const summary=node('summary');
  summary.append(heading);
  detail.append(summary);
  for(const child of [...section.children])detail.append(child);
  section.append(detail);
  section.classList.add('anybike-v2-compact-supplement');
  // Model-specific factory colour and engineering references belong WITH
  // their corresponding source-verified research, not as repeated standalone
  // panels hundreds of pixels below. The unique records stay in the document.
  const categories=id==='v2FactoryColours'?['factory_colours']:
   ['engineering','engine','specification','chassis'];
  const group=categories.map(category=>
   groups.find(item=>item.dataset.anybikeResearchCategory===category))
   .find(Boolean);
  const destination=group?.querySelector(':scope > details[data-v2-factory-category]');
  if(destination){
   const supplementalHeading=section.querySelector('summary > h2');
   if(supplementalHeading)supplementalHeading.textContent=
    id==='v2FactoryColours'?'Additional factory colours by model year':
     'Additional documented engineering details';
   destination.append(section);
   section.classList.add('anybike-v2-nested-supplement');
  }
 }
}
// The site's existing visitor-country service is a presentation hint only.
// Stock authorisation stays with the international-public-stock endpoint.
// Missing geography must never be interpreted as a verified UK location.
async function isConfirmedUkVisitor(){
 try{
  const response=await fetch(ENDPOINT+'/functions/v1/visitor-market-country',
   {method:'GET',cache:'no-store'});
  if(!response.ok)return false;
  const result=await response.json();
  return String(result?.country_code||'').toUpperCase()==='GB';
 }catch(error){
  console.warn('Visitor-country presentation lookup unavailable',error);
  return false;
 }
}
function makeSection(id,title,after){
 let el=$(id);
 if(!el){
  el=node('section',undefined,'card');
  el.id=id;
  el.append(node('h2',title));
  after.after(el);
 }
 return el;
}
import {resolveApprovedV2Identity} from '/model-template/approved-v2-route-identity.mjs';
const params=new URLSearchParams(location.search);
// Optional diagnostic only; no visible marker on normal public pages.
// Emitted only after the shared renderer resolves an exact catalogue identity.
function showUniversalVerification(make,model,canonicalId){
 if(params.get('v2verify')!=='1')return;
 const main=document.querySelector('main');
 if(!main)return;
 let marker=document.getElementById('anybikeUniversalV2Verification');
 if(!marker){
  marker=node('div',undefined,'anybike-v2-verification');
  marker.id='anybikeUniversalV2Verification';
  marker.style.cssText='max-width:1100px;margin:22px auto 8px;padding:8px 12px;background:#1d1d1d;border:1px solid #777;border-left:3px solid var(--model-accent);border-radius:6px;color:#eee;font-size:12px;font-weight:700';
 }
 marker.dataset.renderer='approved-v2-universal-preview';
 marker.dataset.catalogueModelId=String(canonicalId);
 marker.dataset.sectionContract='20';
 marker.textContent='AB-V2-978 · '+make+' '+model+' · Model ID '+canonicalId+' · 20-slot master';
 main.append(marker);
}

let wantMake=str(params.get('make')),wantModel=str(params.get('model'));
let approvedDedicatedRoute=null;
let permanentRouteModelId=null;
 // Static SEO routes share this exact V2 document and renderer. Identity is
 // embedded by the published catalogue build, then revalidated by Supabase.
 // Query parameters cannot override a model's permanent URL.
 if(/^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/.test(location.pathname)){
  try{
   const identityNode=document.getElementById('anybikeV2RouteIdentity');
   const identity=JSON.parse(identityNode?.textContent||'null');
   if(!identity||typeof identity.make!=='string'||typeof identity.model!=='string'||
      !Number.isInteger(identity.model_id)||identity.model_id<=0||
      (wantMake&&normalize(wantMake)!==normalize(identity.make))||
      (wantModel&&normalize(wantModel)!==normalize(identity.model)))
    throw Error('Permanent model route identity invalid');
   wantMake=identity.make;wantModel=identity.model;
   permanentRouteModelId=identity.model_id;
   approvedDedicatedRoute=location.pathname;
  }catch(error){
   console.warn('Permanent model route rejected',error);
   wantMake='';wantModel='';
  }
 }

// A dedicated page can adopt this exact renderer in a later approved migration
// without duplicating the template or guessing an identity from its URL slug.
// The checked-in reviewed route map supplies both make and exact model name.
if(/^\/(?:bmw|harley-davidson)-[a-z0-9-]+\.html$/.test(location.pathname)){
 try{
  const response=await fetch('/data/approved-dedicated-model-routes.json',{cache:'no-cache'});
  if(!response.ok)throw Error('Reviewed dedicated route map unavailable');
  const data=await response.json();
  const identity=resolveApprovedV2Identity(location.pathname,data?.models);
  if(!identity)throw Error('Dedicated route not uniquely approved');
  // Never allow a conflicting query string to override a reviewed route.
  if((wantMake&&normalize(wantMake)!==normalize(identity.make))||
     (wantModel&&normalize(wantModel)!==normalize(identity.model)))
   throw Error('Dedicated model route/query conflict');
  wantMake=identity.make;wantModel=identity.model;
  approvedDedicatedRoute=identity.url;
 }catch(error){
  console.warn('V2 dedicated route identity rejected',error);
  wantMake='';wantModel='';
 }
}
// Preserve reviewed public alias links from the established general model route.
// A known alias redirects to one explicitly named published identity; there
// is no fuzzy matching and the destination still passes the public catalogue.
if(location.pathname==='/motorcycle-model-guide.html'&&wantMake&&wantModel){
 const aliases={
  'aprilia|rs660':['Aprilia','RS 660'],
  'bmw|ce 02 am 7.9% apr representative':['BMW','CE 02 AM'],
  'bmw|k 1600 b grand america':['BMW','K 1600 Grand America'],
  'indian|scout':['Indian Motorcycle','Scout'],
  'indian|scout bobber':['Indian Motorcycle','Scout Bobber'],
  'kawasaki|z900rs':['Kawasaki','Z900 RS']
 };
 const alias=aliases[wantMake.toLowerCase()+'|'+wantModel.toLowerCase()];
 const targetMake=alias?.[0]||wantMake,targetModel=alias?.[1]||wantModel;
 // Keep the one approved HTML shell: resolve old query routes here, not in
 // a second inline page script. Match ONLY the published permanent manifest.
 try{
  const response=await fetch('/data/universal-v2-model-routes.json',{cache:'no-cache'});
  if(response.ok){
   const manifest=await response.json();
   const routes=arr(manifest.models).filter(row=>
    normalize(row.make)===normalize(targetMake)&&normalize(row.model)===normalize(targetModel)&&
    /^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/.test(row.url||''));
   if(routes.length===1){
    const destination=new URL(routes[0].url,location.origin);
    for(const [key,value] of params)if(key!=='make'&&key!=='model')destination.searchParams.append(key,value);
    destination.hash=location.hash;
    location.replace(destination.href);
   }else if(alias){
    location.replace('/motorcycle-model-guide.html?make='+encodeURIComponent(targetMake)+
     '&model='+encodeURIComponent(targetModel)+location.hash);
   }
  }
 }catch(error){console.warn('Permanent model route unavailable',error)}
}

const done=()=>{
 window.__anybikeV2EditorialReady=true;
 window.dispatchEvent(new Event('anybike:v2-editorial-ready'));
};
if(!wantMake||!wantModel||wantMake.length>90||wantModel.length>120){
 showError('Explore motorcycle manufacturers and choose a model to view its researched specifications.');
 const browse=node('a','Browse all motorcycle manufacturers →');
 browse.href='/motorcycle-manufacturers.html';
 browse.style.cssText='display:inline-block;margin-top:10px;color:#fff;text-decoration:underline;text-decoration-color:var(--model-accent)';
 $('previewStatusError').append(browse);
 // Notify the shared navigation loader that there is no valid model identity.
 // It must not wait forever or fabricate model-specific links.
 done();
}else{
 try{
  const client=window.supabase?.createClient?.(ENDPOINT,KEY);
  // The live public Supabase catalogue is authoritative. The site JSON is
  // only an offline/network fallback, never an alternative model template.
  let candidates=[],liveCatalogueLoaded=false;
  if(client){
   try{
    const {data,error}=await client.rpc('public_anybike_manufacturer_catalogue_names_v1',{p_make:wantMake});
    if(error)throw error;
    if(!Array.isArray(data))throw Error('Unexpected catalogue response');
    candidates=data;liveCatalogueLoaded=true;
   }catch(e){console.warn('Supabase JS catalogue request unavailable',e)}
  }
  if(!liveCatalogueLoaded){
   try{
    candidates=await publicCatalogueRpc(wantMake);
    liveCatalogueLoaded=true;
   }catch(e){console.warn('Read-only public catalogue unavailable',e)}
  }
  // The checked-in catalogue is for network outages only; an empty successful
  // live response is authoritative and must not be replaced with stale names.
  if(!liveCatalogueLoaded){
   const response=await fetch('/data/motorcycle-catalogue-master.json',{cache:'no-cache'});
   if(!response.ok)throw Error('Published motorcycle catalogue unavailable');
   const catalogue=await response.json();
   candidates=arr(catalogue.models);
  }
  let found=candidates.filter(row=>normalize(row.make)===normalize(wantMake)&&normalize(row.model)===normalize(wantModel));
  // The public dropdown deliberately excludes aliases and names pending review.
  // Their already-published permanent SEO URLs still need the SAME V2 shell.
  // Resolve ONLY an exact embedded ID+make+model+pathname match against the
  // immutable 978-route publication manifest. Never use it to publish facts.
  if(found.length!==1&&permanentRouteModelId!==null){
   const response=await fetch('/data/universal-v2-model-routes.json',{cache:'no-cache'});
   if(!response.ok)throw Error('Published permanent model identity unavailable');
   const manifest=await response.json();
   const exact=arr(manifest.models).filter(row=>
    row.url===location.pathname&&Number(row.model_id)===permanentRouteModelId&&
    normalize(row.make)===normalize(wantMake)&&normalize(row.model)===normalize(wantModel));
   if(exact.length===1)found=exact;
  }
  if(found.length!==1)throw Error('No unique published model matches that make and model.');
  const selected=found[0],make=str(selected.make),model=str(selected.model),title=make+' '+model;
  // SINGLE V2 TEMPLATE: only the manufacturer accent changes, not layout.
  // Apply exclusively after exact published catalogue identity verification.
  document.documentElement.dataset.anybikeModelBrand=
   normalize(make)==='harley davidson'?'harley-davidson':'anybike';
  const canonicalId=Number(selected.model_id||selected.catalogue_model_id);
   if(permanentRouteModelId!==null&&canonicalId!==permanentRouteModelId)
    throw Error('Permanent route catalogue ID mismatch');
  const hasCanonicalId=Number.isSafeInteger(canonicalId)&&canonicalId>0;
  const enquiry='/bulk-buying-request.html?make='+encodeURIComponent(make)+'&model='+encodeURIComponent(model);
  const manufacturer=normalize(make)==='bmw'?'/bmw-motorcycles.html':
   normalize(make)==='harley davidson'?'/harley-davidson-motorcycles.html':
   '/motorcycle-brand.html?make='+encodeURIComponent(make);
  // Access is read-only and subject to the table's existing publication RLS.
  // Filtering on both JSONB identity fields prevents cross-model leakage.
  let guide=null,publishedV2Editorial=false;
  if(client){
   try{
    // Editorial must match the canonical catalogue ID, not merely similarly
    // spelt make/model fields. When no ID is available, show verified facts only.
    if(hasCanonicalId){
     const {data,error}=await client.from('motorcycle_model_v2_editorial')
      .select('model_id,slug,editorial').eq('preview_visible',true)
      .eq('model_id',canonicalId)
      .eq('editorial->>make',make).eq('editorial->>model',model).limit(1).maybeSingle();
     if(!error&&data?.editorial&&Number(data.model_id)===canonicalId&&
        normalize(data.editorial.make)===normalize(make)&&
        normalize(data.editorial.model)===normalize(model)){
          guide=data.editorial;publishedV2Editorial=true;
        }
     if(error)console.warn('V2 editorial not available for this identity; verified facts remain',error);
    }
   }catch(e){console.warn('V2 editorial lookup unavailable',e);}
  }
  // The published V2 editorial is also readable through the public RLS
  // projection when the optional Supabase JS browser library is unavailable.
  // The database decides which models' editorial is public; this never
  // falls back to private drafts, admin credentials or preview-only flags.
  if(!guide&&hasCanonicalId){
   try{
    const url=new URL('/rest/v1/motorcycle_model_v2_editorial',ENDPOINT);
    url.searchParams.set('select','model_id,slug,editorial');
    url.searchParams.set('preview_visible','eq.true');
    url.searchParams.set('model_id','eq.'+canonicalId);
    url.searchParams.set('editorial->>make','eq.'+make);
    url.searchParams.set('editorial->>model','eq.'+model);
    url.searchParams.set('limit','2');
    const response=await fetch(url,{headers:{apikey:KEY},cache:'no-store'});
    if(response.ok){
     const rows=await response.json();
     if(Array.isArray(rows)&&rows.length===1&&
        Number(rows[0].model_id)===canonicalId&&
        normalize(rows[0].editorial?.make)===normalize(make)&&
        normalize(rows[0].editorial?.model)===normalize(model)){
      guide=rows[0].editorial;publishedV2Editorial=true;
     }
    }
   }catch(error){
    console.warn('Public RLS-approved V2 editorial REST fallback unavailable',error);
   }
  }
  // The public legacy guide is identity-filtered before use. If a reviewed V2
  // editorial already exists, source-backed historical rows only fill empty
  // facts slots; the approved V2 narrative and model identity win.
  try{
   const response=await fetch('/data/motorcycle-model-guides.json',{cache:'no-cache'});
   if(response.ok){
    const publicGuides=await response.json();
    const exact=Object.values(publicGuides?.models||{}).filter(record=>
     record&&normalize(record.make)===normalize(make)&&
     normalize(record.model)===normalize(model));
    if(exact.length===1){
     if(!guide)guide=exact[0];
     else{
      const {supplementPublishedV2Guide}=await import('/model-template/approved-v2-published-guide-supplements.mjs');
      guide=supplementPublishedV2Guide(guide,exact[0],{make,model});
     }
    }
   }
  }catch(error){
   console.warn('Previously published model guide unavailable; V2 research continues',error);
  }
  // Previously published BMW history is an existing public database source.
  // Only approved dedicated BMW routes may consult it. The bridge validates
  // the returned identity and rejects unreferenced generations.
  if(approvedDedicatedRoute&&normalize(make)==='bmw'&&client){
   try{
    const {data,error}=await client.rpc('public_bmw_model_history_v1',{
     requested_path:approvedDedicatedRoute
    });
    if(error)throw error;
    const {mergeApprovedBmwHistory}=await import('/model-template/approved-v2-bmw-history-bridge.mjs');
    guide=mergeApprovedBmwHistory(guide,data,{make,model,approvedRoute:approvedDedicatedRoute,preferExisting:publishedV2Editorial});
   }catch(error){
    console.warn('Optional exact-route BMW history unavailable; retaining existing V2 research',error);
   }
  }
  // Previously published content from approved dedicated model routes is
  // displayed through the same V2 layout, never as unverified factory facts.
  let preservedExistingPhoto=null;
  if(approvedDedicatedRoute&&(normalize(make)==='harley davidson'||
     (normalize(make)==='bmw'&&normalize(model)==='r 1250 gs'))){
   try{
    const archivePath=normalize(make)==='bmw'?
     '/data/bmw-r1250gs-v2-preservation.json':'/data/harley-v2-legacy-preservation.json';
    const response=await fetch(archivePath,{cache:'no-cache'});
    if(!response.ok)throw Error('Preserved public research unavailable');
    const archive=await response.json();
    const row=normalize(make)==='bmw'?archive:(()=>{
     const entry=arr(archive.models).find(record=>
      record.url===approvedDedicatedRoute&&
      normalize(record.make)===normalize(make)&&
      normalize(record.model)===normalize(model));
     return entry?{...entry,publication_status:archive.publication_status}:null;
    })();
    const {preserveDedicatedModelResearch,preservedExistingHero}=
     await import('/model-template/approved-v2-dedicated-preservation.mjs?v=20261113-r1250-merge2');
    guide=preserveDedicatedModelResearch(guide,row,{make,model,url:approvedDedicatedRoute});
    preservedExistingPhoto=preservedExistingHero(row,{make,model,url:approvedDedicatedRoute});
   }catch(error){
    console.warn('Preserved legacy model evidence unavailable; approved V2 continues',error);
   }
  }
  window.__anybikeV2ModelIdentity=Object.freeze({make,model});
  window.__anybikeV2Editorial=guide;
  window.dispatchEvent(new Event('anybike:v2-model-identity-ready'));

  // Shared indexable metadata: where an existing approved canonical
  // public model route exists, keep it as the preferred URL. Otherwise the
  // unique make/model master URL is its own canonical. Never use an editorial
  // draft's unapproved canonical metadata or cross-model URLs.
  const pageTitle=title+' | Motorcycle History & Specifications | AnyBike';
  const description=str(guide?.page_metadata?.description)||
   'Explore '+title+' motorcycle model information, available verified research and UK sourcing options with AnyBike.';
  // Keep the existing indexed generic URL when rendering the SAME V2 master
  // at its established route; retain approved dedicated BMW/Harley canonicals.
  const canonicalPath=approvedDedicatedRoute||
   (location.pathname==='/motorcycle-model-guide.html'?
    '/motorcycle-model-guide.html':'/motorcycle-v2-master.html');
  const masterUrl=approvedDedicatedRoute?
   new URL(approvedDedicatedRoute,location.origin):
   new URL(canonicalPath+'?make='+
    encodeURIComponent(make)+'&model='+encodeURIComponent(model),location.origin);
  let canonical=masterUrl.href;
  // The permanent catalogue URL is canonical for generic/query-string
  // routes. Existing reviewed dedicated BMW/Harley URLs still win below.
  if(!approvedDedicatedRoute){
   try{
    const response=await fetch('/data/universal-v2-model-routes.json',{cache:'no-cache'});
    if(response.ok){
     const manifest=await response.json();
     const matches=arr(manifest?.models).filter(row=>
      Number(row.model_id)===canonicalId&&
      normalize(row.make)===normalize(make)&&normalize(row.model)===normalize(model)&&
      /^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/.test(String(row.url||'')));
     if(matches.length===1)canonical=new URL(matches[0].url,location.origin).href;
    }
   }catch(error){console.warn('Permanent model canonical unavailable',error);}
  }

  try{
   let routes=null;
   if(client){
    try{
     const {data,error}=await client.rpc('public_anybike_manufacturer_model_routes_v1',{p_make:make});
     if(error)throw error;
     if(Array.isArray(data))routes=data;
    }catch(error){console.warn('Supabase JS canonical routes unavailable',error);}
   }
   if(!routes){
    const response=await fetch(ENDPOINT+'/rest/v1/rpc/public_anybike_manufacturer_model_routes_v1',{
     method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},
     body:JSON.stringify({p_make:make}),cache:'no-store'
    });
    if(response.ok){
     const data=await response.json();
     if(Array.isArray(data))routes=data;
    }
   }
   if(routes){
    const exact=routes.filter(item=>normalize(item.make)===normalize(make)&&
     normalize(item.model)===normalize(model)&&
     /^\/(?:bmw|harley-davidson)-[a-z0-9-]+\.html$/.test(String(item.url||'')));
    if(!approvedDedicatedRoute&&exact.length===1)canonical=new URL(exact[0].url,location.origin).href;
   }
  }catch(e){console.warn('Canonical published route lookup unavailable',e)}
  // Existing approved BMW/Harley model URLs retain SEO priority even when
  // a new universal /models/ route also serves the same motorcycle.
  if(permanentRouteModelId!==null){
   try{
    const response=await fetch('/data/approved-dedicated-model-routes.json',{cache:'no-cache'});
    if(response.ok){
     const dedicated=await response.json();
     const exact=arr(dedicated?.models).filter(row=>
      normalize(row.make)===normalize(make)&&normalize(row.model)===normalize(model)&&
      /^\/(?:bmw|harley-davidson)-[a-z0-9-]+\.html$/.test(String(row.url||'')));
     if(exact.length===1)canonical=new URL(exact[0].url,location.origin).href;
    }
   }catch(error){console.warn('Existing model canonical unavailable',error);}
  }
  document.title=pageTitle;
  const setMeta=(selector,value)=>{
   const item=document.querySelector(selector);
   if(item)item.setAttribute('content',value);
  };
  setMeta('meta[name="description"]',description);
  setMeta('meta[property="og:title"]',pageTitle);
  setMeta('meta[property="og:description"]',description);
  setMeta('meta[property="og:url"]',canonical);
  setMeta('meta[name="twitter:title"]',pageTitle);
  setMeta('meta[name="twitter:description"]',description);
  const canonicalNode=$('modelCanonical');if(canonicalNode)canonicalNode.href=canonical;
  const schemaNode=$('modelStructuredData');
  if(schemaNode)schemaNode.textContent=JSON.stringify({
   '@context':'https://schema.org','@type':'WebPage',
   name:pageTitle,description,url:canonical,
   isPartOf:{'@type':'WebSite',name:'AnyBike',url:'https://www.anybike.co.uk/'},
   about:{'@type':'Motorcycle',name:title,brand:{'@type':'Brand',name:make}}
  });
  $('heading').textContent=title;
  // "Other" is an internal catch-all, not a useful public motorcycle type.
  // The single canonical catalogue taxonomy is authoritative for every model.
  // Editorial may fill a missing category but must never override the shared
  // catalogue classification with a stale legacy value.
  const categoryCandidates=[str(selected.motorcycle_type),str(selected.category),str(guide?.page_metadata?.category)];
  const approvedCategory=categoryCandidates.find(value=>value&&!/^(other|unknown|uncategorised|uncategorized|n\/a)$/i.test(value));
  $('category').textContent=approvedCategory||'Motorcycle model';
  const summary=$('summary');summary.replaceChildren();
  const hero=guide?.hero||{};
  if(arr(hero.paragraphs).length)arr(hero.paragraphs).forEach(x=>paragraph(summary,x));
  else paragraph(summary,str(guide?.summary)||'Explore '+title+' motorcycle information and any verified model-year research available. Specifications and availability vary by year and market.');
  $('years').textContent=str(hero.years)||str(guide?.years)||'Source-verified specifications vary by model year and market.';
  $('source').href=enquiry;
  // The master uses the existing approved manufacturer routes, rather
  // than sending every brand's model page to the generic A–Z directory.
  const manufacturerAction=$('manufacturer');
  if(manufacturerAction){
   manufacturerAction.href=manufacturer;
   manufacturerAction.textContent='Explore '+make+' motorcycles →';
  }
  // A UK visitor does not need an international export-stock message.
  // Resolve once, in parallel with the existing model and stock requests.
  const ukPresentationPromise=isConfirmedUkVisitor();
  // Place exact-model stock before slower photography and research requests.
  // The loading text does not claim availability or bypass buyer permissions.
  const header=document.querySelector('main > .hero'),stock=$('internationalModelStock');
  if(header&&stock)header.after(stock);
  const stockTitle=stock.querySelector('h2'),stockIntro=stock.querySelector('p');
  stockTitle.textContent=title+' motorcycles available internationally';
  stockIntro.textContent='Only confirmed, published motorcycles matching this exact model are displayed. Ask AnyBike to source other years or specifications.';
  const cards=$('internationalModelCards');
  cards.replaceChildren(node('p','Checking permitted exact-model stock…'));
  stock.dataset.stockFeedState='checking';
  // Keep hidden while audience and authorised stock resolve, avoiding
  // an international-only panel flashing briefly in the UK view.
  // Forms must work even while slow research and photography are still loading.
  // Guest requests do not depend on a successful optional login check.
  const optionalVisitorToken=async()=>{
   try{
    const session=await client?.auth?.getSession?.();
    return typeof session?.data?.session?.access_token==='string'?session.data.session.access_token:null;
   }catch(error){console.warn('Optional visitor session unavailable; continuing as guest');return null;}
  };
  const form=$('internationalGuestRequestForm'),status=$('internationalGuestRequestStatus');
  $('internationalGuestRequest').querySelector('h2').textContent='Enquire about a '+title;
  $('internationalGuestRequest').querySelector('p').textContent='International buyers can enquire without creating an account.';
  const labels={name:'Full name',email:'Email address',country:'Country',phone:'Phone / WhatsApp (optional)',kind:'Request type',message:'Your message'};
  for(const [key,value] of Object.entries(labels)){
   const n=form.querySelector('[data-form-label="'+key+'"]');if(n)n.textContent=value;
  }
  const placeholder={name:'Full name',email:'Email address',country:'Country',phone:'Phone / WhatsApp',message:'Year, specification, budget and your question'};
  for(const [key,value] of Object.entries(placeholder)){
   const n=form.querySelector('[data-form-placeholder="'+key+'"]');if(n)n.placeholder=value;
  }
  for(const option of form.querySelectorAll('select[name="kind"] option'))option.textContent=option.value;
  $('v2FormSubmit').textContent='Send enquiry →';
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   const button=$('v2FormSubmit');button.disabled=true;status.textContent='Sending enquiry…';
   try{
    const values=Object.fromEntries(new FormData(form).entries());
    if(!str(values.name)||!str(values.email)||!str(values.country)||str(values.message).length<5)throw Error('Please complete your name, email, country and message.');
    const token=await optionalVisitorToken();
    const res=await fetch(ENDPOINT+'/functions/v1/international-guest-enquiry',{
     method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
     body:JSON.stringify({...values,make,model,page:location.href})
    });
    const reply=await res.json().catch(()=>null);
    if(!res.ok||!reply?.ok)throw Error(typeof reply?.error==='string'?reply.error:'Could not confirm enquiry delivery. Please retry or contact AnyBike.');
    status.textContent='Your enquiry has been received'+(reply.reference?' · Reference '+reply.reference:'')+'.';
    form.reset();
   }catch(e){status.textContent=e.message||'Could not send enquiry';}
   finally{button.disabled=false;}
  });
  const fig=$('databaseHeroPhoto');
  // Rights-checked photography comes from one approved photo-bank RPC,
  // not image names, model guesses or manufacturer press hotlinks.
  let approvedHero=null,approvedGallery=[];
  // A browser-bundle failure must not suppress authorised, rights-checked
  // public media. Both RPCs apply their existing database publication checks.
  const publicMedia=async name=>{
   if(!['public_anybike_model_hero_v1','public_anybike_verified_model_gallery_v1'].includes(name))
    throw Error('Unapproved media RPC');
   const response=await fetch(ENDPOINT+'/rest/v1/rpc/'+name,{
    method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},
    body:JSON.stringify({p_make:make,p_model:model}),cache:'no-store'
   });
   if(!response.ok)throw Error('Public media HTTP '+response.status);
   return response.json();
  };
  const photoData=async name=>{
   if(client){
    try{
     const result=await client.rpc(name,{p_make:make,p_model:model});
     if(!result.error)return result.data;
    }catch(error){console.warn('Supabase JS media request failed',error);}
   }
   return publicMedia(name);
  };
  const [heroResult,galleryResult]=await Promise.allSettled([
   photoData('public_anybike_model_hero_v1'),
   photoData('public_anybike_verified_model_gallery_v1')
  ]);
  if(heroResult.status==='fulfilled')approvedHero=heroResult.value;
  if(galleryResult.status==='fulfilled')approvedGallery=arr(galleryResult.value);
  const safePhoto=x=>x&&normalize(x.make)===normalize(make)&&
   normalize(x.model)===normalize(model)&&validURL(x.image_url)&&
   validURL(x.source_page_url)&&validURL(x.licence_url)&&
   str(x.attribution)&&str(x.licence);
  // Always prefer a rights-checked photograph of THIS exact model.
  // A valid licensed exact-model gallery photograph may fill the hero slot
  // when the dedicated hero RPC has no image. Never use another motorcycle.
  if(!safePhoto(approvedHero)){
   const fullBike=arr(approvedGallery).filter(photo=>safePhoto(photo)&&str(photo.subject_category)==='whole_motorcycle').sort((a,b)=>{
    const detail=x=>/\b(?:engine|motor|detail|close.up|instrument|exhaust)\b/i.test(str(x.title));
    return Number(detail(a))-Number(detail(b));
   });
   if(fullBike.length)approvedHero=fullBike[0];
  }
  // Existing attributed exact-model research photos are a final photo fallback.
  if(!safePhoto(approvedHero)&&safePhoto(preservedExistingPhoto)&&
   str(preservedExistingPhoto.subject_category)==='whole_motorcycle')
   approvedHero=preservedExistingPhoto;
  // Explicitly registered manufacturer marks only; no fuzzy lookup or
  // inferred logo from an arbitrary brand's name. The same registry serves
  // every model of that manufacturer. Logos are NOT motorcycle photographs.
  const registeredManufacturerLogos=Object.freeze({
   vespa:'https://commons.wikimedia.org/wiki/Special:FilePath/Vespa-logo.svg',
   piaggio:'https://commons.wikimedia.org/wiki/Special:FilePath/Piaggio_Group_logo.svg',
   'indian motorcycle':'https://commons.wikimedia.org/wiki/Special:FilePath/Indian_Motorcycle_logo.svg',
   husqvarna:'https://commons.wikimedia.org/wiki/Special:FilePath/Husqvarna_Logo.png',
   triumph:'https://commons.wikimedia.org/wiki/Special:FilePath/Logo_Triumph.svg',
   aprilia:'https://commons.wikimedia.org/wiki/Special:FilePath/Aprilia-logo.svg',
   'royal enfield':'https://commons.wikimedia.org/wiki/Special:FilePath/Royal_Enfield_logo.svg',
   kawasaki:'https://commons.wikimedia.org/wiki/Special:FilePath/Kawasaki_Motors_logo.svg',
   suzuki:'https://commons.wikimedia.org/wiki/Special:FilePath/Suzuki_Motor_Corporation_logo.svg',
   ktm:'https://commons.wikimedia.org/wiki/Special:FilePath/KTM-Logo.svg',
   honda:'https://global.honda/content/dam/site/global-en/newsroom-new/cq_img/news/2025/11/c251104beng/c251104beng_01.jpg',
   bmw:'https://commons.wikimedia.org/wiki/Special:FilePath/BMW.svg',
   ducati:'https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20ducati.png',
   'harley davidson':'https://commons.wikimedia.org/wiki/Special:FilePath/Harley%20Davidson%20orange%20logo.svg',
   'yamaha':'https://commons.wikimedia.org/wiki/Special:FilePath/Yamaha%20Motor%202025.svg'
  });
  const showRegisteredLogo=()=>{
   if(!fig)return;
   const registeredLogo=registeredManufacturerLogos[normalize(make)];
   if(!registeredLogo){fig.hidden=true;fig.dataset.anybikeHeroType='unavailable';return;}
   if(registeredLogo){
    const img=fig.querySelector('img');
    img.alt=make+' manufacturer logo';
    img.style.objectFit='contain';
    // Manufacturer marks with black/transparent artwork must remain legible
    // on the shared charcoal V2 hero without altering real motorcycle photos.
    img.style.backgroundColor='#fff';
    img.style.padding='12px';
    img.style.boxSizing='border-box';
    const caption=fig.querySelector('figcaption');
    caption.textContent=make+' manufacturer logo';
    fig.dataset.anybikeHeroType='manufacturer-logo';
    img.onerror=()=>{fig.hidden=true;fig.dataset.anybikeHeroType='unavailable'};
    fig.hidden=false;
    img.src=registeredLogo;
   }
  };
  if(fig&&safePhoto(approvedHero)){
   // Share/preview images are added only when the same exact-model photo
   // passed the central image rights and identity checks.
   let openGraphPhoto=document.querySelector('meta[property="og:image"]');
   if(!openGraphPhoto){
    openGraphPhoto=document.createElement('meta');
    openGraphPhoto.setAttribute('property','og:image');
    document.head.append(openGraphPhoto);
   }
   openGraphPhoto.content=approvedHero.image_url;
   const img=fig.querySelector('img');
   img.onerror=showRegisteredLogo;
   img.alt=str(approvedHero.title)||title+' motorcycle';
   const caption=fig.querySelector('figcaption');
   caption.textContent=str(approvedHero.attribution)+' · ';
   sourceLink(caption,approvedHero.source_page_url,'Photograph attribution ↗');
   sourceLink(caption,approvedHero.licence_url,' · Licence ↗');
   fig.dataset.anybikeHeroType='photograph';
   fig.hidden=false;
   img.src=approvedHero.image_url;
  }else if(fig){showRegisteredLogo();}
  // Never repeat the hero as a gallery card or display the same image twice.
  const galleryUrls=new Set(safePhoto(approvedHero)?[approvedHero.image_url]:[]);
  const galleryItems=approvedGallery.filter(photo=>{
   if(!safePhoto(photo)||galleryUrls.has(photo.image_url))return false;
   galleryUrls.add(photo.image_url);return true;
  });
  // Prefer licensed whole-bike images; engine close-ups stay in the gallery.
  galleryItems.sort((a,b)=>{
   const detail=x=>/\b(?:engine|motor|detail|close.up|instrument|exhaust)\b/i.test(str(x.title));
   return Number(detail(a))-Number(detail(b));
  });
  if(galleryItems.length){
   // Use the same approved BMW model-gallery position on every manufacturer.
   // Never add a second gallery after stock or display rights-only metadata.
   const gallerySection=$('ukR1300ModelGallery');
   gallerySection.hidden=false;
   gallerySection.replaceChildren(node('h2','Approved '+title+' photographs'));
   const holder=node('div',undefined,'v2-documentary-grid');
   for(const picture of galleryItems){
    const article=node('article');
    const image=node('img');image.src=picture.image_url;image.loading='lazy';
    image.decoding='async';image.alt=str(picture.title)||title+' documented motorcycle detail';
    image.style.cssText='width:100%;height:190px;object-fit:contain;background:#1a1a1a;border-radius:8px';
    article.append(image,node('h4',str(picture.title)||title+' photograph'));
    const from=picture.model_year_start,to=picture.model_year_end;
    const startYear=from!==null&&from!==undefined?String(from).trim():'';
    const endYear=to!==null&&to!==undefined?String(to).trim():'';
    const period=startYear&&endYear&&startYear!==endYear?
     startYear+'–'+endYear:(startYear||endYear);
    paragraph(article,period);
    const attribution=str(picture.attribution),licence=str(picture.licence);
    paragraph(article,[attribution,
      licence&&!attribution.toLowerCase().includes(licence.toLowerCase())?licence:''
    ].filter(Boolean).join(' · '));
    sourceLink(article,picture.source_page_url,'Original photograph ↗');
    holder.append(article);
   }
   gallerySection.append(holder);
  }
  // The approved V2 shell now places development as a real main-level
  // section outside Available Stock. Model years are inserted before it.
  // Keep this one layout for BMW, Harley and every other manufacturer.
  const development=$('r1300gsModelHistory'),timeline=$('r1300V2VerifiedExtras');
  if(development){
   development.hidden=true;
   development.querySelector('h3').textContent=title+' — development and ownership';
  }
  $('sourceBottom').href=enquiry;
  $('sourceBottom').textContent='Ask AnyBike to source '+title+' →';
  $('nextAction').querySelector('h2').textContent='Looking for a '+title+'?';
  $('nextAction').querySelector('p').textContent='Tell AnyBike your year, specification, mileage and budget. We can help with UK sourcing enquiries.';
  $('v2UkSellAction').href='/sell-your-motorcycle.html?make='+encodeURIComponent(make)+'&model='+encodeURIComponent(model);
  $('v2UkSellAction').textContent='Sell my '+title+' →';
  $('v2UkSelling').querySelector('h2').textContent='UK owners: Sell My '+title;
  $('v2UkSelling').querySelectorAll('p')[0].textContent='Tell AnyBike about your motorcycle and submit photographs for review.';
  $('v2UkSelling').querySelectorAll('p')[1].textContent='There is no guaranteed offer or obligation to sell.';
  // Pair the two buyer/seller calls to action near the enquiry, not the
  // specifications. Reuse the existing panels and their working links.
  const sellPanel=$('v2UkSelling'),buyPanel=$('nextAction');
  const enquiryPanel=$('internationalGuestRequest');
  if(sellPanel&&buyPanel&&enquiryPanel){
   let pair=$('anybikeV2BuySellPair');
   if(!pair){
    pair=node('div',undefined,'anybike-v2-buy-sell-pair');
    pair.id='anybikeV2BuySellPair';
   }
   enquiryPanel.before(pair);
   pair.append(buyPanel,sellPanel);
  }
  $('r1300CountryMarkets').querySelector('h2').textContent='Explore the '+title+' worldwide';
  $('r1300CountryMarkets').querySelector('p:not(.eyebrow)').textContent='Explore international motorcycle markets. A country link does not indicate exact-model stock.';
  // Optional editorial sections: no empty cards.
  const production=guide?.production||{};
  const generations=arr(production.generations).filter(x=>str(x.label)&&validURL(x.source));
  if(generations.length){
   const gen=$('generationPanel');gen.hidden=false;
   gen.querySelector('h2').textContent='Documented '+title+' generations';
   const controls=$('generationControls'),detail=$('generationDetail');
   controls.replaceChildren();detail.replaceChildren();
   const renderGeneration=(g,index)=>{
    [...controls.children].forEach((btn,i)=>btn.setAttribute('aria-pressed',String(index===i)));
    detail.replaceChildren(node('h3',g.label));
    paragraph(detail,g.description);
    const metrics=[['Model year',g.model_year],['Engine',g.engine_cc?g.engine_cc+' cc':null],
     ['Power',g.power_hp?g.power_hp+' hp':null],['Torque',g.torque_nm?g.torque_nm+' Nm':null],
     ['Transmission',g.transmission],['Type',g.body_type]];
    const facts=node('div',undefined,'generation-specs');
    metrics.filter(([,v])=>v!==null&&v!==undefined&&String(v).trim()).forEach(([k,v])=>facts.append(node('span',k+': '+v)));
    detail.append(facts);sourceLink(detail,g.source,'Manufacturer technical reference ↗');
    sourceLink(detail,g.official_photo_gallery_url,'View manufacturer photographs ↗');
   };
   generations.forEach((g,i)=>{
    const btn=node('button',str(g.label)||'Version '+(i+1));btn.type='button';
    btn.addEventListener('click',()=>renderGeneration(g,i));controls.append(btn);
   });
   renderGeneration(generations[0],0);
  }
  // The published historical guide has source-audited milestones. Use them
  // only when the approved V2 editorial has not supplied its own timeline.
  // Never promote unsourced generation_milestones labelled 'pending'.
  const documentedMilestones=arr(production.documented_milestones).filter(x=>
   (Number.isInteger(x?.year)||/^\\d{4}$/.test(str(x?.year)))&&
   str(x?.event)&&validURL(x?.source))
   .map(x=>({period:String(x.year),description:x.event,source:x.source}));
  const authoredTimeline=arr(guide?.model_year_timeline).filter(x=>str(x.period)&&str(x.description));
  const events=authoredTimeline.length?authoredTimeline:documentedMilestones;
  if(events.length){
   const section=$('r1300V2VerifiedExtras');section.hidden=false;
   section.querySelector('h2').textContent='Model-year development timeline';
   section.querySelector('.r1300-v2-extra-head p').textContent='Documented model-year changes and production milestones.';
   section.querySelector('summary span').textContent='Model-year timeline';
   const list=$('databaseModelTimeline');list.replaceChildren();
   events.forEach(e=>{
    const p=node('p');p.append(node('strong',e.period+': '),document.createTextNode(e.description));
    if(validURL(e.source)){p.append(document.createTextNode(' · '));sourceLink(p,e.source,'Manufacturer reference ↗');}
    list.append(p);
   });
   sourceLink(list,guide?.model_year_timeline_reference?.url,guide?.model_year_timeline_reference?.label);
  }
  // Chronological documentary model-year cards; unknown periods keep input order.
  const yearCards=arr(guide?.model_year_cards).filter(x=>str(x.period)&&str(x.description))
   .map((card,index)=>({card,index,year:Number(str(card.period).match(/(?:18|19|20)\d{2}/)?.[0]||0)}))
   .sort((a,b)=>(a.year||9999)-(b.year||9999)||a.index-b.index)
   .map(x=>x.card);
  const devCards=arr(guide?.development_cards).filter(x=>str(x.title)&&str(x.description));
  if(development&&(yearCards.length||devCards.length)){
   development.hidden=false;
   const years=makeSection('v2GenericModelYears','Model years & editions',development);
   // The approved BMW R 1300 GS reading order places model years and
   // editions before the broader development and ownership stories.
   // Reuse one shared section for every make; no per-model markup variants.
   development.before(years);
   years.querySelector('h2').textContent=title+' — model years and editions';
   const container=node('div',undefined,'v2-model-year-cards');
   for(const c of yearCards){
    // The generations panel already holds the identical dated account,
    // including its source. Don't show a heading-only copy.
    const duplicated=generations.some(g=>
      normalize(g.description)===normalize(c.description)&&
      normalize(g.label)===normalize(c.period));
    if(duplicated)continue;
    const article=node('article');
    article.append(node('h4',c.period));
    paragraph(article,c.description);
    sourceLink(article,c.source,'Manufacturer reference ↗');
    container.append(article);
   }
   if(container.children.length)years.append(container);else years.remove();
   for(const group of ['engineering','buying']){
    const target=development.querySelector('[data-model-card-group="'+group+'"]');
    if(!target)continue;
    target.replaceChildren();
    for(const c of devCards.filter(x=>x.category===group)){
     const article=node('article');
     article.append(node('strong',c.title));paragraph(article,c.description);target.append(article);
    }
    const head=target.previousElementSibling;
    if(head)head.hidden=target.children.length===0;
   }
   // Preserve chronological year cards even when no separate development cards exist.
   if(!devCards.length&&!yearCards.length)development.hidden=true;
  }
  // The dated timeline is reference material, not a second prominent
  // research chapter. Keep every source-linked event in the DOM, but place
  // its closed disclosure with model years / development instead of above
  // the six-card ownership overview.
  if(timeline&&!timeline.hidden){
   const timelineDetails=timeline.querySelector('.r1300-v2-extra-grid > details');
   if(timelineDetails){
    timelineDetails.open=false;
    const summary=timelineDetails.querySelector('summary');
    if(summary){
     summary.replaceChildren(node('span','Explore the documented model-year timeline'));
    }
   }
   timeline.classList.add('anybike-v2-timeline-compact');
   const yearSection=$('v2GenericModelYears');
   if(yearSection){
    yearSection.append(timeline);
   }else if(development&&!development.hidden){
    development.append(timeline);
   }else{
    const generationsPanel=$('generationPanel');
    if(generationsPanel)generationsPanel.after(timeline);
   }
  }
  const dive=arr(guide?.deep_dive).filter(x=>str(x.title)&&arr(x.paragraphs).some(p=>str(p.text)||validURL(p.link?.[0])));
  if(dive.length){
   const section=$('r1300DeepDive');section.hidden=false;
   section.querySelector('h2').textContent='Factory, ownership & '+make+' history';
   const holder=$('databaseDeepDive');holder.replaceChildren();
   for(const part of dive){
    const details=node('details'),summary=node('summary',part.title+' — '+str(part.subtitle));
    const content=node('div',undefined,'r1300-deep-content');
    arr(part.paragraphs).forEach(x=>{
     if(str(x.text))paragraph(content,x.text);
     if(Array.isArray(x.link))sourceLink(content,x.link[0],x.link[1]);
    });
    details.append(summary,content);holder.append(details);
   }
  }
  // Factory colours and engineering rows are optional, attributed,
  // manufacturer/year-specific and never filled with guessed values.
  const colours=arr(production.official_colours).filter(x=>str(x.name)&&validURL(x.source));
  if(colours.length){
   const section=makeSection('v2FactoryColours','Factory colours & editions',$('body'));
   section.querySelector('h2').textContent='Factory colours & editions';
   const grid=node('div',undefined,'v2-documentary-grid');
   const sorted=[...colours].sort((a,b)=>Number(a.model_year||0)-Number(b.model_year||0));
   for(const colour of sorted){
    const card=node('article');
    card.append(node('h4',colour.name));
    paragraph(card,[colour.model_year,colour.variant].filter(Boolean).join(' · '));
    sourceLink(card,colour.source,'Factory colour reference ↗');grid.append(card);
   }
   section.append(grid);
  }
  const engineering=arr(guide?.engineering_reference?.rows).filter(x=>Array.isArray(x)&&x.length===2&&str(x[0])&&str(x[1]));
  if(engineering.length){
   const section=makeSection('v2EngineeringOverview','Engineering & technical overview',$('v2FactoryColours')||$('body'));
   const grid=node('div',undefined,'v2-documentary-grid');
   for(const [label,value] of engineering){
    const cell=node('article');cell.append(node('h4',label),node('p',value));grid.append(cell);
   }
   section.append(grid);
   sourceLink(section,guide?.engineering_reference?.source,'Manufacturer technical reference ↗');
  }
  // Year-and-market-specific factory specification records are already
  // published in the reviewed legacy guide. Keep them separate from general
  // engineering prose: figures from different model years must not be merged.
  const documentedSpecs=arr(production.specifications).filter(x=>
   x&&validURL(x.source)&&(Number.isInteger(x.model_year)||str(x.model_year))&&
   ['engine_cc','power_hp','torque_nm','transmission'].some(k=>x[k]!==null&&x[k]!==undefined&&String(x[k]).trim()))
   .map((spec,index)=>({spec,index,year:Number(spec.model_year)}))
   // Factory figures belong to their documented model year. Sort only years
   // we can parse, retain original source order for undated records, and
   // never combine separate market or edition specifications.
   .sort((a,b)=>(Number.isInteger(a.year)&&a.year>0?a.year:9999)-
                (Number.isInteger(b.year)&&b.year>0?b.year:9999)||a.index-b.index)
   .map(({spec})=>spec);
  if(documentedSpecs.length){
   const section=makeSection('v2DocumentedSpecifications','Documented specifications',$('v2EngineeringOverview')||$('v2FactoryColours')||$('body'));
   section.classList.add('anybike-v2-spec-highlights');
   const grid=node('div',undefined,'v2-documentary-grid');
   for(const spec of documentedSpecs){
    const article=node('article');
    article.classList.add('anybike-v2-spec-record');
    article.append(node('h4',[spec.model_year,str(spec.market)].filter(Boolean).join(' · ')));
    // Present manufacturer-documented figures as individual scan-friendly
    // specification tiles, preserving the exact model-year/market source.
    const metrics=node('dl',undefined,'anybike-v2-spec-metrics');
    const values=[
     ['Engine',spec.engine_cc,'cc'],['Power',spec.power_hp,'hp'],
     ['Torque',spec.torque_nm,'Nm'],['Transmission',str(spec.transmission),'']
    ];
    for(const [label,value,unit] of values){
     if(value===null||value===undefined||String(value).trim()==='')continue;
     if(typeof value==='number'&&(!Number.isFinite(value)||value<=0))continue;
     const tile=node('div',undefined,'anybike-v2-spec-metric');
     tile.append(node('dt',label));
     const shown=typeof value==='number'?value.toLocaleString('en-GB'):String(value);
     tile.append(node('dd',shown+(unit?' '+unit:'')));
     metrics.append(tile);
    }
    article.append(metrics);
    const source=node('div',undefined,'anybike-v2-spec-source');
    sourceLink(source,spec.source,'Factory specification source ↗');
    article.append(source);
    grid.append(article);
   }
   section.append(grid);
   // Approved sales-first sequence: the verified factory specification must
   // precede model-year development and research, rather than sit in #body
   // after the generation timeline. One shared placement for every make.
   const firstDevelopment=$('generationPanel');
   if(firstDevelopment)firstDevelopment.before(section);
  }
  // Long-form source-linked editorial fields: open-ended section registry.
  // New category keys render only when they contain approved paragraphs and
  // a source, without changing the template or adding hundreds of blanks.
  // Source-linked extra research is attached to its verified category below,
  // not duplicated as a second grid of technical sections.
  // Legacy editorial sections are optional and content-driven, not empty.
  const textSections=arr(guide?.sections).filter(x=>Array.isArray(x)&&str(x[0])&&str(x[1]));
  if(textSections.length){
   // A single shared V2 supplementary research component for every model:
   // compact source-text disclosures, never a separate long-form template.
   // Preserve each legacy paragraph in the DOM, including its exact wording.
   const card=makeSection('v2EditorialSections','Further motorcycle research',$('v2EditorialResearch')||$('v2EngineeringOverview')||$('body'));
   card.classList.add('anybike-v2-legacy-research');
   const heading=card.querySelector(':scope > h2');
   if(heading)heading.textContent='Further motorcycle research';
   const grid=node('div',undefined,'anybike-v2-legacy-research-grid');
   for(const [sectionHeading,copy] of textSections){
    const details=node('details');
    details.dataset.anybikeV2LegacyResearch='1';
    const summary=node('summary');
    summary.append(node('span',sectionHeading));
    details.append(summary);
    const content=node('div',undefined,'anybike-v2-legacy-research-content');
    paragraph(content,copy);
    details.append(content);
    grid.append(details);
   }
   // Render only once when the shared route is re-initialised.
   card.querySelector('.anybike-v2-legacy-research-grid')?.remove();
   card.querySelector('details[data-anybike-v2-legacy-research]')?.remove();
   card.append(grid);
  }
  const nav=$('databaseMotorcycleTypes');
  nav.replaceChildren();
  for(const item of arr(guide?.motorcycle_type_links)){
   if(typeof item.url!=='string'||!/^\/motorcycle-type-[a-z-]+\.html$/.test(item.url)||!str(item.label))continue;
   const a=node('a',item.label);a.href=item.url;nav.append(a);
  }
  if(!nav.children.length){
   // Public, published motorcycle-type routes are valid for every make.
   // The V2 editorial includes these for BMW; models without released
   // editorial still need the complete universal navigation rather than
   // a single generic fallback link or an empty section.
   const publishedTypes=[
    ['Adventure','adventure'],['Touring','touring'],
    ['Sports & Superbikes','sports'],['Naked & Roadsters','roadsters'],
    ['Classic & Heritage','classics'],['Cruisers','cruisers'],
    ['Scooters & Automatic','scooters'],['Off-road & Enduro','off-road']
   ];
   for(const [name,slug] of publishedTypes){
    const a=node('a',name+' →');
    a.href='/motorcycle-type-'+slug+'.html';
    nav.append(a);
   }
  }
  const typeSection=nav.closest('section');if(typeSection)typeSection.hidden=!nav.children.length;
  // Source-verified exact-model facts populate research without manufacturing
  // invented specifications or blank mandatory panels.
  let factCount=0;
   try{
    factCount=await installVerifiedModelFacts({body:$('body'),make,model,client});
   }catch(error){
    // Verified research is optional; a public facts RPC outage must not
    // disable the model's sourcing enquiry or exact-model stock.
    console.warn('Source-verified model research unavailable; continuing model page',error);
   }
  // The existing 20-slot editorial contract is the ONLY future publication
  // source. It independently checks RLS-visible release provenance, identity,
  // timestamps and nested approvals. Render its approved research into V2,
  // not a second page layout. Zero approved slots means NO draft leakage.
  let publishedCount=0;
  let publicationFailure=null;
  if(hasCanonicalId){
   try{
    const {loadUniversalPublishedPage}=await import('/model-template/universal-page-data.mjs?v=20261115-newline-fix5');
    const {renderUniversalPage}=await import('/model-template/universal-page-renderer.mjs?v=20261115-contract-gate3');
    // If the optional Supabase JS CDN is unavailable, use the SAME public
    // RLS-protected published projection over REST. Never substitute drafts.
    const publication=await loadUniversalPublishedPage(client,{
     type:'model',id:canonicalId,restEndpoint:ENDPOINT,restKey:KEY
    });
    if(publication){
     if(normalize(publication.entity.name)!==normalize(model)||
        publication.entity.id!==canonicalId)throw Error('Cross-model universal publication blocked');
     const holder=node('div');
     holder.dataset.anybikeUniversalRoot='true';
     renderUniversalPage(holder,{
      entity:{...publication.entity,manufacturer_name:make},
      sections:publication.sections,stock:[]
     });
     const approved=[...holder.querySelectorAll('[data-anybike-role="research"] > section.card')];
     if(approved.length){
      const destination=$('body');
      for(const section of approved){
       // Keep the 20-slot publication contract intact. If a verified facts
       // group already occupies the SAME explicitly registered research
       // heading, enrich that group instead of creating a second heading.
       // Unknown section titles remain standalone: never fuzzy-match facts.
       const heading=section.querySelector(':scope > h2')?.textContent?.trim()||'';
       const matches=[...destination.querySelectorAll('[data-anybike-research-category]')]
        .filter(group=>group.dataset.anybikeResearchIdentity===JSON.stringify([make.toLowerCase(),model.toLowerCase()])&&
         approvedResearchSectionHeading(group.dataset.anybikeResearchCategory,heading));
       const content=[...section.children].filter(child=>child.tagName!=='H2');
       if(matches.length===1&&content.length){
        // One canonical slot can be mounted only once per model. Preserve
        // the first approved projection; never duplicate research on reruns.
        const slot=section.dataset.sectionKey||'';
        if(matches[0].querySelector('[data-anybike-reviewed-publication][data-section-key="'+slot+'"]'))continue;
        const merged=node('div',undefined,'anybike-v2-reviewed-universal-section');
        merged.dataset.sectionKey=section.dataset.sectionKey||'';
        merged.dataset.anybikeReviewedPublication='true';
        // Keep the canonical slot identity when published content is merged
        // into a verified source category instead of shown as a duplicate.
        merged.dataset.anybikeV2CanonicalSlot='true';
        merged.append(node('h4','Additional approved research'),...content);
        matches[0].append(merged);
       }else{
        // Put approved sections INSIDE the existing factory research panel.
        // Appending them elsewhere leaves a misleading 'not published' card
        // on the page even when Supabase has released exact-model research.
        const researchPanel=destination.querySelector('[data-anybike-verified-model-facts]');
        const target=researchPanel&&researchPanel.dataset.anybikeResearchIdentity===JSON.stringify([make.toLowerCase(),model.toLowerCase()])?researchPanel:destination;
        // A canonical slot already rendered in a previous pass must not
        // produce a second full-width editorial panel.
        const slot=section.dataset.sectionKey||'';
        if(destination.querySelector('.anybike-v2-reviewed-universal-section[data-section-key="'+slot+'"]'))continue;
        section.classList.add('anybike-v2-reviewed-universal-section');
        target.append(section);
       }
       publishedCount++;
      }
     }
     if(publishedCount){
      // An approved section is real published research. Never show the
      // contradictory awaiting-publication message alongside it.
      const researchPanel=$('body')?.querySelector('[data-anybike-verified-model-facts]');
      if(researchPanel?.dataset.anybikeResearchIdentity===JSON.stringify([make.toLowerCase(),model.toLowerCase()])){
       researchPanel.querySelector('[data-anybike-research-awaiting-publication]')?.remove();
      }
     }
    }
   }catch(e){
    // Fail closed: a malformed or unpublished section must never replace
    // exact-model verified research or surface editorial drafts.
    publicationFailure=e;
    console.error('Reviewed 20-slot editorial projection unavailable or rejected for '+make+' '+model+' (ID '+canonicalId+')',e);
   }
  }
  const explanations=guide?.research_explanations;
  if(explanations&&typeof explanations==='object'&&!Array.isArray(explanations)){
   const guideIdentity=JSON.stringify([make.toLowerCase(),model.toLowerCase()]);
   let panel=$('body').querySelector('[data-anybike-verified-model-facts]');
   // Never append guide research to a panel for a different model.
   if(panel&&panel.dataset.anybikeResearchIdentity!==guideIdentity){
    panel.remove();panel=null;
   }
   const supplied=Object.entries(explanations).filter(([key,entry])=>
    /^[a-z][a-z0-9_]{1,64}$/.test(key)&&entry&&
    arr(entry.paragraphs).some(str)&&validURL(entry.source_url));
   // Source-linked guide explanations are another approved input to the
   // SAME model research panel, including models without verified RPC facts.
   // Never create a parallel standalone research layout.
   if(supplied.length&&!panel){
    panel=node('section',undefined,'card feature anybike-verified-model-research');
    panel.dataset.anybikeVerifiedModelFacts='1';
    panel.dataset.anybikeResearchIdentity=guideIdentity;
    panel.append(node('h2','Documented factory research'));
    $('body').prepend(panel);
   }
   for(const [key,entry] of supplied){
    let group=[...panel.querySelectorAll('[data-anybike-research-category]')]
      .find(x=>x.dataset.anybikeResearchCategory===key);
    if(!group){
     group=node('div',undefined,'v2-editorial-category');
     group.dataset.anybikeResearchCategory=key;
     group.append(node('h3',str(entry.title)||key.replace(/_/g,' ')));
     group.dataset.anybikeResearchIdentity=JSON.stringify([make.toLowerCase(),model.toLowerCase()]);
     panel.append(group);
    }
    if(group.querySelector('[data-v2-editorial-explanation]'))continue;
    const article=node('article',undefined,'v2-editorial-research');
    article.dataset.v2EditorialExplanation=key;
    const groupHeading=group.querySelector(':scope > h3')?.textContent?.trim();
    const articleHeading=str(entry.title)||key.replace(/_/g,' ');
    if(normalize(groupHeading)!==normalize(articleHeading))article.append(node('h4',articleHeading));
    arr(entry.paragraphs).forEach(x=>paragraph(article,x));
    sourceLink(article,entry.source_url,entry.source_name||'Manufacturer reference ↗');
    group.append(article);
   }
  }
  integratePublishedResearch($('body'),make,model);
  organiseCanonicalResearchSlots($('body'));
  organiseUniversalFactoryResearch($('body'));
  ensureUniversalResearchPanel($('body'),make,model);
  // Never tell visitors research is unpublished when the public projection
  // failed to load or validate. Distinguish service failure from no release.
  if(publicationFailure){
   const panel=$('body')?.querySelector('[data-anybike-verified-model-facts]');
   const empty=panel?.querySelector('[data-anybike-research-awaiting-publication]');
   if(empty){
    empty.textContent='Documented factory research is temporarily unavailable. Please try again shortly.';
    empty.dataset.anybikeResearchLoadError='true';
   }
   if(new URLSearchParams(location.search).has('v2debug')&&panel){
    const diagnostic=node('p','Research load error: '+String(publicationFailure?.message||publicationFailure));
    diagnostic.dataset.anybikeResearchDiagnostic='true';
    panel.append(diagnostic);
   }
  }
  updateDynamicResearchNavigation($('body'));
  // Every catalogue model gets the approved master regardless of research
  // coverage. Do not turn its hero into a research-publication status notice.
  // Leave unverified specifications and model-year claims absent until approved.
  if(!factCount&&!guide&&!publishedCount){
   // Keep the approved model-led hero even when research is awaiting approval.
   // Sourcing enquiries belong in the existing action panels, not the introduction.
   const intro=$('summary');
   intro.replaceChildren();
   paragraph(intro,'Explore the '+title+' motorcycle, its documented model information, photographs, history and related models. Specifications and equipment vary by model year and market.');
   $('years').textContent='';
  }
  // Public exact-model inventory: never use whole-manufacturer stock.
  // One exact-model stock component. Its public endpoint independently enforces
  // country/role restrictions: a 403 is NOT "no stock" and must not be bypassed.
  cards.replaceChildren();
  let feedState='unavailable',confirmedCount=0;
  try{
   const token=await optionalVisitorToken();
   const res=await fetch(ENDPOINT+'/functions/v1/international-public-stock',
    {cache:'no-store',headers:token?{Authorization:'Bearer '+token}:{}});
   if(res.status===401||res.status===403){
    feedState='restricted';
   }else if(!res.ok){
    feedState='unavailable';
   }else{
    const data=await res.json();
    if(!Array.isArray(data.items))throw Error('Unexpected stock response');
    feedState='checked';
    // Reuse the website's existing ID-verification contract. Matching
    // visible names alone cannot authorize model stock, especially across
    // generations or trimmed catalogue aliases.
    const {stockForCanonicalModel}=await import('/model-template/canonical-public-stock-identity.mjs');
    const pageIdentity={catalog_model_id:canonicalId,manufacturer_name:make,model_name:model};
    const matched=stockForCanonicalModel(data.items,pageIdentity,6);
    for(const row of matched){
     const key=String(row.item_id);
     const a=node('a');a.href='/international-vq-motorcycle.html?id='+encodeURIComponent(key);
     if(validURL(row.image_url)){
      const img=node('img');img.src=row.image_url;img.alt=title;img.loading='lazy';a.append(img);
     }
     a.append(node('strong',[title,row.year].filter(Boolean).join(' ')));
     paragraph(a,Number(row.price)>0?'£'+Number(row.price).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2}):'Price on request');
     a.append(node('span','View motorcycle →'));cards.append(a);
     confirmedCount++;
    }
   }
  }catch(e){feedState='unavailable';console.warn('Exact-model stock request failed; no substitute inventory displayed',e)}
  if(!confirmedCount){
   const messages={
    restricted:'Available-stock access is restricted for this visitor. Ask AnyBike to check this model for you.',
    checked:'No matching published motorcycles are listed in the accessible feed. Ask AnyBike to check sourcing options.',
    unavailable:'Current stock cannot be confirmed right now. Ask AnyBike to check UK supplier availability.'
   };
   const note=node('p',messages[feedState]||messages.unavailable);
   note.className='anybike-stock-status';cards.append(note);
  }
  stock.dataset.stockFeedState=feedState;
  // UK view: keep the actual model research and sourcing CTAs, without
  // an inappropriate "available internationally / access restricted" card.
  // International view: retain stock, VAT-eligible inventory and the
  // existing access state exactly as the stock service returned it.
  const confirmedUkVisitor=await ukPresentationPromise;
  stock.hidden=confirmedUkVisitor;
  // Keep the same functioning model enquiry form for all audiences, but do
  // not label a UK dealer's form as an international-buyer-only service.
  const enquiryAudienceIntro=$('internationalGuestRequest')?.querySelector('p');
  if(enquiryAudienceIntro){
   enquiryAudienceIntro.textContent=confirmedUkVisitor?
    'Ask AnyBike about this motorcycle. Include your preferred year, specification and budget.':
    'International buyers can enquire without creating an account.';
  }
  const related=$('databaseRelatedModels');
  // The shared navigation renderer owns the related pills and 217 markets;
  // never hardcode a second manufacturer or model directory.
  if(related){
   related.hidden=true;
   const duplicate=related.closest('section');
   if(duplicate)duplicate.hidden=true; // compact related pills remain above research
  }
  const typeHeading=$('databaseMotorcycleTypes')?.closest('section');
  if(typeHeading){
   const h=typeHeading.querySelector('h2'),p=typeHeading.querySelector('p:not(.eyebrow)');
   if(h)h.textContent='Find your riding style';
   if(p)p.textContent='Explore motorcycles by category across manufacturers.';
  }
  showUniversalVerification(make,model,canonicalId);
  done();
  // Isolated optional advertising; failure must not alter the approved model renderer.
  if(confirmedUkVisitor&&hasCanonicalId) import('/advertising/universal-banner.mjs?v=20261121-7').then(m=>m.renderMoveHouseOnUkPage()).catch(()=>{});
 }catch(error){
  console.error('Universal V2 master failed safely',error);
  // Never leave a permanent stock-loading message after another RPC fails.
  const pendingStock=$('internationalModelStock');
  if(pendingStock?.dataset.stockFeedState==='checking'){
   $('internationalModelCards')?.replaceChildren(node('p','Current stock cannot be confirmed right now. Ask AnyBike to check UK supplier availability.'));
   pendingStock.dataset.stockFeedState='unavailable';
  }
  // A permanent route can identify its motorcycle even when its catalogue
  // record is awaiting editorial review. Display only the route's literal
  // identity, never another model's specifications or unpublished research.
  if(permanentRouteModelId!==null&&wantMake&&wantModel){
   const heading=$('heading');
   if(heading)heading.textContent=wantMake+' '+wantModel;
   const category=$('category');
   if(category)category.textContent='Motorcycle model';
   const summary=$('summary');
   if(summary)summary.textContent='This motorcycle model is awaiting catalogue review. Verified model research is not yet available.';
   const source=$('source');
   if(source)source.href='/bulk-buying-request.html?make='+encodeURIComponent(wantMake)+'&model='+encodeURIComponent(wantModel);
   const manufacturer=$('manufacturer');
   if(manufacturer)manufacturer.href=normalize(wantMake)==='bmw'?'/bmw-motorcycles.html':
    normalize(wantMake)==='harley davidson'?'/harley-davidson-motorcycles.html':
    '/motorcycle-brand.html?make='+encodeURIComponent(wantMake);
   showError('This model is awaiting catalogue review. No unverified motorcycle information has been published.');
  }else{
   showError('The selected model could not be loaded safely. No other motorcycle information has been substituted.');
  }
  done();
 }
}
