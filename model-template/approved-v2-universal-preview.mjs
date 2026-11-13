/* AnyBike approved V2 UNIVERSAL MASTER renderer.
   ONE template + ONE shared model identity contract + dynamically populated
   approved sections. No per-model HTML, no BMW-specific editorial lookup.
   Public catalogue identifies models; public verified RPC supplies facts;
   RLS-approved V2 editorial optionally enriches the SAME sections.
   Missing research produces no empty box. Existing live routes are untouched.
*/
import {installVerifiedModelFacts,approvedResearchSectionHeading} from '/model-template/public-verified-model-facts.mjs?v=20261113-chronological1';
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
let wantMake=str(params.get('make')),wantModel=str(params.get('model'));
let approvedDedicatedRoute=null;
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
if(location.pathname==='/motorcycle-model-guide.html'){
 const aliases={
  'aprilia|rs660':['Aprilia','RS 660'],
  'bmw|ce 02 am 7.9% apr representative':['BMW','CE 02 AM'],
  'bmw|k 1600 b grand america':['BMW','K 1600 Grand America'],
  'indian|scout':['Indian Motorcycle','Scout'],
  'indian|scout bobber':['Indian Motorcycle','Scout Bobber'],
  'kawasaki|z900rs':['Kawasaki','Z900 RS']
 };
 const alias=aliases[wantMake.toLowerCase()+'|'+wantModel.toLowerCase()];
 if(alias){
  location.replace('/motorcycle-model-guide.html?make='+encodeURIComponent(alias[0])+
   '&model='+encodeURIComponent(alias[1])+location.hash);
 }
}

const done=()=>{
 window.__anybikeV2EditorialReady=true;
 window.dispatchEvent(new Event('anybike:v2-editorial-ready'));
};
if(!wantMake||!wantModel||wantMake.length>90||wantModel.length>120){
 showError('Explore motorcycle manufacturers and choose a model to view its researched specifications.');
 const browse=node('a','Browse all motorcycle manufacturers →');
 browse.href='/motorcycle-manufacturers.html';
 browse.style.cssText='display:inline-block;margin-top:10px;color:#fff;text-decoration:underline;text-decoration-color:#ed1c24';
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
  const found=candidates.filter(row=>normalize(row.make)===normalize(wantMake)&&normalize(row.model)===normalize(wantModel));
  if(found.length!==1)throw Error('No unique published model matches that make and model.');
  const selected=found[0],make=str(selected.make),model=str(selected.model),title=make+' '+model;
  const canonicalId=Number(selected.model_id||selected.catalogue_model_id);
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
    const row=normalize(make)==='bmw'?archive:
     arr(archive.models).find(entry=>entry.url===approvedDedicatedRoute);
    const {preserveDedicatedModelResearch,preservedExistingHero}=
     await import('/model-template/approved-v2-dedicated-preservation.mjs');
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
   'Explore source-verified '+title+' model history, specifications, model years and UK motorcycle sourcing with AnyBike.';
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
    if(exact.length===1)canonical=new URL(exact[0].url,location.origin).href;
   }
  }catch(e){console.warn('Canonical published route lookup unavailable',e)}
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
  $('category').textContent=str(guide?.page_metadata?.category)||str(selected.category)||'Motorcycle model';
  const summary=$('summary');summary.replaceChildren();
  const hero=guide?.hero||{};
  if(arr(hero.paragraphs).length)arr(hero.paragraphs).forEach(x=>paragraph(summary,x));
  else paragraph(summary,str(guide?.summary)||'Explore source-verified '+title+' model years, specifications and documented manufacturer history. Individual motorcycles and markets may differ.');
  $('years').textContent=str(hero.years)||str(guide?.years)||'Source-verified specifications vary by model year and market.';
  $('source').href=enquiry;
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
  stock.hidden=false;
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
  // Central photo-bank approvals take precedence. An already-published,
  // attributed exact-model Wikimedia image is used only as a fallback.
  if(!safePhoto(approvedHero)&&safePhoto(preservedExistingPhoto))
   approvedHero=preservedExistingPhoto;
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
   const img=fig.querySelector('img');img.src=approvedHero.image_url;
   img.alt=str(approvedHero.title)||title+' motorcycle';
   const caption=fig.querySelector('figcaption');
   caption.textContent=str(approvedHero.attribution)+' · ';
   sourceLink(caption,approvedHero.source_page_url,'Photograph attribution ↗');
   sourceLink(caption,approvedHero.licence_url,' · Licence ↗');
   fig.hidden=false;
  }
  // Never repeat the hero as a gallery card or display the same image twice.
  const galleryUrls=new Set(safePhoto(approvedHero)?[approvedHero.image_url]:[]);
  const galleryItems=approvedGallery.filter(photo=>{
   if(!safePhoto(photo)||galleryUrls.has(photo.image_url))return false;
   galleryUrls.add(photo.image_url);return true;
  });
  if(galleryItems.length){
   const gallerySection=makeSection('v2ApprovedGallery','Approved '+title+' photographs',stock);
   const holder=node('div',undefined,'v2-documentary-grid');
   for(const picture of galleryItems){
    const article=node('article');
    const image=node('img');image.src=picture.image_url;image.loading='lazy';
    image.decoding='async';image.alt=str(picture.title)||title+' documented motorcycle detail';
    image.style.cssText='width:100%;height:190px;object-fit:contain;background:#1a1a1a;border-radius:8px';
    article.append(image,node('h4',str(picture.title)||title+' photograph'));
    paragraph(article,[picture.model_year_start,picture.model_year_end]
      .filter(x=>x!==null&&x!==undefined).join('–'));
    paragraph(article,picture.attribution+' · '+picture.licence);
    sourceLink(article,picture.source_page_url,'Original photograph ↗');
    holder.append(article);
   }
   gallerySection.append(holder);
  }
  // Exactly one shared V2 layout. Move its approved sections into their
  // approved reading order rather than creating new make-specific templates.
  const development=$('r1300gsModelHistory'),timeline=$('r1300V2VerifiedExtras');
  if(development&&timeline)timeline.after(development);
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
   years.querySelector('h2').textContent=title+' — model years and editions';
   const container=node('div',undefined,'v2-model-year-cards');
   for(const c of yearCards){
    const article=node('article');
    article.append(node('h4',c.period));paragraph(article,c.description);
    sourceLink(article,c.source,'Manufacturer reference ↗');container.append(article);
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
   if(!devCards.length)development.hidden=true;
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
   ['engine_cc','power_hp','torque_nm','transmission'].some(k=>x[k]!==null&&x[k]!==undefined&&String(x[k]).trim()));
  if(documentedSpecs.length){
   const section=makeSection('v2DocumentedSpecifications','Documented specifications',$('v2EngineeringOverview')||$('v2FactoryColours')||$('body'));
   const grid=node('div',undefined,'v2-documentary-grid');
   for(const spec of documentedSpecs){
    const article=node('article');
    article.append(node('h4',[spec.model_year,str(spec.market)].filter(Boolean).join(' · ')));
    const values=[
     ['Engine',spec.engine_cc,'cc'],['Power',spec.power_hp,'hp'],
     ['Torque',spec.torque_nm,'Nm'],['Transmission',str(spec.transmission),'']
    ];
    for(const [label,value,unit] of values){
     if(value===null||value===undefined||String(value).trim()==='')continue;
     if(typeof value==='number'&&(!Number.isFinite(value)||value<=0))continue;
     paragraph(article,label+': '+value+(unit?' '+unit:''));
    }
    sourceLink(article,spec.source,'Factory specification source ↗');
    grid.append(article);
   }
   section.append(grid);
  }
  // Long-form source-linked editorial fields: open-ended section registry.
  // New category keys render only when they contain approved paragraphs and
  // a source, without changing the template or adding hundreds of blanks.
  // Source-linked extra research is attached to its verified category below,
  // not duplicated as a second grid of technical sections.
  // Legacy editorial sections are optional and content-driven, not empty.
  const textSections=arr(guide?.sections).filter(x=>Array.isArray(x)&&str(x[0])&&str(x[1]));
  if(textSections.length){
   const card=makeSection('v2EditorialSections','Further motorcycle research',$('v2EditorialResearch')||$('v2EngineeringOverview')||$('body'));
   for(const [heading,copy] of textSections){card.append(node('h3',heading));paragraph(card,copy);}
  }
  const nav=$('databaseMotorcycleTypes');
  nav.replaceChildren();
  for(const item of arr(guide?.motorcycle_type_links)){
   if(typeof item.url!=='string'||!/^\/motorcycle-type-[a-z-]+\.html$/.test(item.url)||!str(item.label))continue;
   const a=node('a',item.label);a.href=item.url;nav.append(a);
  }
  if(!nav.children.length){
   for(const type of [str(selected.category)].filter(Boolean)){
    const a=node('a',type+' →');a.href='/motorcycle-type.html?type='+encodeURIComponent(type);nav.append(a);
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
  if(client&&hasCanonicalId){
   try{
    const {loadUniversalPublishedPage}=await import('/model-template/universal-page-data.mjs');
    const {renderUniversalPage}=await import('/model-template/universal-page-renderer.mjs');
    const publication=await loadUniversalPublishedPage(client,{type:'model',id:canonicalId});
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
        const merged=node('div',undefined,'anybike-v2-reviewed-universal-section');
        merged.dataset.sectionKey=section.dataset.sectionKey||'';
        merged.dataset.anybikeReviewedPublication='true';
        merged.append(node('h4','Additional approved research'),...content);
        matches[0].append(merged);
       }else{
        section.classList.add('anybike-v2-reviewed-universal-section');
        destination.append(section);
       }
       publishedCount++;
      }
     }
    }
   }catch(e){
    // Fail closed: a malformed or unpublished section must never replace
    // exact-model verified research or surface editorial drafts.
    console.warn('Reviewed 20-slot editorial projection unavailable or rejected',e);
   }
  }
  const explanations=guide?.research_explanations;
  if(explanations&&typeof explanations==='object'&&!Array.isArray(explanations)){
   let panel=$('body').querySelector('[data-anybike-verified-model-facts]');
   const supplied=Object.entries(explanations).filter(([key,entry])=>
    /^[a-z][a-z0-9_]{1,64}$/.test(key)&&entry&&
    arr(entry.paragraphs).some(str)&&validURL(entry.source_url));
   if(supplied.length&&!panel)panel=makeSection('v2EditorialResearch','Documented factory research',$('body'));
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
  // Avoid an empty-looking extra research-status card where no verified
  // research has yet been published. Keep model-specific sourcing available.
  if(!factCount&&!guide&&!publishedCount){
   const intro=$('summary');
   intro.replaceChildren();
   paragraph(intro,'Documented research is not yet published for '+title+'. Tell AnyBike the year and specification you need, and we can help with your enquiry.');
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
  stock.hidden=false;
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
  done();
 }catch(error){
  console.error('Universal V2 master failed safely',error);
  // Never leave a permanent stock-loading message after another RPC fails.
  const pendingStock=$('internationalModelStock');
  if(pendingStock?.dataset.stockFeedState==='checking'){
   $('internationalModelCards')?.replaceChildren(node('p','Current stock cannot be confirmed right now. Ask AnyBike to check UK supplier availability.'));
   pendingStock.dataset.stockFeedState='unavailable';
  }
  showError('The selected model could not be loaded safely. No other motorcycle information has been substituted.');
  done();
 }
}
