let marketDays=30;
let marketSort="engaged";
let marketPerformanceRows=[];
let marketPersonalisationFilter="all";
let marketPersonalisationRows=[];

function miEsc(v){
  return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function miNum(v){return Number(v||0).toLocaleString("en-GB");}
function miSeconds(v){
  const n=Number(v||0);
  if(n<60)return Math.round(n)+"s";
  return Math.floor(n/60)+"m "+Math.round(n%60)+"s";
}
function miMarketName(slug){
  return String(slug||"").split("-").filter(Boolean).map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(" ");
}
function miEngagement(seconds,views,visitors){
  const active=Number(seconds||0);
  const repeat=Number(visitors||0)>0 ? Number(views||0)/Number(visitors||0) : 0;
  if(active>=90 || (active>=45 && repeat>=2)) return {label:"Strong",cls:"strong"};
  if(active>=30 || (active>=18 && repeat>=2)) return {label:"Engaged",cls:"engaged"};
  if(active>=10) return {label:"Light",cls:"light"};
  return {label:"Brief",cls:"brief"};
}

function miSortMarkets(rows){
  const list=[...(rows||[])];
  const n=v=>Number(v||0);
  const alpha=(a,b)=>miMarketName(a.market_slug).localeCompare(miMarketName(b.market_slug),"en",{sensitivity:"base"});

  if(marketSort==="views"){
    return list.sort((a,b)=>n(b.page_views)-n(a.page_views) || n(b.unique_visitors)-n(a.unique_visitors) || alpha(a,b));
  }
  if(marketSort==="enquiries"){
    return list.sort((a,b)=>n(b.enquiries)-n(a.enquiries) || n(b.linked_deals)-n(a.linked_deals) || n(b.unique_visitors)-n(a.unique_visitors) || alpha(a,b));
  }
  if(marketSort==="deals"){
    return list.sort((a,b)=>n(b.linked_deals)-n(a.linked_deals) || n(b.enquiries)-n(a.enquiries) || n(b.unique_visitors)-n(a.unique_visitors) || alpha(a,b));
  }
  if(marketSort==="alpha"){
    return list.sort(alpha);
  }

  // Default: commercially useful engagement first, then depth of genuine traffic.
  return list.sort((a,b)=>
    n(b.linked_deals)-n(a.linked_deals) ||
    n(b.enquiries)-n(a.enquiries) ||
    n(b.known_users)-n(a.known_users) ||
    n(b.avg_active_seconds)-n(a.avg_active_seconds) ||
    n(b.unique_visitors)-n(a.unique_visitors) ||
    n(b.page_views)-n(a.page_views) ||
    alpha(a,b)
  );
}

function renderMarketPerformance(){
  const body=document.getElementById("marketRows");
  if(!body)return;
  const rows=miSortMarkets(marketPerformanceRows);

  body.innerHTML=rows.length?rows.map(r=>{
    const views=Number(r.page_views||0);
    const leads=Number(r.enquiries||0);
    const deals=Number(r.linked_deals||0);
    const visitors=Number(r.unique_visitors||0);
    const rate=views>0?(leads/views*100):0;
    const engagement=miEngagement(r.avg_active_seconds,views,visitors);
    const viewsPerVisitor=visitors>0?(views/visitors):0;
    return '<tr>'+
      '<td data-label="Market"><div class="market-name">'+miEsc(miMarketName(r.market_slug))+'</div><div class="market-title" title="'+miEsc(r.page_title||"")+'">'+miEsc(r.page_title||"")+'</div></td>'+
      '<td data-label="Views" class="num">'+miNum(views)+'</td>'+
      '<td data-label="Visitors" class="num">'+miNum(r.unique_visitors)+'</td>'+
      '<td data-label="Known users" class="num">'+miNum(r.known_users)+'</td>'+
      '<td data-label="Engagement"><span class="engagement '+engagement.cls+'">'+engagement.label+'</span><span class="engagement-detail">'+miSeconds(r.avg_active_seconds)+' avg · '+viewsPerVisitor.toFixed(1)+' views/visitor</span></td>'+
      '<td data-label="Enquiries" class="num '+(leads?"good":"zero")+'">'+miNum(leads)+'</td>'+
      '<td data-label="Deals" class="num '+(deals?"good":"zero")+'">'+miNum(deals)+'</td>'+
      '<td data-label="Lead rate"><strong>'+rate.toFixed(1)+'%</strong><div class="bar"><span style="width:'+Math.min(100,rate*10)+'%"></span></div></td>'+
      '<td data-label="Page"><a href="/markets/'+miEsc(miMarketSlug(r.market_slug))+'.html" target="_blank" rel="noopener" style="color:#ed1c24;font-weight:900">Open ↗</a></td>'+
    '</tr>';
  }).join(""):'<tr><td colspan="9" class="empty">No market activity recorded in this period.</td></tr>';
}

function setMarketSort(value){
  marketSort=String(value||"engaged");
  renderMarketPerformance();
}

async function loadMarketIntelligence(){
  const body=document.getElementById("marketRows");
  const discovery=document.getElementById("discoveryRows");
  if(!body)return;

  body.innerHTML='<tr><td colspan="9" class="empty">Loading market intelligence…</td></tr>';

  const client=getAdminSupabaseClient();
  if(!client){
    body.innerHTML='<tr><td colspan="9" class="empty">Admin data connection is unavailable.</td></tr>';
    return;
  }

  try{
    const {data,error}=await client.functions.invoke("admin-market-intelligence",{body:{days:marketDays}});
    if(error)throw error;
    if(!data?.ok)throw new Error(data?.detail||data?.error||"Could not load market intelligence");

    const rows=Array.isArray(data.markets)?data.markets:[];
    const totals=rows.reduce((a,r)=>({
      views:a.views+Number(r.page_views||0),
      visitors:a.visitors+Number(r.unique_visitors||0),
      leads:a.leads+Number(r.enquiries||0),
      deals:a.deals+Number(r.linked_deals||0)
    }),{views:0,visitors:0,leads:0,deals:0});

    document.getElementById("kpiViews").textContent=miNum(totals.views);
    document.getElementById("kpiVisitors").textContent=miNum(totals.visitors);
    document.getElementById("kpiLeads").textContent=miNum(totals.leads);
    document.getElementById("kpiDeals").textContent=miNum(totals.deals);
    document.getElementById("kpiMarkets").textContent=miNum(rows.length);
    const coverage=Number(data?.attribution?.coverage_percent);
    document.getElementById("kpiCoverage").textContent=Number.isFinite(coverage)?coverage.toFixed(1)+"%":"—";

    marketPerformanceRows=rows;
    renderMarketPerformance();

    const d=Array.isArray(data.discovery)?data.discovery:[];
    if(discovery){
      discovery.innerHTML=d.length?d.slice(0,40).map(r=>{
        const market=miMarketName(r.market_slug)||r.country||"Unknown market";
        return '<div class="source-card"><strong>'+miEsc(r.source_name)+'</strong><small>'+miEsc(market)+' · '+miEsc(r.channel_type||"Other")+'</small><div class="count">'+miNum(r.mentions)+' mention'+(Number(r.mentions)===1?"":"s")+'</div></div>';
      }).join(""):'<div class="empty">No buyer-discovery answers yet. They will appear here as customers answer the optional post-enquiry question.</div>';
    }
  }catch(err){
    console.error("Market Intelligence load failed",err);
    body.innerHTML='<tr><td colspan="9" class="empty">Could not load market intelligence: '+miEsc(err?.message||"Unknown error")+'</td></tr>';
  }
}


function miMarketSlug(country){
  const key=String(country||"").trim().toLowerCase();
  const aliases={
    "united states":"usa",
    "united kingdom":"united-kingdom",
    "united arab emirates":"uae",
    "turkey":"turkiye",
    "réunion":"reunion",
    "réunion island":"reunion",
    "reunion island":"reunion",
    "ivory coast":"ivory-coast"
  };
  if(aliases[key])return aliases[key];
  return key.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function miDate(v){
  if(!v)return "—";
  try{return new Date(v).toLocaleString("en-GB");}catch(e){return "—";}
}
function renderMarketPersonalisation(){
  const body=document.getElementById("personalisationRows");
  if(!body)return;
  const rows=marketPersonalisationRows.filter(r=>{
    if(marketPersonalisationFilter==="guest")return Number(r.guest_events||0)>0;
    if(marketPersonalisationFilter==="search")return Number(r.search_events||0)>0;
    return Number(r.viewed_bikes||0)>0 || Number(r.search_events||0)>0;
  });
  body.innerHTML=rows.length?rows.map(r=>{
    const country=r.country||"Unknown";
    const bikes=Array.isArray(r.bikes)?r.bikes.slice(0,8):[];
    const searches=Array.isArray(r.searches)?r.searches.slice(0,8):[];
    const bikeChips=bikes.map(b=>'<span class="signal-chip">'+miEsc([b.year,b.make,b.model].filter(Boolean).join(" "))+'</span>').join("");
    const searchChips=searches.map(s=>'<span class="signal-chip">'+miEsc([s.make,s.model].filter(Boolean).join(" ")||"Filtered stock search")+(Number(s.events||0)>1?" ×"+miNum(s.events):"")+'</span>').join("");
    const reason='<div class="market-signal-detail">'+
      (bikeChips?'<strong>Viewed motorcycles</strong><br>'+bikeChips:"")+
      (searchChips?'<div style="margin-top:8px"><strong>Search signals</strong><br>'+searchChips+'</div>':"")+
      '</div>';
    const guest=Number(r.guest_events||0)>0;
    const searched=Number(r.search_events||0)>0;
    const status=guest
      ? '<span class="personalisation-badge guest">Guest-driven</span>'
      : '<span class="personalisation-badge live">Known-user activity</span>';
    return '<tr class="personalisation-row">'+
      '<td data-label="Market"><div class="market-name">'+miEsc(country)+'</div></td>'+
      '<td data-label="Status">'+status+(searched?'<div style="margin-top:6px"><span class="personalisation-badge live">Search influenced</span></div>':"")+'</td>'+
      '<td data-label="Viewed bikes" class="num">'+miNum(r.viewed_bikes)+'</td>'+
      '<td data-label="Guest signals" class="num '+(guest?"good":"zero")+'">'+miNum(r.guest_events)+'</td>'+
      '<td data-label="Search signals" class="num '+(searched?"good":"zero")+'">'+miNum(r.search_events)+'</td>'+
      '<td data-label="Last activity">'+miEsc(miDate(r.last_activity_at))+'</td>'+
      '<td data-label="Why / bikes"><details><summary>Show signals</summary>'+reason+'</details></td>'+
      '<td data-label="Page"><a href="/markets/'+miEsc(miMarketSlug(country))+'.html" target="_blank" rel="noopener" style="color:#ed1c24;font-weight:900">Open ↗</a></td>'+
    '</tr>';
  }).join(""):'<tr><td colspan="8" class="empty">No personalised market activity recorded in this period.</td></tr>';
}
async function loadMarketPersonalisation(){
  const body=document.getElementById("personalisationRows");
  if(!body)return;
  const client=getAdminSupabaseClient();
  if(!client)return;
  try{
    const {data,error}=await client.rpc("admin_get_market_personalisation_v1",{p_days:marketDays});
    if(error)throw error;
    marketPersonalisationRows=Array.isArray(data?.markets)?data.markets:[];
    renderMarketPersonalisation();
  }catch(err){
    console.error("Market personalisation load failed",err);
    body.innerHTML='<tr><td colspan="8" class="empty">Could not load live market personalisation: '+miEsc(err?.message||"Unknown error")+'</td></tr>';
  }
}
function bindMarketPersonalisationFilters(){
  const wrap=document.getElementById("personalisationFilters");
  if(!wrap)return;
  wrap.addEventListener("click",event=>{
    const btn=event.target.closest("[data-personalisation-filter]");
    if(!btn)return;
    marketPersonalisationFilter=btn.dataset.personalisationFilter||"all";
    wrap.querySelectorAll("[data-personalisation-filter]").forEach(x=>x.classList.toggle("active",x===btn));
    renderMarketPersonalisation();
  });
}

function bindMarketRangeButtons(){
  const wrap=document.getElementById("rangeButtons");
  if(!wrap)return;
  wrap.addEventListener("click",event=>{
    const btn=event.target.closest("[data-days]");
    if(!btn)return;
    marketDays=Number(btn.dataset.days)||30;
    wrap.querySelectorAll("[data-days]").forEach(x=>x.classList.toggle("active",x===btn));
    loadMarketIntelligence();
    loadMarketPersonalisation();
  });
}

(async function startMarketIntelligence(){
  const allowed=await requireAdminSession();
  if(!allowed)return;
  document.documentElement.classList.remove("admin-auth-pending");
  bindMarketRangeButtons();
  bindMarketPersonalisationFilters();
  await Promise.all([loadMarketIntelligence(),loadMarketPersonalisation()]);
})();