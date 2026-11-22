// AnyBike advertiser-first slot editor. Draft-only; existing live ads are untouched.
(()=>{'use strict';
const root=document.getElementById('adcontent');if(!root)return;
// Simple page finder replaces the legacy 333-row technical placement editor.
const picker=document.createElement('section');picker.id='abAdvertPageFinder';picker.dataset.abWorkspaceArea='placements';
picker.innerHTML='<h2>Choose a website page</h2><p style="color:#bbb;font-size:13px">Find a page, then manage its adverts. The template will make space automatically where supported.</p><div class="bar" style="gap:9px;align-items:center"><input type="search" id="abAdvertPageSearch" placeholder="Find a page, e.g. about-us or compare" aria-label="Find an advertising page" style="flex:1;min-width:180px"><button id="abAdvertPageReload" type="button">Refresh pages</button></div><p id="abAdvertPageStatus" role="status" style="color:#aaa;margin:9px 0"></p><div id="abAdvertPageList" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:8px;max-height:430px;overflow:auto"></div>';
const section=document.createElement('section');section.id='abSlotAdvertManager';section.dataset.abWorkspaceArea='placements';section.hidden=true;
section.innerHTML='<div class="bar" style="justify-content:space-between"><h2>Manage adverts for this page</h2><button type="button" id="abSlotClose">Close</button></div><p id="abSlotLocation"></p><p style="color:#bbb;font-size:13px">Choose adverts, preview the page, and publish when ready. Nothing changes publicly until you confirm.</p><label style="max-width:320px">Number of adverts<select id="abSlotCount"><option value="1">1 advert</option><option value="2">2 adverts</option><option value="3">3 adverts</option><option value="4">4 adverts</option></select></label><div id="abSlotChoosers" class="ab-slot-choosers"></div><h3>Layout preview</h3><div id="abSlotPreview" class="ab-slot-preview"></div><p id="abSlotStatus" role="status" style="color:#ccc"></p><div class="bar" style="gap:8px"><button type="button" id="abSlotDraftSave" class="primary" disabled>Save draft</button><button type="button" id="abSlotPreviewPage" disabled>Preview page</button><button type="button" id="abSlotCopyOpen" disabled>Choose pages</button><button type="button" id="abSlotPublishCheck" hidden disabled>Check publication readiness</button><button type="button" id="abSlotPublish" class="primary" disabled>Publish adverts</button><button type="button" id="abSlotRestore" hidden>Undo last publication</button></div><div id="abSlotCopyPanel" hidden style="margin-top:14px;padding:13px;border:1px solid #515151;border-radius:10px"><div class="bar" style="justify-content:space-between"><strong>Copy this layout to other pages</strong><button type="button" id="abSlotCopyClose">Close</button></div><p style="color:#bbb;font-size:12px">Tick the pages you want. Copies are saved safely; the current live adverts stay as they are.</p><label>Find page<input type="search" id="abSlotCopySearch" placeholder="Search page address"></label><p id="abSlotCopySummary" role="status"></p><div class="bar" style="margin:8px 0"><button type="button" id="abSlotCopy50">Select up to 50 matching pages</button><button type="button" id="abSlotCopyClear">Clear selection</button></div><div id="abSlotCopyTargets" style="display:grid;gap:7px;max-height:260px;overflow:auto;margin:10px 0"></div><button type="button" id="abSlotCopySave" class="primary" disabled>Save selected pages together</button></div><div id="abSlotPagePreview" hidden style="margin-top:16px;border:1px solid #555;border-radius:10px;padding:12px"><div class="bar" style="justify-content:space-between;margin-bottom:9px"><strong>Page preview · private draft, not published</strong><button type="button" id="abSlotHidePage">Close preview</button></div><p style="font-size:12px;color:#bbb">The existing public advert is replaced only inside this admin preview, not on the live website. Scroll within the preview to see the placement.</p><iframe id="abSlotPageFrame" title="Private preview of proposed adverts in the actual page" style="display:block;width:100%;height:690px;border:1px solid #444;border-radius:8px;background:#090909"></iframe></div>';
const style=document.createElement('style');style.textContent='#adcontent .ab-slot-choosers{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:12px;margin:12px 0}#adcontent .ab-slot-ad-choice{display:grid;gap:9px;padding:11px;border:1px solid #484848;border-radius:9px;background:#161616;min-width:0}#adcontent .ab-slot-choosers label{display:grid;gap:5px;min-width:0}#adcontent .ab-slot-choosers select{width:100%;min-width:0}#adcontent .ab-slot-preview{display:grid;grid-template-columns:repeat(var(--count,1),minmax(0,1fr));gap:12px;margin:10px 0 15px}#adcontent .ab-slot-preview article{min-width:0;border:1px solid #555;border-radius:10px;background:#111;padding:10px;overflow:hidden}#adcontent .ab-slot-image-frame{display:grid;place-items:center;width:100%;max-width:100%;overflow:hidden;border-radius:10px;background:transparent}#adcontent .ab-slot-preview img{display:block;width:100%;height:100%;object-fit:contain;border-radius:10px}#adcontent .ab-slot-preview strong{display:block;font-size:12px;margin-bottom:8px;overflow-wrap:anywhere}#adcontent .ab-slot-preview small{display:block;width:100%;text-align:center;color:#aaa;font-size:11px}#adcontent #abSlotPublishCheck[hidden]{display:none!important}#adcontent #abSlotPagePreview[hidden]{display:none!important}#adcontent #abSlotPagePreview iframe{max-width:100%}@media(max-width:730px){#adcontent .ab-slot-preview{grid-template-columns:1fr!important}}';document.head.append(style);
const before=document.getElementById('namedAdvertisingSpaces');if(before){root.insertBefore(picker,before);root.insertBefore(section,before)}else{root.append(picker,section)};
const $=id=>document.getElementById(id),loc=$('abSlotLocation'),cnt=$('abSlotCount'),choosers=$('abSlotChoosers'),preview=$('abSlotPreview'),status=$('abSlotStatus'),save=$('abSlotDraftSave'),pageButton=$('abSlotPreviewPage'),pageWrap=$('abSlotPagePreview'),pageFrame=$('abSlotPageFrame'),copyOpen=$('abSlotCopyOpen'),copyPanel=$('abSlotCopyPanel'),copySearch=$('abSlotCopySearch'),copyTargets=$('abSlotCopyTargets'),copySummary=$('abSlotCopySummary'),copySave=$('abSlotCopySave'),copy50=$('abSlotCopy50'),copyClear=$('abSlotCopyClear'),checkPublish=$('abSlotPublishCheck'),publish=$('abSlotPublish'),restore=$('abSlotRestore');
let db,campaigns=[],customers=[],current=null,draft=null,artworkMasters=new Map(),selectedFormats=[],copyInventory=[],copySelected=new Set(),copyExisting=new Set(),publishedRecord=null,publicationReady=false;
const formatNames={slim:'Slim banner · 3:1',square:'Square advert · 1:1',stock_card:'Stock card · 4:3',landscape:'Landscape · 16:9',portrait:'Portrait · 4:5'};
const formatRatios={slim:'3 / 1',square:'1 / 1',stock_card:'4 / 3',landscape:'16 / 9',portrait:'4 / 5'};
function artwork(c,format){
 if(!c)return '';
 const master=artworkMasters.get(c.partner_id+'|'+format);
 if(master)return master;
 const field={slim:'slim_image_url',square:'compact_image_url',stock_card:'stock_card_image_url',landscape:'desktop_image_url',portrait:'mobile_image_url'}[format]||'slim_image_url';
 return c[field]||'';
}
function hasArtwork(c,format){return /^https:\/\//.test(artwork(c,format))}
function currentFormats(){return [...choosers.querySelectorAll('select[data-shape]')].map(s=>s.value)}
function currentCampaigns(){return [...choosers.querySelectorAll('select[data-campaign]')].map(s=>s.value)}
function options(format){return campaigns.filter(c=>c.status==='active'&&hasArtwork(c,format)&&/^https:\/\//.test(c.destination_url||''))}
function selections(){return currentCampaigns()}
function render(){
 const values=selections(),formats=currentFormats(),num=Number(cnt.value);
 while(values.length<num)values.push('');
 while(formats.length<num)formats.push(selectedFormats[formats.length]||'slim');
 choosers.replaceChildren();
for(let i=0;i<num;i++){
 const group=document.createElement('div');group.className='ab-slot-ad-choice';
 const shapeLabel=document.createElement('label');shapeLabel.textContent='Advert '+(i+1)+' · artwork shape';
 const shape=document.createElement('select');shape.dataset.shape='1';shape.setAttribute('aria-label','Artwork shape for advert '+(i+1));
 for(const [key,name] of Object.entries(formatNames))shape.append(new Option(name,key));
 shape.value=formats[i];shapeLabel.append(shape);
 const campaignLabel=document.createElement('label');campaignLabel.textContent='Advertising customer and advert';
 const sel=document.createElement('select');sel.dataset.campaign='1';sel.setAttribute('aria-label','Advert '+(i+1)+' campaign');
 function populate(id){sel.replaceChildren(new Option('Choose advertiser and advert',''));for(const c of options(shape.value)){const owner=customers.find(p=>p.id===c.partner_id);sel.append(new Option((owner?.name||'Unassigned')+' · '+c.name,c.id))}if([...sel.options].some(o=>o.value===id))sel.value=id;}
 populate(values[i]||'');
 shape.onchange=()=>{const previous=sel.value;selectedFormats[i]=shape.value;populate(previous);showPreview()};
 sel.onchange=()=>{const selected=selections().filter(Boolean);if(new Set(selected).size!==selected.length){sel.value='';status.textContent='Choose a different campaign for each advert.';}else{status.textContent='Replacement selected. Preview the page, then save or publish when eligible.';}showPreview()};
 campaignLabel.append(sel);
 const replace=document.createElement('button');replace.type='button';replace.textContent='Replace advert '+(i+1);
 replace.className='ab-slot-replace';replace.style.cssText='justify-self:start;padding:7px 12px;background:#242424;border:1px solid #666;border-radius:7px;color:#fff';
 replace.onclick=()=>{sel.focus();sel.scrollIntoView({block:'nearest',behavior:'smooth'});status.textContent='Choose the replacement for advert '+(i+1)+'. The other adverts and artwork shapes will stay the same.'};
 group.append(shapeLabel,campaignLabel,replace);choosers.append(group);
 }
 showPreview()}
function showPreview(){
 const ids=selections(),formats=currentFormats(),unique=ids.every(Boolean)&&new Set(ids).size===ids.length&&ids.every((id,i)=>{const c=campaigns.find(x=>x.id===id);return c&&hasArtwork(c,formats[i])});
 selectedFormats=[...formats];preview.replaceChildren();preview.style.setProperty('--count',String(ids.length));
 for(let i=0;i<ids.length;i++){
  const c=campaigns.find(v=>v.id===ids[i]),format=formats[i];const art=document.createElement('article');
  const title=document.createElement('strong');title.textContent=c?.name||'Choose an advert';art.append(title);
  if(c&&hasArtwork(c,format)){
   const frame=document.createElement('div');frame.className='ab-slot-image-frame';frame.style.aspectRatio=formatRatios[format]||'3 / 1';
   const img=document.createElement('img');img.src=artwork(c,format);img.alt=c.alt_text||c.name;img.loading='lazy';
   frame.append(img);art.append(frame);
  }
  const note=document.createElement('small');note.textContent='Advertisement';art.append(note);preview.append(art);
 }
 save.disabled=!current||!unique;pageButton.disabled=!current||!unique;copyOpen.disabled=!current||!unique;checkPublish.disabled=!current||!unique;publish.disabled=!current||!unique;publicationReady=false;
}
cnt.onchange=render;
$('abSlotClose').onclick=()=>{section.hidden=true;pageWrap.hidden=true;copyPanel.hidden=true;pageFrame.removeAttribute('src')};
$('abSlotHidePage').onclick=()=>{pageWrap.hidden=true;pageFrame.removeAttribute('src')};
async function open(detail){const {slotCode,pagePath}=detail||{};if(!slotCode||!pagePath)return;current={slotCode,pagePath};section.hidden=false;pageWrap.hidden=true;copyPanel.hidden=true;publishedRecord=null;publish.disabled=true;restore.hidden=true;pageFrame.removeAttribute('src');loc.textContent=pagePath+' · '+slotCode;status.textContent='Loading approved campaigns and any saved draft…';
try{if(typeof getAdminSupabaseClient!=='function')throw Error('Admin connection missing');db=getAdminSupabaseClient();const admin=await db.rpc('anybike_is_admin');if(admin.error||admin.data!==true)throw Error('Administrator access required');
const results=await Promise.all([db.from('advertising_campaigns').select('id,name,status,partner_id,desktop_image_url,slim_image_url,stock_card_image_url,mobile_image_url,compact_image_url,destination_url,alt_text').order('name'),db.from('commercial_partners').select('id,name').order('name'),db.from('advertising_slot_layout_drafts').select('slot_code,page_path,campaign_ids,advert_count,artwork_formats').eq('slot_code',slotCode).maybeSingle(),db.from('advertising_partner_artwork_library').select('partner_id,creative_format,active_artwork_id').not('active_artwork_id','is',null),db.from('advertising_slot_published_layouts').select('slot_code,page_path,campaign_ids,artwork_formats,advert_count').eq('slot_code',slotCode).maybeSingle()]);const fail=results.find(r=>r.error);if(fail)throw fail.error;
campaigns=results[0].data||[];customers=results[1].data||[];draft=results[2].data||null;publishedRecord=results[4].data||null;restore.hidden=!publishedRecord;
 artworkMasters=new Map();
 const refs=results[3].data||[],ids=[...new Set(refs.map(r=>r.active_artwork_id).filter(Boolean))];
 if(ids.length){
  const versions=await db.from('advertising_client_artwork').select('id,public_url,status').in('id',ids);
  if(versions.error)throw versions.error;
  const byId=new Map((versions.data||[]).filter(v=>v.status==='approved').map(v=>[v.id,v.public_url]));
  for(const entry of refs){const url=byId.get(entry.active_artwork_id);if(url&&/^https:\/\//.test(url))artworkMasters.set(entry.partner_id+'|'+entry.creative_format,url)}
 }
selectedFormats=draft?.artwork_formats?.length?draft.artwork_formats.slice():[];cnt.value=String(draft?.advert_count||1);render();if(draft){const selects=[...choosers.querySelectorAll('select[data-campaign]')];draft.campaign_ids.forEach((id,i)=>{if(selects[i])selects[i].value=id});showPreview();}
status.textContent=publishedRecord?'A layout is live here. Preview any changes before publishing.':draft?'Your layout is saved. The live website is unchanged.':'Choose your adverts to get started.';
}catch(e){status.textContent='Unable to load adverts: '+(e.message||e);save.disabled=true;pageButton.disabled=true;copyOpen.disabled=true}
section.scrollIntoView({behavior:'smooth',block:'start'});}
save.onclick=async()=>{if(!current||!db)return;const ids=selections(),formats=currentFormats();if(ids.some((id,i)=>!options(formats[i]).some(c=>c.id===id))||new Set(ids).size!==ids.length){status.textContent='Choose distinct active campaigns for all positions.';return}
if(!confirm('Save '+ids.length+' adverts as a DRAFT for '+current.pagePath+'? Nothing will be published.'))return;
save.disabled=true;try{const payload={slot_code:current.slotCode,page_path:current.pagePath,advert_count:ids.length,campaign_ids:ids,artwork_formats:formats,updated_at:new Date().toISOString()};const result=await db.from('advertising_slot_layout_drafts').upsert(payload,{onConflict:'slot_code'}).select('slot_code,advert_count,campaign_ids,artwork_formats').single();if(result.error)throw result.error;if(result.data.campaign_ids.length!==ids.length||result.data.artwork_formats.length!==ids.length)throw Error('Draft not fully verified');status.textContent='Saved '+ids.length+'-advert layout draft. Existing public advertising unchanged.';}catch(e){status.textContent='Draft not saved: '+(e.message||e)}finally{showPreview()}};

// Render proposed layout within the actual same-origin page without saving or
// changing its public database configuration. This is admin-only DOM preview.
pageButton.onclick=()=>{
 if(!current||save.disabled||pageButton.disabled)return;
 const ids=selections(),formats=currentFormats(),items=ids.map((id,i)=>{
  const campaign=campaigns.find(c=>c.id===id);
  if(!campaign||!hasArtwork(campaign,formats[i]))return null;
  return {name:campaign.name,src:artwork(campaign,formats[i]),alt:campaign.alt_text||campaign.name,ratio:formatRatios[formats[i]]||'1 / 1'};
 });
 if(items.some(x=>!x)){status.textContent='Select approved artwork for every advert before previewing.';return}
 if(!/^\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.html$/i.test(current.pagePath)){
  status.textContent='This page cannot be previewed safely here.';return
 }
 pageWrap.hidden=false;
 const slotCode=current.slotCode,pagePath=current.pagePath;
 pageFrame.onload=async()=>{
  try{
   const doc=pageFrame.contentDocument;
   if(!doc||pageFrame.contentWindow.location.origin!==location.origin)throw Error('Same-origin preview unavailable');
   let slot=[...doc.querySelectorAll('.managed-ad-space[data-ad-slot]')].find(n=>n.dataset.adSlot===slotCode);
   if(!slot){
    const inv=await db.from('advertising_page_inventory').select('slot_code,placement_key').eq('page_path',pagePath).maybeSingle();
    if(inv.error||inv.data?.slot_code!==slotCode)throw Error('Advertising location unavailable');
    const main=doc.querySelector('main'),key=inv.data.placement_key;
    if(key==='stock_grid'){
     const stock=doc.getElementById('stockGrid');
     if(!stock)throw Error('Available Stock motorcycle grid is unavailable');
     const old=doc.getElementById('anybike-move-universal-house-ad');if(old)old.style.display='none';
     const cards=items.map(item=>{
      const card=doc.createElement('article'),image=doc.createElement('img'),label=doc.createElement('small');
      card.className='card anybike-private-stock-ad';card.style.cssText='display:flex;flex-direction:column;position:relative;min-width:0;background:transparent;border:0;box-shadow:none;overflow:visible';
      image.src=item.src;image.alt=item.alt;image.style.cssText='display:block;width:100%;height:100%;object-fit:contain;border-radius:12px';
      label.textContent='Advertisement';label.style.cssText='position:absolute;top:100%;left:0;right:0;padding-top:3px;text-align:center;font:11px Arial,sans-serif;color:#aaa';
      card.append(image,label);return card;
     });
     const apply=()=>{
      if(pageWrap.hidden||!pageFrame.isConnected)return;
      // Remove only the old Move card in this private preview.
      for(const ad of [...stock.querySelectorAll(':scope > .anybike-move-stock-ad')])ad.style.display='none';
      const bikes=[...stock.querySelectorAll(':scope > article.card:not(.anybike-move-stock-ad):not(.anybike-private-stock-ad)')];
      if(!bikes.length){status.textContent='Waiting for the stock cards to load in preview…';return}
      const anchors=cards.map((_,i)=>bikes[Math.min(bikes.length-1,Math.max(0,Math.ceil((i+1)*bikes.length/(cards.length+1))-1))]);
      const correct=cards.every((card,i)=>{if(card.parentElement!==stock)return false;let prev=card.previousElementSibling;while(prev?.classList.contains('anybike-private-stock-ad'))prev=prev.previousElementSibling;return prev===anchors[i]});
      if(!correct){cards.forEach(c=>c.remove());for(let i=cards.length-1;i>=0;i--)anchors[i].after(cards[i])}
      const height=Math.ceil(bikes[0].getBoundingClientRect().height);
      if(height>=100)for(const card of cards){card.style.height=height+'px';card.querySelector('img').style.height=height+'px'}
      stock.style.rowGap='24px';status.textContent='Private Available Stock preview: '+cards.length+' adverts placed among motorcycles. Nothing published.';
      if(cards[0].isConnected&&!stock.__anybikeScrolledForPreview){stock.__anybikeScrolledForPreview=true;cards[0].scrollIntoView({block:'center',behavior:'instant'})}
     };
     let pending=false;
     const schedule=()=>{if(pending)return;pending=true;pageFrame.contentWindow.requestAnimationFrame(()=>{pending=false;apply()})};
     const observer=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('anybike-private-stock-ad'))))schedule()});
     observer.observe(stock,{childList:true});
     if(typeof doc.defaultView.ResizeObserver==='function'){const resize=new doc.defaultView.ResizeObserver(schedule);resize.observe(stock)}
     schedule();return;
    }
    if(!main||!['main_end','about_wrap','before_sources','export_wrap','freight_wrap','sell_wrap'].includes(key))throw Error('No suitable page advertising position');
    slot=doc.createElement('section');slot.className='managed-ad-space';slot.dataset.adSlot=slotCode;slot.dataset.market='GB';
    slot.style.cssText='width:100%;max-width:1200px;min-width:0;margin:16px auto 22px;box-sizing:border-box;clear:both;display:block';
    let parent=main,before=null;
    if(key==='before_sources'){
     if(!main.querySelector('#databaseHeroPhoto')||!main.querySelector('#nextAction'))throw Error('This model template is missing its advert position');
     before=main.querySelector('#modelSources');
    }else if(key==='about_wrap'){
     let wrap=doc.getElementById('anybike-move-about-wrap');
     if(!wrap){wrap=doc.createElement('div');wrap.className='wrap';wrap.id='anybike-move-about-wrap';wrap.style.cssText='margin:20px auto 24px;box-sizing:border-box;min-width:0';main.append(wrap)}
     parent=wrap;
    }else if(key==='export_wrap'||key==='freight_wrap'||key==='sell_wrap'){
     const wrap=doc.createElement('div');wrap.style.cssText='width:100%;max-width:1200px;margin:20px auto 24px;box-sizing:border-box;min-width:0';main.append(wrap);parent=wrap;
    }
    // Replace the existing visible advert only inside the private preview.
    const live=doc.getElementById('anybike-move-universal-house-ad');
    if(live)live.style.display='none';
    if(before)parent.insertBefore(slot,before);else parent.append(slot);
   }
   const style=doc.createElement('style');
   style.textContent='.anybike-private-layout-preview{display:grid!important;grid-template-columns:repeat('+items.length+',minmax(0,1fr));gap:clamp(8px,1.3vw,16px);width:100%;max-width:none;min-width:0;margin:10px 0}.anybike-private-layout-preview article{min-width:0;margin:0;background:transparent;border:0}.anybike-private-layout-preview img{display:block;width:100%;height:auto;object-fit:contain;border-radius:12px}.anybike-private-layout-preview small{display:block;color:#aaa;text-align:center;font:11px Arial,sans-serif;margin-top:4px}@media(max-width:680px){.anybike-private-layout-preview{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:420px){.anybike-private-layout-preview{grid-template-columns:1fr!important}}';
   doc.head.append(style);
   const host=doc.createElement('div');host.className='anybike-private-layout-preview';
   for(const item of items){
    const card=doc.createElement('article'),img=doc.createElement('img'),label=doc.createElement('small');
    img.src=item.src;img.alt=item.alt;img.loading='eager';img.style.aspectRatio=item.ratio;
    label.textContent='Advertisement';label.style.cssText='display:block;width:100%;text-align:center';
    card.append(img,label);host.append(card);
   }
   const apply=()=>{
    if(!host.isConnected||slot.childNodes.length!==1||slot.firstChild!==host)slot.replaceChildren(host);
   };
   apply();
   const observer=new MutationObserver(()=>{if(pageWrap.hidden||!pageFrame.isConnected){observer.disconnect();return}apply()});
   observer.observe(slot,{childList:true});
   slot.scrollIntoView({block:'center',behavior:'instant'});
   status.textContent='Private page preview displayed. The live website remains unchanged.';
  }catch(e){status.textContent='Page preview unavailable: '+(e.message||e)}
 };
 pageFrame.src=pagePath;
};



// Publication is independent of saving drafts. Check every campaign against
// the same public approved creative projection used by the Edge Function.
async function publicationEligibility(){
 const ids=selections(),formats=currentFormats();
 if(!current||ids.length<1||ids.some((id,i)=>!options(formats[i]).some(c=>c.id===id))||new Set(ids).size!==ids.length)
  return {ready:false,message:'Select distinct active campaigns with approved artwork first.'};
 const [inventory,publicAds]=await Promise.all([
  db.from('advertising_page_inventory').select('page_path,page_category,placement_enabled,excluded,slot_code,market_scope,placement_key').eq('page_path',current.pagePath).maybeSingle(),
  db.from('public_advertising_creatives_v1').select('id,countries,page_categories,page_paths,manufacturers,models,customer_types,placement,destination_url').in('id',ids)
 ]);
 if(inventory.error||publicAds.error)throw inventory.error||publicAds.error;
 const p=inventory.data;
 if(!p||!p.placement_enabled||p.excluded||p.slot_code!==current.slotCode)return {ready:false,message:'This named advertising location is not currently eligible for a published multi-advert layout.'};
 const matches=publicAds.data||[],bad=[];
 for(const id of ids){
  const c=campaigns.find(x=>x.id===id),a=matches.find(x=>x.id===id);
  // A directly assigned page is the admin's explicit targeting decision.
  // Keep real checks (active/approved campaign, country, expiry, approved artwork).
  // Ignore only older automatic page/category targeting rules.
  if(!a||a.placement!=='below_hero'||!a.countries?.includes('GB')||
    !/^https:\/\//.test(a.destination_url||''))bad.push(c?.name||id);
 }
 if(bad.length)return {ready:false,message:'These adverts cannot be published yet because their campaigns are inactive, expired, outside the UK audience or missing required approval: '+bad.map(n=>n.split(' — ')[0]).join(', ')+'. The existing live adverts are unchanged.'};
 // The page must already have the matching named slot. Never invent a placement.
 const response=await fetch(current.pagePath,{credentials:'same-origin',cache:'no-store'});
 if(!response.ok)throw Error('Cannot verify actual page location');
 const html=await response.text();
 const documentSnapshot=new DOMParser().parseFromString(html,'text/html');
 const anchor=[...documentSnapshot.querySelectorAll('.managed-ad-space[data-ad-slot][data-market="GB"]')]
  .find(n=>n.dataset.adSlot===current.slotCode);
 if(!anchor){
  const supported=new Set(['main_end','about_wrap','before_sources','export_wrap','freight_wrap','sell_wrap','stock_grid']);
  const main=documentSnapshot.querySelector('main');
  if(!main||!supported.has(p.placement_key)||p.placement_key==='stock_grid'&&!main.querySelector('#stockGrid')||p.placement_key==='before_sources'&&(!main.querySelector('#databaseHeroPhoto')||!main.querySelector('#nextAction')))
   return {ready:false,message:'This page does not yet have a suitable advertising space in its template.'};
 }
 if(!ids.every((id,i)=>artworkMasters.has(campaigns.find(x=>x.id===id)?.partner_id+'|'+formats[i])))
  return {ready:false,message:'At least one advert needs an approved artwork master for its selected shape.'};
 return {ready:true,message:'All campaigns are eligible for this page and approved artwork shapes are available. Publishing will replace the existing live layout.'};
}
checkPublish.onclick=async()=>{
 if(!db||!current)return;
 publicationReady=false;publish.hidden=true;publish.disabled=true;
 checkPublish.disabled=true;status.textContent='Checking live eligibility, page targeting and approved artwork…';
 try{
  const result=await publicationEligibility();publicationReady=result.ready;publish.hidden=!result.ready;publish.disabled=!result.ready;status.textContent=result.message;
 }catch(e){status.textContent='Publication check failed: '+(e.message||e)}
 finally{checkPublish.disabled=false}
};
publish.onclick=async()=>{
 if(!db||!current||publish.disabled)return;
 publish.disabled=true;
 try{
  // Automatically check all safety rules as part of publishing.
  const result=await publicationEligibility();
  if(!result.ready){status.textContent="Nothing has changed on the website. "+result.message;return;}
  if(!confirm('PUBLISH this layout publicly on '+current.pagePath+'? This will replace the current live advert(s) for visitors.'))return;
  const ids=selections(),formats=currentFormats(),payload={slot_code:current.slotCode,page_path:current.pagePath,
   campaign_ids:ids,artwork_formats:formats,advert_count:ids.length,published_at:new Date().toISOString()};
  const written=await db.from('advertising_slot_published_layouts').upsert(payload,{onConflict:'slot_code'}).select('slot_code,campaign_ids,artwork_formats,advert_count').single();
  if(written.error)throw written.error;
  if(written.data.advert_count!==ids.length||written.data.campaign_ids.join(',')!==ids.join(','))throw Error('Published layout verification failed');
  publishedRecord=written.data;restore.hidden=false;status.textContent='Published configuration saved. Check the live page to confirm delivery; existing single-advert fallback remains available.';
 }catch(e){status.textContent='Nothing changed on the website. '+(e.message||e)}
 finally{publicationReady=false;showPreview()}
};
restore.onclick=async()=>{
 if(!db||!current||!publishedRecord)return;
 if(!confirm('RESTORE the previous live advertising arrangement on '+current.pagePath+'?'))return;
 restore.disabled=true;
 try{
  const histories=await db.from('advertising_slot_layout_history').select('id,slot_code,page_path,campaign_ids,artwork_formats,advert_count').eq('slot_code',current.slotCode).order('id',{ascending:false}).limit(1);
  if(histories.error)throw histories.error;
  const last=histories.data?.[0];
  if(last&&last.page_path===current.pagePath){
   const res=await db.from('advertising_slot_published_layouts').upsert({slot_code:current.slotCode,page_path:last.page_path,
    campaign_ids:last.campaign_ids,artwork_formats:last.artwork_formats,advert_count:last.advert_count,published_at:new Date().toISOString()},{onConflict:'slot_code'}).select('slot_code').single();
   if(res.error)throw res.error;
   status.textContent='Previous multi-advert layout restored. Verify it on the public page.';
  }else{
   const res=await db.from('advertising_slot_published_layouts').delete().eq('slot_code',current.slotCode).select('slot_code');
   if(res.error||res.data?.length!==1)throw res.error||Error('Restore could not be verified');
   status.textContent='Previous original advertising arrangement restored. The existing single-advert system now applies.';
   publishedRecord=null;restore.hidden=true;
  }
 }catch(e){status.textContent='Could not restore previous layout: '+(e.message||e)}
 finally{restore.disabled=false}
};

// Copy a validated selection to OTHER registered page slots as drafts only.
// No public inventory flags, live campaigns or existing drafts are modified.
function showCopyTargets(){
 const term=copySearch.value.trim().toLowerCase();
 const matches=copyInventory.filter(p=>p.page_path.toLowerCase().includes(term)||p.slot_code.toLowerCase().includes(term));
 copyTargets.replaceChildren();
 for(const p of matches.slice(0,80)){
  const key=p.slot_code,label=document.createElement('label'),checkbox=document.createElement('input');
  checkbox.type='checkbox';checkbox.checked=copySelected.has(key);checkbox.disabled=copyExisting.has(key);
  checkbox.onchange=()=>{if(checkbox.checked&&copySelected.size>=50&&!copySelected.has(key)){checkbox.checked=false;copySummary.textContent='50 pages selected. Save this batch, then choose another.';return}checkbox.checked?copySelected.add(key):copySelected.delete(key);showCopySummary()};
  label.style.cssText='display:flex;align-items:center;gap:8px;padding:7px;border:1px solid #444;border-radius:6px;min-width:0;cursor:pointer';
  const text=document.createElement('span');text.textContent=p.page_path+' · '+p.slot_code+(copyExisting.has(key)?' · already has draft':'');
  text.style.overflowWrap='anywhere';label.append(checkbox,text);copyTargets.append(label);
 }
 copySummary.textContent=matches.length+' matching locations · '+copySelected.size+' selected'+(matches.length>80?' · showing first 80; refine your search':'');
 copySave.disabled=!copySelected.size||copySelected.size>50;
}
function showCopySummary(){copySummary.textContent=copySelected.size+' pages selected · copies will be drafts only';copySave.disabled=!copySelected.size||copySelected.size>50}
copySearch.oninput=showCopyTargets;
copy50.onclick=()=>{
 const term=copySearch.value.trim().toLowerCase();
 const matches=copyInventory.filter(p=>(p.page_path.toLowerCase().includes(term)||p.slot_code.toLowerCase().includes(term))&&!copyExisting.has(p.slot_code));
 for(const p of matches){if(copySelected.size>=50)break;copySelected.add(p.slot_code)}
 showCopyTargets();copySummary.textContent=copySelected.size+' pages selected. Save all 50 in one action; no adverts published.';
};
copyClear.onclick=()=>{copySelected.clear();showCopyTargets()};
$('abSlotCopyClose').onclick=()=>{copyPanel.hidden=true};
copyOpen.onclick=async()=>{
 if(!current||copyOpen.disabled||!db)return;
 copyPanel.hidden=false;copyTargets.replaceChildren();copySummary.textContent='Loading existing advertising locations…';copyOpen.disabled=true;
 try{
  const [locations,existing]=await Promise.all([
   db.from('advertising_page_inventory').select('page_path,slot_code,placement_enabled,excluded').order('page_path').limit(1000),
   db.from('advertising_slot_layout_drafts').select('slot_code').limit(1000)
  ]);
  if(locations.error||existing.error)throw locations.error||existing.error;
  copyExisting=new Set((existing.data||[]).map(r=>r.slot_code));
  copyInventory=(locations.data||[]).filter(p=>p.page_path&&/^\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.html$/i.test(p.page_path)&&/^AB-[A-Z0-9-]+$/.test(p.slot_code||'')&&p.slot_code!==current.slotCode&&!copyExisting.has(p.slot_code));
  copySelected.clear();copySearch.value='';showCopyTargets();
 }catch(e){copySummary.textContent='Cannot load destinations: '+(e.message||e)}
 finally{copyOpen.disabled=false}
};
copySave.onclick=async()=>{
 if(!db||!current||!copySelected.size)return;if(copySelected.size>50){copySummary.textContent='Save up to 50 pages per batch.';return}
 const ids=selections(),formats=currentFormats(),targets=copyInventory.filter(p=>copySelected.has(p.slot_code));
 if(ids.length<1||ids.length>4||ids.some((id,i)=>!options(formats[i]).some(c=>c.id===id))||new Set(ids).size!==ids.length){
  copySummary.textContent='Choose valid, distinct campaigns before copying.';return;
 }
 if(!confirm('Copy '+ids.length+' adverts as drafts to '+targets.length+' other page(s)? Existing drafts and live adverts will not change.'))return;
 copySave.disabled=true;
 let created=0,skipped=0;
 try{
  for(const target of targets){
   // Re-check before each insert; only INSERT avoids overwriting an existing draft.
   const row={slot_code:target.slot_code,page_path:target.page_path,advert_count:ids.length,campaign_ids:ids,artwork_formats:formats,updated_at:new Date().toISOString()};
   const result=await db.from('advertising_slot_layout_drafts').upsert(row,{onConflict:'slot_code',ignoreDuplicates:true}).select('slot_code');
   if(result.error)throw result.error;
   if(result.data?.length)created++;else skipped++;
  }
  copySummary.textContent=created+' draft layout(s) copied'+(skipped?' · '+skipped+' existing draft(s) preserved':'')+'. No live adverts changed. Check target-page eligibility before publishing.';
  copySelected.clear();
  const fresh=await db.from('advertising_slot_layout_drafts').select('slot_code').limit(1000);
  if(!fresh.error)copyExisting=new Set((fresh.data||[]).map(r=>r.slot_code));
  showCopyTargets();
  copySummary.textContent=created+' draft layout(s) copied'+(skipped?' · '+skipped+' unchanged':'')+'. Nothing published.';
 }catch(e){copySummary.textContent='Some pages could not be saved ('+created+' completed): '+(e.message||e)}
 finally{copySave.disabled=!copySelected.size}
};


const finderInput=document.getElementById('abAdvertPageSearch'),finderList=document.getElementById('abAdvertPageList'),finderStatus=document.getElementById('abAdvertPageStatus');
let finderPages=[],finderReady=false;
const supportedPageKeys=new Set(['main_end','about_wrap','before_sources','export_wrap','freight_wrap','sell_wrap','stock_grid']);
function renderFinder(){
 const q=finderInput.value.trim().toLowerCase();
 const matching=finderPages.filter(p=>!q||(p.page_path+' '+p.slot_code).toLowerCase().includes(q));
 finderList.replaceChildren();
 for(const p of matching.slice(0,48)){
  const card=document.createElement('div');card.style.cssText='display:flex;gap:9px;align-items:center;justify-content:space-between;border:1px solid #484848;border-radius:9px;padding:10px;background:#171717;min-width:0';
  const name=document.createElement('span');name.textContent=p.page_path;name.style.cssText='min-width:0;overflow-wrap:anywhere;font-size:13px';
  const button=document.createElement('button');button.type='button';button.textContent='Manage adverts';
  button.onclick=()=>open({pagePath:p.page_path,slotCode:p.slot_code});
  card.append(name,button);finderList.append(card);
 }
 finderStatus.textContent=matching.length+' advertising page'+(matching.length===1?'':'s')+' found'+(matching.length>48?' · showing first 48; type to narrow the list':'');
}
async function loadFinder(){
 if(typeof getAdminSupabaseClient!=='function')return;
 finderStatus.textContent='Loading website pages…';
 try{
  const client=getAdminSupabaseClient();
  const admin=await client.rpc('anybike_is_admin');if(admin.error||admin.data!==true)throw Error('Administrator access required');
  const result=await client.from('advertising_page_inventory').select('page_path,slot_code,placement_key,excluded').order('page_path').limit(1000);
  if(result.error)throw result.error;
  finderPages=(result.data||[]).filter(p=>p.slot_code&&/^AB-[A-Z0-9-]+$/.test(p.slot_code)&&p.page_path&&/^\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.html$/i.test(p.page_path)&&!p.excluded&&supportedPageKeys.has(p.placement_key));
  finderReady=true;renderFinder();
 }catch(error){finderStatus.textContent='Unable to load pages: '+(error.message||error)}
}
finderInput.oninput=()=>{if(finderReady)renderFinder()};
document.getElementById('abAdvertPageReload').onclick=loadFinder;
loadFinder();

window.addEventListener('anybike:manage-slot-adverts',event=>open(event.detail));
})();