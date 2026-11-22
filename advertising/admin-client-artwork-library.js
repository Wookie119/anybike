// AnyBike Mega System client files: click advertiser, see five formats, manage versions.
(()=>{'use strict';
const root=document.createElement('section');root.id='client-artwork-library';
root.style.cssText='background:#171717;border:1px solid #414141;border-radius:12px;margin:18px 0;padding:18px;color:#fff';
root.innerHTML='<h2 style="margin:0 0 6px">Advertiser artwork files · approved artwork import</h2><p style="color:#bbb;margin:0 0 12px">Click an advertiser to see its five advert sizes. Artwork is held in that client’s file, not on individual pages.</p><p id="cal-status" role="status" aria-live="polite" style="color:#bbb">Checking admin access…</p><div id="cal-contents" hidden><input id="cal-search" type="search" aria-label="Find advertiser" placeholder="Find an advertiser" style="width:100%;max-width:340px;padding:10px;background:#232323;border:1px solid #555;border-radius:8px;color:white;margin:0 0 12px"><div id="cal-clients" style="display:flex;flex-wrap:wrap;gap:9px"></div><div id="cal-folder" hidden style="margin-top:20px;border-top:1px solid #444;padding-top:15px"><div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px"><button type="button" id="cal-back" style="background:#333;color:white;border:1px solid #666;border-radius:7px;padding:9px 14px">← All advertisers</button><h3 id="cal-title" style="margin:0"></h3><button type="button" id="cal-manage-locations" style="padding:9px 13px;border:1px solid #ed1c24;border-radius:7px;background:#ed1c24;color:#fff;font-weight:700;cursor:pointer">Choose advertising locations</button></div><div id="cal-five" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px"></div></div></div>';
const controlPanel=document.getElementById('adcontent');
if(controlPanel)controlPanel.insertBefore(root,controlPanel.firstChild);
else (document.querySelector('main')||document.body).append(root);
const $=s=>root.querySelector('#'+s),status=t=>{$('cal-status').textContent=t};
const make=(tag,t)=>{const e=document.createElement(tag);if(t!==undefined)e.textContent=String(t);return e};
const button=(label,fn,primary=false)=>{const b=make('button',label);b.type='button';b.style.cssText='padding:9px 12px;border-radius:8px;border:1px solid '+(primary?'#ed1c24':'#555')+';background:'+(primary?'#ed1c24':'#282828')+';color:#fff;font-weight:700;cursor:pointer';b.onclick=fn;return b};
const formats=[['square','Square','1:1','square'],['stock_card','Available Stock','4:3','stock_card_image_url'],['slim','Slim banner','3:1','slim_image_url'],['landscape','Landscape','16:9','desktop_image_url'],['portrait','Portrait','4:5','mobile_image_url']];
const ratios={square:1,stock_card:4/3,slim:3,landscape:16/9,portrait:4/5};
const formatGuides={
 square:{usage:'A small spot advert',location:'Beside motorcycle listings, inside a page grid, or in a group of three or four adverts',example:'Works best when the message stays readable at card size'},
 stock_card:{usage:'Available Stock advertising',location:'An advert taking the space of a motorcycle listing card in Available Stock',example:'Should look balanced alongside motorcycle photos and stock cards'},
 slim:{usage:'A thin horizontal banner',location:'Across the bottom or between sections of a desktop page',example:'Good for a short headline, company logo and one call to action'},
 landscape:{usage:'A larger horizontal feature advert',location:'A wider page section where a full-width advertisement has been allocated',example:'More room for a vehicle or product photograph and supporting message'},
 portrait:{usage:'A tall advert',location:'A vertical page column or mobile-friendly placement where the layout allows',example:'Useful for photographic advertising without stretching a landscape advert'}
};
let db,clients=[],campaigns=[],slots=[],placements=[],versions=[],libraryFormats=[],selected=null;
async function load(){
 const results=await Promise.all([
  db.from('commercial_partners').select('id,name').order('name'),
  db.from('advertising_campaigns').select('id,partner_id,stock_card_image_url,slim_image_url,desktop_image_url,mobile_image_url,compact_image_url'),
  db.from('advertising_client_artwork_slots').select('slot_code,partner_id,creative_format,active_artwork_id'),
  db.from('advertising_partner_artwork_library').select('partner_id,creative_format,active_artwork_id'),
  db.from('advertising_square_house_placements').select('slot_code,artwork_url'),
  db.from('advertising_client_artwork').select('id,partner_id,creative_format,file_name,public_url,status,source_label,storage_path,created_at').order('created_at',{ascending:false}).limit(1000)
 ]);
 for(const r of results)if(r.error)throw r.error;
 [clients,campaigns,slots,libraryFormats,placements,versions]=results.map(r=>r.data||[]);
 renderClients();if(selected)renderFolder();
}
function visibleClients(){
 const search=$('cal-search').value.trim().toLowerCase();
 return clients.filter(c=>c.name.toLowerCase().includes(search));
}
function renderClients(){
 $('cal-clients').replaceChildren();
 for(const c of visibleClients()){
  const n=formats.filter(([format])=>libraryFormats.some(a=>a.partner_id===c.id&&a.creative_format===format&&a.active_artwork_id&&versions.some(v=>v.id===a.active_artwork_id&&v.status==='approved'))).length;
  const b=button(c.name+' · '+n+'/5 ready',()=>{selected=c.id;$('cal-folder').hidden=false;renderFolder();$('cal-folder').scrollIntoView({block:'nearest',behavior:'smooth'})},selected===c.id);
  $('cal-clients').append(b);
 }
 if(!$('cal-clients').children.length)$('cal-clients').append(make('p','No advertisers match your search.'));
}
function currentArt(format,field){
 const active=libraryFormats.find(a=>a.partner_id===selected&&a.creative_format===format)?.active_artwork_id;
 const stored=versions.find(v=>v.partner_id===selected&&v.creative_format===format&&v.id===active&&v.status==='approved');
 if(stored)return stored.public_url;
 if(format==='square'){
  const slot=slots.find(s=>s.partner_id===selected&&s.creative_format==='square');
  return placements.find(p=>p.slot_code===slot?.slot_code)?.artwork_url||null;
 }
 return campaigns.find(c=>c.partner_id===selected&&c[field])?.[field]||null;
}
async function checkFinishedArtwork(source,format){
 let img;
 try{
  const file=typeof source==='string' ? await (async()=>{const res=await fetch(source,{mode:'cors',cache:'no-store'});if(!res.ok)throw Error('Artwork cannot be checked ('+res.status+'). Upload the original WebP to the advertiser file.');return await res.blob()})() : source;
  img=await createImageBitmap(file);
  const w=img.width,h=img.height,r=w/h;
  if(w<600||h<200||Math.abs(r/ratios[format]-1)>.006)throw Error('The artwork does not match the '+format.replace('_',' ')+' frame. It would leave gaps or be cropped.');
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const ctx=cv.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Unable to inspect image.');
  ctx.drawImage(img,0,0);
  const alpha=(x,y)=>ctx.getImageData(Math.floor(x),Math.floor(y),1,1).data[3];
  const radius=Math.round(Math.min(w,h)*.055);
  for(const [x,y] of [[0,0],[w-1,0],[0,h-1],[w-1,h-1]]){
   if(alpha(x,y)>12)throw Error('The image has an unsupported opaque border. Please upload finished artwork.');
  }
  for(const [x,y] of [[w/2,0],[w/2,h-1],[0,h/2],[w-1,h/2],[radius,radius],[w-radius-1,radius],[radius,h-radius-1],[w-radius-1,h-radius-1]]){
   if(alpha(x,y)<245)throw Error('There is transparent padding or missing artwork along the advert edge. Artwork must fill the rounded frame.');
  }
  for(const [x,y] of [[radius/3,0],[w-1-radius/3,0],[radius/3,h-1],[w-1-radius/3,h-1]]){
   if(alpha(x,y)>90)throw Error('The image edges need adjusting. Please upload finished artwork.');
  }
  return {width:w,height:h};
 }finally{img?.close?.()}
}
async function bakeArtworkCorners(source,format,filename){
 let bitmap;
 try{
  let blob=source;
  if(typeof source==='string'){
   const response=await fetch(source,{mode:'cors',cache:'no-store'});
   if(!response.ok)throw Error('Original artwork is unavailable for conversion (HTTP '+response.status+').');
   blob=await response.blob();
  }
  bitmap=await createImageBitmap(blob);
  const w=bitmap.width,h=bitmap.height;
  if(w<600||h<200||Math.abs(w/h/ratios[format]-1)>.006)throw Error('Original size is not suitable for this '+format.replace('_',' ')+' slot. Nothing was cropped.');
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)throw Error('Canvas unavailable.');
  ctx.drawImage(bitmap,0,0);
  // Transparent corner pixels are burned into the WebP itself. No CSS radius, scaling or cropping.
  const radius=Math.max(16,Math.round(Math.min(w,h)*.055));
  ctx.globalCompositeOperation='destination-in';
  ctx.fillStyle='#fff';
  ctx.beginPath();
  ctx.moveTo(radius,0);ctx.lineTo(w-radius,0);ctx.quadraticCurveTo(w,0,w,radius);
  ctx.lineTo(w,h-radius);ctx.quadraticCurveTo(w,h,w-radius,h);
  ctx.lineTo(radius,h);ctx.quadraticCurveTo(0,h,0,h-radius);
  ctx.lineTo(0,radius);ctx.quadraticCurveTo(0,0,radius,0);
  ctx.closePath();ctx.fill();
  const out=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('WebP export failed')),'image/webp',.96));
  if(out.type!=='image/webp')throw Error('Browser did not export a WebP.');
  const cleanName=(filename||'approved-advert.webp').replace(/\.webp$/i,'')+'-rounded.webp';
  const converted=new File([out],cleanName,{type:'image/webp'});
  await checkFinishedArtwork(converted,format);
  return converted;
 }finally{bitmap?.close?.()}
}
async function saveRoundedVersion(v,format){
 if(v.partner_id!==selected||v.creative_format!==format)return status('Open the original artwork in its own client file.');
 const owner=clients.find(c=>c.id===selected);
 if(!owner)return status('Advertiser missing.');
 if(!confirm('Save a new rounded-corner WebP version of '+v.file_name+' for '+owner.name+'? Original artwork and live campaigns will not change.'))return;
 try{
  status('Preparing an updated image version…');
  const converted=await bakeArtworkCorners(v.public_url,format,v.file_name);
  const safe=converted.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-').slice(-100);
  const path='clients/'+selected+'/'+format+'/'+crypto.randomUUID()+'-'+safe;
  const upload=await db.storage.from('advertising-creatives').upload(path,converted,{upsert:false,contentType:'image/webp',cacheControl:'31536000'});
  if(upload.error)throw upload.error;
  const url=db.storage.from('advertising-creatives').getPublicUrl(path).data.publicUrl;
  const row=await db.from('advertising_client_artwork').insert({partner_id:selected,creative_format:format,storage_path:path,public_url:url,file_name:converted.name,source_label:'Transparent rounded corners baked into source WebP · original retained',alt_text:owner.name+' advertisement',status:'draft'});
  if(row.error)throw row.error;
  await load();
  status('Rounded WebP saved as a new draft under '+owner.name+'. Original and live advert unchanged. Review the version and approve it when satisfied.');
 }catch(e){status('Unable to round the artwork: '+e.message)}
}
async function uploadFile(format,file,report){
 const say=message=>{status(message);if(report){report.textContent=message;report.hidden=false;report.scrollIntoView({block:'nearest'});}};
 if(!file)return say('Choose a replacement image first using Choose file.');
 if(!['image/webp','image/png','image/jpeg'].includes(file.type)||!file.size||file.size>10*1024*1024)return say('Choose a WebP, PNG or JPEG image under 10 MB.');
 try{
  say('Preparing image…');
  const prepared=await bakeArtworkCorners(file,format,file.name);
  if(prepared.size>10*1024*1024)throw Error('Rounded WebP exceeds 10 MB.');
  const safe=prepared.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-').slice(-100);
  const path='clients/'+selected+'/'+format+'/'+crypto.randomUUID()+'-'+safe;
  const upload=await db.storage.from('advertising-creatives').upload(path,prepared,{upsert:false,cacheControl:'31536000',contentType:'image/webp'});
  if(upload.error)throw upload.error;
  const url=db.storage.from('advertising-creatives').getPublicUrl(path).data.publicUrl;
  const row=await db.from('advertising_client_artwork').insert({partner_id:selected,creative_format:format,storage_path:path,public_url:url,file_name:prepared.name,source_label:'Original design · transparent corners baked into WebP on upload',alt_text:clients.find(c=>c.id===selected)?.name+' advertisement',status:'draft'});
  if(row.error)throw row.error;
  say('Saved to the correct client file as a draft. Nothing published. Review the new artwork under Artwork versions.');
  await load();
 }catch(e){say('Upload failed: '+e.message)}
}
async function approve(v){
 if(v.storage_path?.startsWith('linked-existing/')||v.source_label?.startsWith('Existing '))return status('This is a source advert, not a finished master. Upload a finished, correctly sized image first.');
 if(!confirm('Approve this finished artwork for '+clients.find(c=>c.id===selected)?.name+'? Confirm the design and wording. The image dimensions and transparent corners will be checked.'))return;
 try{
  await checkFinishedArtwork(v.public_url,v.creative_format);
  const r=await db.from('advertising_client_artwork').update({status:'approved',approved_at:new Date().toISOString()}).eq('id',v.id).eq('status','draft').select('id').single();
  if(r.error)throw r.error;
  await load();status('Approved '+v.file_name+'. You can now make it live.');
 }catch(e){status('Approval failed: '+e.message)}
}
async function activate(v,format,field){
 if(v.partner_id!==selected||v.creative_format!==format||v.status!=='approved')return status('Approve the correct advertiser artwork before activation.');
 const owner=clients.find(c=>c.id===selected);
 if(!confirm('Assign this approved '+format.replace('_',' ')+' artwork as the '+owner.name+' master? All existing campaign destinations will be preserved.'))return;
 try{
  await checkFinishedArtwork(v.public_url,format);
  // Every partner has five permanent master-format records, even without campaigns.
  const folder=await db.from('advertising_partner_artwork_library').update({
   active_artwork_id:v.id,updated_at:new Date().toISOString()
  }).eq('partner_id',selected).eq('creative_format',format).select('partner_id').single();
  if(folder.error)throw folder.error;
  if(format==='square'){
   const matched=slots.filter(s=>s.partner_id===selected&&s.creative_format===format);
   for(const slot of matched){
    const x=await db.rpc('advertising_activate_client_artwork',{p_slot_code:slot.slot_code,p_artwork_id:v.id});
    if(x.error)throw x.error;
   }
  }else{
   for(const c of campaigns.filter(c=>c.partner_id===selected)){
    const x=await db.from('advertising_campaigns').update({[field]:v.public_url}).eq('id',c.id).select('id').single();
    if(x.error)throw x.error;
   }
  }
  await load();status('Approved '+format.replace('_',' ')+' artwork saved as '+owner.name+' master. All compatible linked placements were updated centrally.');
 }catch(e){await load().catch(()=>{});status('Master assignment could not be completed: '+e.message)}
}
function artworkDependencies(v){
 const master=libraryFormats.some(x=>x.active_artwork_id===v.id);
 const slot=slots.some(x=>x.active_artwork_id===v.id);
 const campaign=campaigns.some(c=>c.partner_id===v.partner_id&&[c.desktop_image_url,c.mobile_image_url,c.slim_image_url,c.stock_card_image_url,c.compact_image_url].includes(v.public_url));
 const placement=placements.some(p=>p.artwork_url===v.public_url);
 return {master,slot,campaign,placement,used:master||slot||campaign||placement};
}
async function unlinkLegacyArtwork(v){
 if(v.partner_id!==selected||!v.storage_path?.startsWith('linked-existing/'))return status('This action only removes old linked artwork from a client file.');
 const owner=clients.find(c=>c.id===selected);
 if(!owner)return status('Client not found.');
 if(!confirm('Remove old artwork entry "'+v.file_name+'" from '+owner.name+' client file? Shared files and website adverts will NOT be deleted or changed.'))return;
 try{
  const [a,b,refs]=await Promise.all([
   db.from('advertising_partner_artwork_library').select('partner_id').eq('active_artwork_id',v.id).limit(1),
   db.from('advertising_client_artwork_slots').select('slot_code').eq('active_artwork_id',v.id).limit(1),
   db.from('advertising_client_artwork').select('id').eq('replaced_by',v.id).limit(1)
  ]);
  for(const x of [a,b,refs])if(x.error)throw x.error;
  if(a.data?.length||b.data?.length||refs.data?.length)throw Error('This version is directly selected as artwork. Select a replacement first.');
  const del=await db.from('advertising_client_artwork').delete().eq('id',v.id).eq('partner_id',selected).eq('status','draft').like('storage_path','linked-existing/%').select('id');
  if(del.error)throw del.error;
  if(del.data?.length!==1)throw Error('Entry was already changed or removed.');
  await load();
  status('Removed obsolete artwork entry from '+owner.name+' client file. Live adverts and shared image file are unchanged.');
 }catch(e){status('Cannot remove old artwork entry: '+e.message)}
}
async function deleteArtwork(v){
 if(v.partner_id!==selected)return status('Open the correct advertiser before deleting artwork.');
 const owner=clients.find(c=>c.id===selected);
 if(!owner)return status('Advertiser not found.');
 const checks=artworkDependencies(v);
 if(checks.used)return status('This artwork is currently selected as a master or used by a campaign. Choose another approved artwork for that format and remove its campaign assignment before deleting it.');
 if(!confirm('Permanently delete "'+v.file_name+'" from '+owner.name+' artwork versions? The original artwork version will be removed. This cannot be undone.'))return;
 try{
  // Recheck the latest database state, not just the loaded gallery state.
  const [l,sl,ca,pl,rep]=await Promise.all([
   db.from('advertising_partner_artwork_library').select('partner_id').eq('active_artwork_id',v.id).limit(1),
   db.from('advertising_client_artwork_slots').select('slot_code').eq('active_artwork_id',v.id).limit(1),
   db.from('advertising_campaigns').select('id,desktop_image_url,mobile_image_url,slim_image_url,stock_card_image_url,compact_image_url').eq('partner_id',v.partner_id),
   db.from('advertising_square_house_placements').select('slot_code').eq('artwork_url',v.public_url).limit(1),
   db.from('advertising_client_artwork').select('id').eq('replaced_by',v.id).limit(1)
  ]);
  for(const check of [l,sl,ca,pl,rep])if(check.error)throw check.error;
  const campaignUsed=(ca.data||[]).some(c=>[c.desktop_image_url,c.mobile_image_url,c.slim_image_url,c.stock_card_image_url,c.compact_image_url].includes(v.public_url));
  if(l.data?.length||sl.data?.length||pl.data?.length||rep.data?.length||campaignUsed)throw Error('Artwork is still referenced by a master, campaign or another record. Select a replacement first.');
  const del=await db.from('advertising_client_artwork').delete().eq('id',v.id).eq('partner_id',selected).select('id');
  if(del.error)throw del.error;
  if(del.data?.length!==1)throw Error('Artwork could not be deleted. Refresh and try again.');
  // Remove only client-owned uploads, never shared campaign or website source images.
  let cleanup='';
  if(v.storage_path?.startsWith('clients/'+selected+'/')){
   const storage=await db.storage.from('advertising-creatives').remove([v.storage_path]);
   if(storage.error)cleanup=' Its old storage image could not be cleaned up: '+storage.error.message;
  }
  await load();
  status('Deleted "'+v.file_name+'" from '+owner.name+' artwork versions.'+cleanup+' Live adverts were unchanged.');
 }catch(e){await load().catch(()=>{});status('Delete blocked: '+e.message)}
}
function renderFolder(){
 const client=clients.find(c=>c.id===selected);
 if(!client){$('cal-folder').hidden=true;return}
 $('cal-folder').hidden=false;$('cal-title').textContent=client.name+' · 5 advert sizes';
 let upsell=root.querySelector('#cal-upsell');
 if(!upsell){
  upsell=button('Upsell Package',()=>{
   window.dispatchEvent(new CustomEvent('anybike:advertiser-upsell',{detail:{advertiser:client.name}}));
  },true);
  upsell.id='cal-upsell';
  $('cal-title').insertAdjacentElement('afterend',upsell);
 }
 upsell.onclick=()=>{
  window.dispatchEvent(new CustomEvent('anybike:advertiser-upsell',{detail:{advertiser:client.name}}));
 };

 // Dealer/franchise controls are inside the client file, never on individual pages.
 let dealerBox=root.querySelector('#cal-uk-dealer-box');
 if(!dealerBox){
  dealerBox=document.createElement('section');dealerBox.id='cal-uk-dealer-box';
  dealerBox.style.cssText='margin:14px 0;padding:15px;border:1px solid #484848;border-radius:10px;background:#1b1b1b';
  $('cal-five').insertAdjacentElement('beforebegin',dealerBox);
 }
 dealerBox.textContent='Loading UK dealer brand settings…';
 loadDealerBrandSettings(selected,dealerBox).catch(e=>{dealerBox.textContent='Dealer settings unavailable: '+e.message});
 const host=$('cal-five');host.replaceChildren();
 for(const [format,label,ratio,field] of formats){
  const card=make('div');card.style.cssText='min-width:0;border:1px solid #444;background:#202020;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:10px';
  card.append(make('strong',label+' · '+ratio));
  const help=formatGuides[format],helpBox=make('div');helpBox.style.cssText='font:12px/1.45 Arial,sans-serif;color:#ddd;min-height:94px';
  const uses=make('strong','Best used for: '+help.usage);uses.style.cssText='display:block;color:#fff;margin-bottom:4px';
  const placement=make('span',help.location);placement.style.display='block';
  helpBox.append(uses,placement);card.append(helpBox);
  const example=make('details'),exampleSummary=make('summary','How to judge this size');exampleSummary.style.cssText='cursor:pointer;font-size:12px;color:#ddd';
  example.append(exampleSummary,make('p',help.example));example.style.cssText='font-size:12px;color:#ccc';
  card.append(example);
  const master=libraryFormats.find(a=>a.partner_id===selected&&a.creative_format===format);
  const activeVersion=versions.find(v=>v.id===master?.active_artwork_id&&v.status==='approved');
  const previews=versions.filter(v=>v.partner_id===selected&&v.creative_format===format);
  const labelStatus=make('small',activeVersion?'Approved master artwork':'Master artwork missing · upload and approve');
  labelStatus.style.cssText='color:'+(activeVersion?'#7ed6a5':'#ddd')+';font-size:12px';
  card.append(labelStatus);
  const imageUrl=activeVersion?.public_url||null,imageBox=make('div');
  imageBox.style.cssText='width:100%;aspect-ratio:'+ratios[format]+';display:grid;place-items:center;background:transparent;border:0;border-radius:0;overflow:visible';
  if(imageUrl){const image=make('img');image.src=imageUrl;image.alt=client.name+' '+label+' advert';image.loading='lazy';image.style.cssText='display:block;width:100%;height:100%;object-fit:contain;border-radius:12px';imageBox.append(image)}
  else {const missing=make('span','No approved master selected for this format');missing.style.cssText='color:#bbb;text-align:center;padding:12px;font-size:12px';imageBox.append(missing)}
  card.append(imageBox);
  // Approved artwork is already stored; do not ask for redundant rounding saves.
  const upload=make('input');upload.type='file';upload.accept='image/webp,image/png,image/jpeg';upload.setAttribute('aria-label','Choose '+label+' replacement image for '+client.name);upload.style.cssText='max-width:100%;font-size:12px';
  const cardFeedback=make('p');cardFeedback.setAttribute('role','status');cardFeedback.style.cssText='color:#eee;font-size:12px;line-height:1.45;margin:0;overflow-wrap:anywhere';cardFeedback.hidden=true;
  const save=button('Upload replacement',()=>uploadFile(format,upload.files?.[0],cardFeedback),true);
  upload.addEventListener('change',()=>{if(upload.files?.[0]){cardFeedback.textContent='Selected: '+upload.files[0].name+'. Click Upload replacement to save a draft.';cardFeedback.hidden=false}});
  const replaceBox=make('details');
  replaceBox.style.cssText='border-top:1px solid #383838;padding-top:7px';
  const replaceLabel=make('summary','Replace approved artwork');replaceLabel.style.cssText='cursor:pointer;font-size:12px;color:#ccc';
  replaceBox.append(replaceLabel,upload,save,cardFeedback);
  card.append(replaceBox);
  const rows=versions.filter(v=>v.partner_id===selected&&v.creative_format===format);
  const history=make('details');
  history.style.cssText='border-top:1px solid #383838;padding-top:7px';
  const summary=make('summary','Older artwork & versions ('+rows.length+')');
  summary.style.cssText='cursor:pointer;font-size:12px;color:#ccc';
  history.append(summary);
  const hint=make('small','All versions are retained, including red and blue artwork. Opening this history never changes the selected master.');
  hint.style.cssText='display:block;color:#aaa;margin:7px 0';history.append(hint);
  for(const v of rows){
   const line=make('details');line.style.cssText='border-top:1px solid #3b3b3b;padding:8px 0;font-size:12px;min-width:0';
   const dependencies=artworkDependencies(v);
   const selectedMaster=master?.active_artwork_id===v.id;
   const title=make('summary',selectedMaster?'Current approved master · '+v.file_name:(v.status==='approved'?'Approved alternative · ':'Draft · ')+v.file_name);
   title.style.cssText='font-weight:700;overflow-wrap:anywhere;cursor:pointer;line-height:1.5';
   line.append(title);
   const preview=make('img');preview.src=v.public_url;preview.alt='Preview of '+v.file_name;preview.loading='lazy';
   preview.style.cssText='display:block;width:100%;aspect-ratio:'+ratios[format]+';height:auto;object-fit:contain;background:transparent;border:0;border-radius:12px;margin:9px 0';
   line.append(preview);
   const state=make('small',(v.status==='approved'?'Approved':'Draft')+(master?.active_artwork_id===v.id?' · SELECTED MASTER':'')+(dependencies.campaign?' · USED BY CAMPAIGN':'')+(dependencies.slot||dependencies.placement?' · USED ON WEBSITE':''));
   state.style.cssText='color:'+(dependencies.used?'#eac07c':'#ccc')+';font-weight:700';line.append(state);
   const controls=make('div');controls.style.cssText='display:flex;gap:6px;flex-wrap:wrap';
   const legacy=Boolean(v.storage_path?.startsWith('linked-existing/')||v.source_label?.startsWith('Existing '));
   // Corner treatment is standard; an old-file repair is available only
   // inside this version's expanded tools, not repeated on every card.
   const repair=button('Repair image',()=>saveRoundedVersion(v,format));
   repair.title='Optional image repair for older artwork';
   controls.append(repair);
   if(v.status==='draft'&&!legacy)controls.append(button('Approve',()=>approve(v)));
   if(v.status==='approved'&&master?.active_artwork_id!==v.id)controls.append(button('Use this artwork',()=>activate(v,format,field),true));
   const removableLink=legacy&&v.status==='draft'&&!dependencies.master&&!dependencies.slot;
   const blocked=dependencies.used&&!removableLink;
   const del=button(removableLink?'Remove from client file':blocked?'In use — cannot delete':'Delete',()=>removableLink?unlinkLegacyArtwork(v):deleteArtwork(v));
   del.style.cssText='padding:8px 12px;border:1px solid '+(blocked?'#555':'#ed1c24')+';border-radius:7px;background:#282828;color:'+(blocked?'#aaa':'#fff')+';cursor:'+(blocked?'not-allowed':'pointer');
   del.disabled=blocked;
   controls.append(del);line.append(controls);
   if(removableLink&&dependencies.used)line.append(make('small','This removes only the old entry from this client file. It does not alter any linked live advert.'));
   else if(blocked)line.append(make('small','To delete this version, first select another approved master and remove any campaign using this artwork.'));
   history.append(line);
  }
  card.append(history);host.append(card);
 }
}

async function loadDealerBrandSettings(partner,host){
 const [profileResult,brandsResult,selectedResult]=await Promise.all([
  db.from('advertising_dealer_profiles').select('*').eq('partner_id',partner).maybeSingle(),
  db.rpc('admin_anybike_advertiser_manufacturers_v1'),
  db.from('advertising_dealer_brand_selections').select('*').eq('partner_id',partner)
 ]);
 for(const x of [profileResult,brandsResult,selectedResult])if(x.error)throw x.error;
 if(selected!==partner||!host.isConnected)return;
 const existing=profileResult.data||{dealer_type:'not_dealer',country_code:'GB',city:'',postcode:'',public_listing_requested:false,public_listing_approved:false};
 const selectedBrands=selectedResult.data||[],brands=brandsResult.data||[];
 host.replaceChildren();
 const h=make('h3','UK Find a Dealer · franchises & brands');h.style.margin='0 0 7px';host.append(h);
 const p=make('p','For UK-facing directory only. Verified franchises can appear as authorised main dealers; other dealers appear as specialists. Nothing is published without approval.');p.style.color='#bbb';host.append(p);
 const type=make('select');type.style.cssText='padding:10px;border-radius:8px;background:#282828;color:white;border:1px solid #777;max-width:100%';
 for(const [key,label] of [['not_dealer','Not a motorcycle dealer'],['main_dealer','Authorised main dealer (franchise chooser)'],['independent','Independent dealer (brand chooser)']]){
  const op=make('option',label);op.value=key;type.append(op)
 }type.value=existing.dealer_type;host.append(type);
 const details=make('div');details.style.marginTop='12px';host.append(details);
 const locationRow=make('div');locationRow.style.cssText='display:flex;flex-wrap:wrap;gap:9px';
 const city=make('input');city.placeholder='UK town or city';city.value=existing.city||'';
 const postcode=make('input');postcode.placeholder='UK postcode';postcode.value=existing.postcode||'';
 for(const n of [city,postcode])n.style.cssText='flex:1;min-width:155px;padding:9px;border-radius:7px;background:#292929;color:#fff;border:1px solid #666';
 locationRow.append(city,postcode);details.append(locationRow);
 const choicesHeading=make('strong','');choicesHeading.style.display='block';choicesHeading.style.margin='13px 0 8px';details.append(choicesHeading);
 const choices=make('div');choices.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:6px;max-height:230px;overflow:auto;border:1px solid #444;padding:10px;border-radius:9px';details.append(choices);
 const verification=make('div');verification.style.cssText='border-top:1px solid #444;margin-top:12px;padding-top:10px';details.append(verification);
 const request=make('input');request.type='checkbox';request.checked=existing.public_listing_requested===true;
 const reqLabel=make('label');reqLabel.style.cssText='display:flex;gap:9px;align-items:center;margin:10px 0';
 reqLabel.append(request,make('span','Request inclusion in UK Find a Dealer'));details.append(reqLabel);
 const approval=make('input');approval.type='checkbox';approval.checked=existing.public_listing_approved===true;
 const apprLabel=make('label');apprLabel.style.cssText='display:flex;gap:9px;align-items:center;margin:10px 0';
 apprLabel.append(approval,make('span','Admin approves public UK listing'));details.append(apprLabel);
 const save=button('Save dealer brands',async()=>{
  save.disabled=true;
  try{
   const dealer_type=type.value,relationship=dealer_type==='main_dealer'?'franchise':'specialist';
   const checkboxes=[...choices.querySelectorAll('input[type=checkbox]:checked')];
   const requested=request.checked&&dealer_type!=='not_dealer';
   const approved=approval.checked&&requested;
   if(approved&&(!city.value.trim()||!postcode.value.trim()))throw Error('Town and postcode are required to publish a UK dealer listing.');
   if(approved&&!checkboxes.length)throw Error('Choose at least one manufacturer before approving a public listing.');
   if(dealer_type==='main_dealer'&&approved){
    for(const box of checkboxes){
     const ref=verification.querySelector('[data-ref="'+box.value+'"]');
     if(!ref?.value.trim())throw Error('Each authorised main dealer franchise must have a verification reference.');
    }
   }
   const profile={partner_id:partner,dealer_type,country_code:'GB',city:city.value.trim()||null,postcode:postcode.value.trim().toUpperCase()||null,public_listing_requested:requested,public_listing_approved:approved,updated_at:new Date().toISOString()};
   const p=await db.from('advertising_dealer_profiles').upsert(profile,{onConflict:'partner_id'});
   if(p.error)throw p.error;
   const old=await db.from('advertising_dealer_brand_selections').delete().eq('partner_id',partner);if(old.error)throw old.error;
   if(dealer_type!=='not_dealer'&&checkboxes.length){
    const rows=checkboxes.map(box=>{
     const reference=verification.querySelector('[data-ref="'+box.value+'"]')?.value.trim()||null;
     const isVerified=dealer_type==='main_dealer'&&Boolean(reference);
     return {partner_id:partner,manufacturer_id:Number(box.value),relationship_type:relationship,verified:isVerified,verification_reference:reference,verified_at:isVerified?new Date().toISOString():null,updated_at:new Date().toISOString()};
    });
    const x=await db.from('advertising_dealer_brand_selections').insert(rows);if(x.error)throw x.error;
   }
   status('Saved UK dealer selections for '+clients.find(c=>c.id===partner)?.name+'.');
   await loadDealerBrandSettings(partner,host);
  }catch(e){status('Could not save dealer details: '+e.message)}
  finally{save.disabled=false}
 },true);
 details.append(save);
 function repaint(){
  details.hidden=type.value==='not_dealer';
  choicesHeading.textContent=type.value==='main_dealer'?'Choose authorised manufacturer franchises':'Choose motorcycle brands this dealer specialises in';
  choices.replaceChildren();verification.replaceChildren();
  const kind=type.value==='main_dealer'?'franchise':'specialist';
  const selectedSet=new Set(selectedBrands.filter(b=>b.relationship_type===kind).map(b=>String(b.manufacturer_id)));
  for(const brand of brands){
   const line=make('label');line.style.cssText='display:flex;align-items:center;gap:7px;padding:5px 7px;border:1px solid #333;border-radius:7px;font-size:13px';
   const check=make('input');check.type='checkbox';check.value=String(brand.id);check.checked=selectedSet.has(check.value);line.append(check,make('span',brand.display_name));choices.append(line);
   if(type.value==='main_dealer'){
    const ref=make('input');ref.dataset.ref=String(brand.id);
    ref.placeholder=brand.display_name+' franchise verification reference';
    ref.value=selectedBrands.find(b=>b.relationship_type==='franchise'&&String(b.manufacturer_id)===String(brand.id))?.verification_reference||'';
    ref.style.cssText='width:100%;padding:8px;margin-top:5px;background:#292929;color:#fff;border:1px solid #555;border-radius:6px';
    const div=make('div');div.dataset.for=String(brand.id);div.hidden=!check.checked;div.append(make('small',brand.display_name+' · evidence/reference'),ref);verification.append(div);
    check.onchange=()=>{div.hidden=!check.checked};
   }
  }
 }
 type.onchange=repaint;repaint();
}


function addZipImporter(){
 const bar=make('div');bar.style.cssText='padding:12px;margin:0 0 14px;background:#222;border:1px solid #555;border-radius:9px;display:flex;align-items:center;gap:10px;flex-wrap:wrap';
 const info=make('p','Import finished artwork for multiple advertisers. Images retain their original proportions, and live adverts are not changed.');info.style.cssText='width:100%;color:#ccc;margin:0';
 const file=make('input');file.type='file';file.accept='.zip,application/zip';file.setAttribute('aria-label','Choose advertiser artwork ZIP');
 const go=button('Import approved client artwork ZIP',async()=>{
  if(!file.files?.[0])return status('Choose the ZIP file first.');
  if(!window.JSZip)return status('ZIP reader unavailable. Refresh and try again.');
  if(file.files[0].size>40000000)return status('ZIP must be smaller than 40 MB.');
  go.disabled=true;
  let saved=0,failed=0,skipped=0;const errors=[];
  const ownerApproved=confirm('Have you personally approved the artwork in this ZIP? OK saves valid files as approved client artwork. Cancel saves them as drafts. Neither option changes live advertising placements.');

  try{
   const archive=await JSZip.loadAsync(file.files[0],{checkCRC32:true});
   const entries=Object.values(archive.files).filter(e=>!e.dir&&e.name.toLowerCase().endsWith('.webp'));
   if(!entries.length||entries.length>100)throw Error('Expected 1–100 WebP artworks.');
   // Accept original approved dimensions without recomposing or resizing the artwork.
   for(const item of entries){
    let image;
    try{
     const name=item.name.split('/').pop();
     const match=name.match(/^([a-z0-9-]+)-(square|stock_card|slim|landscape|portrait)-([0-9]+)x([0-9]+)(?:-[a-z0-9-]+)?\.webp$/i);
     if(!match)throw Error('Invalid artwork filename');
     const slug=match[1],format=match[2],wh=[Number(match[3]),Number(match[4])];
     const client=clients.find(c=>c.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')===slug.toLowerCase());
     if(!client)throw Error('Advertiser not found: '+slug);
     if(wh[0]<600||wh[1]<200)throw Error('Insufficient resolution');
     if(Math.abs(wh[0]/wh[1]/ratios[format]-1)>.006)throw Error('Artwork does not match '+format.replace('_',' ')+' proportions');
     const bytes=await item.async('uint8array');
     if(!bytes.length||bytes.length>10000000)throw Error('Image too large or empty');

     const webp=new File([bytes],name,{type:'image/webp'});
     image=await createImageBitmap(webp);
     if(image.width!==wh[0]||image.height!==wh[1])throw Error('Image pixel size mismatch');
     const rounded=await bakeArtworkCorners(webp,format,name);
     if(rounded.size>10000000)throw Error('Rounded WebP exceeds 10 MB.');
     const path='clients/'+client.id+'/'+format+'/'+crypto.randomUUID()+'-'+rounded.name;
     const upload=await db.storage.from('advertising-creatives').upload(path,rounded,{upsert:false,contentType:'image/webp',cacheControl:'31536000'});
     if(upload.error)throw upload.error;
     const url=db.storage.from('advertising-creatives').getPublicUrl(path).data.publicUrl;
     const save=await db.from('advertising_client_artwork').insert({partner_id:client.id,creative_format:format,storage_path:path,public_url:url,file_name:rounded.name,alt_text:client.name+' advertisement',source_label:ownerApproved?'Owner-approved artwork · baked transparent rounded corners; dimensions preserved':'Artwork pending approval · baked transparent rounded corners; dimensions preserved',status:ownerApproved?'approved':'draft',...(ownerApproved?{approved_at:new Date().toISOString()}:{})}).select('id').single();
     if(save.error)throw save.error;
     if(ownerApproved&&!libraryFormats.some(a=>a.partner_id===client.id&&a.creative_format===format&&a.active_artwork_id)){
      const master=await db.from('advertising_partner_artwork_library').update({active_artwork_id:save.data.id}).eq('partner_id',client.id).eq('creative_format',format).is('active_artwork_id',null);
      if(master.error)throw master.error;
     }
     saved++;
    }catch(e){failed++;errors.push(item.name+': '+e.message)}
    finally{image?.close?.();status('Importing '+(saved+failed+skipped)+' of '+entries.length+' · '+saved+' saved · '+skipped+' duplicate · '+failed+' failed')}
   }
   await load();
   status('Artwork ZIP imported: '+saved+' files saved in the correct client libraries'+(skipped?' · '+skipped+' identical duplicates skipped':'')+(failed?' · '+failed+' failed: '+errors.slice(0,3).join('; '):'')+'. Live advertising placements have not changed.');
  }catch(e){status('Artwork ZIP import failed: '+e.message)}
  finally{go.disabled=false}
 },true);
 bar.append(info,file,go);$('cal-search').insertAdjacentElement('beforebegin',bar);
}

addZipImporter();
$('cal-search').oninput=renderClients;
$('cal-manage-locations').onclick=()=>{if(!selected)return;window.dispatchEvent(new CustomEvent('anybike:advertiser-placement',{detail:{partnerId:selected}}))};
$('cal-back').onclick=()=>{selected=null;$('cal-folder').hidden=true;renderClients()};
(async()=>{
 try{
  db=getAdminSupabaseClient();
  const auth=await db.rpc('anybike_is_admin');
  if(auth.error||auth.data!==true)throw Error('Administrator permission required');
  $('cal-contents').hidden=false;await load();status('Choose an advertiser to open its file.');
 }catch(e){status('Client files unavailable: '+e.message)}
})();
})();