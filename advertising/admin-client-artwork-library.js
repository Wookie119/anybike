// AnyBike Mega System client files: click advertiser, see five formats, manage versions.
(()=>{'use strict';
const root=document.createElement('section');root.id='client-artwork-library';
root.style.cssText='background:#171717;border:1px solid #414141;border-radius:12px;margin:18px 0;padding:18px;color:#fff';
root.innerHTML='<h2 style="margin:0 0 6px">Advertiser files</h2><p style="color:#bbb;margin:0 0 12px">Click an advertiser to see its five advert sizes. Artwork is held in that client’s file, not on individual pages.</p><p id="cal-status" role="status" aria-live="polite" style="color:#bbb">Checking admin access…</p><div id="cal-contents" hidden><input id="cal-search" type="search" aria-label="Find advertiser" placeholder="Find an advertiser" style="width:100%;max-width:340px;padding:10px;background:#232323;border:1px solid #555;border-radius:8px;color:white;margin:0 0 12px"><div id="cal-clients" style="display:flex;flex-wrap:wrap;gap:9px"></div><div id="cal-folder" hidden style="margin-top:20px;border-top:1px solid #444;padding-top:15px"><div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px"><button type="button" id="cal-back" style="background:#333;color:white;border:1px solid #666;border-radius:7px;padding:9px 14px">← All advertisers</button><h3 id="cal-title" style="margin:0"></h3></div><div id="cal-five" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px"></div></div></div>';
(document.querySelector('main')||document.body).append(root);
const $=s=>root.querySelector('#'+s),status=t=>{$('cal-status').textContent=t};
const make=(tag,t)=>{const e=document.createElement(tag);if(t!==undefined)e.textContent=String(t);return e};
const button=(label,fn,primary=false)=>{const b=make('button',label);b.type='button';b.style.cssText='padding:9px 12px;border-radius:8px;border:1px solid '+(primary?'#ed1c24':'#555')+';background:'+(primary?'#ed1c24':'#282828')+';color:#fff;font-weight:700;cursor:pointer';b.onclick=fn;return b};
const formats=[['square','Square','1:1','square'],['stock_card','Available Stock','4:3','stock_card_image_url'],['slim','Slim banner','3:1','slim_image_url'],['landscape','Landscape','16:9','desktop_image_url'],['portrait','Portrait','4:5','mobile_image_url']];
const ratios={square:1,stock_card:4/3,slim:3,landscape:16/9,portrait:4/5};
let db,clients=[],campaigns=[],slots=[],placements=[],versions=[],libraryFormats=[],selected=null;
async function load(){
 const results=await Promise.all([
  db.from('commercial_partners').select('id,name').order('name'),
  db.from('advertising_campaigns').select('id,partner_id,stock_card_image_url,slim_image_url,desktop_image_url,mobile_image_url'),
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
async function uploadFile(format,file){
 if(!file)return status('Choose a WebP image first.');
 if(file.type!=='image/webp'||!file.size||file.size>10*1024*1024)return status('Use WebP artwork under 10 MB.');
 let bitmap;
 try{
  bitmap=await createImageBitmap(file);
  if(Math.abs(bitmap.width/bitmap.height/ratios[format]-1)>.006)throw Error('Wrong dimensions: '+bitmap.width+' × '+bitmap.height+'. Save the finished '+format.replace('_',' ')+' artwork at the required aspect ratio.');
  if(bitmap.width<600||bitmap.height<200)throw Error('Resolution too small.');
  const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context)throw Error('Artwork could not be checked.');
  context.drawImage(bitmap,0,0);
  const corners=[[0,0],[bitmap.width-1,0],[0,bitmap.height-1],[bitmap.width-1,bitmap.height-1]];
  if(corners.some(([x,y])=>context.getImageData(x,y,1,1).data[3]>20))throw Error('Artwork must have rounded, transparent corners saved into the file. No page cropping or corner masks.');
  const name=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-').slice(-100);
  const path='clients/'+selected+'/'+format+'/'+crypto.randomUUID()+'-'+name;
  status('Uploading '+file.name+'…');
  const u=await db.storage.from('advertising-creatives').upload(path,file,{upsert:false,cacheControl:'31536000',contentType:'image/webp'});
  if(u.error)throw u.error;
  const {data:pub}=db.storage.from('advertising-creatives').getPublicUrl(path);
  const row=await db.from('advertising_client_artwork').insert({partner_id:selected,creative_format:format,storage_path:path,public_url:pub.publicUrl,file_name:file.name,source_label:'Client artwork',alt_text:clients.find(c=>c.id===selected)?.name+' advertisement',status:'draft'});
  if(row.error)throw row.error;
  await load();status('Saved in this client file as a draft. Review and approve it below.');
 }catch(e){status('Upload failed: '+e.message)}
 finally{bitmap?.close?.()}
}
async function approve(v){
 if(v.storage_path?.startsWith('linked-existing/')||v.source_label?.startsWith('Existing '))return status('This is a source advert, not a finished master. Upload the properly sized WebP with rounded corners first.');
 if(!confirm('Approve this finished artwork for '+clients.find(c=>c.id===selected)?.name+'? Confirm rights, wording and visible rounded corners.'))return;
 try{
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
  const master=libraryFormats.find(a=>a.partner_id===selected&&a.creative_format===format);
  const activeVersion=versions.find(v=>v.id===master?.active_artwork_id&&v.status==='approved');
  const previews=versions.filter(v=>v.partner_id===selected&&v.creative_format===format);
  const labelStatus=make('small',activeVersion?'Approved master artwork':'Master artwork missing · upload and approve');
  labelStatus.style.cssText='color:'+(activeVersion?'#7ed6a5':'#ddd')+';font-size:12px';
  card.append(labelStatus);
  const imageUrl=currentArt(format,field),imageBox=make('div');
  imageBox.style.cssText='height:160px;display:grid;place-items:center;background:#111;border-radius:11px;overflow:hidden';
  if(imageUrl){const image=make('img');image.src=imageUrl;image.alt=client.name+' '+label+' advert';image.loading='lazy';image.style.cssText='display:block;width:100%;height:100%;object-fit:contain';imageBox.append(image)}
  else imageBox.append(make('span','No artwork yet'));
  card.append(imageBox);
  if(imageUrl&&!activeVersion){
   const note=make('small','Existing campaign artwork shown for reference only. It is not an approved master for this size.');
   note.style.cssText='color:#d7c7ac;font-size:12px;line-height:1.4';card.append(note);
  }
  const upload=make('input');upload.type='file';upload.accept='image/webp';upload.setAttribute('aria-label','Choose '+label+' advert for '+client.name);upload.style.cssText='max-width:100%;font-size:12px';
  const save=button('Upload replacement',()=>uploadFile(format,upload.files?.[0]),true);card.append(upload,save);
  const rows=versions.filter(v=>v.partner_id===selected&&v.creative_format===format);
  const history=make('details');const summary=make('summary','Artwork versions ('+rows.length+')');summary.style.cursor='pointer';history.append(summary);
  for(const v of rows){
   const line=make('div');line.style.cssText='border-top:1px solid #444;padding:8px 0;font-size:12px';
   const legacy=Boolean(v.storage_path?.startsWith('linked-existing/')||v.source_label?.startsWith('Existing '));
   line.append(make('div',v.file_name+' · '+(legacy?'Source artwork · not placement-ready':v.status)));
   if(legacy)line.append(make('small','Saved in this advertiser file. Prepare the correct finished size with transparent rounded corners before approval.'));
   if(v.status==='draft'&&!legacy)line.append(button('Approve',()=>approve(v)));
   if(v.status==='approved')line.append(button('Use this artwork',()=>activate(v,format,field),true));
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
 const info=make('p','Import all advertisers from one ZIP or import one advertiser’s five finished WebP files. Images are checked for exact size and transparent rounded corners, saved in each advertiser file as drafts, and are not published automatically.');info.style.cssText='width:100%;color:#ccc;margin:0';
 const file=make('input');file.type='file';file.accept='.zip,application/zip';file.setAttribute('aria-label','Choose advertiser artwork ZIP');
 const go=button('Import artwork ZIP',async()=>{
  if(!file.files?.[0])return status('Choose the ZIP file first.');
  if(!window.JSZip)return status('ZIP reader unavailable. Refresh and try again.');
  if(file.files[0].size>40000000)return status('ZIP must be smaller than 40 MB.');
  go.disabled=true;
  let saved=0,failed=0;const errors=[];
  try{
   const archive=await JSZip.loadAsync(file.files[0],{checkCRC32:true});
   const entries=Object.values(archive.files).filter(e=>!e.dir&&e.name.toLowerCase().endsWith('.webp'));
   if(!entries.length||entries.length>100)throw Error('Expected 1–100 WebP artworks.');
   const dims={square:[1000,1000],stock_card:[1200,900],slim:[1500,500],landscape:[1600,900],portrait:[800,1000]};
   for(const item of entries){
    let image;
    try{
     const name=item.name.split('/').pop();
     const match=name.match(/^([a-z0-9-]+)-(square|stock_card|slim|landscape|portrait)-([0-9]+)x([0-9]+)\.webp$/i);
     if(!match)throw Error('Invalid artwork filename');
     const slug=match[1],format=match[2],wh=dims[format];
     const client=clients.find(c=>c.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')===slug.toLowerCase());
     if(!client)throw Error('Advertiser not found: '+slug);
     if(Number(match[3])!==wh[0]||Number(match[4])!==wh[1])throw Error('Invalid image size');
     const bytes=await item.async('uint8array');
     if(!bytes.length||bytes.length>10000000)throw Error('Image too large or empty');
     const webp=new File([bytes],name,{type:'image/webp'});
     image=await createImageBitmap(webp);
     if(image.width!==wh[0]||image.height!==wh[1])throw Error('Image pixel size mismatch');
     const cv=document.createElement('canvas');cv.width=image.width;cv.height=image.height;
     const ctx=cv.getContext('2d',{willReadFrequently:true});
     if(!ctx)throw Error('Cannot verify artwork');
     ctx.drawImage(image,0,0);
     if([[0,0],[cv.width-1,0],[0,cv.height-1],[cv.width-1,cv.height-1]].some(([x,y])=>ctx.getImageData(x,y,1,1).data[3]>20))throw Error('Rounded transparent corners required');
     const path='clients/'+client.id+'/'+format+'/'+crypto.randomUUID()+'-'+name;
     const upload=await db.storage.from('advertising-creatives').upload(path,webp,{upsert:false,contentType:'image/webp',cacheControl:'31536000'});
     if(upload.error)throw upload.error;
     const url=db.storage.from('advertising-creatives').getPublicUrl(path).data.publicUrl;
     const save=await db.from('advertising_client_artwork').insert({partner_id:client.id,creative_format:format,storage_path:path,public_url:url,file_name:name,alt_text:client.name+' advertisement',source_label:'Prepared ZIP artwork · pending review',status:'draft'});
     if(save.error)throw save.error;
     saved++;
    }catch(e){failed++;errors.push(item.name+': '+e.message)}
    finally{image?.close?.();status('Importing '+(saved+failed)+' of '+entries.length+' · '+saved+' saved · '+failed+' failed')}
   }
   await load();
   status('Artwork ZIP imported: '+saved+' files in advertiser libraries.'+(failed?' '+failed+' could not be saved: '+errors.slice(0,3).join('; '):'')+' Review and approve each finished creative before it can be placed.');
  }catch(e){status('Artwork ZIP import failed: '+e.message)}
  finally{go.disabled=false}
 },true);
 bar.append(info,file,go);$('cal-search').insertAdjacentElement('beforebegin',bar);
}

addZipImporter();
$('cal-search').oninput=renderClients;
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