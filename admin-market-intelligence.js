let marketDays=30;

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
        '<td data-label="Page"><a href="'+miEsc(r.page_path||"#")+'" target="_blank" rel="noopener" style="color:#ed1c24;font-weight:900">Open ↗</a></td>'+
      '</tr>';
    }).join(""):'<tr><td colspan="9" class="empty">No market activity recorded in this period.</td></tr>';

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

function bindMarketRangeButtons(){
  const wrap=document.getElementById("rangeButtons");
  if(!wrap)return;
  wrap.addEventListener("click",event=>{
    const btn=event.target.closest("[data-days]");
    if(!btn)return;
    marketDays=Number(btn.dataset.days)||30;
    wrap.querySelectorAll("[data-days]").forEach(x=>x.classList.toggle("active",x===btn));
    loadMarketIntelligence();
  });
}

(async function startMarketIntelligence(){
  const allowed=await requireAdminSession();
  if(!allowed)return;
  document.documentElement.classList.remove("admin-auth-pending");
  bindMarketRangeButtons();
  await loadMarketIntelligence();
})();