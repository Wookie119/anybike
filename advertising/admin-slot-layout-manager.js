// AnyBike advertiser-first slot editor. Draft-only; existing live ads are untouched.
(()=>{'use strict';
const root=document.getElementById('adcontent');if(!root)return;
const section=document.createElement('section');section.id='abSlotAdvertManager';section.dataset.abWorkspaceArea='placements';section.hidden=true;
section.innerHTML='<div class="bar" style="justify-content:space-between"><h2>Manage adverts for this page</h2><button type="button" id="abSlotClose">Close</button></div><p id="abSlotLocation"></p><p style="color:#bbb;font-size:13px">Choose up to four different approved campaigns for this position. Preview the proposed layout and save a draft. Publishing is not enabled here; existing live adverts remain unchanged.</p><label style="max-width:320px">Number of adverts<select id="abSlotCount"><option value="1">1 advert</option><option value="2">2 adverts</option><option value="3">3 adverts</option><option value="4">4 adverts</option></select></label><div id="abSlotChoosers" class="ab-slot-choosers"></div><h3>Layout preview</h3><div id="abSlotPreview" class="ab-slot-preview"></div><p id="abSlotStatus" role="status" style="color:#ccc"></p><button type="button" id="abSlotDraftSave" class="primary" disabled>Save layout as draft</button>';
const style=document.createElement('style');style.textContent='#adcontent .ab-slot-choosers{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:12px;margin:12px 0}#adcontent .ab-slot-ad-choice{display:grid;gap:9px;padding:11px;border:1px solid #484848;border-radius:9px;background:#161616;min-width:0}#adcontent .ab-slot-choosers label{display:grid;gap:5px;min-width:0}#adcontent .ab-slot-choosers select{width:100%;min-width:0}#adcontent .ab-slot-preview{display:grid;grid-template-columns:repeat(var(--count,1),minmax(0,1fr));gap:12px;margin:10px 0 15px}#adcontent .ab-slot-preview article{min-width:0;border:1px solid #555;border-radius:10px;background:#111;padding:10px;overflow:hidden}#adcontent .ab-slot-image-frame{display:grid;place-items:center;width:100%;max-width:100%;overflow:hidden;border-radius:10px;background:transparent}#adcontent .ab-slot-preview img{display:block;width:100%;height:100%;object-fit:contain;border-radius:10px}#adcontent .ab-slot-preview strong{display:block;font-size:12px;margin-bottom:8px;overflow-wrap:anywhere}#adcontent .ab-slot-preview small{color:#aaa;font-size:11px}@media(max-width:730px){#adcontent .ab-slot-preview{grid-template-columns:1fr!important}}';document.head.append(style);
const before=document.getElementById('namedAdvertisingSpaces');before?root.insertBefore(section,before):root.append(section);
const $=id=>document.getElementById(id),loc=$('abSlotLocation'),cnt=$('abSlotCount'),choosers=$('abSlotChoosers'),preview=$('abSlotPreview'),status=$('abSlotStatus'),save=$('abSlotDraftSave');
let db,campaigns=[],customers=[],current=null,draft=null,artworkMasters=new Map(),selectedFormats=[];
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
 shape.onchange=()=>{selectedFormats[i]=shape.value;populate(sel.value);showPreview()};
 sel.onchange=()=>{const selected=selections().filter(Boolean);if(new Set(selected).size!==selected.length){sel.value='';status.textContent='Choose a different campaign for each advert.';}showPreview()};
 campaignLabel.append(sel);group.append(shapeLabel,campaignLabel);choosers.append(group);
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
  const note=document.createElement('small');note.textContent=(formatNames[format]||format)+' · Draft preview only · Advertisement';art.append(note);preview.append(art);
 }
 save.disabled=!current||!unique;
}
cnt.onchange=render;
$('abSlotClose').onclick=()=>{section.hidden=true};
async function open(detail){const {slotCode,pagePath}=detail||{};if(!slotCode||!pagePath)return;current={slotCode,pagePath};section.hidden=false;loc.textContent=pagePath+' · '+slotCode;status.textContent='Loading approved campaigns and any saved draft…';
try{if(typeof getAdminSupabaseClient!=='function')throw Error('Admin connection missing');db=getAdminSupabaseClient();const admin=await db.rpc('anybike_is_admin');if(admin.error||admin.data!==true)throw Error('Administrator access required');
const results=await Promise.all([db.from('advertising_campaigns').select('id,name,status,partner_id,desktop_image_url,slim_image_url,stock_card_image_url,mobile_image_url,compact_image_url,destination_url,alt_text').order('name'),db.from('commercial_partners').select('id,name').order('name'),db.from('advertising_slot_layout_drafts').select('slot_code,page_path,campaign_ids,advert_count,artwork_formats').eq('slot_code',slotCode).maybeSingle(),db.from('advertising_partner_artwork_library').select('partner_id,creative_format,active_artwork_id').not('active_artwork_id','is',null)]);const fail=results.find(r=>r.error);if(fail)throw fail.error;
campaigns=results[0].data||[];customers=results[1].data||[];draft=results[2].data||null;
 artworkMasters=new Map();
 const refs=results[3].data||[],ids=[...new Set(refs.map(r=>r.active_artwork_id).filter(Boolean))];
 if(ids.length){
  const versions=await db.from('advertising_client_artwork').select('id,public_url,status').in('id',ids);
  if(versions.error)throw versions.error;
  const byId=new Map((versions.data||[]).filter(v=>v.status==='approved').map(v=>[v.id,v.public_url]));
  for(const entry of refs){const url=byId.get(entry.active_artwork_id);if(url&&/^https:\/\//.test(url))artworkMasters.set(entry.partner_id+'|'+entry.creative_format,url)}
 }
selectedFormats=draft?.artwork_formats?.length?draft.artwork_formats.slice():[];cnt.value=String(draft?.advert_count||1);render();if(draft){const selects=[...choosers.querySelectorAll('select[data-campaign]')];draft.campaign_ids.forEach((id,i)=>{if(selects[i])selects[i].value=id});showPreview();}
status.textContent=draft?'Existing draft loaded. Website advertising unchanged.':'Choose approved adverts to prepare a layout draft. Existing live advert is untouched.';
}catch(e){status.textContent='Unable to load adverts: '+(e.message||e);save.disabled=true}
section.scrollIntoView({behavior:'smooth',block:'start'});}
save.onclick=async()=>{if(!current||!db)return;const ids=selections(),formats=currentFormats();if(ids.some((id,i)=>!options(formats[i]).some(c=>c.id===id))||new Set(ids).size!==ids.length){status.textContent='Choose distinct active campaigns for all positions.';return}
if(!confirm('Save '+ids.length+' adverts as a DRAFT for '+current.pagePath+'? Nothing will be published.'))return;
save.disabled=true;try{const payload={slot_code:current.slotCode,page_path:current.pagePath,advert_count:ids.length,campaign_ids:ids,artwork_formats:formats,updated_at:new Date().toISOString()};const result=await db.from('advertising_slot_layout_drafts').upsert(payload,{onConflict:'slot_code'}).select('slot_code,advert_count,campaign_ids,artwork_formats').single();if(result.error)throw result.error;if(result.data.campaign_ids.length!==ids.length||result.data.artwork_formats.length!==ids.length)throw Error('Draft not fully verified');status.textContent='Saved '+ids.length+'-advert layout draft. Existing public advertising unchanged.';}catch(e){status.textContent='Draft not saved: '+(e.message||e)}finally{showPreview()}};
window.addEventListener('anybike:manage-slot-adverts',event=>open(event.detail));
})();