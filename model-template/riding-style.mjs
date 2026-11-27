const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modelPath = /^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/;
const storyPath = /^(?:\/global\/[a-z0-9-]+\.html|\/anybike-global\.html#[a-z0-9-]+)$/;
const isExternal = value => typeof value === 'string' && value.startsWith('https://');

export function brandMark(make, logos) {
  const mark = logos[make] || {};
  if (!isExternal(mark.image)) return '';
  return '<span class="type-brand-mark'+(mark.background === 'dark' ? ' on-dark' : '')+'"><img alt="" loading="lazy" decoding="async" src="'+escape(mark.image)+'"></span>';
}

const makePath = make => ({
  BMW:'/bmw-motorcycles.html', 'Harley-Davidson':'/harley-davidson-motorcycles.html', 'Indian Motorcycle':'/indian-motorcycles.html'
}[make] || '/motorcycle-brand.html?make='+encodeURIComponent(make));
const guideLink = model => '<a href="'+escape(model.url)+'">'+escape(model.model)+'</a>';

function illustration(story) {
  const photo = /^\/assets\/global\/[a-z0-9-]+\.webp$/.test(story.src) || /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[a-zA-Z0-9_./%-]+\.jpg$/.test(story.src);
  if (!photo || !isExternal(story.source) || !isExternal(story.licenceUrl)) return '';
  return '<figure><a href="'+escape(story.url)+'" tabindex="-1" aria-hidden="true"><img src="'+escape(story.src)+'" alt="'+escape(story.alt)+'" loading="lazy" decoding="async"></a>'+
    '<figcaption><details><summary>Photo · '+escape(story.credit)+'</summary>'+escape(story.caption)+' · <a href="'+escape(story.source)+'">'+escape(story.credit)+'</a> · <a href="'+escape(story.licenceUrl)+'">'+escape(story.licence)+'</a> · '+escape(story.change)+'</details></figcaption></figure>';
}

export function storiesMarkup(stories) {
  const articles = stories.filter(s => storyPath.test(s.url));
  const cards = articles.map((story,i) => '<article class="global-preview-card'+(!i?' global-preview-lead':'')+'">'+illustration(story)+
    '<div class="global-preview-copy"><p class="global-preview-tag">'+escape(story.tag)+'</p><h3><a href="'+escape(story.url)+'">'+escape(story.title)+'</a></h3><p>'+escape(story.summary)+'</p></div></article>').join('');
  return '<div class="global-preview-heading"><h2>AnyBike <span>Global</span></h2><a href="/anybike-global.html">Explore all stories →</a></div><div class="global-preview-grid">'+cards+'</div>';
}

export function catalogue(data, registry) {
  const paths = new Map(registry.models.filter(r => modelPath.test(r.url)).map(r => [r.model_id,r.url]));
  return data.filter(m => paths.has(m.model_id)).map(m => ({...m,url:paths.get(m.model_id)}));
}

export function pageSections(page, models) {
  const groups = new Map();
  for (const model of models.filter(m => page.categories.includes(m.category))) {
    if (!groups.has(model.make)) groups.set(model.make,[]);
    groups.get(model.make).push(model);
  }
  const cards = [...groups].map(([make, bikes]) => {
    const items = bikes.map(b => '<li>'+guideLink(b)+'</li>');
    const extra = items.length > 5 ? '<details><summary>More '+escape(make)+' models ('+(items.length-5)+')</summary><ul>'+items.slice(5).join('')+'</ul></details>' : '';
    return '<article class="card type-make-card"><h3><a href="'+escape(makePath(make))+'">'+brandMark(make,page.logos)+escape(make)+'</a></h3><ul>'+items.slice(0,5).join('')+'</ul>'+extra+'</article>';
  }).join('');
  const byId = new Map(models.map(m=>[m.model_id,m]));
  const featured = page.featured.map(id=>byId.get(id)).filter(Boolean).map(m =>
    '<article class="card"><h3 class="type-feature-heading">'+brandMark(m.make,page.logos)+'<a href="'+escape(m.url)+'">'+escape(m.make+' '+m.model)+'</a></h3></article>').join('');
  const considerations = page.consider.map(([heading,copy])=>'<article class="card"><h3>'+escape(heading)+'</h3><p>'+escape(copy)+'</p></article>').join('');
  const related = page.related.filter(s=>/^[a-z-]+$/.test(s) && page.relatedNames[s]).map(s=>'<a href="/motorcycle-type-'+s+'.html">'+escape(page.relatedNames[s])+'</a>').join(' · ');
  return {models:cards,editorial:'<section class="section"><h2>About this motorcycle type</h2><p class="lead">'+escape(page.intro)+'</p></section>'+
    '<section class="section"><h2>Featured motorcycles to explore</h2><div class="grid">'+featured+'</div></section>'+
    '<section class="section"><h2>What to consider before choosing</h2><div class="grid">'+considerations+'</div></section>'+
    '<section class="section"><h2>Related motorcycle types</h2><p>'+related+'</p></section>'};
}

export const api = 'https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/';
export const headers = {apikey:'sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK'};
async function get(url, extra={}) {
  const r=await fetch(url,{...extra,signal:AbortSignal.timeout(9000)});
  if(!r.ok) throw Error('Riding style data unavailable');
  return r.json();
}
const requests = new Map();
export function getStyle(slug) {
  if (!requests.has(slug)) requests.set(slug,get(api+'rpc/public_anybike_riding_style_v1?p_slug='+encodeURIComponent(slug),{headers}));
  return requests.get(slug);
}
async function refresh(main) {
  const slug=main.dataset.ridingStyle;
  const page=await getStyle(slug);
  if(!page) return;
  main.querySelector('[data-global-preview]').innerHTML=storiesMarkup(page.stories);
  if(slug==='directory') return;
  main.querySelector('h1').textContent=page.title;
  main.querySelector('h1 + p').textContent=page.lead;
  const [index,routes]=await Promise.all([get(api+'rpc/public_anybike_universal_model_index_v1',{headers}),get('/data/universal-v2-model-routes.json')]);
  const sections=pageSections(page,catalogue(index,routes));
  main.querySelector('#typeEditorial').innerHTML=sections.editorial;
  main.querySelector('#typeModels').innerHTML=sections.models;
}
if(typeof document!=='undefined'){
  const main=document.querySelector('main[data-riding-style]');
  if(main) main.addEventListener('error', event => {
    const badge=event.target.closest?.('.type-brand-mark');
    if(badge) badge.hidden=true;
  },true);
  if(main)refresh(main).catch(()=>{/* The last published HTML is already displayed. */});
}
