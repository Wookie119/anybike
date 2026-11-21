(()=>{'use strict';const $=id=>document.getElementById(id), status=t=>$('adstatus').textContent=t;let db,partners=[],campaigns=[],performance=[],commissions=[],editId=null,partnerId=null,coverage=[];const types={status:['draft','active','inactive'],campaign_category:['external','house'],placement:['below_hero','below_header','above_footer','content_top','existing_house','stock_card'],revenue_model:['commission','per_click','per_lead','monthly','fixed','own_promotion']};const cf={partner_id:'Partner',name:'Campaign name',campaign_category:'Advertising category',status:'Status',placement:'Placement',headline_template:'Headline ({{make}} {{model}})',subheading:'Subheading',cta_text:'Button text',desktop_image_url:'Large landscape artwork URL',mobile_image_url:'Large portrait artwork URL',slim_image_url:'Slim landscape artwork URL',compact_image_url:'Compact mobile artwork URL',stock_card_image_url:'Stock card artwork URL',destination_url:'Destination HTTPS URL',alt_text:'Image description',disclosure:'Disclosure',countries:'Countries (comma-separated ISO codes)',manufacturers:'Manufacturers',models:'Models',page_categories:'Page categories',customer_types:'Customer types',page_paths:'Page paths',starts_at:'Starts (local time)',ends_at:'Ends (local time)',duration_days:'Duration days',priority:'Priority',revenue_model:'Revenue model',use_model_photo:'Use model photo',is_test:'Test campaign',compliance_reference:'Compliance reference',compliance_approved_at:'Compliance approved (local time)'};const pf={name:'Partner name',kind:'Type',status:'Status',website:'Website',logo_url:'Logo URL',branding_approved:'Branding approved',agreement_approved:'Agreement approved'};const lf={partner_id:'Partner',campaign_id:'Campaign (optional)',entry_type:'Entry type',amount:'Amount',currency:'Currency',external_reference:'External reference',notes:'Notes'};const arrays=['countries','manufacturers','models','page_categories','customer_types','page_paths'],bools=['use_model_photo','is_test','branding_approved','agreement_approved'],nums=['duration_days','priority','amount'],dates=['starts_at','ends_at','compliance_approved_at'];function el(tag,text){const n=document.createElement(tag);if(text!=null)n.textContent=text;return n}function fields(container,defs,data={},mode='campaign'){const root=$(container);root.replaceChildren();for(const [key,label] of Object.entries(defs)){const wrap=el('label',label);let opts=key==='partner_id'?partners.map(p=>[p.id,p.name]):key==='campaign_id'?[['','None'],...campaigns.map(c=>[c.id,c.name])]:key==='kind'?['affiliate','finance','stock_feed','transport','other']:key==='entry_type'?['earned','received','clawback','refund','fee']:key==='status'&&mode==='partner'?['prospect','pending','approved','inactive']:types[key];let field=el(opts?'select':'input');field.name=key;if(opts)for(const item of opts){const [v,t]=Array.isArray(item)?item:[item,item];const o=el('option',t);o.value=v;field.append(o)}else field.type=bools.includes(key)?'checkbox':nums.includes(key)?'number':dates.includes(key)?'datetime-local':'text';let v=data[key];if(bools.includes(key))field.checked=!!v;else if(dates.includes(key)&&v){const d=new Date(v);field.value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}else if(v!=null)field.value=Array.isArray(v)?v.join(', '):v;if(key==='amount')field.step='.01';wrap.append(field);root.append(wrap)}}function values(form,defs){const result={};for(const key of Object.keys(defs)){const f=form.elements[key],v=f.value.trim();result[key]=bools.includes(key)?f.checked:arrays.includes(key)?v.split(',').map(x=>x.trim()).filter(Boolean):nums.includes(key)?(v?Number(v):key==='priority'?0:null):dates.includes(key)?(v?new Date(v).toISOString():null):v||null}return result}async function get(table){const {data,error}=await db.from(table).select('*');if(error)throw error;return data||[]}async function save(table,payload,id){const q=id?db.from(table).update(payload).eq('id',id):db.from(table).insert(payload);const {data,error}=await q.select('id').single();if(error)throw error;return data.id}function row(root,items){let tr=el('tr');for(const item of items){let td=el('td');if(item instanceof Node)td.append(item);else td.textContent=item??'—';tr.append(td)}root.append(tr)}function button(text,fn){let b=el('button',text);b.type='button';b.onclick=fn;return b}function pname(id){return partners.find(p=>p.id===id)?.name||'Unknown'}const creativeSlots=[
 ['move-motorcycles-large-landscape.webp','desktop_image_url','Large landscape','16 / 9'],
 ['move-motorcycles-large-portrait.webp','mobile_image_url','Large portrait','4 / 5'],
 ['move-motorcycles-slim-landscape.webp','slim_image_url','Slim landscape','3 / 1'],
 ['move-motorcycles-compact-mobile.webp','compact_image_url','Compact mobile','1 / 1'],
 ['move-motorcycles-stock-card.webp','stock_card_image_url','Stock card','4 / 3']
];
// One artwork contract for all campaigns: image dimensions must match the
// allocated slot. Reject an unsuitable asset rather than crop any advertising.
const creativeSlotRatio={desktop_image_url:16/9,mobile_image_url:4/5,slim_image_url:3,
 compact_image_url:1,stock_card_image_url:4/3};
function validateCreativeDimensions(width,height,field,label){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
  throw Error(label+': artwork dimensions could not be verified.');
 const expected=creativeSlotRatio[field];
 if(!expected)throw Error(label+': unknown advertising format.');
 const actual=width/height,variance=Math.abs(actual/expected-1);
 if(variance>0.035)
  throw Error(label+': '+width+' × '+height+' does not match this advert slot ('+
   (expected===3?'3:1':expected===4/3?'4:3':expected===16/9?'16:9':expected===4/5?'4:5':'1:1')+
   '). Upload artwork designed for this size. AnyBike never crops advertising.');
}
async function validateUploadedCreative(file,field){
 let bitmap;
 try{
  bitmap=await createImageBitmap(file);
  validateCreativeDimensions(bitmap.width,bitmap.height,field,file.name);
 }catch(error){
  if(error?.message?.includes('does not match'))throw error;
  throw Error(file.name+': unable to read artwork dimensions. Upload a valid WebP image.');
 }finally{bitmap?.close?.()}
}
function showCreativeSizes(){
 const host=$('creativeSizePreviews');if(!host)return;
 host.replaceChildren();
 const form=$('campaignform');
 for(const [filename,field,title,ratio] of creativeSlots){
  const card=el('div');card.style.cssText='background:#151515;border:1px solid #444;border-radius:12px;padding:9px;min-width:0';
  const heading=el('strong',title);card.append(heading);
  const url=String(form.elements[field]?.value||'').trim();
  if(url.startsWith('https://')){
   const image=el('img');image.src=url;image.alt=title+' Move Motorcycles advertising preview';image.loading='lazy';image.style.cssText='width:100%;height:auto;max-width:100%;object-fit:contain;display:block;margin:8px auto;border-radius:10px;overflow:hidden;aspect-ratio:auto';card.append(image);
   card.append(el('p','Ready in campaign · '+filename));
  }else card.append(el('p','Not uploaded · '+filename));
  host.append(card);
 }
 $('creativeUploadStatus').textContent='Preview only — no changes to live pages or campaign status.';
}
async function uploadCreativeSizes(){
 if(!editId)throw Error('Save the campaign draft before uploading artwork.');
 const current=campaigns.find(c=>c.id===editId);
 if(!current||current.status!=='draft')throw Error('Upload to a draft campaign only. Active artwork must be reviewed separately.');
 const files=[...($('creativeFiles').files||[])];
 if(!files.length)throw Error('Select the five extracted Move Motorcycles WebP files first.');
 if(files.length>5)throw Error('Select at most five artwork files.');
 const byName=new Map(creativeSlots.map(slot=>[slot[0],slot]));
 for(const file of files){
  if(!byName.has(file.name.toLowerCase()))throw Error('Unexpected filename: '+file.name+'. Use the provided five-size advert pack.');
  if(file.type!=='image/webp'||file.size>10*1024*1024||!file.size)throw Error('Only non-empty WebP files up to 10 MB are accepted: '+file.name);
  await validateUploadedCreative(file,byName.get(file.name.toLowerCase())[1]);
 }
 const uploadButton=$('uploadCreativeFiles');uploadButton.disabled=true;
 let done=0;const errors=[];
 try{
  for(const file of files){
   const [filename,field]=byName.get(file.name.toLowerCase());
   $('creativeUploadStatus').textContent='Uploading '+(done+1)+' of '+files.length+': '+filename;
   const path='campaigns/'+editId+'/'+crypto.randomUUID()+'-'+filename;
   const {error:uploadError}=await db.storage.from('advertising-creatives').upload(path,file,{cacheControl:'31536000',contentType:'image/webp',upsert:false});
   if(uploadError){errors.push(filename+': '+uploadError.message);break;}
   const {data:publicData}=db.storage.from('advertising-creatives').getPublicUrl(path);
   const url=publicData?.publicUrl;
   if(!url||!url.startsWith('https://')){errors.push(filename+': public URL missing');break;}
   const {data:savedRow,error:saveError}=await db.from('advertising_campaigns').update({[field]:url}).eq('id',editId).eq('status','draft').select('id').maybeSingle();
   if(saveError||!savedRow){errors.push(filename+': uploaded asset, but campaign link was not confirmed: '+(saveError?.message||'Draft changed. Refresh.'));break;}
   $('campaignform').elements[field].value=url;
   done++;
  }
  await load();
  showCreativeSizes();
  $('creativeUploadStatus').textContent=done+' of '+files.length+' uploaded and assigned to draft. '+(errors.length?errors.join(' | '):'No adverts have been activated. All five image slots now available for preview.');
  if(done===files.length)$('creativeFiles').value='';
 }finally{uploadButton.disabled=false;}
}
function openCampaign(c={}){editId=c.id||null;fields('campaignfields',cf,{status:'draft',campaign_category:'external',placement:'below_hero',priority:0,revenue_model:'commission',...c});$('editor').hidden=false;$('campaignpreview').hidden=true;$('creativeUploadPanel').hidden=!editId;$('creativeSizePreviews').replaceChildren();$('creativeUploadStatus').textContent=editId?'Upload the five WebP files from the advert pack, then preview them here.':'Save as a draft first to enable artwork uploads.';$('editor').scrollIntoView({block:'nearest',behavior:'smooth'})}function openPartner(p={}){partnerId=p.id||null;fields('partnerfields',pf,{kind:'affiliate',status:'prospect',...p},'partner');$('partnerform').hidden=false;$('partnerform').scrollIntoView({block:'nearest',behavior:'smooth'})}let latestCountryAdvertisingReport=null;
function csvCell(value){
 const raw=String(value??'');
 const safe=/^\s*[=+@-]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replace(/"/g,'""')+'"';
}
function exportCountryAdvertisingReport(){
 const rows=latestCountryAdvertisingReport;
 if(!Array.isArray(rows)||!rows.length)throw Error('No country performance data to export.');
 const header=['Campaign','Country','Impressions','Clicks','CTR percent','Conversions'];
 const csv=[header,...rows.map(r=>[r.campaign_name,r.country_code==='--'?'Unverified (legacy)':r.country_code,r.impressions,r.clicks,r.ctr_pct??'',r.conversions])]
  .map(line=>line.map(csvCell).join(',')).join('\r\n');
 const blob=new Blob(['\uFEFF'+csv+'\r\n'],{type:'text/csv;charset=utf-8;'});
 const url=URL.createObjectURL(blob);
 const link=el('a');link.href=url;link.download='anybike-advertising-country-performance-30-days.csv';
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
 status('Country performance CSV prepared locally. No email sent.');
}
function renderAdvertisingReadiness(){
 const total=$('adReadinessTotals'),details=$('adReadinessDetails');
 if(!total||!details)return;
 const active=campaigns.filter(c=>c.status==='active').length;
 const draft=campaigns.filter(c=>c.status==='draft');
 const approved=partners.filter(p=>p.status==='approved'&&p.branding_approved&&p.agreement_approved).length;
 total.textContent=active+' active · '+draft.length+' draft · '+approved+'/'+partners.length+' partners fully approved';
 details.replaceChildren();
 if(!draft.length){details.textContent=active?'Active campaigns are listed below.':'No draft campaigns to review.';return;}
 const list=el('div');list.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:7px';
 for(const campaign of draft.slice(0,10)){
  const partner=partners.find(p=>p.id===campaign.partner_id);
  const blockers=[];
  if(!partner||partner.status!=='approved'||!partner.branding_approved||!partner.agreement_approved)blockers.push('partner approval');
  if(!Array.isArray(campaign.countries)||!campaign.countries.length)blockers.push('countries');
  if(!campaign.destination_url||!campaign.desktop_image_url||!campaign.mobile_image_url)blockers.push('artwork / URL');
  if(!campaign.disclosure)blockers.push('disclosure');
  if(partner?.kind==='finance'&&(!campaign.compliance_reference||!campaign.compliance_approved_at))blockers.push('finance compliance');
  const b=button(campaign.name+': '+(blockers.length?blockers.join(', '):'ready for review'),()=>openCampaign(campaign));
  b.style.cssText='font-size:12px;text-align:left;padding:7px 9px;background:#282828;border-color:#555';
  b.title='Open draft campaign to review missing activation requirements';
  list.append(b);
 }
 details.append(list);
}
async function load(){const [base,countryPerformance]=await Promise.all([Promise.all(['commercial_partners','advertising_campaigns','admin_advertising_performance_v1','admin_commercial_commission_summary_v1'].map(get)),get('admin_advertising_country_performance_v1').catch(error=>({load_error:error.message||String(error)}))]);[partners,campaigns,performance,commissions]=base;renderAdvertisingReadiness();const countryRows=$('advertisingcountryrows');if(countryRows){countryRows.replaceChildren();const countryData=Array.isArray(countryPerformance)?countryPerformance:[];latestCountryAdvertisingReport=countryData;const exportButton=$('exportcountryads');if(exportButton)exportButton.disabled=countryData.length===0;const empty=$('advertisingcountryempty');if(empty&&countryPerformance?.load_error){empty.hidden=false;empty.textContent='Country report unavailable — '+countryPerformance.load_error+' (other advertising records remain accessible).';}else if(empty){empty.textContent='No country-attributed events recorded yet.';}const ordered=[...countryData].sort((a,b)=>Number(b.impressions)-Number(a.impressions)||String(a.campaign_name).localeCompare(String(b.campaign_name))||String(a.country_code).localeCompare(String(b.country_code)));for(const item of ordered)row(countryRows,[item.campaign_name,item.country_code==='--'?'Unverified (legacy)':item.country_code,Number(item.impressions||0).toLocaleString('en-GB'),Number(item.clicks||0).toLocaleString('en-GB'),item.ctr_pct==null?'—':item.ctr_pct+'%',Number(item.conversions||0).toLocaleString('en-GB')]);if(!countryPerformance?.load_error)$('advertisingcountryempty').hidden=ordered.length>0;}for(const id of ['campaignrows','partnerrows','commissionrows'])$(id).replaceChildren();for(const c of campaigns){const p=performance.find(x=>x.campaign_id===c.id)||{};row($('campaignrows'),[c.name,c.status,c.starts_at?new Date(c.starts_at).toLocaleDateString('en-GB'):'—',c.ends_at?new Date(c.ends_at).toLocaleDateString('en-GB'):'—',p.impressions||0,p.clicks||0,p.ctr_pct==null?'—':p.ctr_pct+'%',p.conversions||0,button('Edit',()=>openCampaign(c))])}for(const p of partners)row($('partnerrows'),[p.name,p.kind,p.status,p.agreement_approved?'Approved':'Pending',p.branding_approved?'Approved':'Pending',button('Edit',()=>openPartner(p))]);for(const c of commissions){const clicks=performance.filter(p=>campaigns.some(x=>x.id===p.campaign_id&&x.partner_id===c.partner_id)).reduce((s,p)=>s+Number(p.clicks),0);row($('commissionrows'),[pname(c.partner_id),c.currency,c.earned,c.received,c.clawbacks,c.outstanding_commission,clicks?(Number(c.earned)/clicks).toFixed(2):'—'])}if(!$('commissionfields').children.length)fields('commissionfields',lf,{currency:'GBP',entry_type:'earned'});renderCoverage();const live=campaigns.filter(c=>c.status==='active');const sums=performance.reduce((out,p)=>{out.impressions+=Number(p.impressions||0);out.clicks+=Number(p.clicks||0);out.conversions+=Number(p.conversions||0);return out},{impressions:0,clicks:0,conversions:0});const health=$('performancehealth');if(health){health.textContent=!live.length?'No active campaigns — '+campaigns.length+' draft or inactive campaign(s). No live traffic expected. Reporting will begin when a campaign is approved and visible.':live.length+' active campaign(s) · '+sums.impressions.toLocaleString('en-GB')+' impressions · '+sums.clicks.toLocaleString('en-GB')+' clicks · '+sums.conversions.toLocaleString('en-GB')+' recorded conversions'+(sums.impressions===0?' · No impressions recorded yet; check actual live placements before interpreting performance.':'')+' · International delivery requires separate country-verification checks.';}status('Ready')}let modelPage=0,pagePage=0;const pageSize=50;function paginate(list,index,prev,next,label,set){const max=Math.max(0,Math.ceil(list.length/pageSize)-1);index=Math.min(index,max);$(prev).disabled=index===0;$(next).disabled=index>=max;$(label).textContent='Page '+(index+1)+' of '+(max+1)+' · '+list.length+' matching';$(prev).onclick=()=>set(index-1);$(next).onclick=()=>set(index+1);return index}const selectedModels=new Set();const coverageLabels={missing:'Available for advertising',covered:'Covered',assigned_pending:'Assigned — pending',excluded:'Excluded'};
function matchingCoverage(){const q=$('coveragequery').value.trim().toLowerCase(),f=$('coveragefilter').value;return coverage.filter(r=>(r.manufacturer+' '+r.model).toLowerCase().includes(q)&&(!f||f===r.coverage_status))}
function renderCoverage(){const list=matchingCoverage();$('coveragerows').replaceChildren();const counts=Object.fromEntries(Object.keys(coverageLabels).map(k=>[k,coverage.filter(r=>r.coverage_status===k).length]));$('coveragecount').textContent=coverage.length+' models · '+Object.entries(counts).map(([k,n])=>n+' '+coverageLabels[k]).join(' · ')+' · '+list.length+' matching';$('selectedcoverage').textContent=selectedModels.size+' selected';const sel=$('coveragecampaign'),previous=sel.value;sel.replaceChildren();const placeholder=el('option','Choose campaign');placeholder.value='';sel.append(placeholder);for(const c of campaigns.filter(c=>c.placement==='below_hero')){const opt=el('option',c.name+' ('+c.status+')');opt.value=c.id;sel.append(opt)}if([...sel.options].some(o=>o.value===previous))sel.value=previous;
modelPage=paginate(list,modelPage,'modelprev','modelnext','modelpage',n=>{modelPage=n;renderCoverage()});for(const r of list.slice(modelPage*pageSize,(modelPage+1)*pageSize)){const check=el('input');check.type='checkbox';check.checked=selectedModels.has(r.model_id);check.setAttribute('aria-label','Select '+r.manufacturer+' '+r.model);check.onchange=()=>{if(check.checked)selectedModels.add(r.model_id);else selectedModels.delete(r.model_id);$('selectedcoverage').textContent=selectedModels.size+' selected'};const assigned=campaigns.find(c=>c.id===r.assigned_campaign_id);const label=(r.campaign_name||assigned?.name||'')+(r.campaign_name||assigned?' · ':'')+(coverageLabels[r.coverage_status]||r.coverage_status);const model=el('a',r.model);model.href='/motorcycle-v2-master.html?make='+encodeURIComponent(r.manufacturer)+'&model='+encodeURIComponent(r.model);model.target='_blank';model.rel='noopener';row($('coveragerows'),[check,r.manufacturer,model,label,r.impressions,r.clicks,r.conversions])}}
async function loadCoverage(){const out=[];for(let offset=0;;offset+=500){const {data,error}=await db.rpc('admin_model_advertising_coverage_v2').range(offset,offset+499);if(error)throw error;out.push(...(data||[]));if(!data||data.length<500)break}coverage=out;renderCoverage()}
async function changeCoverage(action){const ids=[...selectedModels];if(!ids.length)throw Error('Select at least one model page');const campaign=$('coveragecampaign').value;if(action==='assign'&&!campaign)throw Error('Choose a campaign');if(!window.confirm((action==='assign'?'Assign campaign to':action==='exclude'?'Exclude':'Restore automatic targeting for')+' '+ids.length+' selected model pages?'))return;let done=0;try{for(let i=0;i<ids.length;i+=100){const batch=ids.slice(i,i+100);const q=action==='reset'?db.from('advertising_model_overrides').delete().eq('placement','below_hero').in('catalogue_model_id',batch):db.from('advertising_model_overrides').upsert(batch.map(id=>({catalogue_model_id:id,placement:'below_hero',campaign_id:action==='assign'?campaign:null,suppressed:action==='exclude',updated_at:new Date().toISOString()})),{onConflict:'catalogue_model_id,placement'});const {error}=await q;if(error)throw error;done+=batch.length;for(const id of batch)selectedModels.delete(id)}await loadCoverage();status(done+' model pages updated')}catch(e){await loadCoverage();throw Error(done+' pages updated before error: '+(e.message||e))}}
let pages=[];const selectedPages=new Set();function matchingPages(){const q=$('pagequery').value.trim().toLowerCase(),c=$('pagecategory').value,f=$('pagefilter').value;return pages.filter(p=>p.page_path.toLowerCase().includes(q)&&(!c||c===p.page_category)&&(!f||f===p.coverage_status))}function renderPairedHousePreview(){
 const root=$('pairedHousePreview'),report=$('pairedHousePreviewStatus');if(!root||!report)return;
 root.replaceChildren();
 const layouts=[
  {name:'Move Motorcycles',find:c=>String(c.name||'').includes('Blue & Gold'),copy:'Motorcycle collection and delivery'},
  {name:'Q-Finance',find:c=>c.partner_id===partners.find(p=>p.name==='Q-Finance')?.id,copy:'Motorcycle finance · subject to compliance approval'}
 ];
 for(const item of layouts){
  const campaign=campaigns.find(item.find);
  const card=el('article');card.className='paired-ad-card';
  const src=campaign?.slim_image_url||campaign?.compact_image_url||campaign?.desktop_image_url;
  if(typeof src==='string'&&/^https:\/\//.test(src)){
   const img=el('img');img.src=src;img.alt=item.name+' draft creative preview';img.loading='lazy';card.append(img);
  }else{const placeholder=el('div',item.name);placeholder.className='paired-placeholder';card.append(placeholder)}
  const copy=el('div');copy.className='paired-ad-copy';
  copy.append(el('strong',item.name),el('p',item.copy));card.append(copy);
  card.append(el('small','Advertisement · '+item.name));
  root.append(card);
 }
 report.textContent='Two equal-width cards · stack on mobile · no links · draft campaigns remain unpublished.';
}
function renderPages(){const list=matchingPages();$('pagerows').replaceChildren();$('pagecount').textContent=pages.length+' inventoried · '+list.length+' matching · '+pages.filter(p=>p.coverage_status==='not_connected').length+' not connected';$('pageselected').textContent=selectedPages.size+' selected';pagePage=paginate(list,pagePage,'pageprev','pagenext','pagepage',n=>{pagePage=n;renderPages()});for(const p of list.slice(pagePage*pageSize,(pagePage+1)*pageSize)){const check=el('input');check.type='checkbox';check.checked=selectedPages.has(p.page_path);check.setAttribute('aria-label','Select '+p.page_path);check.onchange=()=>{if(check.checked)selectedPages.add(p.page_path);else selectedPages.delete(p.page_path);$('pageselected').textContent=selectedPages.size+' selected'};const a=el('a',p.page_path);a.href=p.page_path;a.target='_blank';a.rel='noopener';const locationSelect=el('select');
const positions=p.page_path==='/available-stock.html'?[['stock_grid','Among motorcycles']]:
 p.page_path==='/motorcycle-v2-master.html'?[['before_sources','After model information']]:
 [[p.page_path==='/about-us.html'?'about_wrap':p.page_path==='/export-services.html'?'export_wrap':p.page_path==='/freight-forwarders.html'?'freight_wrap':p.page_path==='/sell-your-motorcycle.html'?'sell_wrap':'main_end','Approved bottom placement'],['main_end','End of page']];
for(const [value,title] of positions){if([...locationSelect.options].some(o=>o.value===value))continue;const opt=el('option',title);opt.value=value;locationSelect.append(opt)}
locationSelect.value=p.placement_key||positions[0][0];
locationSelect.setAttribute('aria-label','Advert position for '+p.page_path);
locationSelect.onchange=run(async()=>{const {error}=await db.from('advertising_page_inventory').update({placement_key:locationSelect.value,updated_at:new Date().toISOString()}).eq('page_path',p.page_path);if(error)throw error;await loadPages();status('Position saved for '+p.page_path)});
const sizeSelect=el('select');
const formats=p.page_path==='/available-stock.html'?[['stock_card','Motorcycle card']]:[['slim_landscape','Slim banner'],['large_landscape','Large landscape']];
for(const [value,title] of formats){const opt=el('option',title);opt.value=value;sizeSelect.append(opt)}
sizeSelect.value=p.creative_format||formats[0][0];
sizeSelect.setAttribute('aria-label','Advert format for '+p.page_path);
sizeSelect.onchange=run(async()=>{const {error}=await db.from('advertising_page_inventory').update({creative_format:sizeSelect.value,updated_at:new Date().toISOString()}).eq('page_path',p.page_path);if(error)throw error;await loadPages();status('Format saved for '+p.page_path)});
row($('pagerows'),[check,a,p.page_category,p.coverage_status.replaceAll('_',' '),locationSelect,sizeSelect])}}async function loadPages(){const {data,error}=await db.from('admin_advertising_page_inventory_v1').select('*').order('page_path');if(error)throw error;pages=data||[];renderPages()}async function changePages(excluded){const ids=[...selectedPages];if(!ids.length)throw Error('Select pages first');if(!confirm((excluded?'Exclude ':'Restore ')+ids.length+' pages?'))return;let done=0;for(let i=0;i<ids.length;i+=50){const batch=ids.slice(i,i+50);const {error}=await db.from('advertising_page_inventory').update({excluded,updated_at:new Date().toISOString()}).in('page_path',batch);if(error){await loadPages();throw Error(done+' pages saved before error: '+error.message)}done+=batch.length;for(const p of batch)selectedPages.delete(p)}await loadPages();status(done+' pages updated')}async function changePlacement(enabled){const ids=[...selectedPages];if(!ids.length)throw Error('Select pages first');const supported=ids.filter(path=>{const p=pages.find(x=>x.page_path===path);return !!p&&(/^(public|manufacturer_candidate|model)$/.test(p.page_category)||/^\/markets\/[a-z0-9-]+\.html$/i.test(path))&&!/^\/(?:admin-|customer-|my-|dealer-|shipper-|seller-|private-|underwrite|proforma|purchase-order|final-invoice)/.test(path)});const targets=enabled?supported:ids;if(!targets.length)throw Error('Selected pages do not yet have a connected renderer');if(!confirm((enabled?'Enable ':'Disable ')+targets.length+' placements?'+(enabled&&ids.length!==targets.length?' Unsupported pages will be skipped.':'')))return;let done=0;for(let i=0;i<targets.length;i+=50){const batch=targets.slice(i,i+50);const {error}=await db.from('advertising_page_inventory').update({placement_enabled:enabled,updated_at:new Date().toISOString()}).in('page_path',batch);if(error){await loadPages();throw Error(done+' pages saved before error: '+error.message)}done+=batch.length;for(const p of batch)selectedPages.delete(p)}await loadPages();status(done+' placements updated; '+(ids.length-targets.length)+' skipped')}function initPages(){ $('pageenable').onclick=run(()=>changePlacement(true));$('pagedisable').onclick=run(()=>changePlacement(false));for(const id of ['pagequery','pagecategory','pagefilter'])$(id).addEventListener(id==='pagequery'?'input':'change',()=>{pagePage=0;renderPages()});$('pageload').onclick=run(loadPages);$('pageselect').onclick=()=>{for(const p of matchingPages())selectedPages.add(p.page_path);renderPages()};$('pageclear').onclick=()=>{selectedPages.clear();renderPages()};$('pageexclude').onclick=run(()=>changePages(true));$('pagerestore').onclick=run(()=>changePages(false))}
function run(fn){return async e=>{e?.preventDefault();try{await fn()}catch(err){status(err.message||String(err))}}}function preview(){const v=values($('campaignform'),cf),root=$('campaignpreview');root.replaceChildren();for(const mobile of [false,true]){root.append(el('h3',mobile?'Mobile preview':'Desktop preview'));const card=el('div');card.className='preview';card.style.borderRadius='12px';card.style.overflow='hidden';if(mobile)card.style.maxWidth='360px';const text=el('div');text.append(el('strong',(v.headline_template||v.name||'').replaceAll('{{make}}','BMW').replaceAll('{{model}}','R 1300 GS')),el('p',v.subheading),el('span',v.cta_text),el('p',v.disclosure));card.append(text);const src=mobile?v.mobile_image_url:v.desktop_image_url;if(src&&/^https:\/\//i.test(src)){const img=el('img');img.src=src;img.alt=v.alt_text||'';img.style.borderRadius='10px';card.append(img)}root.append(card)}root.hidden=false}
async function initQuotes(){
 const root=el('section');root.id='quotearea';$('adcontent').prepend(root);
 root.innerHTML='<div class="bar"><h2>Advertising quotations</h2><button id="newquote" class="primary">New quotation</button><button id="refreshquotes">Refresh</button></div><div id="quotelist" class="scroll"></div><div id="quoteeditor" hidden><h3 id="quotetitle">Quotation</h3><form id="quoteform"><div class="fields"><label>Advertiser<input name="advertiser_name" list="quoteAdvertisers" placeholder="Choose or enter company" required><datalist id="quoteAdvertisers"></datalist></label><label>Contact name<input name="contact_name" list="quoteContacts" placeholder="Choose or enter contact"><datalist id="quoteContacts"></datalist></label><label>Contact email<input name="contact_email" type="email"></label><label>Package title<input name="title" list="quotePackageTitles" placeholder="Choose or enter a title" required><datalist id="quotePackageTitles"><option value="Website Advertising"><option value="Manufacturer Sponsorship"><option value="Motorcycle Model Advertising"><option value="Available Stock Advertising"><option value="International Market Advertising"><option value="Exclusive Advertising Package"><option value="Bespoke Advertising Package"></datalist></label><label>Audience<select name="audience"><option>UK</option><option>International</option><option>Worldwide</option></select></label><label>Duration (days)<input name="duration_days" type="number" min="1" required value="30"></label><label>Valid until<input name="valid_until" type="date"></label><label>Discount (£)<input name="discount_gbp" type="number" min="0" step=".01" value="0"></label><label>VAT (%)<input name="vat_rate" type="number" min="0" max="100" step=".01" value="20"></label><label>Notes<input name="notes"></label></div><div class="bar"><button class="primary">Save quotation</button><button type="button" id="quoteclose">Close</button></div></form><div id="quotelinearea" hidden><h3>Advertising placements</h3><p>Build a package with a separate line for each advert, format or group of pages. Include the agreed price; quotations cannot be issued at £0.</p><div class="bar" style="margin:8px 0"><label style="display:flex;align-items:center;gap:8px">Quick placement template <select id="quoteplacementpreset"><option value="">Choose a starting point</option><option value="manufacturer">Manufacturer sponsorship</option><option value="model">Individual motorcycle model</option><option value="country">Country market page</option><option value="stock">Available stock card</option><option value="service">Motorcycle service specialist</option><option value="homepage">Homepage feature</option></select></label><span style="color:#bbb;font-size:12px">Fills title and format only; targeting and prices require your choice.</span></div><form id="quotelineform"><div class="fields"><label>Advert title / description<input name="description" placeholder="e.g. Harley servicing" required></label><label>Format<select name="artwork_format"><option value="large_landscape">Large landscape</option><option value="large_portrait">Large portrait</option><option value="slim_landscape">Slim landscape</option><option value="compact_mobile">Compact mobile</option><option value="stock_card">Stock card</option></select></label><label>Manufacturer<select name="manufacturer"><option value="">Select manufacturer (optional)</option></select></label><label>Model<select name="model"><option value="">All models of selected manufacturer</option></select></label><label>Countries (ISO codes)<input name="countries" placeholder="GB or DE, FR, IT" title="Use two-letter ISO country codes. UK = GB."></label><label>Quantity<input name="quantity" type="number" min="1" value="1" required></label><label>Price per placement (£, ex VAT)<input name="unit_price_gbp" type="number" min="0" step=".01" value="0" required></label></div><div class="bar"><button type="button" id="quoteselected">Use selected pages / models below</button><span id="quoteselectedcount"></span><button class="primary">Add placement</button></div></form><div id="quotelines" class="scroll"></div><div id="quotetotals"></div><div class="bar" style="margin-top:12px"><button type="button" id="quoteprint">Preview / print A4 quotation</button><button type="button" id="quoteemail">Prepare quotation email</button></div></div></div>';
 const preset=$('quoteplacementpreset');
  preset.onchange=()=>{const templates={manufacturer:['Manufacturer sponsorship','slim_landscape'],model:['Motorcycle model advert','slim_landscape'],country:['International market advert','slim_landscape'],stock:['Available stock card advert','stock_card'],service:['Motorcycle service specialist advert','slim_landscape'],homepage:['Homepage feature advert','large_landscape']};const choice=templates[preset.value];if(!choice)return;const form=$('quotelineform');form.elements.description.value=choice[0];form.elements.artwork_format.value=choice[1];form.elements.quantity.value=1;form.elements.unit_price_gbp.value='';status('Template selected. Confirm pages, quantity and price.');};
  const placementForm=$('quotelineform');const placementFields=placementForm.querySelector('.fields');placementFields.style.setProperty('gap','14px 18px','important');placementFields.style.setProperty('grid-template-columns','repeat(auto-fit,minmax(min(100%,220px),1fr))','important');for(const label of placementFields.querySelectorAll('label')){label.style.setProperty('grid-template-columns','minmax(0,1fr)','important');label.style.minWidth='0';for(const control of label.querySelectorAll('input,select')){control.style.setProperty('width','100%','important');control.style.setProperty('min-width','0','important');control.style.setProperty('margin','0','important')}}const placementBar=placementForm.querySelector('.bar');placementBar.style.setProperty('margin-top','16px','important');placementBar.style.setProperty('gap','12px','important');$('quotelines').style.marginTop='14px';$('quotetotals').style.marginTop='12px';
 let qid=null, scope={page_paths:[],catalogue_model_ids:[],manufacturers:[],countries:[]};const f=$('quoteform'),lf=$('quotelineform'),money=n=>Number(n||0).toLocaleString('en-GB',{style:'currency',currency:'GBP'});
 const checked=async(q)=>{const {data,error}=await q;if(error)throw error;return data};

 let quoteContacts=[],contactRequest=0;
 function advertiserOptions(){const dl=$('quoteAdvertisers');dl.replaceChildren();for(const p of [...partners].sort((a,b)=>a.name.localeCompare(b.name))){const o=el('option');o.value=p.name;dl.append(o)}}
 async function contactOptions(clearPrevious=false){const serial=++contactRequest;quoteContacts=[];$('quoteContacts').replaceChildren();if(clearPrevious){f.elements.contact_name.value='';f.elements.contact_email.value=''}const company=f.elements.advertiser_name.value.trim();if(!company)return;const {data,error}=await db.from('anybike_master_contacts').select('first_name,last_name,email,company').ilike('company',company.replace(/[\\%_]/g,m=>'\\'+m)).limit(100);if(serial!==contactRequest)return;if(error){status('Contact lookup unavailable; enter contact manually');return}quoteContacts=(data||[]).filter(c=>String(c.company||'').trim().toLowerCase()===company.toLowerCase()).map(c=>({name:[c.first_name,c.last_name].filter(Boolean).join(' ').trim(),email:c.email||''}));for(const c of quoteContacts){if(!c.name&&!c.email)continue;const o=el('option');o.value=c.name||c.email;o.label=c.email;$('quoteContacts').append(o)}}
 f.elements.advertiser_name.addEventListener('change',run(()=>contactOptions(true)));
 f.elements.contact_name.addEventListener('change',()=>{const name=f.elements.contact_name.value.trim().toLowerCase();const matches=quoteContacts.filter(c=>(c.name||c.email).toLowerCase()===name);if(matches.length===1&&matches[0].email)f.elements.contact_email.value=matches[0].email;else if(matches.length>1)status('Multiple matching contacts; enter the correct email manually')});
 function clearScope(){scope={page_paths:[],catalogue_model_ids:[],manufacturers:[],countries:[]};$('quoteselectedcount').textContent='Manual quantity';lf.elements.manufacturer.value='';lf.elements.model.replaceChildren(new Option('All models of selected manufacturer',''))}
 async function changeQuoteStatus(q,next){
  const transitions={draft:['sent','cancelled'],sent:['accepted','declined','expired'],accepted:[],declined:[],expired:[],cancelled:[]};
  if(!(transitions[q.status]||[]).includes(next))throw Error('This quotation cannot move from '+q.status+' to '+next);
  if(next==='sent'){
   const totals=await checked(db.from('admin_advertising_quotation_totals_v1').select('placement_quantity,total_gbp').eq('id',q.id).single());
   if(Number(totals.placement_quantity)<1||Number(totals.total_gbp)<=0)throw Error('Add priced advertising placements before recording a quotation as sent.');
   const deliveries=await checked(db.from('advertising_quotation_email_deliveries').select('delivery_status').eq('quotation_id',q.id).limit(1));
   if(deliveries.length){
    if(deliveries[0].delivery_status==='sent')throw Error('Direct email was accepted by the provider. Refresh the quotation status before marking it sent manually.');
    throw Error('A direct email attempt is recorded ('+deliveries[0].delivery_status+'). Resolve delivery status before recording a manual send.');
   }
   const current=await checked(db.from('advertising_quotations').select('contact_email').eq('id',q.id).single());
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(current.contact_email||'')))throw Error('Save a valid recipient email on the quotation first.');
   if(!confirm('Only mark this quotation as sent AFTER actually sending the quotation externally to '+current.contact_email+'. This button does not send an email. Continue?'))return;
  }
  if(next==='accepted'&&!confirm('Have you received and recorded the advertiser’s acceptance? This does not activate advertising or create an invoice.'))return;
  if(next==='declined'&&!confirm('Record this quotation as declined?'))return;
  if(next==='expired'&&!confirm('Mark this quotation expired?'))return;
  if(next==='cancelled'&&!confirm('Cancel this draft quotation?'))return;
  const {data,error}=await db.from('advertising_quotations').update({status:next,updated_at:new Date().toISOString()}).eq('id',q.id).eq('status',q.status).select('id');
  if(error)throw error;if(!data?.length)throw Error('Quotation changed elsewhere. Refresh before updating.');
  await list();status('Quotation AB-ADQ-'+String(q.quote_number).padStart(6,'0')+' marked '+next+'.');
 }
 async function convertQuoteToDraftCampaigns(q){
  if(q.status!=='accepted')throw Error('Only accepted quotations can be converted.');
  const quote=await checked(db.from('advertising_quotations').select('*').eq('id',q.id).single());
  if(quote.status!=='accepted')throw Error('Quotation status changed. Refresh.');
  const partner=partners.find(p=>p.id===quote.partner_id)||partners.find(p=>p.name.trim().toLowerCase()===quote.advertiser_name.trim().toLowerCase());
  if(!partner)throw Error('Create the advertiser as an Advertising partner before converting this quotation.');
  const items=await checked(db.from('advertising_quotation_items').select('*').eq('quotation_id',quote.id).order('created_at'));
  if(!items.length)throw Error('Add advertising placements before converting.');
  // Preflight all lines before writing any campaigns; the current creative selector
  // matches manufacturer and model lists independently, not exact make/model pairs.
  for(const item of items){
   const ids=new Set((item.catalogue_model_ids||[]).map(String));
   const exact=coverage.filter(m=>ids.has(String(m.model_id)));
   if(ids.size!==exact.length)throw Error('Model catalogue changed for '+item.description+'. Refresh coverage before converting.');
   const brands=[...new Set([...(item.manufacturers||[]),...exact.map(m=>m.manufacturer)])];
   if(ids.size&&brands.length>1)throw Error('Placement "'+item.description+'" selects models from multiple manufacturers. Create one quotation placement per manufacturer to prevent advertising on unintended models.');
  }
  if(!confirm('Create up to '+items.length+' advertising campaign drafts from this accepted quotation? No adverts will be activated or invoices issued.'))return;
  let created=0,existing=0;
  for(const item of items){
   const prior=await checked(db.from('advertising_campaigns').select('id').eq('source_quotation_item_id',item.id).limit(1));
   if(prior.length){existing++;continue;}
   const selectedIds=new Set((item.catalogue_model_ids||[]).map(String));
   const selectedModels=coverage.filter(m=>selectedIds.has(String(m.model_id)));
   const manufacturers=[...new Set([...(item.manufacturers||[]),...selectedModels.map(m=>m.manufacturer)])];
   const models=[...new Set(selectedModels.map(m=>m.model))];
   const formatPlacement=item.artwork_format==='stock_card'?'stock_card':'below_hero';
   const desc=[item.description, 'Quotation AB-ADQ-'+String(quote.quote_number).padStart(6,'0'),'Artwork format: '+item.artwork_format.replaceAll('_',' '),'Quoted quantity: '+item.quantity,'Audience: '+quote.audience,'Configure and approve artwork and exact territory before activation'].join(' | ');
   const record={
    source_quotation_item_id:item.id,partner_id:partner.id,
    name:quote.title+' — '+item.description, status:'draft',
    campaign_category:partner.kind==='transport'&&partner.name.toLowerCase()==='move motorcycles'?'house':'external',
    placement:formatPlacement, headline_template:item.description,
    subheading:desc, cta_text:'Learn more', disclosure:'Advertisement',
    duration_days:quote.duration_days||30,priority:0,revenue_model:'fixed',
    manufacturers,models,page_paths:item.page_paths||[],
    countries:Array.isArray(item.countries)&&item.countries.length?item.countries:(quote.audience==='UK'?['GB']:[])
   };
   const {error}=await db.from('advertising_campaigns').insert(record);
   if(error){if(error.code==='23505'){existing++;continue;}throw Error('Created '+created+' draft(s) before error: '+error.message);}
   created++;
  }
  await load();await list();
  status('Campaign conversion: '+created+' new draft(s), '+existing+' already linked. Check targeting, artwork, compliance and country rules before activation.');
 }
 async function prepareAdvertisingBilling(q){
  if(q.status!=='accepted')throw Error('Only accepted advertising quotations can be prepared for billing.');
  const current=await checked(db.from('advertising_quotations').select('id,status,advertiser_name,contact_email').eq('id',q.id).single());
  if(current.status!=='accepted')throw Error('Quotation must still be accepted.');
  const totals=await checked(db.from('admin_advertising_quotation_totals_v1').select('*').eq('id',q.id).single());
  const existing=await checked(db.from('advertising_billing_reviews').select('*').eq('quotation_id',q.id).limit(1));
  if(existing.length){
   status('Billing record already prepared for AB-ADQ-'+String(q.quote_number).padStart(6,'0')+'. Status: '+existing[0].billing_status+'. No duplicate created.');
   return;
  }
  if(!Number(totals.placement_quantity))throw Error('Quotation has no placements.');
  if(!confirm('Prepare advertising billing review for '+current.advertiser_name+' ('+money(totals.total_gbp)+')? This will NOT send or issue an invoice.'))return;
  const {error}=await db.from('advertising_billing_reviews').insert({
   quotation_id:q.id,advertiser_name:current.advertiser_name,billing_email:current.contact_email||null,
   subtotal_gbp:totals.subtotal_gbp,discount_gbp:totals.discount_gbp,net_gbp:totals.net_gbp,
   vat_gbp:totals.vat_gbp,total_gbp:totals.total_gbp,currency:'GBP',billing_status:'needs_review'
  });
  if(error&&error.code!=='23505')throw error;
  await list();status('Advertising billing review prepared. No invoice has been issued.');
 }
 async function previewAdvertisingBillingDraft(v){
  const win=window.open('','_blank');
  if(!win)throw Error('Allow pop-ups to preview billing draft.');
  const [quote,items,totals]=await Promise.all([
   checked(db.from('advertising_quotations').select('*').eq('id',v.quotation_id).single()),
   checked(db.from('advertising_quotation_items').select('*').eq('quotation_id',v.quotation_id).order('created_at')),
   checked(db.from('admin_advertising_quotation_totals_v1').select('*').eq('id',v.quotation_id).single())
  ]);
  const doc=win.document;
  doc.title='Advertising billing draft — AB-ADQ-'+String(quote.quote_number).padStart(6,'0');
  const style=doc.createElement('style');
  style.textContent='@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font:11pt Arial,sans-serif;color:#181818;margin:0;background:#eee}main{background:white;max-width:210mm;min-height:297mm;margin:0 auto;padding:18mm}header{border-bottom:4px solid #ed1c24;padding-bottom:12px;margin-bottom:20px}h1{margin:0;font-size:22pt}h2{font-size:14pt}p{line-height:1.5}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{text-align:left;padding:9px 7px;border-bottom:1px solid #ccc;vertical-align:top;overflow-wrap:anywhere}th{background:#eee}.total{font-weight:bold;font-size:15pt;border-top:2px solid #ed1c24;padding-top:12px}.warning{font-weight:bold;color:#a31319}button{border:0;background:#ed1c24;color:white;padding:10px 16px;cursor:pointer}footer{margin-top:30px;border-top:1px solid #ccc;padding-top:12px;font-size:10pt}@media print{body{background:white}main{padding:0;min-height:0}button{display:none}}';
  doc.head.append(style);
  const main=doc.createElement('main'),header=doc.createElement('header');
  const title=doc.createElement('h1');title.textContent='AnyBike — Advertising billing draft';
  const warn=doc.createElement('p');warn.textContent='DRAFT FOR INTERNAL REVIEW — NOT A VAT INVOICE — NOT ISSUED';warn.className='warning';
  header.append(title,warn);main.append(header);
  const ref='AB-ADQ-'+String(quote.quote_number).padStart(6,'0');
  const para=doc.createElement('p');
  para.textContent='Quotation: '+ref+' | Advertiser: '+quote.advertiser_name+' | Billing contact: '+(v.billing_contact_name||'Not confirmed')+' | Billing email: '+(v.billing_email||'Not confirmed')+' | Billing address: '+(v.billing_address||'Not confirmed')+' | Billing country: '+(v.billing_country||'Not confirmed')+' | Buyer VAT number: '+(v.buyer_vat_number||'Not supplied')+' | Purchase order: '+(v.purchase_order_reference||'Not supplied')+' | Audience: '+quote.audience+' | Duration: '+quote.duration_days+' days';
  main.append(para);
  const table=doc.createElement('table'),head=doc.createElement('tr');
  for(const label of ['Advertising placement','Format','Qty','Unit ex VAT','Net']){const cell=doc.createElement('th');cell.textContent=label;head.append(cell)}
  table.append(head);
  for(const item of items){const tr=doc.createElement('tr');for(const val of [item.description,String(item.artwork_format).replaceAll('_',' '),String(item.quantity),money(item.unit_price_gbp),money(item.line_total_gbp)]){const cell=doc.createElement('td');cell.textContent=val;tr.append(cell)}table.append(tr)}
  main.append(table);
  for(const [label,value] of [['Subtotal',totals.subtotal_gbp],['Discount',totals.discount_gbp],['Net',totals.net_gbp],['VAT',totals.vat_gbp],['Total including VAT',totals.total_gbp]]){const p=doc.createElement('p');p.textContent=label+': '+money(value);if(label.startsWith('Total'))p.className='total';main.append(p)}
  const foot=doc.createElement('footer');foot.textContent='Internal billing preparation only. Confirm the legal issuer, buyer billing address, VAT treatment, payment terms and invoice number before issuing a customer invoice.';
  const print=doc.createElement('button');print.textContent='Print draft';print.onclick=()=>win.print();main.append(foot,print);
  doc.body.append(main);
 }
 async function editAdvertisingBillingDetails(record){
  const host=$('advertisingBillingReviews');
  let panel=$('advertisingBillingEditor');
  if(!panel){panel=el('div');panel.id='advertisingBillingEditor';panel.style.cssText='padding:14px;margin:12px 0;border:1px solid #666;border-radius:8px;background:#242424';host.prepend(panel);}
  panel.replaceChildren(el('h3','Confirm billing details — '+record.advertiser_name));
  const form=el('form');form.className='fields';form.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px';
  const names=[['billing_contact_name','Billing contact'],['billing_email','Billing email'],['billing_address','Full billing address'],['billing_country','Billing country'],['purchase_order_reference','Purchase order reference (optional)'],['buyer_vat_number','Buyer VAT number (optional)']];
  const controls={};
  for(const [key,label] of names){
   const wrap=el('label',label),input=el(key==='billing_address'?'textarea':'input');
   input.name=key;input.value=record[key]||'';input.style.cssText='width:100%;min-width:0';
   if(key==='billing_email')input.type='email';if(key==='billing_address')input.rows=3;
   if(['billing_contact_name','billing_email','billing_address','billing_country'].includes(key))input.required=true;
   wrap.append(input);form.append(wrap);controls[key]=input;
  }
  const bar=el('div');bar.className='bar';bar.style.gridColumn='1 / -1';
  const saveBtn=el('button','Save billing details');saveBtn.className='primary';saveBtn.type='submit';
  const cancel=button('Close',()=>panel.remove());bar.append(saveBtn,cancel);form.append(bar);
  form.onsubmit=run(async()=>{
   const updates=Object.fromEntries(Object.entries(controls).map(([key,input])=>[key,input.value.trim()]));
   if(!updates.billing_email.match(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/))throw Error('Enter a valid billing email.');
   if(updates.billing_address.length<10)throw Error('Enter the complete billing address.');
   updates.updated_at=new Date().toISOString();
   const {error}=await db.from('advertising_billing_reviews').update(updates).eq('id',record.id).eq('billing_status','needs_review');
   if(error)throw error;await billingReviews();status('Billing details saved for review; invoice not issued.');
  });
  panel.append(form);panel.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 async function prepareAdvertisingInvoiceDraft(v){
  if(v.billing_status!=='ready')throw Error('Confirm billing details before preparing an invoice draft.');
  if(!confirm('Prepare an unissued advertising invoice draft for '+v.advertiser_name+'? No invoice number will be assigned and nothing will be emailed.'))return;
  const {data,error}=await db.rpc('admin_prepare_advertising_invoice_draft_v1',{p_billing_review_id:v.id});
  if(error)throw error;
  if(!data)throw Error('Invoice draft could not be created.');
  await billingReviews();
  status('Advertising invoice draft prepared. No invoice number assigned, sent or issued.');
 }
 async function viewAdvertisingInvoiceDraft(v,issued=false){
  const win=window.open('','_blank');
  if(!win)throw Error('Allow pop-ups to view an invoice draft.');
  const {data:row,error}=issued
   ?await db.from('advertising_issued_invoices').select('invoice_number,issued_at,invoice_snapshot').eq('billing_review_id',v.id).maybeSingle()
   :await db.from('advertising_invoice_drafts').select('*').eq('billing_review_id',v.id).maybeSingle();
  if(error){win.close();throw error;}
  if(!row){win.close();throw Error(issued?'Issued invoice not found.':'Prepare an advertising invoice draft first.');}
  const data=issued?row.invoice_snapshot:row;
  const doc=win.document;
  doc.title=issued?'AnyBike advertising invoice '+row.invoice_number:'AnyBike advertising invoice draft';
  const style=doc.createElement('style');
  style.textContent='@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font:11pt/1.5 Arial,sans-serif;color:#161616;background:#eee;margin:0}main{background:#fff;max-width:210mm;min-height:297mm;margin:auto;padding:17mm}h1{font-size:20pt;border-bottom:4px solid #ed1c24;padding-bottom:12px}h2{font-size:12pt;margin-bottom:5px}p{margin:6px 0}table{border-collapse:collapse;width:100%;margin-top:20px}th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}th{background:#eee}.warning{font-weight:bold;color:#bd121a}.total{font-size:15pt;font-weight:bold;margin-top:18px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:18px}button{background:#ed1c24;color:white;border:0;padding:9px 15px;margin-top:20px;cursor:pointer}@media print{body{background:#fff}main{padding:0;min-height:0}button{display:none}}';
  doc.head.append(style);
  const main=doc.createElement('main');const heading=doc.createElement('h1');heading.textContent=issued?'AnyBike — Advertising invoice':'AnyBike advertising — Invoice draft';main.append(heading);
  if(issued){const p=doc.createElement('p');p.textContent='Invoice number: '+row.invoice_number+' | Issued: '+new Date(row.issued_at).toLocaleDateString('en-GB');main.append(p)}
  else{const warn=doc.createElement('p');warn.className='warning';warn.textContent='UNISSUED DRAFT — NOT A VAT INVOICE';main.append(warn)}
  const columns=doc.createElement('div');columns.className='columns';
  const issuer=doc.createElement('div');const recipient=doc.createElement('div');
  const addText=(node,label,value)=>{const p=doc.createElement('p');const strong=doc.createElement('strong');strong.textContent=label+': ';p.append(strong,doc.createTextNode(String(value||'—')));node.append(p)};
  addText(issuer,'Issuer',data.issuer_name);addText(issuer,'Trading as',data.issuer_trading_name);addText(issuer,'Address',data.issuer_address);addText(issuer,'Company no.',data.issuer_company_number);addText(issuer,'VAT no.',data.issuer_vat_number);
  addText(recipient,'Advertiser',data.advertiser_name);addText(recipient,'Billing contact',data.billing_contact);addText(recipient,'Billing address',data.billing_address);addText(recipient,'Country',data.billing_country);addText(recipient,'Email',data.billing_email);addText(recipient,'PO reference',data.purchase_order_reference);
  columns.append(issuer,recipient);main.append(columns);
  const tbl=doc.createElement('table');const tr=doc.createElement('tr');for(const label of ['Placement','Format','Quantity','Unit','Net']){const th=doc.createElement('th');th.textContent=label;tr.append(th)}tbl.append(tr);
  for(const item of data.lines||[]){const line=doc.createElement('tr');for(const cellValue of [item.description,String(item.artwork_format||'').replaceAll('_',' '),item.quantity,money(item.unit_price_gbp),money(item.line_total_gbp)]){const td=doc.createElement('td');td.textContent=String(cellValue??'');line.append(td)}tbl.append(line)}main.append(tbl);
  for(const [label,amount] of [['Subtotal',data.subtotal_gbp],['Discount',data.discount_gbp],['Net',data.net_gbp],['VAT ('+data.vat_rate_percent+'%)',data.vat_gbp],['Total including VAT',data.gross_gbp]]){const p=doc.createElement('p');p.textContent=label+': '+money(amount);if(label==='Total including VAT')p.className='total';main.append(p)}
  addText(main,'Payment terms',data.payment_terms);
  const bank=doc.createElement('section');const bankHeading=doc.createElement('h2');bankHeading.textContent='Payment information';bank.append(bankHeading);
  addText(bank,'Account name',data.issuer_bank_name);addText(bank,'Sort code',data.issuer_bank_sort_code);addText(bank,'Account number',data.issuer_bank_account_number);
  if(data.issuer_bank_iban)addText(bank,'IBAN',data.issuer_bank_iban);
  if(data.issuer_bank_bic)addText(bank,'BIC',data.issuer_bank_bic);
  addText(bank,'Payment reference',issued?row.invoice_number:'Provided when invoice is issued');
  main.append(bank);
  addText(main,'Payment due',data.payment_due_on);
  addText(main,'Service date',data.service_date);
  if(!issued){const foot=doc.createElement('p');foot.className='warning';foot.textContent='For internal verification only. Payment terms, VAT treatment and legal invoice number must be confirmed before any invoice is issued.';main.append(foot)}
  const print=doc.createElement('button');print.textContent='Print draft';print.onclick=()=>win.print();main.append(print);
  doc.body.append(main);
 }
 async function reviewAdvertisingInvoiceDraft(v,draft){
  const host=$('advertisingBillingReviews');
  let panel=$('advertisingInvoiceReviewPanel');
  if(!panel){panel=el('div');panel.id='advertisingInvoiceReviewPanel';panel.style.cssText='padding:16px;margin:14px 0;border:1px solid #666;border-radius:8px;background:#242424';host.prepend(panel)}
  panel.replaceChildren(el('h3','Final invoice review — '+v.advertiser_name));
  const form=el('form');form.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px';
  const defs=[['service_date','Advertising service date','date'],['payment_due_on','Payment due date','date'],['payment_terms','Advertising payment terms','textarea'],['vat_review_notes','VAT treatment review / approval notes','textarea']];
  const inputs={};
  for(const [key,label,type] of defs){const wrap=el('label',label),input=el(type==='textarea'?'textarea':'input');input.name=key;if(type!=='textarea')input.type=type;input.value=draft[key]||'';input.required=true;input.style.width='100%';if(type==='textarea')input.rows=3;wrap.append(input);form.append(wrap);inputs[key]=input}
  const checkWrap=el('label');checkWrap.style.cssText='grid-column:1/-1;display:flex;align-items:flex-start;gap:8px';
  const check=el('input');check.type='checkbox';check.checked=!!draft.vat_review_confirmed;
  checkWrap.append(check,el('span','I have reviewed the advertising VAT treatment and confirmed the invoice values and jurisdiction.'));form.append(checkWrap);
  const bar=el('div');bar.className='bar';bar.style.gridColumn='1/-1';
  const save=el('button','Save final review');save.type='submit';const close=button('Close',()=>panel.remove());bar.append(save,close);form.append(bar);
  form.onsubmit=run(async()=>{
   const updates=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.value.trim()]));
   updates.vat_review_confirmed=check.checked;
   if(updates.vat_review_notes.length<10&&check.checked)throw Error('Explain the VAT review in at least 10 characters.');
   if(updates.payment_terms.length<8||/to be agreed/i.test(updates.payment_terms))throw Error('Enter specific advertising payment terms.');
   if(!updates.payment_due_on||!updates.service_date)throw Error('Service date and payment due date are required.');
   const already=await checked(db.from('advertising_issued_invoices').select('id').eq('draft_id',draft.id).limit(1));
   if(already.length)throw Error('Invoice already issued; these details are frozen.');
   const {data,error}=await db.from('advertising_invoice_drafts').update({...updates,updated_at:new Date().toISOString()}).eq('id',draft.id).eq('state','draft').select('id');
   if(error)throw error;if(!data?.length)throw Error('Draft no longer editable.');
   panel.remove();await billingReviews();status('Final invoice details saved. Invoice remains unissued.');
  });
  panel.append(form);panel.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 async function issueAdvertisingInvoice(v,draft){
  if(v.billing_status!=='ready')throw Error('Billing review must be ready.');
  if(!draft.vat_review_confirmed||!draft.payment_due_on||!draft.service_date||String(draft.payment_terms||'').trim().length<8)throw Error('Complete the final invoice review first.');
  const entry=prompt('This will ISSUE a real numbered advertising invoice for '+v.advertiser_name+' ('+money(v.total_gbp)+'). It cannot be edited or undone. Nothing will be emailed. Type ISSUE to confirm:');
  if(entry!=='ISSUE')return;
  if(!confirm('Final confirmation: issue a permanent AnyBike advertising invoice now?'))return;
  const {data,error}=await db.rpc('admin_issue_advertising_invoice_v1',{p_draft_id:draft.id});
  if(error)throw error;
  await billingReviews();status('Issued advertising invoice '+data+'. No email has been sent.');
 }
 async function recordAdvertisingPayment(invoice,remaining){
  if(!(remaining>0))throw Error('This invoice has no outstanding balance.');
  let host=$('advertisingPaymentPanel');
  if(host)host.remove();
  host=el('div');host.id='advertisingPaymentPanel';host.style.cssText='padding:12px;border:1px solid #555;border-radius:8px;background:#252525;margin:10px 0';
  const heading=el('h3','Record payment — '+invoice.invoice_number+' · outstanding '+money(remaining));
  const form=el('form');form.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px';
  const entries=[['amount_gbp','Amount received (£)','number',String(remaining)],['paid_on','Date received','date',new Date().toISOString().slice(0,10)],['payment_reference','Bank / payment reference','text','']];
  const fields={};
  for(const [name,label,type,value] of entries){const wrap=el('label',label),input=el('input');input.name=name;input.type=type;input.value=value;input.required=true;if(name==='amount_gbp'){input.min='0.01';input.max=String(remaining);input.step='0.01'}wrap.append(input);form.append(wrap);fields[name]=input;}
  const methodWrap=el('label','Payment method'),method=el('select');
  for(const [value,label] of [['bank_transfer','Bank transfer'],['card','Card'],['cheque','Cheque'],['cash','Cash'],['other','Other']]){const opt=el('option',label);opt.value=value;method.append(opt)}methodWrap.append(method);form.append(methodWrap);
  const actions=el('div');actions.className='bar';actions.style.gridColumn='1/-1';
  const save=el('button','Record confirmed payment');save.type='submit';save.className='primary';
  actions.append(save,button('Cancel',()=>host.remove()));form.append(actions);
  form.onsubmit=run(async()=>{
    const amount=Number(fields.amount_gbp.value),ref=fields.payment_reference.value.trim(),paidOn=fields.paid_on.value;
    if(!Number.isFinite(amount)||amount<=0||amount>remaining||Math.round(amount*100)!==amount*100)throw Error('Enter a valid payment up to the outstanding balance.');
    if(ref.length<3)throw Error('Enter the actual payment reference.');
    if(!paidOn||paidOn>new Date().toISOString().slice(0,10))throw Error('Payment date cannot be in the future.');
    if(!confirm('Confirm '+money(amount)+' has actually reached the AnyBike account for '+invoice.invoice_number+'? Payment entries are permanent.'))return;
    save.disabled=true;
    try{const {error}=await db.from('advertising_invoice_payments').insert({invoice_id:invoice.id,amount_gbp:amount,paid_on:paidOn,payment_method:method.value,payment_reference:ref});
      if(error)throw error;await billingReviews();status('Payment recorded against '+invoice.invoice_number+'. No invoice or email sent.');
    }finally{save.disabled=false}
  });
  host.append(heading,form);$('advertisingBillingReviews').prepend(host);host.scrollIntoView({block:'nearest'});
}
async function sendIssuedAdvertisingInvoice(invoice){
 if(!invoice?.id)throw Error('A numbered, issued advertising invoice is required.');
 const issued=await checked(db.from('advertising_issued_invoices').select('invoice_number,invoice_snapshot').eq('id',invoice.id).single());
 const recipient=String(issued.invoice_snapshot?.billing_email||'').trim();
 if(!recipient||!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(recipient))throw Error('The issued invoice has no valid saved billing email.');
 const typed=prompt('This sends the REAL issued invoice '+issued.invoice_number+' to '+recipient+'. Nothing will be sent unless you type SEND:');
 if(typed!=='SEND')return;
 if(!confirm('Final confirmation: email invoice '+issued.invoice_number+' to '+recipient+' now?'))return;
 const result=await db.functions.invoke('admin-send-advertising-invoice',{body:{invoice_id:invoice.id}});
 if(result.error||!result.data?.success){
  await billingReviews();
  throw Error(result.data?.error||'Invoice email status not confirmed. Check delivery log; do not retry automatically.');
 }
 await billingReviews();status('Invoice '+issued.invoice_number+' email accepted for delivery to '+recipient+'.');
}
async function billingReviews(){
  let container=$('advertisingBillingReviews');
  if(!container){container=el('div');container.id='advertisingBillingReviews';$('quotearea').append(container);}
  const [rows,drafts,issued,payments,invoiceDeliveries]=await Promise.all([checked(db.from('advertising_billing_reviews').select('id,quotation_id,advertiser_name,billing_contact_name,billing_email,billing_address,billing_country,purchase_order_reference,buyer_vat_number,total_gbp,billing_status,external_invoice_reference,created_at').order('created_at',{ascending:false}).limit(100)),checked(db.from('advertising_invoice_drafts').select('*')),checked(db.from('advertising_issued_invoices').select('id,billing_review_id,draft_id,invoice_number')),checked(db.from('advertising_invoice_payments').select('invoice_id,amount_gbp')),checked(db.from('advertising_invoice_email_deliveries').select('invoice_id,recipient_email,delivery_status,completed_at'))]);const invoiceEmailById=new Map(invoiceDeliveries.map(x=>[x.invoice_id,x]));const draftsByReview=new Map(drafts.map(d=>[d.billing_review_id,d]));const issuedByDraft=new Map(issued.map(i=>[i.draft_id,i]));const receivedByInvoice=new Map();for(const payment of payments)receivedByInvoice.set(payment.invoice_id,(receivedByInvoice.get(payment.invoice_id)||0)+Number(payment.amount_gbp));
  if(!rows.length){container.replaceChildren();return;}
  const heading=el('h3','Advertising billing reviews — no invoice issued automatically');
  const table=el('table');row(table,['Advertiser','Total','Billing stage','Invoice reference','Invoice email','Received / outstanding','Actions']);
  for(const v of rows){
   const actions=el('div');actions.className='bar';
   actions.append(button('Preview billing draft',run(()=>previewAdvertisingBillingDraft(v))));
   if(v.billing_status==='ready'&&!draftsByReview.has(v.id))actions.append(button('Create invoice draft',run(()=>prepareAdvertisingInvoiceDraft(v))));
   const draft=draftsByReview.get(v.id);
   const issuedDoc=draft&&issuedByDraft.get(draft.id);
   if(draft&&!issuedDoc)actions.append(button('View invoice draft',run(()=>viewAdvertisingInvoiceDraft(v))));
   if(draft&&!issuedDoc&&v.billing_status==='ready')actions.append(button('Final review',()=>reviewAdvertisingInvoiceDraft(v,draft)));
   if(draft&&!issuedDoc&&v.billing_status==='ready')actions.append(button('Issue invoice',run(()=>issueAdvertisingInvoice(v,draft))));
   if(issuedDoc){actions.append(button('View issued invoice',run(()=>viewAdvertisingInvoiceDraft(v,true))));if(!invoiceEmailById.has(issuedDoc.id))actions.append(button('Email issued invoice',run(()=>sendIssuedAdvertisingInvoice(issuedDoc))));const remaining=Math.max(0,Math.round((Number(v.total_gbp)-Number(receivedByInvoice.get(issuedDoc.id)||0))*100)/100);if(remaining>0)actions.append(button('Record payment',()=>recordAdvertisingPayment(issuedDoc,remaining)));}
   if(v.billing_status==='needs_review')actions.append(button('Billing details',()=>editAdvertisingBillingDetails(v)));
   if(v.billing_status==='needs_review')actions.append(button('Mark ready',run(async()=>{
    if(!v.billing_contact_name?.trim()||!v.billing_email?.trim()||!v.billing_address?.trim()||!v.billing_country?.trim())throw Error('Save a verified billing contact, email, address and country before marking ready.');
    if(!confirm('Confirm billing details have been checked? This still does not issue an invoice.'))return;
    const {error}=await db.from('advertising_billing_reviews').update({billing_status:'ready',updated_at:new Date().toISOString()}).eq('id',v.id).eq('billing_status','needs_review');
    if(error)throw error;await billingReviews();status('Billing marked ready for invoice preparation.');
   })));
   if(v.billing_status==='ready'&&!draft)actions.append(button('Record external invoice',run(async()=>{
    const ref=prompt('Enter the genuine invoice reference AFTER the invoice has been issued in your invoicing system:');
    if(ref===null)return;
    if(ref.trim().length<3)throw Error('A valid issued invoice reference is required.');
    if(!confirm('Confirm invoice '+ref.trim()+' was actually issued? This records the reference only; it does not send an invoice.'))return;
    const {error}=await db.from('advertising_billing_reviews').update({billing_status:'invoiced',external_invoice_reference:ref.trim(),updated_at:new Date().toISOString()}).eq('id',v.id).eq('billing_status','ready');
    if(error)throw error;await billingReviews();status('Issued invoice reference recorded.');
   })));
   const received=issuedDoc?Number(receivedByInvoice.get(issuedDoc.id)||0):0;const balance=issuedDoc?Math.max(0,Number(v.total_gbp)-received):null;row(table,[v.advertiser_name,money(v.total_gbp),issuedDoc?(balance<0.005?'Paid':received>0?'Part paid':'Awaiting payment'):v.billing_status,v.external_invoice_reference||issuedDoc?.invoice_number||'—',issuedDoc?(invoiceEmailById.has(issuedDoc.id)?({sent:'Accepted by email service',sending:'Sending — verify',uncertain:'Outcome uncertain — check',failed:'Rejected — review'}[invoiceEmailById.get(issuedDoc.id).delivery_status]||'Check delivery'):'Not sent'):'—',issuedDoc?money(received)+' / '+money(balance):'—',actions]);
  }
  container.replaceChildren(heading,table);
 }
 async function list(){
  const [data,attempts]=await Promise.all([
   checked(db.from('admin_advertising_quotation_totals_v1').select('*').order('quote_number',{ascending:false})),
   checked(db.from('advertising_quotation_email_deliveries').select('quotation_id,delivery_status,recipient_email,completed_at'))
  ]);
  const deliveries=new Map(attempts.map(a=>[a.quotation_id,a]));
  const table=el('table');row(table,['Reference','Advertiser','Package','Audience','Placements','Total inc VAT','Status','Email delivery','Actions']);
  for(const q of data){
   const controls=el('div');controls.className='bar';controls.style.flexWrap='nowrap';
   if(q.status==='draft'){controls.append(button(Number(q.placement_quantity)>0?'Open':'Add placements',run(()=>open(q.id))));if(Number(q.placement_quantity)>0&&Number(q.total_gbp)>0)controls.append(button('Record external send',run(()=>changeQuoteStatus(q,'sent'))));}
   if(q.status==='sent'){controls.append(button('Accept',run(()=>changeQuoteStatus(q,'accepted'))),button('Decline',run(()=>changeQuoteStatus(q,'declined'))),button('Expire',run(()=>changeQuoteStatus(q,'expired'))));}
   if(q.status==='accepted'){controls.append(button('Create campaign drafts',run(()=>convertQuoteToDraftCampaigns(q))),button('Prepare billing',run(()=>prepareAdvertisingBilling(q))));}
   const email=deliveries.get(q.id);
   const deliveryLabel=email?email.delivery_status+(email.delivery_status==='sent'?' · '+email.recipient_email:' · check before retrying'):'Not sent directly';
   row(table,['AB-ADQ-'+String(q.quote_number).padStart(6,'0'),q.advertiser_name,q.title,q.audience,q.placement_quantity,money(q.total_gbp),q.status,deliveryLabel,controls]);
  }
  $('quotelist').replaceChildren(table);
  await billingReviews();
 }
 function scopeSummary(l){const brands=l.manufacturers||[],models=l.catalogue_model_ids||[],pages=l.page_paths||[],countries=l.countries||[];return [countries.length?'Countries: '+countries.join(', '):'Territory to confirm',brands.length?brands.join(', '):'',models.length?models.length+' model pages':'',pages.length?pages.length+' website pages':''].filter(Boolean).join(' · ')||'Manual placement'}
 async function lines(){const data=await checked(db.from('advertising_quotation_items').select('*').eq('quotation_id',qid).order('created_at'));const t=el('table');row(t,['Advert','Format','Targeted pages','Qty','Unit price','Net','']);for(const l of data)row(t,[l.description,l.artwork_format.replaceAll('_',' '),scopeSummary(l),l.quantity,money(l.unit_price_gbp),money(l.line_total_gbp),button('Remove',run(async()=>{if(!confirm('Remove this draft placement?'))return;await checked(db.from('advertising_quotation_items').delete().eq('id',l.id));await lines();await list()}))]);$('quotelines').replaceChildren(t);const q=await checked(db.from('admin_advertising_quotation_totals_v1').select('*').eq('id',qid).single());$('quotetotals').textContent='Subtotal '+money(q.subtotal_gbp)+' · Discount '+money(q.discount_gbp)+' · VAT '+money(q.vat_gbp)+' · Total '+money(q.total_gbp)}
 async function open(id){$('quoteemailpanel')?.remove();qid=id||null;advertiserOptions();f.reset();quoteContacts=[];contactRequest++;$('quoteContacts').replaceChildren();lf.reset();$('quoteplacementpreset').value='';clearScope();$('quoteeditor').hidden=false;$('quotelinearea').hidden=!qid;const m=lf.elements.manufacturer;m.replaceChildren(new Option('Select manufacturer (optional)',''));for(const brand of [...new Set(coverage.map(x=>x.manufacturer))].sort())m.add(new Option(brand,brand));if(qid){const q=await checked(db.from('advertising_quotations').select('*').eq('id',qid).single());lf.elements.countries.value=q.audience==='UK'?'GB':'';if(q.status!=='draft'){qid=null;$('quoteeditor').hidden=true;throw Error('Only draft quotations can be edited')}for(const field of f.elements)if(field.name&&q[field.name]!=null)field.value=q[field.name];$('quotetitle').textContent='AB-ADQ-'+String(q.quote_number).padStart(6,'0');await contactOptions();await lines()}else $('quotetitle').textContent='New quotation'}
 $('newquote').onclick=run(()=>open());$('refreshquotes').onclick=run(list);$('quoteclose').onclick=()=>$('quoteeditor').hidden=true;
 f.onsubmit=run(async()=>{const v=Object.fromEntries(new FormData(f));v.partner_id=partners.find(p=>p.name.trim().toLowerCase()===v.advertiser_name.trim().toLowerCase())?.id||null;for(const k of ['duration_days','discount_gbp','vat_rate'])v[k]=Number(v[k]);v.valid_until=v.valid_until||null;v.updated_at=new Date().toISOString();qid=await save('advertising_quotations',v,qid);await open(qid);await list();status('Quotation saved')});
 lf.elements.manufacturer.onchange=()=>{const brand=lf.elements.manufacturer.value;const currentCountries=lf.elements.countries.value;clearScope();lf.elements.manufacturer.value=brand;lf.elements.countries.value=currentCountries;if(!brand){lf.elements.quantity.value=1;return}const matching=coverage.filter(x=>x.manufacturer===brand&&x.coverage_status!=='excluded');scope.manufacturers=[brand];scope.catalogue_model_ids=matching.map(x=>x.model_id);for(const m of matching.sort((a,b)=>String(a.model).localeCompare(String(b.model))))lf.elements.model.add(new Option(m.model,String(m.model_id)));lf.elements.quantity.value=scope.catalogue_model_ids.length;$('quoteselectedcount').textContent=scope.catalogue_model_ids.length+' model pages proposed'};
  lf.elements.model.onchange=()=>{const id=lf.elements.model.value,brand=lf.elements.manufacturer.value;if(!brand)return;scope.manufacturers=[brand];scope.catalogue_model_ids=id?[Number(id)]:coverage.filter(x=>x.manufacturer===brand&&x.coverage_status!=='excluded').map(x=>x.model_id);lf.elements.quantity.value=scope.catalogue_model_ids.length||1;$('quoteselectedcount').textContent=id?'1 exact model page selected':scope.catalogue_model_ids.length+' model pages proposed';};
 $('quoteselected').onclick=()=>{const currentCountries=lf.elements.countries.value;clearScope();lf.elements.countries.value=currentCountries;scope.page_paths=[...selectedPages];scope.catalogue_model_ids=[...selectedModels];const count=scope.page_paths.length+scope.catalogue_model_ids.length;if(!count){status('Select website or model pages in the coverage tables first');return}lf.elements.quantity.value=count;$('quoteselectedcount').textContent=count+' proposed placements'};
 lf.onsubmit=run(async()=>{if(!qid)throw Error('Save the quotation first');const v=Object.fromEntries(new FormData(lf));delete v.manufacturer;delete v.model;v.countries=[...new Set(String(v.countries||'').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean))];if(!v.countries.length||v.countries.some(x=>!/^[A-Z]{2}$/.test(x)||x==='UK'))throw Error('Enter explicit two-letter country codes for this placement (GB for United Kingdom).');const quote=await checked(db.from('advertising_quotations').select('audience').eq('id',qid).single());if(quote.audience==='UK'&&v.countries.some(x=>x!=='GB'))throw Error('This is a UK quotation. Use GB only, or change the quotation audience to International / Worldwide first.');if(quote.audience==='International'&&v.countries.includes('GB'))throw Error('International quotation must not include GB. Choose Worldwide for UK and international advertising together.');v.quantity=Number(v.quantity);v.unit_price_gbp=Number(v.unit_price_gbp);if(!Number.isSafeInteger(v.quantity)||v.quantity<1)throw Error('Enter a valid placement quantity.');if(!Number.isFinite(v.unit_price_gbp)||v.unit_price_gbp<=0)throw Error('Enter the agreed price per placement above £0.');const count=scope.page_paths.length+scope.catalogue_model_ids.length;if((count||scope.manufacturers.length)&&count!==v.quantity)throw Error('Quantity must match selected placements');await save('advertising_quotation_items',{...v,...scope,countries:v.countries,quotation_id:qid},null);lf.reset();clearScope();await lines();await list();status('Placement added')});

 $('quoteemail').onclick=run(async()=>{if(!qid)throw Error('Save the quotation first');const id=qid;const [q,items,t]=await Promise.all([checked(db.from('advertising_quotations').select('*').eq('id',id).single()),checked(db.from('advertising_quotation_items').select('*').eq('quotation_id',id).order('created_at')),checked(db.from('admin_advertising_quotation_totals_v1').select('*').eq('id',id).single())]);if(!items.length||Number(t.total_gbp)<=0)throw Error('Add priced placements and a total above £0 before preparing the quotation email');const email=String(q.contact_email||'').trim();if(!/^[^\s@?,&#]+@[^\s@?,&#]+\.[^\s@?,&#]+$/.test(email))throw Error('Save a valid recipient email first');const ref='AB-ADQ-'+String(q.quote_number).padStart(6,'0');const subject='AnyBike advertising quotation '+ref;const body=['Hello'+(q.contact_name?' '+q.contact_name:'')+',','','Thank you for your interest in advertising with AnyBike. Please find our proposed advertising package below.','',ref+' — '+q.title,'Audience: '+q.audience,'Duration: '+q.duration_days+' days',...items.map(l=>l.description+' — '+l.artwork_format.replaceAll('_',' ')+' — '+scopeSummary(l)+' — '+l.quantity+' × '+money(l.unit_price_gbp)+' (ex VAT)'),'','Subtotal: '+money(t.subtotal_gbp),'Discount: '+money(t.discount_gbp),'VAT: '+money(t.vat_gbp),'Total including VAT: '+money(t.total_gbp),'Valid until: '+(q.valid_until||'To be agreed'),'','Proposed placements are subject to availability, artwork approval and applicable compliance requirements.','','Please reply quoting '+ref+' if you would like to proceed.','','Kind regards','AnyBike','sales@anybike.co.uk'].join('\r\n');let panel=$('quoteemailpanel');if(!panel){panel=el('div');panel.id='quoteemailpanel';$('quotelinearea').append(panel)}panel.replaceChildren(el('h3','Quotation email draft'));const to=el('p','To: '+email),sub=el('p','Subject: '+subject),area=el('textarea');area.value=body;area.rows=14;area.style.width='100%';const copy=button('Copy email text',run(async()=>{await navigator.clipboard.writeText(area.value);status('Email text copied')}));const launch=button('Open email app',()=>{const url='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(area.value);if(url.length>1900){status('Email too long for some email apps; copy the text instead');return}location.href=url});const send=button('Send quotation email directly',run(async()=>{
 const existing=await checked(db.from('advertising_quotation_email_deliveries').select('delivery_status,recipient_email').eq('quotation_id',id).limit(1));
 if(existing.length)throw Error('An email attempt already exists ('+existing[0].delivery_status+'). Check delivery history before resending.');
 if(!confirm('Send the quotation directly to '+email+' from AnyBike now? The system sends the saved quotation details, not edits to this draft text. No A4 PDF will be attached.'))return;
 send.disabled=true;status('Submitting quotation email…');
 try{
  const {data,error}=await db.functions.invoke('admin-send-advertising-quotation',{body:{quotation_id:id}});
  let details=data;
  if(error&&error.context&&typeof error.context.json==='function'){
   try{details=await error.context.json();}catch{}
  }
  if(error||!details?.success){
   try{await list();}catch{}
   throw Error(details?.error||error?.message||'Delivery not confirmed; check the delivery audit before retrying');
  }
  $('quoteeditor').hidden=true;await list();status('Quotation '+ref+' emailed to '+email+'. Provider acceptance recorded.');
 }finally{send.disabled=false;}
}));
panel.append(to,sub,area,copy,launch,send,el('p','Direct sending uses the saved quotation and does not attach the A4 PDF. An email draft is not sent until you click Send and confirm. If delivery is uncertain, check the recorded attempt before retrying.'));status('Email draft prepared')});
 $('quoteprint').onclick=async()=>{if(!qid)return;const w=window.open('','_blank');if(!w){status('Allow pop-ups to preview the quotation');return}const id=qid;try{const [q,items,t]=await Promise.all([checked(db.from('advertising_quotations').select('*').eq('id',id).single()),checked(db.from('advertising_quotation_items').select('*').eq('quotation_id',id).order('created_at')),checked(db.from('admin_advertising_quotation_totals_v1').select('*').eq('id',id).single())]);if(!items.length||Number(t.total_gbp)<=0)throw Error('Add priced placements before printing the quotation');const d=w.document;d.title='AB-ADQ-'+String(q.quote_number).padStart(6,'0');const style=d.createElement('style');style.textContent='@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font:11pt Arial,sans-serif;color:#171717;background:white;margin:0}main{max-width:182mm;margin:20px auto;padding:12mm;background:white}header{border-bottom:3px solid #ed1c24;padding-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:20px}header img{width:145px;height:auto;background:#111;border-radius:3px}h1{font-size:21pt;margin:0}h2{font-size:13pt;margin:22px 0 8px}p{margin:5px 0;white-space:pre-wrap;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;margin-top:12px;table-layout:fixed}th,td{text-align:left;padding:9px 6px;border-bottom:1px solid #ddd;overflow-wrap:anywhere;vertical-align:top}th{background:#eee}th:first-child{width:40%}th:nth-child(2){width:21%}th:nth-child(3){width:9%}th:nth-child(4),th:nth-child(5){width:15%}tr{break-inside:avoid}thead{display:table-header-group}.totals{margin:20px 0 20px auto;width:70%;break-inside:avoid}.totals p{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #ddd;padding:6px}.totals p:last-child{font-weight:bold;border-top:2px solid #ed1c24;font-size:14pt}.meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:18px 0}footer{border-top:1px solid #ccc;margin-top:24px;padding-top:10px;font-size:9pt;color:#444}button{padding:9px 16px;margin:10px;background:#ed1c24;color:white;border:0;border-radius:4px;cursor:pointer}@media print{main{margin:0;padding:0;max-width:none}button{display:none}}';d.head.append(style);
 const node=(tag,txt)=>{const e=d.createElement(tag);if(txt!=null)e.textContent=txt;return e};const main=node('main'),head=node('header'),logo=node('img');logo.src=location.origin+'/anybike-logo-new.jpg';logo.alt='AnyBike';const heading=node('div');heading.append(node('h1','Advertising quotation'),node('p',d.title));head.append(logo,heading);main.append(head);
 const meta=node('div');meta.className='meta';const a=node('div'),b=node('div');a.append(node('strong','Prepared for'),node('p',q.advertiser_name),node('p',q.contact_name),node('p',q.contact_email));b.append(node('strong','Quotation details'),node('p','Issued: '+new Date(q.created_at).toLocaleDateString('en-GB')),node('p','Valid until: '+(q.valid_until?new Date(q.valid_until+'T00:00:00').toLocaleDateString('en-GB'):'To be agreed')),node('p','Status: '+q.status));meta.append(a,b);main.append(meta,node('h2',q.title),node('p','Audience: '+q.audience+' · Duration: '+q.duration_days+' days'));
 const table=node('table'),thead=node('thead'),hr=node('tr');for(const x of ['Advert / target','Format','Qty','Unit price','Net'])hr.append(node('th',x));thead.append(hr);table.append(thead);const tbody=node('tbody');for(const l of items){const tr=node('tr');for(const x of [l.description+'\n'+scopeSummary(l),l.artwork_format.replaceAll('_',' '),l.quantity,money(l.unit_price_gbp),money(l.line_total_gbp)])tr.append(node('td',x));tbody.append(tr)}table.append(tbody);main.append(table);
 const totals=node('div');totals.className='totals';for(const [label,value] of [['Subtotal',t.subtotal_gbp],['Discount',t.discount_gbp],['Net',t.net_gbp],['VAT ('+q.vat_rate+'%)',t.vat_gbp],['Total including VAT',t.total_gbp]]){const p=node('p');p.append(node('span',label),node('span',money(value)));totals.append(p)}main.append(totals);if(q.notes)main.append(node('h2','Notes'),node('p',q.notes));if(q.terms)main.append(node('h2','Terms'),node('p',q.terms));main.append(node('p','Proposed placements are subject to availability, artwork approval and applicable compliance requirements.'),node('footer','AnyBike.co.uk · sales@anybike.co.uk'));const print=node('button','Print / save as PDF');print.onclick=()=>w.print();d.body.replaceChildren(print,main);w.focus()}catch(err){w.close();status(err.message||String(err))}};
 await list()
}
async function init(){db=getAdminSupabaseClient();const {data,error}=await db.rpc('anybike_is_admin');if(error||data!==true)throw Error('Admin database permission required');$('adcontent').hidden=false;$('newcampaign').onclick=()=>openCampaign();$('newpartner').onclick=()=>openPartner();$('closepartner').onclick=()=>$('partnerform').hidden=true;$('newcommission').onclick=()=>{fields('commissionfields',lf,{currency:'GBP',entry_type:'earned'});$('commissionform').hidden=false};$('closecommission').onclick=()=>$('commissionform').hidden=true;$('closeeditor').onclick=()=>$('editor').hidden=true;$('previewad').onclick=preview;$('uploadCreativeFiles').onclick=run(uploadCreativeSizes);$('previewCreativeSizes').onclick=showCreativeSizes;$('refreshads').onclick=run(load);$('exportcountryads').onclick=run(exportCountryAdvertisingReport);$('coverageload').onclick=run(loadCoverage);$('coveragequery').oninput=$('coveragefilter').onchange=()=>{modelPage=0;renderCoverage()};$('selectcoverage').onclick=()=>{for(const r of matchingCoverage())selectedModels.add(r.model_id);renderCoverage()};$('clearcoverage').onclick=()=>{selectedModels.clear();renderCoverage()};$('assigncoverage').onclick=run(()=>changeCoverage('assign'));$('excludecoverage').onclick=run(()=>changeCoverage('exclude'));$('resetcoverage').onclick=run(()=>changeCoverage('reset'));$('campaignform').onsubmit=run(async()=>{const v=values($('campaignform'),cf);if(!v.name||!v.partner_id)throw Error('Name and partner required');if(v.status==='active'&&!v.starts_at)v.starts_at=new Date().toISOString();if(v.status==='active'&&v.duration_days&&!v.ends_at)v.ends_at=new Date(Date.parse(v.starts_at)+v.duration_days*86400000).toISOString();if(v.starts_at&&v.ends_at&&Date.parse(v.ends_at)<=Date.parse(v.starts_at))throw Error('End date must follow start date');if(v.status==='active'){
 if(v.is_test)throw Error('Test campaigns remain drafts for safe artwork and placement previews. Untick Test campaign only after full approval and targeting review.');
 const requiredHttps=['destination_url','desktop_image_url','mobile_image_url'];
 for(const field of requiredHttps){let url;try{url=new URL(String(v[field]||''))}catch{throw Error('Complete '+cf[field]+' with a valid HTTPS URL before activation.')}if(url.protocol!=='https:')throw Error('Only HTTPS advertising artwork and destinations may be activated.');}
 if(!String(v.disclosure||'').trim())throw Error('Advertising disclosure is required before activation.');
 // Blank alt text is valid for decorative artwork; descriptive creatives should use accurate alt text.
 if(!v.countries?.length)throw Error('Select explicit target countries before activating advertising. Blank targeting must not run worldwide.');
 const countryCodes=v.countries.map(country=>String(country).trim().toUpperCase());
 if(countryCodes.some(country=>!/^[A-Z]{2}$/.test(country)||country==='UK'))throw Error('Use two-letter ISO country codes (GB for the United Kingdom) before activating advertising.');
 v.countries=[...new Set(countryCodes)];
 const partner=partners.find(p=>p.id===v.partner_id);
 if(!partner||partner.status!=='approved'||!partner.agreement_approved||!partner.branding_approved)throw Error('Partner approval, agreement and branding must all be confirmed before activation.');
 if(partner?.kind==='finance'&&(!v.compliance_reference||!v.compliance_approved_at||!partner.branding_approved||!partner.agreement_approved))throw Error('Finance advertising requires approved branding, agreement and recorded compliance approval before activation.');
 if(editId){
  const original=campaigns.find(c=>c.id===editId);
  if(original?.source_quotation_item_id){
   const line=await checked(db.from('advertising_quotation_items').select('quotation_id').eq('id',original.source_quotation_item_id).single());
   const quote=await checked(db.from('advertising_quotations').select('status,audience').eq('id',line.quotation_id).single());
   if(quote.status!=='accepted')throw Error('The originating quotation must remain accepted.');
   if(quote.audience==='International'&&(!v.countries?.length||v.countries.some(country=>['GB','UK'].includes(String(country).toUpperCase()))))throw Error('International-only advertising requires explicit non-UK country targeting before activation.');
   if(quote.audience==='UK'&&(!v.countries?.length||v.countries.some(country=>!['GB','UK'].includes(String(country).toUpperCase()))))throw Error('UK quotation requires UK-only country targeting before activation.');
  }
 }
 if(!confirm('Activate this campaign? Approved advertising may appear on targeted live pages.'))return;
}editId=await save('advertising_campaigns',v,editId);await load();await loadCoverage();const saved=campaigns.find(c=>c.id===editId);if(saved)openCampaign(saved);status('Campaign saved. Upload five advert sizes below when ready.')});$('partnerform').onsubmit=run(async()=>{partnerId=await save('commercial_partners',values($('partnerform'),pf),partnerId);await load();status('Partner saved')});$('commissionform').onsubmit=run(async()=>{await save('commercial_commission_entries',values($('commissionform'),lf));fields('commissionfields',lf,{currency:'GBP',entry_type:'earned'});await load();status('Commission entry recorded')});initPages();await load();renderPairedHousePreview();$('refreshPairedHousePreview').onclick=renderPairedHousePreview;await loadCoverage();await loadPages();await initQuotes()}let attempts=0;const timer=setInterval(()=>{if(!document.documentElement.classList.contains('admin-auth-pending')){clearInterval(timer);run(init)()}else if(++attempts>300)clearInterval(timer)},100)})();