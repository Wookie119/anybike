import {api, headers} from '../model-template/riding-style.mjs';

const registryPath = '/data/universal-v2-model-routes.json';
const modelPath = /^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/;
let registryRequest;

const strings = {
  en: {
    title: 'Find a motorcycle', prompt: 'Search by make or model', search: 'Search', loading: 'Searching motorcycle guides…',
    empty: 'No model guides match. Try a make or model name.', failed: 'Search is temporarily unavailable.',
    browse: 'Browse all motorcycle guides', popular: market => 'Popular motorcycles in ' + market,
    suggested: market => 'Motorcycle guides for ' + market,
    demand: 'Based on recent searches on this market page.', results: 'Matching motorcycle guides'
  },
  fr: {
    title: 'Trouver une moto', prompt: 'Rechercher par marque ou modèle', search: 'Rechercher', loading: 'Recherche des guides moto…',
    empty: 'Aucun guide ne correspond. Essayez une marque ou un modèle.', failed: 'La recherche est momentanément indisponible.',
    browse: 'Voir tous les guides moto', popular: market => 'Motos populaires · ' + market,
    suggested: market => 'Guides moto · ' + market,
    demand: 'D’après les recherches récentes sur cette page de marché.', results: 'Guides moto correspondants'
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
  } catch { /* The reviewed model guides stay available if signal data is unavailable. */ }
}
