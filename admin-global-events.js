// Global events central editor — authenticated AnyBike admins only.
(()=>{'use strict';
const $=id=>document.getElementById(id), status=t=>{$('status').textContent=t};
const types=[['show','Motorcycle show'],['festival','Festival'],['race','Racing'],['rally','Rally'],['dealer_open_day','Dealer open day'],['dealer_open_house','Dealer open house'],['model_launch','Manufacturer model launch'],['press_launch','Press launch / test ride'],['ride_out','Ride-out'],['club_meet','Owners club meeting'],['bike_night','Bike night'],['classic_show','Classic motorcycle event'],['autojumble','Autojumble / swap meet'],['charity_ride','Charity ride'],['creator_event','Creator / YouTuber event'],['other','Other']];
const form=$('eventForm'),typeSelect=form.elements.namedItem('event_type');
types.forEach(([value,name])=>{const opt=document.createElement('option');opt.value=value;opt.textContent=name;typeSelect.append(opt)});
let db,items=[],editId=null,authorised=false;
const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=String(text??'');return n};
function editor(item){
 editId=item?.id??null;form.reset();
 const fields=['title','event_type','edition_year','country_code','country_name','city','venue','start_date','end_date','date_status','organiser_name','official_url','guide_path','summary','review_note','published','cancelled'];
 if(item)for(const f of fields){const input=form.elements.namedItem(f);if(input)input.value=item[f]===null?'':String(item[f])}
 else {form.elements.namedItem('edition_year').value=String(new Date().getFullYear()+1);form.elements.namedItem('published').value='false';form.elements.namedItem('cancelled').value='false'}
 $('editingTitle').textContent=item?'Edit event · '+item.title:'New motorcycle event · draft';
 $('editor').hidden=false;$('editor').scrollIntoView({behavior:'smooth',block:'start'});
}
function render(){
 const q=$('filter').value.trim().toLowerCase(),state=$('state').value;
 const rows=items.filter(x=>(!q||[x.title,x.country_name,x.city,x.organiser_name].join(' ').toLowerCase().includes(q))&&(!state||(state==='published'===x.published)));
 $('count').textContent=items.length+' events in database · '+rows.length+' matching · '+items.filter(x=>x.published).length+' published';
 $('rows').replaceChildren();
 for(const item of rows){
  const tr=document.createElement('tr');const name=el('td',item.title);
  if(item.organiser_name)name.append(el('small','Organiser: '+item.organiser_name));tr.append(name);
  tr.append(el('td',item.event_type.replaceAll('_',' ')+' · '+item.city+', '+item.country_name));
  tr.append(el('td',item.start_date?(item.start_date+(item.end_date&&item.end_date!==item.start_date?' – '+item.end_date:'')):'Unconfirmed'));
  tr.append(el('td',(item.published?'Published':'Draft')+(item.cancelled?' · Cancelled':'')+' · '+item.date_status.replaceAll('_',' ')));
  const act=el('td',''),edit=el('button','Edit');edit.type='button';edit.onclick=()=>editor(item);act.append(edit);
  if(item.published){
   const hide=el('button','Unpublish');hide.type='button';hide.style.marginLeft='6px';
   hide.onclick=async()=>{if(!confirm('Unpublish '+item.title+'?'))return;hide.disabled=true;
    try{const r=await db.from('motorcycle_global_events').update({published:false,updated_at:new Date().toISOString()}).eq('id',item.id).select('id').single();if(r.error)throw r.error;await load();status('Unpublished '+item.title)}
    catch(e){status('Unable to unpublish: '+e.message)}finally{hide.disabled=false}
   };act.append(hide)
  }
  tr.append(act);$('rows').append(tr)
 }
}
async function load(){
 if(!authorised)return;status('Loading motorcycle events…');
 const r=await db.from('motorcycle_global_events').select('*').order('edition_year',{ascending:false}).order('start_date',{ascending:true,nullsFirst:false}).limit(1000);
 if(r.error){status('Unable to load events: '+r.error.message);return}
 items=r.data||[];render();status(items.length+' events loaded. Drafts are not public.')
}
$('new').onclick=()=>editor(null);
$('cancel').onclick=()=>{$('editor').hidden=true};
$('refresh').onclick=load;$('filter').oninput=render;$('state').onchange=render;
form.onsubmit=async e=>{
 e.preventDefault();if(!authorised)return;
 const raw=Object.fromEntries(new FormData(form).entries());
 const val=k=>String(raw[k]||'').trim(),start=val('start_date'),end=val('end_date');
 if(Boolean(start)!==Boolean(end)){status('Enter both start and end dates or leave both empty.');return}
 if(start&&end<start){status('The end date must not be before the start date.');return}
 if(val('date_status')==='confirmed'&&!start){status('Confirmed events require a start and end date.');return}
 if(val('published')==='true'&&!confirm('Publish this event on the public worldwide calendar? Verify official details and rights first.'))return;
 const payload={
 title:val('title'),event_type:val('event_type'),edition_year:Number(val('edition_year')),
 country_code:val('country_code').toUpperCase(),country_name:val('country_name'),city:val('city'),
 venue:val('venue')||null,start_date:start||null,end_date:end||null,date_status:val('date_status'),
 organiser_name:val('organiser_name')||null,official_url:val('official_url'),guide_path:val('guide_path')||null,
 summary:val('summary'),review_note:val('review_note')||null,published:val('published')==='true',cancelled:val('cancelled')==='true',
 updated_at:new Date().toISOString()
 };
 if(!payload.official_url.startsWith('https://')){status('Use an https:// official event URL.');return}
 if(!payload.title||!payload.summary||!payload.country_name||!payload.city){status('Fill in all required event details.');return}
 if(!editId){
  const slugBase=payload.title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,75);
  payload.slug=slugBase+'-'+Math.random().toString(36).slice(2,8);
 }
 const save=$('save');save.disabled=true;status('Saving event…');
 try{
  const q=editId?db.from('motorcycle_global_events').update(payload).eq('id',editId):db.from('motorcycle_global_events').insert(payload);
  const r=await q.select('id,title,published').single();if(r.error)throw r.error;
  $('editor').hidden=true;await load();status('Saved '+r.data.title+' · '+(r.data.published?'published':'draft')+'.')
 }catch(e){status('Event was not saved: '+e.message)}
 finally{save.disabled=false}
};
async function init(){
 try{
  db=getAdminSupabaseClient();const check=await db.rpc('anybike_is_admin');
  if(check.error||check.data!==true)throw Error('Administrator permissions required');
  authorised=true;await load()
 }catch(e){status('Events editor unavailable: '+e.message);$('new').disabled=true}
}
init();
})();