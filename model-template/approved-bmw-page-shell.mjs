/*
 * AnyBike approved R 1300 GS presentation applied to existing BMW model URLs.
 * Does not replace their SEO URLs or working model data/stock handlers.
 * All researched cards are sourced from the exact make/model already used
 * by the page; later source changes update automatically when feed changes.
 * Keeps approved R 1300 GS and dedicated R 1250 GS galleries unchanged.
 */
const normalise=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const text=v=>typeof v==='string'?v.trim():'';
const safeSource=url=>typeof url==='string'&&/^https:\/\//i.test(url);
async function publishedBmwResearch(){
 const provider=window.supabase;
 const client=provider?.createClient?.('https://tuehtnezhdnkqbbhttgp.supabase.co','sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK');
 if(!client)return null;
 const {data,error}=await client.rpc('public_bmw_model_history_v1',{requested_path:location.pathname});
 if(error||!data||data.make!=='BMW'||!Array.isArray(data.generations))return null;
 return data;
}
// One hero for every BMW model route. The approved photo bank is the only
// source of imagery. Without a licensed exact-model photo, the designed
// typographic hero stays visible: no unrelated bikes or broken placeholders.
async function applyBmwHero(hero,model){
 if(!hero||hero.querySelector('.recovered-hero-photo,.licensed-photo,[data-anybike-model-hero]'))return;
 hero.classList.add('anybike-bmw-master-hero');
 const media=document.createElement('figure');
 media.className='anybike-bmw-master-hero-media';
 media.dataset.anybikeModelHero='1';
 const fallback=document.createElement('div');
 fallback.className='anybike-bmw-master-hero-identity';
 const marque=document.createElement('span');marque.textContent='BMW MOTORRAD';
 const name=document.createElement('strong');name.textContent=model;
 const strap=document.createElement('span');strap.textContent='Motorcycle model guide';
 fallback.append(marque,name,strap);
 media.append(fallback);
 const actions=hero.querySelector('.actions');
 if(actions)actions.before(media);else hero.append(media);
 try{
  const provider=window.supabase;
  if(!provider?.createClient)return;
  const client=provider.createClient('https://tuehtnezhdnkqbbhttgp.supabase.co','sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK');
  const {data,error}=await client.rpc('public_bmw_model_hero_v1',{requested_path:location.pathname});
  if(error||!data||normalise(data.model)!==normalise(model)||
   !safeSource(data.image_url)||!safeSource(data.source_page_url)||!safeSource(data.licence_url)||
   !text(data.attribution)||!text(data.licence))return;
  const img=document.createElement('img');
  img.src=data.image_url;img.alt='BMW '+model+' — approved model photograph';
  img.loading='eager';img.decoding='async';
  const caption=document.createElement('figcaption');
  const source=document.createElement('a');source.href=data.source_page_url;source.target='_blank';source.rel='noopener noreferrer';source.textContent=data.attribution;
  const licence=document.createElement('a');licence.href=data.licence_url;licence.target='_blank';licence.rel='noopener noreferrer';licence.textContent=data.licence;
  caption.append(source,' · ',licence);
  // Do not remove the designed fallback before an image has actually loaded.
  img.addEventListener('load',()=>{fallback.remove();media.classList.add('has-approved-photo');},{once:true});
  img.addEventListener('error',()=>{img.remove();caption.remove();},{once:true});
  media.append(img,caption);
 }catch(error){console.warn('BMW hero photo unavailable; keeping branded model hero',error);}
}
const makeCard=(entry,{compact=false}={})=>{
 const article=document.createElement('article');article.className='anybike-master-history-card';
 const h=document.createElement('h3');h.textContent=text(entry.label)||'Documented model development';
 article.append(h);
 // A single documented generation is already explained in the specification
 // panel directly above. Do not print the same paragraph a second time.
 if(!compact){const desc=document.createElement('p');desc.textContent=text(entry.description)||'Confirm the exact model and year of an individual motorcycle.';article.append(desc);}
 const meta=[];
 if(text(entry.model_year))meta.push(text(entry.model_year));
 if(Number.isInteger(entry.announcement_year))meta.push('Announced '+entry.announcement_year);
 if(meta.length){const p=document.createElement('p');p.className='anybike-master-history-meta';p.textContent=meta.join(' · ');article.append(p);}
 if(safeSource(entry.source)){const a=document.createElement('a');a.href=entry.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Manufacturer reference ↗';article.append(a);}
 return article;
};
export async function applyApprovedBmwPageShell(){
 const main=document.querySelector('main'),hero=main?.querySelector('.hero'),body=main?.querySelector('#body');
 if(!main||!hero||!body||!location.pathname.startsWith('/bmw-'))return false;
 // R 1300 GS keeps its dedicated approved 13-section layout unchanged.
 if(main.querySelector('#ukR1300ModelGallery'))return false;
 main.classList.add('anybike-approved-bmw-live-shell');
 const display=main.querySelector('#heading')?.textContent?.trim()||main.querySelector('h1')?.textContent?.trim()||'';
 const model=display.replace(/^BMW\s+/i,'');
 if(!model)return false;
 // One shared hero renderer for every existing BMW model route.
 void applyBmwHero(hero,model);
 // Existing production model guides are also hydrated by the page's own loader;
 // this is a separate presentation pass, never a replacement for it.
 // A page's documented generation panel is the primary version history.
 // Older shared stock code also adds "development and ownership" cards: once
 // model-specific generation research is visible, suppress that duplicate.
 const generationPanel=main.querySelector('#generationPanel');
 const reconcileHistory=()=>{
  const documented=!!(generationPanel&&!generationPanel.hidden&&generationPanel.querySelector('.generation-detail')?.textContent?.trim());
  const duplicate=main.querySelector('.anybike-model-research');
  if(duplicate)duplicate.hidden=documented;
  const copied=main.querySelector('[data-anybike-master-gallery]');
  if(copied)copied.hidden=documented;
 };
 if(generationPanel){
  const observer=new MutationObserver(reconcileHistory);
  observer.observe(generationPanel,{attributes:true,attributeFilter:['hidden'],subtree:true,childList:true,characterData:true});
  // The stock section may arrive after the original page loader.
  const mainObserver=new MutationObserver(records=>{
   if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.anybike-model-research')||n.querySelector?.('.anybike-model-research')))))reconcileHistory();
  });
  mainObserver.observe(main,{childList:true,subtree:true});
  reconcileHistory();
 }
 const existing=main.querySelector('#ukR1250ModelGallery,#ukR1250HistoryCards');
 if(existing){
  existing.classList.add('anybike-master-model-years');
  const specs=main.querySelector('#generationPanel');
  if(specs&&specs.parentElement===main)specs.after(existing);
 }
 // Always prefer the restricted, public, exact-route Supabase history feed.
 // Changes to documented model history then appear on the next page load
 // without edits to any of these BMW HTML files.
 let published=null;
 try{published=await publishedBmwResearch();}
 catch(error){console.warn('Published model history unavailable; retaining existing guide',error);}
 if(published&&normalise(published.model)!==normalise(model))published=null;
 // One database source owns the introductory facts for all existing BMW
 // pages; the frozen R 1300 GS reference page is outside this shared shell.
 // Keep the pre-rendered introduction when the network is unavailable.
 if(published){
  const intro=hero.querySelector('#summary'),years=hero.querySelector('#years');
  if(intro&&text(published.hero_summary))intro.textContent=published.hero_summary;
  if(years&&text(published.hero_years))years.textContent=published.hero_years;
  hero.dataset.anybikeDatabaseModel=published.slug||'1';
 }
 if(published){
  try{
   const {applyBmwDatabaseSections,addDatabaseCountryNavigation}=await import('/model-template/bmw-db-research-sections.mjs');
   applyBmwDatabaseSections(body,published);
   // The existing public country guide routes are shared by all BMW models.
   // Add region-grouped links without treating route discovery as approval of
   // new model research or rewriting the approved model page layout.
   if(!published.country_markets?.length){
    const provider=window.supabase;
    const client=provider?.createClient?.('https://tuehtnezhdnkqbbhttgp.supabase.co','sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK');
    if(client){
     void client.rpc('public_anybike_country_navigation_v1').then(({data,error})=>{
      if(!error&&Array.isArray(data))addDatabaseCountryNavigation(body,data);
     }).catch(error=>console.warn('BMW country navigation unavailable; existing research retained',error));
    }
   }
  }catch(error){console.warn('BMW research enrichment unavailable; preserving original guide',error);}
 }
 // The same Supabase read also supplies published-documentation links.
 // Only add links not already present in the model's original research.
 if(Array.isArray(published?.references)){
  const existingSources=new Set([...main.querySelectorAll('a[href]')].map(a=>a.href));
  const seen=new Set();
  const references=published.references.filter(ref=>{
   if(!ref||!text(ref.label)||!safeSource(ref.url))return false;
   const url=new URL(ref.url).href;
   if(existingSources.has(url)||seen.has(url))return false;
   seen.add(url);return true;
  });
  if(references.length){
   const section=document.createElement('section');section.className='anybike-master-model-sources';
   section.setAttribute('aria-label','BMW model research documentation');
   const details=document.createElement('details');
   const heading=document.createElement('summary');heading.textContent='Further documented BMW research sources ('+references.length+')';
   const links=document.createElement('nav');links.setAttribute('aria-label','Additional BMW research sources');
   for(const ref of references){
    const a=document.createElement('a');a.href=ref.url;a.target='_blank';a.rel='noopener noreferrer';
    a.textContent=ref.label+' ↗';links.append(a);
   }
   details.append(heading,links);section.append(details);body.after(section);
  }
 }
 let events=Array.isArray(published?.generations)?published.generations.filter(x=>text(x.label)&&text(x.description)):[];
 if(!events.length&&!existing){
  try{
   const response=await fetch('/data/motorcycle-model-guides.json',{cache:'default'});
   if(!response.ok)throw Error('Model guide source unavailable');
   const data=await response.json();
   const local=Object.values(data.models||{}).find(g=>normalise(g.make)==='bmw'&&normalise(g.model)===normalise(model));
   events=Array.isArray(local?.production?.generations)?local.production.generations:[];
  }catch(error){console.warn('Model gallery unavailable; preserving existing page research',error);}
 }
 if(!events.length)return true;
 if(existing){
  // Preserve the already-approved R1250 year-by-year gallery and its photos.
  // The existing R 1250 GS gallery remains the authoritative model-year
  // section; don't append the same manufacturer generation a second time.
  return true;
 }
 // If the legacy guide already documents exact generations and specs,
 // it supplies the model-year section; avoid a second copy of the same text.
 if(generationPanel&&!generationPanel.hidden&&generationPanel.querySelector('.generation-detail')?.textContent?.trim())return true;
 if(main.querySelector('[data-anybike-master-gallery]'))return true;
 const section=document.createElement('section');section.className='anybike-master-model-years';section.dataset.anybikeMasterGallery='1';
 section.setAttribute('aria-label','Model years editions development and ownership');
 const h=document.createElement('h2');h.textContent='BMW '+model+' — model years and development';
 const intro=document.createElement('p');intro.textContent='Explore documented versions and model changes. Photographs and equipment must match the exact model and year.';
 const grid=document.createElement('div');grid.className='anybike-master-history-grid';
 for(const entry of events)grid.append(makeCard(entry,{compact:events.length===1}));
 section.append(h,intro,grid);
 // Approved order: introduction > exact stock (injected by shared header)
 // > documented specification > independent development > research.
 const panel=main.querySelector('#generationPanel');
 if(panel?.parentElement===main)panel.after(section);
 else body.before(section);
 return true;
}
if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',()=>void applyApprovedBmwPageShell(),{once:true});
}else void applyApprovedBmwPageShell();
