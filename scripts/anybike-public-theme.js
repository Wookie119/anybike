/* AnyBike shared approved UI tokens, read-only from Supabase.
   No hardcoded page-specific theme overrides; stylesheet provides offline fallback. */
(()=>{'use strict';
 const project='https://tuehtnezhdnkqbbhttgp.supabase.co';
 const publishable='sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK';
 const map={red:'--ab-ui-red',body:'--ab-ui-body',panel:'--ab-ui-surface',panel_alt:'--ab-ui-surface-alt',input:'--ab-ui-input',line:'--ab-ui-border',muted:'--ab-ui-muted',pill_line:'--ab-ui-pill-line',hero_radius:'--ab-ui-hero-radius',card_radius:'--ab-ui-card-radius',control_radius:'--ab-ui-control-radius',pill_radius:'--ab-ui-pill-radius',page_max:'--ab-ui-page-max'};
 const color=/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/;
 const size=/^\d{1,4}px$/;
 async function load(){
  try{
   const url=project+'/rest/v1/anybike_public_design_tokens?design_key=eq.anybike-uk-approved-v2&select=tokens,design_version&limit=1';
   const response=await fetch(url,{headers:{apikey:publishable},signal:AbortSignal.timeout(6500)});
   if(!response.ok)throw Error('Theme service '+response.status);
   const rows=await response.json();
   const tokens=rows?.[0]?.tokens;
   if(!tokens||typeof tokens!=='object'||Array.isArray(tokens))return;
   const root=document.documentElement;
   for(const [key,cssVar] of Object.entries(map)){
    const value=tokens[key];
    if(typeof value!=='string')continue;
    if((key.endsWith('_radius')||key==='page_max'?size:color).test(value))root.style.setProperty(cssVar,value);
   }
   root.dataset.anybikeDesignVersion=String(rows[0].design_version||1);
  }catch(err){console.warn('AnyBike approved theme unavailable; using approved local fallback',err)}
 }
 load();
})();
