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
const makeCard=entry=>{
 const article=document.createElement('article');article.className='anybike-master-history-card';
 const h=document.createElement('h3');h.textContent=text(entry.label)||'Documented model development';
 const desc=document.createElement('p');desc.textContent=text(entry.description)||'Confirm the specification and model year for an individual motorcycle.';
 article.append(h,desc);
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
 // Existing production model guides are also hydrated by the page's own loader;
 // this is a separate presentation pass, never a replacement for it.
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
  // Display any future database history updates as sourced references within
  // the same section, never as a duplicate model-year gallery.
  const details=document.createElement('details');details.className='anybike-master-db-updates';
  const heading=document.createElement('summary');heading.textContent='Documented BMW research references';
  const grid=document.createElement('div');grid.className='anybike-master-history-grid';
  for(const event of events)grid.append(makeCard(event));
  details.append(heading,grid);existing.append(details);
  return true;
 }
 if(main.querySelector('[data-anybike-master-gallery]'))return true;
 const section=document.createElement('section');section.className='anybike-master-model-years';section.dataset.anybikeMasterGallery='1';
 section.setAttribute('aria-label','Model years editions development and ownership');
 const h=document.createElement('h2');h.textContent='BMW '+model+' — model years and development';
 const intro=document.createElement('p');intro.textContent='Explore documented versions and model changes. Photographs and equipment must match the exact model and year.';
 const grid=document.createElement('div');grid.className='anybike-master-history-grid';
 for(const entry of events)grid.append(makeCard(entry));
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
