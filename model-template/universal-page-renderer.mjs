// AnyBike: one canonical manufacturer/model layout renderer.
// Stage-only until the approved BMW/Harley visual baseline and public projection pass QA.
// No network requests, no direct privileged database reads, no HTML injection.
import {canonicalPageEntity,buildUniversalPageSections,visibleUniversalSections} from './universal-page-section-contract.mjs';
import {stockForCanonicalModel} from './canonical-public-stock-identity.mjs';

const safeText = x => typeof x === 'string' ? x.trim() : '';
const approvedLink = x => {
  if (typeof x !== 'string') return false;
  if (/^\/(?!\/)[a-z0-9][a-z0-9\/_?.=%&#-]*$/i.test(x)) return true;
  try {
    const u=new URL(x);
    return u.protocol==='https:' && !u.username && !u.password;
  } catch { return false; }
};
const node = (doc, tag, value='', className='') => {
  const e=doc.createElement(tag);
  if(className)e.className=className;
  if(value!==null&&value!==undefined)e.textContent=String(value);
  return e;
};
function appendContent(doc,parent,value,depth=0){
  if(depth>4||value===undefined||value===null)return;
  if(typeof value==='string'||typeof value==='number'){
    if(String(value).trim())parent.append(node(doc,'p',String(value)));
    return;
  }
  if(Array.isArray(value)){
    if(!value.length)return;
    const list=node(doc,'div','','anybike-universal-items');
    for(const item of value.slice(0,40)){
      const box=node(doc,'article','','anybike-universal-item');
      appendContent(doc,box,item,depth+1);
      if(box.childNodes.length)list.append(box);
    }
    if(list.childNodes.length)parent.append(list);
    return;
  }
  if(typeof value!=='object')return;
  // An approved section cannot silently promote nested draft generation,
  // model-year or engineering records. These flags come from the staged
  // catalogue and must remain fail-closed even after a parent is published.
  const review=safeText(value.verification_status).toLowerCase();
  const sourceReview=safeText(value.source_verification_status).toLowerCase();
  const contentStatus=safeText(value.content_status).toLowerCase();
  const editorialStatus=safeText(value.editorial_status).toLowerCase();
  const allowed=new Set(['verified','approved','published']);
  if((review&&!allowed.has(review))||
     (sourceReview&&!allowed.has(sourceReview))||
     (contentStatus&&!allowed.has(contentStatus))||
     (editorialStatus&&!allowed.has(editorialStatus)))return;
  // Strict display whitelist: arbitrary JSON keys are not rendered as speculative facts.
  const heading=safeText(value.title)||safeText(value.label)||
    safeText(value.name)||safeText(value.heading);
  if(heading)parent.append(node(doc,depth>0?'h3':'h2',heading));
  // Model-year notes are explicitly reviewed editorial text, not a year
  // inferred from a press-release or a source document's publication date.
  if(safeText(value.years))
    parent.append(node(doc,'p',value.years,'anybike-universal-model-years'));
  if(safeText(value.subtitle))
    parent.append(node(doc,'p',value.subtitle,'anybike-universal-subtitle'));
  for(const key of ['summary','description','text','body']){
    if(typeof value[key]==='string'&&value[key].trim())parent.append(node(doc,'p',value[key]));
  }
  // Structured technical rows are a documented part of the approved
  // universal editorial schema. Render only two-cell text pairs; never dump
  // arbitrary JSON or treat pending engineering as verified information.
  if(Array.isArray(value.rows)){
    const specs=node(doc,'dl','','anybike-universal-specification-rows');
    for(const pair of value.rows.slice(0,60)){
      if(!Array.isArray(pair)||pair.length!==2)continue;
      const label=safeText(pair[0]);
      const val=typeof pair[1]==='number'&&Number.isFinite(pair[1])?String(pair[1]):safeText(pair[1]);
      if(!label||!val)continue;
      specs.append(node(doc,'dt',label),node(doc,'dd',val));
    }
    if(specs.childNodes.length)parent.append(specs);
  }
  // Dated editorial history remains within the approved section, not a
  // separate model-specific template. Dates are displayed as source labels,
  // never inferred to be motorcycle production-start dates.
  const period=safeText(value.period)||safeText(value.date);
  if(period)parent.append(node(doc,'p',period,'anybike-universal-period'));
  if(Number.isInteger(value.year)&&value.year>=1885&&value.year<=2100)
    parent.append(node(doc,'p',String(value.year),'anybike-universal-period'));
  for(const key of ['event','change','evidence']){
    if(typeof value[key]==='string'&&value[key].trim())
      parent.append(node(doc,'p',value[key]));
  }
  // A published factory milestone can carry its own source. Preserve the
  // documentary link without treating the press-release date as production.
  const evidenceUrl=safeText(value.source);
  if(evidenceUrl.startsWith('https://')&&approvedLink(evidenceUrl)){
    const sourceLink=node(doc,'a','View source document','anybike-universal-source-link');
    sourceLink.href=evidenceUrl;sourceLink.target='_blank';
    sourceLink.rel='noopener noreferrer';parent.append(sourceLink);
  }
  // Approved research paragraphs may cite documentary sources as
  // [URL, label]. Keep the citation without exposing arbitrary HTML or
  // allowing unsafe protocols, including when the paragraph is link-only.
  if(Array.isArray(value.link)&&value.link.length===2){
    const [sourceUrl,sourceLabel]=value.link;
    if(typeof sourceUrl==='string'&&approvedLink(sourceUrl)&&
       safeText(sourceLabel)){
      const sourceAnchor=node(doc,'a',sourceLabel,'anybike-universal-inline-reference');
      sourceAnchor.href=sourceUrl;
      if(sourceUrl.startsWith('https://')){
        sourceAnchor.target='_blank';
        sourceAnchor.rel='noopener noreferrer';
      }
      parent.append(sourceAnchor);
    }
  }
  const url=safeText(value.url);
  if(approvedLink(url)&&heading){
    const a=node(doc,'a','Read more');a.href=url;
    if(url.startsWith('https://')){a.target='_blank';a.rel='noopener noreferrer';}
    parent.append(a);
  }
  // Customer-service copy has a documented finite schema. Render its
  // reviewed headings and paragraphs, but never turn labels/placeholders
  // into an inert imitation enquiry form.
  if(value.customer_copy&&typeof value.customer_copy==='object'&&
     !Array.isArray(value.customer_copy)){
    for(const key of ['uk_selling','international_stock',
                      'international_enquiry','international_sourcing']){
      const copy=value.customer_copy[key];
      if(copy&&typeof copy==='object'&&!Array.isArray(copy))
        appendContent(doc,parent,copy,depth+1);
    }
  }
  // One typed renderer for every entity. Use known editorial fields only; never
  // render source HTML, unlicensed photograph URLs or arbitrary database keys.
  for(const key of ['items','paragraphs','entries','cards','links',
    'hero','production','timeline','production_evidence','generations','milestones','specifications','colours',
    'types','related_model_links','global_stories','deep_dive','development_cards',
    'actions','engineering','development',
    'editions','technical_specifications','motorcycle_types','country_markets']){
    if(Array.isArray(value[key])||(value[key]&&typeof value[key]==='object'))
      appendContent(doc,parent,value[key],depth+1);
  }
}

// Verified source facts have a typed, auditable rendering path. Raw editorial JSON,
// source HTML and photo candidates must never be dumped into a public page.
function appendVerifiedFacts(doc,parent,facts){
 if(!Array.isArray(facts))return;
 const list=node(doc,'div','','anybike-universal-verified-facts');
 for(const fact of facts.slice(0,60)){
  if(!fact||fact.source_verification_status!=='verified'||
     !safeText(fact.label)||!approvedLink(fact.source_url)||
     !String(fact.source_url).startsWith('https://'))continue;
  // Source verification is evidence quality, not editorial release approval.
  // Fail closed on explicit nested draft, embargo or publication denial flags.
  if(fact.publication_eligible===false)continue;
  if(fact.editorial_status&&
     !['verified','approved','published'].includes(safeText(fact.editorial_status).toLowerCase()))continue;
  if(fact.content_status&&
     !['verified','approved','published'].includes(safeText(fact.content_status).toLowerCase()))continue;
  if(fact.published_at){
   const released=Date.parse(fact.published_at);
   if(!Number.isFinite(released)||released>Date.now())continue;
  }
  const item=node(doc,'article','','anybike-universal-evidence');
  item.append(node(doc,'h3',fact.label));
  const data=fact.value;
  // Catalogue fact values may be verified documentary text rather than a
  // numeric engineering object. Display only the reviewed plain-text value;
  // never parse the source as HTML, infer units or substitute other models.
  if(typeof data==='string'&&data.trim()&&data.trim().length<=1200)
   item.append(node(doc,'p',data.trim(),'anybike-universal-evidence-text'));
  if(data&&typeof data==='object'&&!Array.isArray(data)){
   const rows=node(doc,'dl','','anybike-universal-evidence-values');
   const fields=[
    ['Engine','engine_cc','cc'],['Power','power_hp','hp'],
    ['Power','max_power_hp','hp maximum'],['Torque','torque_nm','Nm'],
    ['Battery','battery_kwh','kWh'],['Factory colour','name',''],
    ['Edition','variant',''],['Model-year reference','reference_model_year',''],
    ['Model-year reference','model_year',''],
    ['Description','evidence',''],['Transmission','transmission',''],
    ['Announcement date','announcement_date',''],['Documented date','date','']
   ];
   for(const [label,key,unit] of fields){
    const value=data[key];
    if(typeof value!=='string'&&typeof value!=='number')continue;
    const v=String(value).trim();
    if(!v)continue;
    rows.append(node(doc,'dt',label),node(doc,'dd',v+(unit?' '+unit:'')));
   }
   // Published source facts may store a numeric amount and its measurement
   // unit separately. Show both together; never invent a unit or a fact.
   const amount=data.amount;
   const unit=safeText(data.unit);
   if((typeof amount==='number'&&Number.isFinite(amount)||
       typeof amount==='string'&&amount.trim()&&Number.isFinite(Number(amount)))&&
       /^[a-z0-9%°/. -]{1,24}$/i.test(unit))
    rows.append(node(doc,'dt','Verified value'),node(doc,'dd',String(amount).trim()+' '+unit));
   if(rows.childNodes.length)item.append(rows);
  }
  const meta=[
   Number.isInteger(fact.start_year)?'Source from '+fact.start_year:'',
   Number.isInteger(fact.end_year)?'to '+fact.end_year:'',
   safeText(fact.market)?'Market: '+fact.market:'',
   safeText(fact.source_name)?'Source: '+fact.source_name:''
  ].filter(Boolean);
  if(meta.length)item.append(node(doc,'p',meta.join(' · '),'anybike-universal-evidence-source'));
  const a=node(doc,'a','View documented source');a.href=fact.source_url;
  a.target='_blank';a.rel='noopener noreferrer';item.append(a);
  list.append(item);
 }
 if(list.childNodes.length)parent.append(list);
}

// Hero photographs must come from a pre-approved, buyer-safe editorial
// source. Never use a stock advert or a different motorcycle as a fallback.
function approvedHeroPhoto(photo,identity,manufacturerName){
 if(!photo||typeof photo!=='object'||Array.isArray(photo)||
    photo.approval_status!=='approved'||identity.type!=='model')return null;
 const normalise=v=>safeText(v).toLowerCase().replace(/[^a-z0-9]/g,'');
 if(!normalise(manufacturerName)||!normalise(photo.manufacturer)||
    normalise(photo.manufacturer)!==normalise(manufacturerName)||
    normalise(photo.model)!==normalise(identity.name))return null;
 for(const key of ['image_url','source_page_url','licence_url']){
  if(!safeText(photo[key]).startsWith('https://')||!approvedLink(photo[key]))return null;
 }
 if(!safeText(photo.licence)||!safeText(photo.attribution))return null;
 return Object.freeze({
  src:photo.image_url,source:photo.source_page_url,
  licence_url:photo.licence_url,licence:photo.licence,
  attribution:photo.attribution
 });
}

export function composeUniversalPage({entity,sections=[],stock=[],heroPhoto=null}={}){
  const identity=canonicalPageEntity(entity);
  const slots=buildUniversalPageSections(entity,sections);
  const visible=visibleUniversalSections(slots);
  const permittedStock=identity.type==='model' ?
    stockForCanonicalModel(stock,{catalog_model_id:identity.id,model_name:identity.name,
      manufacturer_name:safeText(entity.manufacturer_name)},24) : [];
  return Object.freeze({
    identity,sections:visible,stock:permittedStock,
    heroPhoto:approvedHeroPhoto(heroPhoto,identity,safeText(entity.manufacturer_name)),
    layout:'anybike-universal-v1',
    order:Object.freeze(['hero','stock','research','customer_actions'])
  });
}
/**
 * Mount only into a dedicated stage/test root with data-anybike-universal-root.
 * Existing approved pages are never overwritten or restructured by this module.
 * Server-side publication/stock entitlements are mandatory; the client only adds checks.
 */
export function renderUniversalPage(root,payload){
  if(!root||root.dataset?.anybikeUniversalRoot!=='true')
    throw Error('Dedicated universal rendering root required');
  const view=composeUniversalPage(payload);
  const doc=root.ownerDocument;
  if(!doc)throw Error('Document unavailable');
  const fragment=doc.createDocumentFragment();
  const hero=node(doc,'header','','anybike-universal-hero');
  hero.append(node(doc,'p',view.identity.type==='model'?'Motorcycle model guide':'Motorcycle manufacturer guide','eyebrow'));
  hero.append(node(doc,'h1',view.identity.name));
  if(view.heroPhoto){
    const figure=node(doc,'figure','','anybike-universal-licensed-hero');
    const img=node(doc,'img');
    img.src=view.heroPhoto.src;
    img.alt=view.identity.name+' — approved motorcycle model photograph';
    img.loading='eager';
    img.decoding='async';
    figure.append(img);
    const caption=node(doc,'figcaption','','anybike-universal-photo-credit');
    const source=node(doc,'a',view.heroPhoto.attribution);
    source.href=view.heroPhoto.source;
    source.target='_blank';source.rel='noopener noreferrer';
    const licence=node(doc,'a',view.heroPhoto.licence);
    licence.href=view.heroPhoto.licence_url;
    licence.target='_blank';licence.rel='noopener noreferrer';
    caption.append(source,licence);
    figure.append(caption);hero.append(figure);
  }
  fragment.append(hero);
  // Always before any research, including when there is no permitted stock.
  const stock=node(doc,'section','','anybike-universal-stock');
  stock.dataset.anybikeRole='stock';
  stock.append(node(doc,'h2','Available Stock'));
  if(view.identity.type==='model'&&view.stock.length){
    const list=node(doc,'div','','anybike-universal-stock-grid');
    for(const item of view.stock){
      const a=node(doc,'a','','anybike-universal-stock-item');
      a.href='/international-vq-motorcycle.html?id='+encodeURIComponent(String(item.item_id));
      // Canonical model identity is authoritative even if a stock feed carries stale display text.
      // Never label an R 1250 GS card as an R 1300 GS because of a mislabelled advert.
      const year=Number.isInteger(Number(item.year))&&Number(item.year)>=1885&&Number(item.year)<=2100?String(item.year):'';
      // Only images already included in the authorized public stock payload
      // can appear in a stock card. These are sale-listing pictures, not
      // substitutes for separately licensed model-research hero photography.
      const imageUrl=safeText(item.image_url);
      if(imageUrl.startsWith('https://')&&approvedLink(imageUrl)){
        const img=node(doc,'img');
        img.src=imageUrl;
        img.alt=view.identity.name+' motorcycle available in stock';
        img.loading='lazy';
        img.decoding='async';
        a.append(img);
      }
      a.append(node(doc,'strong',[view.identity.name,year].filter(Boolean).join(' ')));
      if(Number.isFinite(Number(item.price))&&Number(item.price)>0)
        a.append(node(doc,'span','£'+Number(item.price).toLocaleString('en-GB')));
      list.append(a);
    }
    stock.append(list);
  }else stock.append(node(doc,'p','Ask AnyBike about sourcing this motorcycle.'));
  fragment.append(stock);
  const research=node(doc,'div','','anybike-universal-research');
  research.dataset.anybikeRole='research';
  for(const slot of view.sections){
    const section=node(doc,'section','','card anybike-universal-research-card');
    section.dataset.sectionKey=slot.key;
    section.append(node(doc,'h2',slot.title||'Motorcycle research'));
    appendContent(doc,section,slot.content);
    if(Array.isArray(slot.content?.verified_catalogue_facts))
      appendVerifiedFacts(doc,section,slot.content.verified_catalogue_facts);
    // Suppress empty section cards even when the published JSON has metadata
    // but no customer-facing text. Never fabricate a paragraph to fill a slot.
    if(section.childNodes.length>1)research.append(section);
  }
  fragment.append(research);
  const actions=node(doc,'section','','anybike-universal-actions');
  actions.dataset.anybikeRole='customer-actions';
  const source=node(doc,'a','Source a Motorcycle');
  source.href='/buy-motorcycles.html';
  const sell=node(doc,'a','Sell My Motorcycle');
  sell.href='/uk-motorcycle-selling.html';
  actions.append(source,sell);fragment.append(actions);
  root.replaceChildren(fragment);
  root.dataset.anybikeRenderedEntity=view.identity.type+':'+view.identity.id;
  return view;
}
