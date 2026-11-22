// Bulk import approved 1:1 campaign artwork to the seven existing stock-feed partner drafts.
// Deliberately does not activate campaigns or change public placements.
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const root=$('anybikeExistingHouseAdverts')||$('namedAdvertisingSpaces');
 if(!root)return;
 const expected=new Map([
  ['catalyst','Catalyst'],['click_dealer','Click Dealer'],
  ['dealerwebs','Dealerwebs'],['deep_blue','Deep Blue'],
  ['evopos','EVOPOS'],['media_links','Media Links'],['pyramid','Pyramid']
 ]);
 const panel=document.createElement('section');
 panel.id='softwareCreativeImporter';
 panel.innerHTML='<h2>Stock-feed software adverts · bulk artwork import</h2>'+
  '<p style="font-size:13px;color:#bbb">Upload the seven square WebP files from the AnyBike artwork pack in one selection. Each image is attached only to its matching company draft, using the existing campaign and creative storage. Nothing goes live automatically.</p>'+
  '<div class="bar"><input id="softwareCreativeFiles" type="file" multiple accept=".zip,.webp,image/webp,application/zip" aria-label="Select seven square software adverts"><button id="softwareCreativeReview" type="button">Check artwork</button><button id="softwareCreativeUpload" type="button" class="primary" disabled>Import checked drafts</button></div>'+
  '<p id="softwareCreativeStatus" role="status" aria-live="polite"></p><div class="scroll"><table><thead><tr><th>Company</th><th>File</th><th>Campaign</th><th>Result</th></tr></thead><tbody id="softwareCreativeRows"></tbody></table></div>';
 root.insertAdjacentElement('afterend',panel);
 let verified=[];
 const setStatus=text=>{$('softwareCreativeStatus').textContent=text};
 function addRow(company,file,campaign,result){
  const tr=document.createElement('tr');
  for(const value of [company,file,campaign,result]){const td=document.createElement('td');td.textContent=value;tr.append(td)}
  $('softwareCreativeRows').append(tr);
 }
 let zipLibraryLoading=null;
 async function readArtworkFiles(){
  const chosen=[...($('softwareCreativeFiles').files||[])];
  if(chosen.length===1&&/\\.zip$/i.test(chosen[0].name)){
   const zipFile=chosen[0];
   if(zipFile.size>12*1024*1024||zipFile.size<=0)throw Error('ZIP must be between 1 byte and 12 MB.');
   if(!window.JSZip){
    if(!zipLibraryLoading)zipLibraryLoading=new Promise((resolve,reject)=>{
     const script=document.createElement('script');
     script.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
     script.onload=()=>window.JSZip?resolve():reject(Error('ZIP reader not available'));
     script.onerror=()=>reject(Error('ZIP reader failed to load; select the extracted WebP files instead'));
     document.head.appendChild(script);
    });
    await zipLibraryLoading;
   }
   const archive=await window.JSZip.loadAsync(zipFile,{checkCRC32:true});
   const entries=Object.values(archive.files).filter(x=>!x.dir);
   if(entries.length!==7||entries.some(x=>!/^([a-z0-9_-]+)-square\\.webp$/i.test(x.name)))
    throw Error('Expected exactly the seven named square WebP adverts at the ZIP root.');
   const files=[];
   for(const entry of entries){
    const data=await entry.async('uint8array');
    if(!data.length||data.length>10*1024*1024)throw Error('Invalid or oversized artwork: '+entry.name);
    files.push(new File([data],entry.name,{type:'image/webp'}));
   }
   return files;
  }
  if(chosen.some(f=>/\\.zip$/i.test(f.name)))throw Error('Select either one ZIP or individual WebP files, not both.');
  return chosen;
 }
 async function check(){
  verified=[];$('softwareCreativeUpload').disabled=true;$('softwareCreativeRows').replaceChildren();
  const files=await readArtworkFiles();
  if(!files.length){setStatus('Select the ZIP pack or the extracted WebP files first.');return}
  if(files.length>7){setStatus('At most seven company adverts can be imported in one batch.');return}
  const db=getAdminSupabaseClient();
  const auth=await db.rpc('anybike_is_admin');
  if(auth.error||auth.data!==true){setStatus('Admin permission required.');return}
  const [partners,campaigns]=await Promise.all([
   db.from('commercial_partners').select('id,name').eq('kind','stock_feed'),
   db.from('advertising_campaigns').select('id,partner_id,name,status,compact_image_url,campaign_category')
     .like('name','AnyBike complimentary software showcase — %')
  ]);
  if(partners.error||campaigns.error){setStatus('Unable to read draft campaigns: '+(partners.error?.message||campaigns.error?.message));return}
  const seen=new Set();let errors=0;
  for(const file of files){
   const key=file.name.toLowerCase().replace(/-square\.webp$/,'').replace(/\.webp$/,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
   const company=expected.get(key);
   const partner=(partners.data||[]).find(p=>p.name.toLowerCase()===company?.toLowerCase());
   const campaign=(campaigns.data||[]).find(c=>c.partner_id===partner?.id);
   let error='';
   if(!company)error='Filename does not match a registered company';
   else if(seen.has(company))error='Duplicate company artwork in selection';
   else if(!partner||!campaign)error='Draft campaign not found';
   else if(campaign.status!=='draft'||campaign.campaign_category!=='house')error='Not a complimentary draft';
   else if(campaign.compact_image_url)error='Square artwork already assigned; use campaign editor to review replacement';
   else if(file.size>10*1024*1024||file.size<=0||file.type!=='image/webp')error='WebP required, maximum 10 MB';
   if(!error){
    let bitmap;
    try{bitmap=await createImageBitmap(file);if(Math.abs(bitmap.width/bitmap.height-1)>0.035)error='Artwork must be square (1:1)'}
    catch(e){error='Cannot read artwork: '+(e?.message||e)}
    finally{bitmap?.close?.()}
   }
   if(error)errors++;else{seen.add(company);verified.push({file,company,campaign})}
   addRow(company||'Unrecognised',file.name,campaign?.name||'—',error||'Ready to import');
  }
  $('softwareCreativeUpload').disabled=!verified.length||!!errors;
  setStatus(errors?errors+' item(s) need attention; no files uploaded.':verified.length+' files verified. Click Import checked drafts to save. No campaigns will be activated.');
 }
 $('softwareCreativeReview').addEventListener('click',()=>check().catch(e=>setStatus('Review failed: '+e.message)));
 $('softwareCreativeFiles').addEventListener('change',()=>{verified=[];$('softwareCreativeUpload').disabled=true;setStatus('New files selected. Check artwork before importing.');$('softwareCreativeRows').replaceChildren()});
 $('softwareCreativeUpload').addEventListener('click',async()=>{
  if(!verified.length)return;
  const button=$('softwareCreativeUpload');button.disabled=true;
  try{
   const db=getAdminSupabaseClient();
   const checkAuth=await db.rpc('anybike_is_admin');
   if(checkAuth.error||checkAuth.data!==true)throw Error('Admin permission required');
   if(!confirm('Attach '+verified.length+' square adverts to their matching draft campaigns? Nothing will be activated.'))return;
   let done=0;let failed=0;
   $('softwareCreativeRows').replaceChildren();
   for(const item of verified){
    const {file,company,campaign}=item;
    setStatus('Importing '+(done+failed+1)+' of '+verified.length+': '+company);
    try{
     const fresh=await db.from('advertising_campaigns').select('id,status,compact_image_url').eq('id',campaign.id).single();
     if(fresh.error||fresh.data?.status!=='draft'||fresh.data?.compact_image_url)throw Error('Draft changed or already has square artwork');
     const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-');
     const path='campaigns/'+campaign.id+'/'+crypto.randomUUID()+'-'+safe;
     const up=await db.storage.from('advertising-creatives').upload(path,file,{cacheControl:'31536000',contentType:'image/webp',upsert:false});
     if(up.error)throw up.error;
     const url=db.storage.from('advertising-creatives').getPublicUrl(path).data?.publicUrl;
     if(!url||!url.startsWith('https://'))throw Error('No secure artwork URL');
     const save=await db.from('advertising_campaigns').update({compact_image_url:url}).eq('id',campaign.id).eq('status','draft').is('compact_image_url',null).select('id').maybeSingle();
     if(save.error||!save.data)throw Error('Artwork uploaded but campaign link not saved; review storage for unused file');
     done++;addRow(company,file.name,campaign.name,'Imported · draft only');
    }catch(e){failed++;addRow(company,file.name,campaign.name,'Failed: '+(e?.message||e))}
   }
   setStatus(done+' imported, '+failed+' failed. Refresh campaign performance to see the newly linked artwork. All campaigns remain drafts.');
   verified=[];
  }catch(e){setStatus('Import stopped: '+e.message)}
  finally{button.disabled=true}
 });
})();