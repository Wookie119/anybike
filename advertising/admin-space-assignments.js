// Commercial space assignments only. Draft/reserved entries never publish.
(()=>{'use strict';
const $=id=>document.getElementById(id);
const anchor=$('namedAdvertisingSpaces');if(!anchor)return;
const section=document.createElement('section');
section.id='commercialSpaceAssignments';
const heading=document.createElement('h2');heading.textContent='Named space assignments · commercial planning';
const note=document.createElement('p');note.style.cssText='font-size:13px;color:#bbb;margin:5px 0';
note.textContent='Assign or replace a campaign in a named space, or clear the assignment. Draft and reserved are planning states only: no campaign is activated and no page changes. Live positions require separate implementation and verification.';
const bar=document.createElement('div');bar.className='bar';
const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Refresh assignments';bar.append(refresh);
const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.style.cssText='font-size:13px;color:#ccc';
const scroll=document.createElement('div');scroll.className='scroll';
const table=document.createElement('table');const head=document.createElement('thead');const header=document.createElement('tr');
for(const h of ['Space ID / name','Placement / verify','Format / market','Campaign','Stage','Preview','Actions']){const th=document.createElement('th');th.textContent=h;header.append(th)}
head.append(header);const body=document.createElement('tbody');table.append(head,body);scroll.append(table);
section.append(heading,note,bar,status,scroll);
anchor.insertAdjacentElement('afterend',section);
const textCell=(tr,text)=>{const td=document.createElement('td');td.textContent=String(text??'—');tr.append(td);return td};
let db;
const formats={square:'compact_image_url',stock_card:'stock_card_image_url',model_card:'stock_card_image_url',vertical:'mobile_image_url',landscape:'desktop_image_url',paired_50_50:'desktop_image_url'};
const softwareDrafts=c=>/^AnyBike complimentary software showcase — /.test(c.name||'')&&!/Dealerwebs$/i.test(c.name||'');
const artworkFits=(space,c)=>Boolean(c&&/^https:\/\//.test(c[formats[space.format]]||''));
const marketFits=(space,c)=>space.market_scope==='all'||!Array.isArray(c.countries)||!c.countries.length||(space.market_scope==='GB'?c.countries.includes('GB'):c.countries.some(x=>x!=='GB'));
async function refreshRows(){
 status.textContent='Loading named-space assignments…';body.replaceChildren();
 try{
  db=getAdminSupabaseClient();
  const admin=await db.rpc('anybike_is_admin');
  if(admin.error||admin.data!==true)throw Error('Admin permission required');
  const results=await Promise.all([
    db.from('advertising_named_spaces').select('slot_code,display_name,page_template,page_path,anchor_key,inherits_template,format,market_scope,status,pricing_tier,guide_monthly_gbp').order('slot_code'),
    db.from('advertising_space_assignments').select('slot_code,campaign_id,assignment_status'),
    db.from('advertising_campaigns').select('id,name,status,campaign_category,countries,desktop_image_url,mobile_image_url,slim_image_url,compact_image_url,stock_card_image_url,destination_url,partner_id').order('name'),
    db.from('commercial_partners').select('id,name')
  ]);
  const failure=results.find(r=>r.error);if(failure)throw failure.error;
  const [spaces,assignments,campaigns,owners]=results.map(r=>r.data||[]);
  const ownerMap=new Map(owners.map(p=>[p.id,p.name]));
  const assignedMap=new Map(assignments.map(a=>[a.slot_code,a]));
  for(const space of spaces){
   const current=assignedMap.get(space.slot_code);
   const tr=document.createElement('tr');
   const spaceCell=textCell(tr,space.slot_code);
   const small=document.createElement('div');small.style.cssText='font-size:12px;color:#aaa;margin-top:3px';small.textContent=space.display_name;spaceCell.append(small);
   const placementCell=textCell(tr,space.inherits_template?'Inherited '+(space.page_template||'page')+' template':'Individual page');
   const location=document.createElement('div');location.style.cssText='font-size:12px;color:#aaa;margin-top:3px';
   location.textContent='Anchor: '+(space.anchor_key||'not mapped');placementCell.append(location);
   if(typeof space.page_path==='string'&&/^\\/[a-z0-9\\/-]+\\.html$/i.test(space.page_path)){
    const view=document.createElement('a');view.href=space.page_path;view.target='_blank';view.rel='noopener noreferrer';
    view.textContent='Open public page';view.style.cssText='display:block;font-size:12px;margin-top:4px';
    placementCell.append(view);
   }
   textCell(tr,(space.format||'Unspecified')+' · '+(space.market_scope||'all')+' · '+(space.pricing_tier||'standard')+' · '+(space.status||'planned'));
   const campaignCell=document.createElement('td');const select=document.createElement('select');select.setAttribute('aria-label','Campaign for '+space.slot_code);
   const empty=document.createElement('option');empty.value='';empty.textContent='Choose campaign';select.append(empty);
   for(const c of campaigns){
    // The other six software suppliers remain private drafts; never offer them for placement.
    if(softwareDrafts(c)&&current?.campaign_id!==c.id)continue;
    if(!artworkFits(space,c)&&current?.campaign_id!==c.id)continue;
    if(!marketFits(space,c)&&current?.campaign_id!==c.id)continue;
    const option=document.createElement('option');option.value=c.id;
    const warning=artworkFits(space,c)&&marketFits(space,c)?'':' · incompatible artwork/market';
    option.textContent=c.name+' · '+(ownerMap.get(c.partner_id)||'Unassigned')+' ('+c.status+warning+')';
    option.disabled=!!warning||softwareDrafts(c);
    select.append(option);
   }
   select.value=current?.campaign_id||'';
   campaignCell.append(select);tr.append(campaignCell);
   const stageCell=document.createElement('td');const stage=document.createElement('select');stage.setAttribute('aria-label','Planning stage for '+space.slot_code);
   for(const value of ['draft','reserved']){const o=document.createElement('option');o.value=value;o.textContent=value[0].toUpperCase()+value.slice(1);stage.append(o)}
   stage.value=current?.assignment_status||'draft';stageCell.append(stage);tr.append(stageCell);
   const previewCell=document.createElement('td');previewCell.style.minWidth='125px';
   const showPreview=()=>{
    previewCell.replaceChildren();
    const c=campaigns.find(x=>x.id===select.value);
    if(!c){previewCell.textContent='No assignment';return}
    const field=formats[space.format]||'desktop_image_url';
    const url=c[field];
    if(!url||!/^https:\/\//.test(url)){previewCell.textContent='Artwork missing for '+(space.format||'this format');return}
    const img=document.createElement('img');img.src=url;img.alt='Draft preview — '+c.name;
    img.loading='lazy';img.style.cssText='max-width:160px;width:100%;height:auto;max-height:95px;object-fit:contain;border:1px solid #555;border-radius:5px';
    img.onerror=()=>{previewCell.textContent='Artwork unavailable'};
    previewCell.append(img);
    const label=document.createElement('div');label.textContent='Preview only · '+c.status;label.style.cssText='font-size:11px;color:#bbb';previewCell.append(label);
   };
   showPreview();select.addEventListener('change',showPreview);tr.append(previewCell);
   const actions=document.createElement('td');const save=document.createElement('button');save.type='button';save.textContent='Save assignment';
   const clear=document.createElement('button');clear.type='button';clear.textContent='Clear';clear.style.marginLeft='5px';clear.disabled=!current;
   save.onclick=async()=>{
    if(!select.value){status.textContent='Select a campaign before saving '+space.slot_code;return}
    save.disabled=true;clear.disabled=true;
    try{
     const c=campaigns.find(x=>x.id===select.value);
     if(!c)throw Error('Campaign not available');
     if(softwareDrafts(c))throw Error('Only DealerWebs may be considered among software suppliers. Other six remain unpublished.');
     if(!artworkFits(space,c))throw Error('Artwork for '+space.format+' is missing. Upload a compatible creative first.');
     if(!marketFits(space,c))throw Error('Campaign territory does not match this named position.');
     if(stage.value==='reserved'&&space.status!=='ready'&&space.status!=='active')throw Error('This space is still planned and cannot be reserved until verified ready.');
     if(!window.confirm('Save '+c.name+' as '+stage.value+' for '+space.slot_code+'? This is planning only; nothing will appear on the website.'))return;
     const result=await db.from('advertising_space_assignments').upsert({slot_code:space.slot_code,campaign_id:c.id,assignment_status:stage.value,updated_at:new Date().toISOString()},{onConflict:'slot_code'}).select('slot_code').single();
     if(result.error)throw result.error;
     await refreshRows();
     status.textContent='Saved planning assignment for '+space.slot_code+'. No advert activated.';
    }catch(e){status.textContent='Assignment not saved: '+(e?.message||e)}
    finally{save.disabled=false;clear.disabled=false}
   };
   clear.onclick=async()=>{
    if(!current)return;
    if(!window.confirm('Clear the planned assignment for '+space.slot_code+'? Campaign and artwork will be kept.'))return;
    clear.disabled=true;
    try{
     const result=await db.from('advertising_space_assignments').delete().eq('slot_code',space.slot_code).select('slot_code').maybeSingle();
     if(result.error||!result.data)throw Error(result.error?.message||'No assignment removed');
     await refreshRows();
     status.textContent='Cleared planned assignment for '+space.slot_code+'. Campaign preserved.';
    }catch(e){status.textContent='Could not clear assignment: '+(e?.message||e)}
    finally{clear.disabled=false}
   };
   actions.append(save,clear);tr.append(actions);body.append(tr);
  }
  status.textContent=spaces.length+' named spaces · '+assignments.length+' planning assignments · '+spaces.filter(x=>x.inherits_template).length+' inherited template positions. These controls do not change live advertising.';
 }catch(e){status.textContent='Unable to load space assignments: '+(e?.message||e)}
}
refresh.addEventListener('click',refreshRows);
refreshRows();
})();