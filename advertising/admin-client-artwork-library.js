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
let db,clients=[],campaigns=[],slots=[],placements=[],versions=[],selected=null;
async function load(){
 const results=await Promise.all([
  db.from('commercial_partners').select('id,name').order('name'),
  db.from('advertising_campaigns').select('id,partner_id,stock_card_image_url,slim_image_url,desktop_image_url,mobile_image_url'),
  db.from('advertising_client_artwork_slots').select('slot_code,partner_id,creative_format,active_artwork_id'),
  db.from('advertising_square_house_placements').select('slot_code,artwork_url'),
  db.from('advertising_client_artwork').select('id,partner_id,creative_format,file_name,public_url,status,source_label,created_at').order('created_at',{ascending:false}).limit(1000)
 ]);
 for(const r of results)if(r.error)throw r.error;
 [clients,campaigns,slots,placements,versions]=results.map(r=>r.data||[]);
 renderClients();if(selected)renderFolder();
}
function visibleClients(){
 const relevant=new Set([...campaigns.map(c=>c.partner_id),...slots.map(s=>s.partner_id)]);
 const search=$('cal-search').value.trim().toLowerCase();
 return clients.filter(c=>relevant.has(c.id)&&c.name.toLowerCase().includes(search));
}
function renderClients(){
 $('cal-clients').replaceChildren();
 for(const c of visibleClients()){
  const n=versions.filter(v=>v.partner_id===c.id&&v.status==='approved').length;
  const b=button(c.name+(n?' · '+n+' saved':''),()=>{selected=c.id;$('cal-folder').hidden=false;renderFolder();$('cal-folder').scrollIntoView({block:'nearest',behavior:'smooth'})},selected===c.id);
  $('cal-clients').append(b);
 }
 if(!$('cal-clients').children.length)$('cal-clients').append(make('p','No advertisers match your search.'));
}
function currentArt(format,field){
 const stored=versions.find(v=>v.partner_id===selected&&v.creative_format===format&&slots.some(s=>s.partner_id===selected&&s.active_artwork_id===v.id));
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
  if(Math.abs(bitmap.width/bitmap.height/ratios[format]-1)>.025)throw Error('Wrong size: '+bitmap.width+' × '+bitmap.height+'. Use the correct '+format+' format.');
  if(bitmap.width<600||bitmap.height<200)throw Error('Resolution too small.');
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
 if(!confirm('Approve this artwork for '+clients.find(c=>c.id===selected)?.name+'? Confirm branding, rights, wording and corners.'))return;
 try{
  const r=await db.from('advertising_client_artwork').update({status:'approved',approved_at:new Date().toISOString()}).eq('id',v.id).eq('status','draft').select('id').single();
  if(r.error)throw r.error;
  await load();status('Approved '+v.file_name+'. You can now make it live.');
 }catch(e){status('Approval failed: '+e.message)}
}
async function activate(v,format,field){
 const matched=slots.filter(s=>s.partner_id===selected&&s.creative_format===format);
 const n=campaigns.filter(c=>c.partner_id===selected).length;
 if(!matched.length&&!n){return status('No campaign or placement is linked to this client yet.')}
 if(!confirm('Make this '+format.replace('_',' ')+' artwork live for '+clients.find(c=>c.id===selected)?.name+'? Existing destination links will stay unchanged.'))return;
 try{
  if(format==='square'){
   if(!matched.length)throw Error('There is no square named placement for this client.');
   for(const slot of matched){const x=await db.rpc('advertising_activate_client_artwork',{p_slot_code:slot.slot_code,p_artwork_id:v.id});if(x.error)throw x.error}
  }else{
   // Campaign targeting, destination and metrics stay untouched; only artwork changes.
   for(const c of campaigns.filter(c=>c.partner_id===selected)){
    const x=await db.from('advertising_campaigns').update({[field]:v.public_url}).eq('id',c.id).select('id').single();
    if(x.error)throw x.error;
   }
  }
  await load();status('New artwork is now assigned centrally. No individual pages were edited.');
 }catch(e){status('Could not activate: '+e.message)}
}
function renderFolder(){
 const client=clients.find(c=>c.id===selected);
 if(!client){$('cal-folder').hidden=true;return}
 $('cal-folder').hidden=false;$('cal-title').textContent=client.name+' · 5 advert sizes';
 const host=$('cal-five');host.replaceChildren();
 for(const [format,label,ratio,field] of formats){
  const card=make('div');card.style.cssText='min-width:0;border:1px solid #444;background:#202020;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:10px';
  card.append(make('strong',label+' · '+ratio));
  const imageUrl=currentArt(format,field),imageBox=make('div');
  imageBox.style.cssText='height:160px;display:grid;place-items:center;background:#111;border-radius:11px;overflow:hidden';
  if(imageUrl){const image=make('img');image.src=imageUrl;image.alt=client.name+' '+label+' advert';image.loading='lazy';image.style.cssText='display:block;width:100%;height:100%;object-fit:contain';imageBox.append(image)}
  else imageBox.append(make('span','No artwork yet'));
  card.append(imageBox);
  const upload=make('input');upload.type='file';upload.accept='image/webp';upload.setAttribute('aria-label','Choose '+label+' advert for '+client.name);upload.style.cssText='max-width:100%;font-size:12px';
  const save=button('Upload replacement',()=>uploadFile(format,upload.files?.[0]),true);card.append(upload,save);
  const rows=versions.filter(v=>v.partner_id===selected&&v.creative_format===format);
  const history=make('details');const summary=make('summary','Artwork versions ('+rows.length+')');summary.style.cursor='pointer';history.append(summary);
  for(const v of rows){
   const line=make('div');line.style.cssText='border-top:1px solid #444;padding:8px 0;font-size:12px';
   line.append(make('div',v.file_name+' · '+v.status));
   if(v.status==='draft')line.append(button('Approve',()=>approve(v)));
   if(v.status==='approved')line.append(button('Use this artwork',()=>activate(v,format,field),true));
   history.append(line);
  }
  card.append(history);host.append(card);
 }
}
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