/* AnyBike Global editorial links for international country pages.
 * Shared across all /markets/*.html routes, preserving existing market
 * templates. Editorial links never certify stock, customs or import rules.
 * Country-specific entries describe the topic's origin, not local demand.
 */
(function(){
 'use strict';
 if(typeof document==='undefined'||typeof location==='undefined')return;
 const match=location.pathname.match(/^\/markets\/([a-z0-9-]+)\.html$/i);
 if(!match)return;
 const slug=match[1].toLowerCase();
 const stories={
  japan:[
   ['Honda NM4 Vultus: Japanese design','/global/honda-nm4-vultus-did-you-know.html'],
   ['Suzuki Hayabusa: aerodynamics and design','/global/suzuki-hayabusa-japan-design-speed.html'],
   ['Yamaha NIKEN: leaning front-wheel engineering','/global/yamaha-niken-leaning-three-wheel-design.html']
  ],
  italy:[
   ['Bimota Tesi H2: Italian chassis engineering','/global/bimota-tesi-h2-blimey-look-at-that.html'],
   ['Ducati Diavel V4: Italian motorcycle design','/global/ducati-diavel-v4-i-want-one.html']
  ],
  india:[
   ['Royal Enfield Himalayan: adventure-motorcycle development','/global/royal-enfield-himalayan-india-mountain-roads.html'],
   ['Bajaj Pulsar: Indian motorcycle evolution','/global/bajaj-pulsar-indian-motorcycle-evolution.html']
  ],
  germany:[
   ['BMW automated shifting: manual or ASA?','/anybike-global.html#bmw-r1300gsa-manual-asa'],
   ['BMW motorcycle model research','/bmw-motorcycles.html']
  ],
  'united-states':[
   ['Harley-Davidson factory performance history','/global/harley-ss-screamin-eagle-cvo-history.html'],
   ['Harley-Davidson tyre buying guide','/global/harley-tyre-buying-guide.html']
  ],
  'united-kingdom':[
   ['Motorcycle engineering and buying research','/anybike-global.html#features'],
   ['UK motorcycle sourcing services','/buy-motorcycles.html']
  ],
  'isle-of-man':[
   ['Works riders and motorcycle racing history','/anybike-global.html#racing-legends']
  ],
  australia:[
   ['Independent Australian motorcycle reporting','/anybike-global.html#voices']
  ],
  canada:[
   ['Motorcycle voices: Canadian riding publications','/anybike-global.html#voices']
  ],
  'new-zealand':[
   ['Motorcycle voices: New Zealand motorcycle reporting','/anybike-global.html#voices']
  ],
  'south-africa':[
   ['Motorcycle voices: South African riding culture','/anybike-global.html#voices']
  ],
  france:[
   ['Motorcycle reviews and comparisons','/anybike-global.html#features']
  ],
  spain:[
   ['Works riders and motorcycle racing stories','/anybike-global.html#racing-legends']
  ]
 };
 const anchor=(label,url)=>{
  const a=document.createElement('a');
  a.href=url;a.textContent=label+' →';
  a.style.cssText='display:inline-flex;align-items:center;min-height:40px;padding:9px 13px;border:1px solid #555;border-radius:8px;background:#242424;color:#fff;text-decoration:none;font-size:14px;font-weight:700';
  return a;
 };
 function mount(){
  const root=document.querySelector('main');
  if(!root||root.querySelector('[data-anybike-global-market-research]'))return;
  const country=(document.documentElement.dataset.country||
   document.querySelector('.country-line strong,.country strong')?.textContent||
   slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())).trim();
  const block=document.createElement('section');
  block.dataset.anybikeGlobalMarketResearch='true';
  block.id='global-motorcycle-research';
  block.style.cssText='max-width:1240px;width:92%;margin:28px auto 54px;padding:22px;border:1px solid #393939;border-left:3px solid #ed1c24;border-radius:12px;background:#151515;color:#fff';
  const h=document.createElement('h2');h.textContent='Motorcycle research and international perspectives';
  h.style.cssText='margin:0 0 9px;font-size:clamp(23px,3vw,30px);color:#fff';
  const p=document.createElement('p');
  p.textContent='Explore manufacturer history, motorcycle design and model guides while researching UK motorcycle sourcing'+(country?' for '+country:'')+'. Articles do not confirm local import eligibility, stock availability or delivery arrangements.';
  p.style.cssText='margin:0 0 18px;color:#ddd;line-height:1.5';
  const nav=document.createElement('nav');
  nav.setAttribute('aria-label','AnyBike Global motorcycle research and model links');
  nav.style.cssText='display:flex;flex-wrap:wrap;gap:10px';
  const entries=[
   ...(stories[slug]||[]),
   ['AnyBike Global: all motorcycle stories','/anybike-global.html'],
   ['Browse motorcycle manufacturers','/motorcycle-manufacturers.html']
  ];
  const seen=new Set();
  for(const [label,url] of entries){
   if(seen.has(url))continue;seen.add(url);
   if(!/^\/[a-z0-9/?=&.#%-]+$/i.test(url))continue;
   nav.appendChild(anchor(label,url));
  }
  block.append(h,p,nav);
  root.appendChild(block);
 }
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})();
