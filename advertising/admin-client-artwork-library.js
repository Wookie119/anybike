// AnyBike Mega System — central advertiser creative library and instant client artwork replacement.
// One client record, many approved versions, one active assignment per placement.
(()=>{
'use strict';
const root=document.createElement('section');
root.id='client-artwork-library';root.style.cssText='background:#171717;border:1px solid #454545;border-radius:12px;margin:20px 0;padding:19px;color:#fff';
root.innerHTML='<h2 style="margin:0 0 8px">Client artwork library</h2><p style="color:#bbb;margin:0 0 12px">Store artwork by advertiser. New uploads remain drafts. Approve a version, then activate it to replace the image at its named advertising slot without editing a page or changing its link.</p><div id="cal-loading" role="status">Checking administrator access…</div><div id="cal-content" hidden><div style="display:flex;flex-wrap:wrap;gap:14px;align-items:end"><label style="flex:1;min-width:210px">Advertiser<br><select id="cal-client" style="width:100%;padding:9px;background:#242424;color:#fff;border:1px solid #777;border-radius:7px"></select></label><label style="flex:1;min-width:180px">Artwork format<br><select id="cal-format" style="width:100%;padding:9px;background:#242424;color:#fff;border:1px solid #777;border-radius:7px"><option value="square">Square 1:1</option><option value="stock_card">Available Stock 4:3</option><option value="slim">Slim 3:1</option><option value="landscape">Landscape 16:9</option><option value="portrait">Portrait 4:5</option></select></label><label style="flex:2;min-width:210px">Upload new WebP artwork<br><input id="cal-file" type="file" accept="image/webp" style="width:100%"></label></div><div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:12px 0"><label style="flex:2;min-width:200px">Source / client reference<br><input id="cal-source" value="AnyBike-created draft" maxlength="120" style="width:100%;padding:8px;background:#242424;color:#fff;border:1px solid #777;border-radius:7px"></label><button type="button" id="cal-upload" style="padding:11px 18px;background:#ed1c24;color:white;border:0;border-radius:7px;font-weight:700">Upload draft artwork</button><button type="button" id="cal-refresh" style="padding:11px;border:1px solid #666;border-radius:7px;background:#292929;color:white">Refresh library</button></div><p id="cal-status" role="status" aria-live="polite" style="color:#ccc"></p><div id="cal-slots"></div><h3>Stored creative versions</h3><div id="cal-versions"></div></div>';
const main=document.querySelector('main')||document.body;main.append(root);
const $=id=>root.querySelector('#'+id),say=text=>{$('cal-status').textContent=text};
let db,clients=[],slots=[],versions=[];
const formats={square:1,stock_card:4/3,slim:3,landscape:16/9,portrait:4/5};
const make=(tag,content)=>{let n=document.createElement(tag);if(content!==undefined)n.textContent=content;return n};
const styleBtn=b=>{b.type='button';b.style.cssText='padding:8px 12px;border:1px solid #777;color:white;background:#282828;border-radius:7px;cursor:pointer;margin:4px 6px 4px 0';return b};
function selector(el,options){el.replaceChildren();for(const [id,name] of options){const o=make('option',name);o.value=id;el.append(o)}}
function render(){
 const partner=$('cal-client').value,format=$('cal-format').value;
 const pslots=slots.filter(s=>s.partner_id===partner);
 const panel=$('cal-slots');panel.replaceChildren();
 const title=make('strong','Named placements for this client');panel.append(title);
 if(!pslots.length)panel.append(make('p','No named spaces are assigned to this client yet. New artwork remains safely in its client library.'));
 for(const slot of pslots){
  const wrap=make('div');wrap.style.cssText='padding:9px;margin:8px 0;border:1px solid #444;border-radius:8px';
  const info=make('div',slot.slot_code+' · '+slot.creative_format+' · '+(slot.active_artwork_id?'Active client-library artwork':'Legacy creative still active'));wrap.append(info);
  const options=versions.filter(v=>v.partner_id===partner&&v.creative_format===slot.creative_format&&v.status==='approved');
  const select=make('select');select.style.cssText='max-width:420px;background:#262626;color:#fff;padding:8px;border:1px solid #666;border-radius:7px;margin:7px 5px 0 0';
  selector(select,[['','Select approved artwork to replace this slot'],...options.map(v=>[v.id,v.file_name+' · '+new Date(v.created_at).toLocaleDateString('en-GB')])]);
  if(slot.active_artwork_id)select.value=slot.active_artwork_id;
  const activate=styleBtn(make('button','Activate selected creative'));
  activate.disabled=!options.length;
  activate.onclick=async()=>{
   if(!select.value)return say('Choose approved artwork first.');
   if(!confirm('Replace the live artwork at '+slot.slot_code+'? The advert destination link will not change.'))return;
   activate.disabled=true;
   try{const x=await db.rpc('advertising_activate_client_artwork',{p_slot_code:slot.slot_code,p_artwork_id:select.value});if(x.error)throw x.error;await load();say('Artwork activated for '+slot.slot_code+'. Public ads will use the replacement on their next load.')}
   catch(e){say('Activation failed: '+e.message)}
   finally{activate.disabled=false}
  };
  wrap.append(select,activate);panel.append(wrap);
 }
 const holder=$('cal-versions');holder.replaceChildren();
 const relevant=versions.filter(v=>v.partner_id===partner&&v.creative_format===format);
 if(!relevant.length)holder.append(make('p','No artwork files for this advertiser and format.'));
 for(const v of relevant){
  const box=make('div');box.style.cssText='display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-top:1px solid #333;padding:12px 0';
  const img=make('img');img.src=v.public_url;img.alt=v.alt_text||v.file_name;img.loading='lazy';img.style.cssText='width:104px;height:104px;object-fit:contain;border-radius:12px;background:#101010';
  const text=make('div');text.style.cssText='flex:1;min-width:180px';
  text.append(make('strong',v.file_name),make('div','Status: '+v.status+' · '+v.source_label),make('small',new Date(v.created_at).toLocaleString('en-GB')));
  box.append(img,text);
  if(v.status==='draft'){
   const approve=styleBtn(make('button','Approve artwork'));approve.onclick=async()=>{
    if(!confirm('Approve this creative as suitable for publication? Check branding, wording, artwork rights and size first.'))return;
    approve.disabled=true;try{const x=await db.from('advertising_client_artwork').update({status:'approved',approved_at:new Date().toISOString()}).eq('id',v.id).eq('status','draft').select('id').single();if(x.error)throw x.error;await load();say('Artwork approved. Select it under the assigned placement to publish.')}catch(e){say('Approval failed: '+e.message)}finally{approve.disabled=false}
   };box.append(approve);
  }
  if(v.status==='approved'&&!slots.some(s=>s.active_artwork_id===v.id)){
   const archive=styleBtn(make('button','Archive'));archive.onclick=async()=>{if(!confirm('Archive this unused artwork?'))return;try{const x=await db.from('advertising_client_artwork').update({status:'archived'}).eq('id',v.id);if(x.error)throw x.error;await load()}catch(e){say(e.message)}};box.append(archive)
  }
  holder.append(box)
 }
}
async function load(){
 const [p,s,v]=await Promise.all([
 db.from('commercial_partners').select('id,name').order('name'),
 db.from('advertising_client_artwork_slots').select('slot_code,partner_id,creative_format,active_artwork_id').order('slot_code'),
 db.from('advertising_client_artwork').select('id,partner_id,creative_format,file_name,public_url,alt_text,source_label,status,created_at').order('created_at',{ascending:false}).limit(1000)]);
 for(const x of [p,s,v])if(x.error)throw x.error;
 clients=p.data||[];slots=s.data||[];versions=v.data||[];
 const chosen=$('cal-client').value;
 selector($('cal-client'),clients.map(c=>[c.id,c.name]));
 if(clients.some(c=>c.id===chosen))$('cal-client').value=chosen;
 render();
}
$('cal-client').onchange=render;$('cal-format').onchange=render;
$('cal-refresh').onclick=async()=>{try{await load();say('Client artwork library refreshed.')}catch(e){say('Refresh failed: '+e.message)}};
$('cal-upload').onclick=async()=>{
 const partner=$('cal-client').value,format=$('cal-format').value,file=$('cal-file').files?.[0];
 if(!partner||!file)return say('Choose an advertiser, a format and a WebP file.');
 if(file.type!=='image/webp'||file.size>10*1024*1024||!file.size)return say('Use a WebP image no larger than 10 MB.');
 const btn=$('cal-upload');btn.disabled=true;
 let bitmap;
 try{
  bitmap=await createImageBitmap(file);const ratio=bitmap.width/bitmap.height;
  if(Math.abs(ratio/formats[format]-1)>.025)throw Error('Wrong aspect ratio: '+bitmap.width+' × '+bitmap.height+'. Upload correct '+format+' artwork; it must not be cropped or stretched.');
  if(bitmap.width<600||bitmap.height<200)throw Error('Artwork resolution is too low.');
  const name=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-').slice(-100);
  const path='clients/'+partner+'/'+format+'/'+crypto.randomUUID()+'-'+name;
  const upload=await db.storage.from('advertising-creatives').upload(path,file,{cacheControl:'31536000',upsert:false,contentType:'image/webp'});
  if(upload.error)throw upload.error;
  const {data:url}=db.storage.from('advertising-creatives').getPublicUrl(path);
  const x=await db.from('advertising_client_artwork').insert({partner_id:partner,creative_format:format,storage_path:path,public_url:url.publicUrl,file_name:file.name,alt_text:clients.find(c=>c.id===partner)?.name+' advertisement',source_label:$('cal-source').value.trim()||'AnyBike-created draft',status:'draft'});
  if(x.error)throw x.error;
  $('cal-file').value='';await load();say('Uploaded to advertiser file as a draft. Review, approve, then activate to replace the current advert.');
 }catch(e){say('Upload failed: '+e.message)}
 finally{bitmap?.close?.();btn.disabled=false}
};
async function init(){
 try{
  db=getAdminSupabaseClient();
  const a=await db.rpc('anybike_is_admin');
  if(a.error||a.data!==true)throw Error('Administrator access required.');
  $('cal-loading').hidden=true;$('cal-content').hidden=false;
  await load();say('Ready: client artwork is versioned and independent of page HTML.');
 }catch(e){$('cal-loading').textContent='Artwork library unavailable: '+e.message}
}
init();
})();