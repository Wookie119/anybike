import {api, headers} from '../model-template/riding-style.mjs';

import {stockForCanonicalModel} from '../model-template/canonical-public-stock-identity.mjs';

const publishedStock = new URL('/functions/v1/international-public-stock', api).href;
const registryPath = '/data/universal-v2-model-routes.json';
const modelPath = /^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/;
let registryRequest;

const strings = {
  en: {
    title: 'Find a motorcycle', prompt: 'Search by make or model', search: 'Search', loading: 'Searching motorcycle guides…',
    empty: 'No model guides match. Try a make or model name.', failed: 'Search is temporarily unavailable.',
    browse: 'Browse all motorcycle guides', popular: market => 'Popular motorcycles in ' + market,
    suggested: market => 'Motorcycle guides for ' + market,
    demand: 'Based on recent searches on this market page.', stock: 'Matching Available Stock', stockEmpty: 'No matching motorcycles in Available Stock at the moment.', stockUnavailable: 'Matching stock is temporarily unavailable.', results: 'Matching motorcycle guides'
  },
  fr: {
    title: 'Trouver une moto', prompt: 'Rechercher par marque ou modèle', search: 'Rechercher', loading: 'Recherche des guides moto…',
    empty: 'Aucun guide ne correspond. Essayez une marque ou un modèle.', failed: 'La recherche est momentanément indisponible.',
    browse: 'Voir tous les guides moto', popular: market => 'Motos populaires · ' + market,
    suggested: market => 'Guides moto · ' + market,
    demand: 'D’après les recherches récentes sur cette page de marché.', stock: 'Motos disponibles correspondant aux recherches', stockEmpty: 'Aucune moto disponible ne correspond pour le moment.', stockUnavailable: 'Le stock correspondant est momentanément indisponible.', results: 'Guides moto correspondants'
  }
};

const normalize = value => value.normalize('NFKD').toLowerCase().replace(/\p{M}/gu,'').replace(/[^a-z0-9]+/g,' ').trim();

export function findCountryModels(models, query) {
  const terms = normalize(query).split(' ').filter(Boolean);
  if (!terms.length) return {exact: [], matches: []};
  const phrase = terms.join('');
  const exact = [];
  const partial = [];
  for (const row of models) {
    const full = normalize(row.make + ' ' + row.model);
    const model = normalize(row.model);
    if (full.replaceAll(' ','') === phrase || model.replaceAll(' ','') === phrase) exact.push(row);
    else if (terms.every(term => full.includes(term)) || full.replaceAll(' ','').includes(phrase)) partial.push(row);
  }
  return {exact, matches: [...exact,...partial].slice(0,8)};
}

async function models() {
  registryRequest ??= fetch(registryPath,{signal:AbortSignal.timeout(9000)})
    .then(response => {
      if (!response.ok) throw Error('Model catalogue unavailable');
      return response.json();
    }).then(({models}) => models.filter(row => Number.isSafeInteger(row.model_id) && modelPath.test(row.url)))
    .catch(error => { registryRequest = undefined; throw error; });
  return registryRequest;
}

function record(market, id) {
  const key = 'anybike-country-search:' + market + ':' + id;
  const hour = String(Math.floor(Date.now()/3600000));
  try {
    if (sessionStorage.getItem(key) === hour) return;
  } catch { /* The database also deduplicates. */ }
  fetch(api+'rpc/record_anybike_country_model_search_v1',{
    method:'POST', headers:{...headers,'Content-Type':'application/json'},
    body:JSON.stringify({p_market:market,p_model_id:id}), keepalive:true
  }).then(response => {
    if (response.ok) sessionStorage.setItem(key,hour);
  }).catch(() => {});
}

function node(tag, text) {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  return el;
}

function guideList(rows, onClick) {
  const list = node('ul');
  list.className = 'country-model-links';
  for (const row of rows) {
    const item = node('li');
    const anchor = node('a',row.make + ' ' + row.model);
    anchor.href = row.url;
    if (onClick) anchor.addEventListener('click',() => onClick(row.model_id));
    item.append(anchor);
    list.append(item);
  }
  return list;
}

export function countryModelSearch(data) {
  const copy = strings[data.locale] || strings.en;
  const wrap = node('section');
  wrap.className = 'wrap country-model-search';
  const heading = node('h2',copy.title);
  heading.id = 'country-model-search-heading';
  wrap.setAttribute('aria-labelledby',heading.id);
  const label = node('label',copy.prompt);
  label.htmlFor = 'country-model-query';
  const search = node('input');
  search.type = 'search';
  search.id = label.htmlFor;
  search.required = true;
  search.maxLength = 80;
  const button = node('button',copy.search);
  button.className = 'btn btn-primary';
  const form = node('form');
  const row = node('div');
  row.append(search,button);
  form.append(label,row);
  const status = node('p');
  status.setAttribute('role','status');
  const results = node('div');
  results.setAttribute('aria-label',copy.results);
  const browse = node('a',copy.browse);
  browse.href = '/motorcycle-models.html';
  wrap.append(heading,form,status,results,browse);
  let request = 0;
  form.addEventListener('submit',async event => {
    event.preventDefault();
    const current = ++request;
    const query = search.value.trim();
    results.replaceChildren();
    if (!query) { status.textContent = copy.empty; return; }
    status.textContent = copy.loading;
    try {
      const {exact,matches} = findCountryModels(await models(),query);
      if (current !== request) return;
      const ids = new Set(exact.map(row => row.model_id));
      const unique = ids.size === 1 ? [...ids][0] : null;
      if (unique) record(data.slug,unique);
      if (matches.length) results.append(guideList(matches,id => { if (id !== unique) record(data.slug,id); }));
      status.textContent = matches.length ? copy.results + ' (' + matches.length + ')' : copy.empty;
    } catch {
      if (current === request) status.textContent = copy.failed;
    }
  });
  return wrap;
}

export function stockForPopularModels(items, rankedModels) {
  const matches = new Map();
  for (const model of rankedModels) {
    const identity = {catalog_model_id:model.model_id, manufacturer_name:model.make, model_name:model.model};
    for (const item of stockForCanonicalModel(items,identity,3)) {
      matches.set(String(item.item_id),item);
    }
  }
  return [...matches.values()].slice(0,8);
}

async function addMatchingStock(section, models, copy, locale) {
  const heading = node('h3',copy.stock);
  const holder = node('div');
  section.append(heading,holder);
  try {
    // Reuse the visitor-facing feed so country pages apply the same public access rules.
    const response = await fetch(publishedStock,{
      signal:AbortSignal.timeout(9000),credentials:'omit',cache:'no-store'
    });
    const payload = response.ok ? await response.json() : null;
    if (!Array.isArray(payload?.items)) throw Error('Published stock unavailable');
    const matches = stockForPopularModels(payload.items,models);
    if (!matches.length) { holder.append(node('p',copy.stockEmpty)); return; }
    holder.className = 'stock-grid';
    const gbp = new Intl.NumberFormat(locale,{style:'currency',currency:'GBP'});
    for (const item of matches) {
      const card = node('a');
      card.className = 'stock-card';
      card.href = '/international-vq-motorcycle.html?id=' + encodeURIComponent(item.item_id);
      const name = [item.make,item.model,item.year].filter(Boolean).join(' · ');
      const photo = node('img');
      photo.alt = name;
      photo.loading = 'lazy';
      photo.src = '/anybike-image-coming-soon.png';
      try {
        const url = new URL(item.image_url);
        if (url.protocol === 'https:' && !url.username && !url.password) photo.src = url.href;
      } catch { /* Keep the existing image placeholder. */ }
      photo.addEventListener('error',() => { photo.src = '/anybike-image-coming-soon.png'; },{once:true});
      const body = node('div');
      body.className = 'stock-copy';
      body.append(node('h4',name));
      if (Number.isFinite(Number(item.price)) && Number(item.price)>0) body.append(node('p',gbp.format(item.price)));
      card.append(photo,body);
      holder.append(card);
    }
  } catch { holder.append(node('p',copy.stockUnavailable)); }
}

export async function loadPopularModels(main, data) {
  const copy = strings[data.locale] || strings.en;
  const existing = main.querySelector('[data-country-section="model_guides"] .section-head h2');
  if (existing && /popular/i.test(existing.textContent)) existing.textContent = copy.suggested(data.market);
  try {
    const response = await fetch(api+'rpc/public_anybike_country_popular_models_v1?' + new URLSearchParams({p_market:data.slug}),
      {headers,signal:AbortSignal.timeout(9000)});
    if (!response.ok) return;
    const ranked = await response.json();
    if (!ranked.length) return;
    const index = new Map((await models()).map(row => [row.model_id,row]));
    const rows = ranked.map(row => index.get(Number(row.model_id))).filter(Boolean);
    const anchor = main.querySelector('.country-model-search');
    if (!anchor || !rows.length || main.querySelector('.country-popular-models')) return;
    const section = node('section');
    section.className = 'wrap country-popular-models';
    section.append(node('h2',copy.popular(data.market)),node('p',copy.demand),guideList(rows));
    anchor.after(section);
    await addMatchingStock(section, rows, copy, data.locale);
  } catch { /* The reviewed model guides stay available if signal data is unavailable. */ }
}
