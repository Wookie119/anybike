import {api, headers} from './riding-style.mjs';

const path = location.pathname;
const localLink = /^\/[\w/-]+\.html(?:#[\w-]+)?$/;
const locale = () => (localStorage.getItem('anybikeLanguage') || document.documentElement.lang || 'en').split('-')[0];
const mark = (el, kind) => { el.dataset.catalogueContent = kind; return el; };

function relatedLink(reference, url, label, kind) {
  if (!reference || !localLink.test(url)) return;
  let link = reference.parentElement.querySelector('[data-catalogue-content="'+kind+'"]');
  if (!link) {
    link = mark(document.createElement('a'),kind);
    link.className = reference.className;
    link.style.cssText = reference.style.cssText;
    reference.after(document.createTextNode(' '),link);
  }
  link.href = url;
  link.textContent = label;
}

async function mount() {
  const response = await fetch(api+'rpc/public_catalogue_page_content_v1?p_path='+encodeURIComponent(path),{headers});
  if (!response.ok) return;
  const rows = await response.json();
  if (!rows.length) return;
  let routes;
  if (rows.some(row=>row.kind==='guide')) {
    const response = await fetch('/data/universal-v2-model-routes.json');
    if (!response.ok) return;
    routes = (await response.json()).models;
  }
  function render() {
    const main = document.querySelector('main');
    if (!main) return;
    for (const row of rows) {
      const label = row.labels?.[locale()] || row.labels?.en;
      if (row.kind==='history' && label && row.source?.startsWith('https://')) {
        const source = main.querySelector('.split .story a[href*="100-years-bmw-motorrad"], .split .story a[data-catalogue-source]');
        const paragraph = source?.closest('.story')?.querySelector('p');
        if (paragraph) {
          mark(paragraph,'history').textContent = label;
          source.href = row.source;
          source.dataset.catalogueSource = 'true';
        }
      }
      if (row.kind==='guide') {
        const guide = routes.find(item=>item.model_id===row.model_id);
        if (guide) relatedLink(main.querySelector('#harley-racing-custom-history a[href="/models/harley-davidson/v-rod.html"]'),guide.url,row.model,row.kind);
      }
      if (row.kind==='label' && label) relatedLink(main.querySelector('nav a[href="/motorcycle-manufacturers.html"]'),row.path,label,row.kind);
      if (row.kind==='market_story') relatedLink(main.querySelector('#global-motorcycle-research nav a'),row.path,row.headline,row.kind);
    }
  }
  render();
  window.addEventListener('anybikeLanguageChanged',render);
  window.addEventListener('anybikePublicHeaderReady',render);
  window.addEventListener('anybikeMarketEditorialReady',render);
}
mount().catch(()=>{/* Existing published content remains available during outages. */});
