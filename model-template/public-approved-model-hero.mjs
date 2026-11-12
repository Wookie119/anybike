/*
 * AnyBike approved exact-model photography for shared model-guide pages.
 * Read-only public RPC; never reads dealer stock, private users, or unapproved photos.
 * No DOM mutation observers: do not repeat the prior BMW page freeze.
 */
const PROJECT='https://tuehtnezhdnkqbbhttgp.supabase.co';
const PUBLIC_KEY='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
const safeHttps=value=>{
 if(typeof value!=='string'||value!==value.trim())return false;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
};
export function approvedHeroCandidate(data,make,model){
 return !!data&&data.make===make&&data.model===model&&
  safeHttps(data.image_url)&&safeHttps(data.source_page_url)&&safeHttps(data.licence_url)&&
  typeof data.attribution==='string'&&!!data.attribution.trim()&&
  typeof data.licence==='string'&&!!data.licence.trim();
}
export async function installApprovedSharedModelHero({root=document.querySelector('main'),query=new URLSearchParams(location.search)}={}){
 const make=query.get('make')?.trim(),model=query.get('model')?.trim();
 const hero=root?.querySelector('section.hero');
 if(!make||!model||!hero||hero.querySelector('[data-anybike-approved-model-hero],.licensed-photo,.recovered-hero-photo'))return false;
 // Keep the current model title, research, sourcing actions and stock in place.
 const provider=typeof window!=='undefined'?window.supabase:null;
 let client=null;
 try{client=provider?.createClient?.(PROJECT,PUBLIC_KEY)||null;}
 catch(error){console.warn('Optional model hero client could not initialize',error);}
 const args={p_make:make,p_model:model};
 let data=null;
 if(client){
  try{
   const result=await client.rpc('public_anybike_model_hero_v1',args);
   if(!result.error)data=result.data;
  }catch(error){console.warn('Optional model hero client unavailable',error);}
 }
 // The same approved, read-only public RPC remains available when the CDN
 // client is missing or its transport fails. Never query raw photo tables.
 if(!data){
  try{
   const response=await fetch(PROJECT+'/rest/v1/rpc/public_anybike_model_hero_v1',{
    method:'POST',headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json'},
    body:JSON.stringify(args)
   });
   if(!response.ok)return false;
   data=await response.json();
  }catch{return false;}
 }
 if(!approvedHeroCandidate(data,make,model)||hero.querySelector('[data-anybike-approved-model-hero]'))return false;
 const figure=document.createElement('figure');
 figure.dataset.anybikeApprovedModelHero='1';
 figure.style.cssText='margin:18px 0 4px;max-width:850px';
 const img=document.createElement('img');
 img.alt=make+' '+model+' — approved model photograph';
 img.loading='eager';
 img.decoding='async';
 img.style.cssText='display:block;width:100%;height:auto;max-height:540px;object-fit:contain;border-radius:9px;background:#191919';
 const caption=document.createElement('figcaption');
 caption.style.cssText='font-size:12px;color:#bfc3ca;margin-top:6px;line-height:1.5';
 const source=document.createElement('a');
 source.href=data.source_page_url;
 source.target='_blank';source.rel='noopener noreferrer';
 source.textContent=data.attribution;
 const licence=document.createElement('a');
 licence.href=data.licence_url;
 licence.target='_blank';licence.rel='noopener noreferrer';
 licence.textContent=data.licence;
 caption.append(source,' · ',licence);
 // Only insert the figure after the image is demonstrably loaded.
 const candidates=[data.image_url];
 if(data.source_page_url.startsWith('https://commons.wikimedia.org/wiki/File:')){
  const file=data.source_page_url.slice('https://commons.wikimedia.org/wiki/File:'.length);
  const fallback='https://commons.wikimedia.org/wiki/Special:FilePath/'+file;
  if(!candidates.includes(fallback))candidates.push(fallback);
 }
 return await new Promise(resolve=>{
  let index=0,finished=false;
  let timer=null;
  const finish=value=>{
   if(finished)return;
   finished=true;
   if(timer!==null)clearTimeout(timer);
   img.onload=null;img.onerror=null;
   resolve(value);
  };
  const next=()=>{
   if(finished)return;
   if(timer!==null)clearTimeout(timer);
   if(index>=candidates.length){finish(false);return;}
   // A stalled third-party image must not leave the publication task pending.
   timer=setTimeout(next,8000);
   try{img.src=candidates[index++];}catch{next();}
  };
  img.onload=()=>{
   if(finished)return;
   if(!img.naturalWidth||!img.naturalHeight){next();return;}
   if(!hero.isConnected){finish(false);return;}
   if(hero.querySelector('[data-anybike-approved-model-hero],.licensed-photo,.recovered-hero-photo')){
    finish(false);return;
   }
   figure.append(img,caption);
   const actions=hero.querySelector('.actions');
   if(actions)actions.before(figure);else hero.append(figure);
   finish(true);
  };
  img.onerror=next;
  next();
 });
}
if(typeof document!=='undefined'){
 const start=()=>void installApprovedSharedModelHero();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
}
