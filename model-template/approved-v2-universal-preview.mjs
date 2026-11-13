/* AnyBike approved V2 UNIVERSAL MASTER renderer.
   ONE template + ONE shared model identity contract + dynamically populated
   approved sections. No per-model HTML, no BMW-specific editorial lookup.
   Public catalogue identifies models; public verified RPC supplies facts;
   RLS-approved V2 editorial optionally enriches the SAME sections.
   Missing research produces no empty box. Existing live routes are untouched.
*/
import {installVerifiedModelFacts} from '/model-template/public-verified-model-facts.mjs?v=20261113-chronological1';
const ENDPOINT='https://tuehtnezhdnkqbbhttgp.supabase.co';
const KEY='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
const $=id=>document.getElementById(id);
const str=x=>typeof x==='string'?x.trim():'';
const normalize=s=>str(s).toLocaleLowerCase('en-GB').replace(/[^a-z0-9]+/g,' ').trim();
const arr=x=>Array.isArray(x)?x:[];
const validURL=x=>typeof x==='string'&&/^https:\/\/[^\s]+$/.test(x);
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
const params=new URLSearchParams(location.search);
const wantMake=str(params.get('make')),wantModel=str(params.get('model'));
const done=()=>{
 window.__anybikeV2EditorialReady=true;
 window.dispatchEvent(new Event('anybike:v2-editorial-ready'));
};
if(!wantMake||!wantModel||wantMake.length>90||wantModel.length>120){
 showError('Specify a published make and model in the URL.');
}else{
 try{
  const response=await fetch('/data/motorcycle-catalogue-master.json',{cache:'no-cache'});
  if(!response.ok)throw Error('Published motorcycle catalogue unavailable');
  const catalogue=await response.json();
  const found=arr(catalogue.models).filter(row=>normalize(row.make)===normalize(wantMake)&&normalize(row.model)===normalize(wantModel));
  if(found.length!==1)throw Error('No unique published model matches that make and model.');
  const selected=found[0],make=str(selected.make),model=str(selected.model),title=make+' '+model;
  const enquiry='/bulk-buying-request.html?make='+encodeURIComponent(make)+'&model='+encodeURIComponent(model);
  const manufacturer=normalize(make)==='bmw'?'/bmw-motorcycles.html':
   normalize(make)==='harley davidson'?'/harley-davidson-motorcycles.html':
   '/motorcycle-brand.html?make='+encodeURIComponent(make);
  const client=window.supabase?.createClient?.(ENDPOINT,KEY);
  // Access is read-only and subject to the table's existing publication RLS.
  // Filtering on both JSONB identity fields prevents cross-model leakage.
  let guide=null;
  if(client){
   try{
    const {data,error}=await client.from('motorcycle_model_v2_editorial')
     .select('model_id,slug,editorial').eq('preview_visible',true)
     .eq('editorial->>make',make).eq('editorial->>model',model).limit(1).maybeSingle();
    if(!error&&data?.editorial&&normalize(data.editorial.make)===normalize(make)&&
       normalize(data.editorial.model)===normalize(model))guide=data.editorial;
    if(error)console.warn('V2 editorial not available for this identity; verified facts remain',error);
   }catch(e){console.warn('V2 editorial lookup unavailable',e);}
  }
  window.__anybikeV2ModelIdentity=Object.freeze({make,model});
  window.__anybikeV2Editorial=guide;
  window.dispatchEvent(new Event('anybike:v2-model-identity-ready'));

  // MASTER HERO — no hardcoded brand text or invented history.
  document.title=title+' | Motorcycle Research | AnyBike';
  const meta=document.querySelector('meta[name="description"]');
  if(meta)meta.content=str(guide?.page_metadata?.description)||'Research '+title+' model years, specifications and motorcycle sourcing with AnyBike.';
  $('heading').textContent=title;
  $('category').textContent=str(guide?.page_metadata?.category)||str(selected.category)||'Motorcycle model';
  const summary=$('summary');summary.replaceChildren();
  const hero=guide?.hero||{};
  if(arr(hero.paragraphs).length)arr(hero.paragraphs).forEach(x=>paragraph(summary,x));
  else paragraph(summary,str(guide?.summary)||'Explore source-verified '+title+' model years, specifications and documented manufacturer history. Individual motorcycles and markets may differ.');
  $('years').textContent=str(hero.years)||str(guide?.years)||'Source-verified specifications vary by model year and market.';
  $('source').href=enquiry;
  const photo=hero.photo||{},fig=$('databaseHeroPhoto');
  const originalRights=validURL(photo.source_url)&&/commons\.wikimedia\.org/.test(new URL(photo.source_url).hostname)&&
   /CC BY|public domain/i.test(str(photo.source_label));
  if(fig&&validURL(photo.url)&&(photo.republication_approved===true||originalRights)){
   const img=fig.querySelector('img');img.src=photo.url;img.alt=str(photo.alt)||title+' motorcycle';
   const caption=fig.querySelector('figcaption');
   caption.textContent=str(photo.credit)+' · ';
   sourceLink(caption,photo.source_url,str(photo.source_label)||'Image attribution');
   fig.hidden=false;
  }
  // Exactly one shared V2 layout. Move its approved sections into their
  // approved reading order rather than creating new make-specific templates.
  const header=document.querySelector('main > .hero'),stock=$('internationalModelStock');
  if(header&&stock)header.after(stock);
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
  const events=arr(guide?.model_year_timeline).filter(x=>str(x.period)&&str(x.description));
  if(events.length){
   const section=$('r1300V2VerifiedExtras');section.hidden=false;
   section.querySelector('h2').textContent='Model-year development timeline';
   section.querySelector('.r1300-v2-extra-head p').textContent='Documented model-year changes and production milestones.';
   section.querySelector('summary span').textContent='Model-year timeline';
   const list=$('databaseModelTimeline');list.replaceChildren();
   events.forEach(e=>{const p=node('p');p.append(node('strong',e.period+': '),document.createTextNode(e.description));list.append(p)});
   sourceLink(list,guide?.model_year_timeline_reference?.url,guide?.model_year_timeline_reference?.label);
  }
  const yearCards=arr(guide?.model_year_cards).filter(x=>str(x.period)&&str(x.description));
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
  const factCount=await installVerifiedModelFacts({body:$('body'),make,model,client});
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
     panel.append(group);
    }
    if(group.querySelector('[data-v2-editorial-explanation]'))continue;
    const article=node('article',undefined,'v2-editorial-research');
    article.dataset.v2EditorialExplanation=key;
    article.append(node('h4',str(entry.title)||key.replace(/_/g,' ')));
    arr(entry.paragraphs).forEach(x=>paragraph(article,x));
    sourceLink(article,entry.source_url,entry.source_name||'Manufacturer reference ↗');
    group.append(article);
   }
  }
  if(!factCount&&!guide){
   const note=node('p','Verified research is not yet published for this motorcycle. You can enquire about a specific year and specification.');
   const section=makeSection('v2ResearchPending','Research publication status',$('generationPanel'));
   section.append(note);
  }
  // Public exact-model inventory: never use whole-manufacturer stock.
  stock.querySelector('h2').textContent=title+' motorcycles available internationally';
  stock.querySelector('p').textContent='Available UK supplier motorcycles are only a selection. Tell AnyBike your preferred year, condition and budget to source '+title+'.';
  stock.hidden=false;
  const cards=$('internationalModelCards');cards.replaceChildren();
  try{
   const session=client?await client.auth.getSession():null;
   const token=session?.data?.session?.access_token;
   const res=await fetch(ENDPOINT+'/functions/v1/international-public-stock',
    {cache:'no-store',headers:token?{Authorization:'Bearer '+token}:{}});
   if(!res.ok)throw Error('Stock endpoint unavailable');
   const data=await res.json();
   const same=x=>normalize(x.make)===normalize(make)&&normalize(x.model)===normalize(model);
   for(const row of arr(data.items).filter(same).slice(0,6)){
    if(!row.item_id)continue;
    const a=node('a');a.href='/international-vq-motorcycle.html?id='+encodeURIComponent(row.item_id);
    if(validURL(row.image_url)){
     const img=node('img');img.src=row.image_url;img.alt=title;img.loading='lazy';a.append(img);
    }
    a.append(node('strong',[title,row.year].filter(Boolean).join(' ')));
    paragraph(a,Number(row.price)>0?'£'+Number(row.price).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2}):'Price on request');
    a.append(node('span','View motorcycle →'));cards.append(a);
   }
  }catch(e){console.warn('International stock unavailable; sourcing remains accessible',e)}
  if(!cards.children.length){
   paragraph(cards,'Current exact-model stock could not be confirmed. Ask AnyBike to check UK supplier availability.');
  }
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
    const token=(await client?.auth.getSession())?.data?.session?.access_token;
    const res=await fetch(ENDPOINT+'/functions/v1/international-guest-enquiry',{
     method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
     body:JSON.stringify({...values,make,model,page:location.href})
    });
    const reply=await res.json();
    if(!res.ok||!reply.ok)throw Error(reply.error||'Could not send enquiry');
    status.textContent='Your enquiry has been received'+(reply.reference?' · Reference '+reply.reference:'')+'.';
    form.reset();
   }catch(e){status.textContent=e.message||'Could not send enquiry';}
   finally{button.disabled=false;}
  });
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
  showError('The selected model could not be loaded safely. No other motorcycle information has been substituted.');
  done();
 }
}
