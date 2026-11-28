import {countryCopy} from './country-copy.mjs';
import {countryPrice} from './country-preferences.mjs';
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
    demand: 'Based on recent searches on this market page.', stock: 'Matching Available Stock', generalEmpty: 'No published motorcycles are currently available.', stockEmpty: 'No matching motorcycles in Available Stock at the moment.', stockUnavailable: 'Matching stock is temporarily unavailable.', results: 'Matching motorcycle guides'
  },
  fr: {
    title: 'Trouver une moto', prompt: 'Rechercher par marque ou modèle', search: 'Rechercher', loading: 'Recherche des guides moto…',
    empty: 'Aucun guide ne correspond. Essayez une marque ou un modèle.', failed: 'La recherche est momentanément indisponible.',
    browse: 'Voir tous les guides moto', popular: market => 'Motos populaires · ' + market,
    suggested: market => 'Guides moto · ' + market,
    demand: 'D’après les recherches récentes sur cette page de marché.', stock: 'Motos disponibles correspondant aux recherches', generalEmpty: 'Aucune moto publiée n’est disponible actuellement.', stockEmpty: 'Aucune moto disponible ne correspond pour le moment.', stockUnavailable: 'Le stock correspondant est momentanément indisponible.', results: 'Guides moto correspondants'
  },
  sv: {
    title: 'Hitta en motorcykel', prompt: 'Sök på märke eller modell', search: 'Sök', loading: 'Söker efter modellguider…',
    empty: 'Inga modeller matchar sökningen.', failed: 'Sökningen är tillfälligt otillgänglig.',
    browse: 'Alla modellguider', popular: market => 'Populära motorcyklar i ' + market,
    suggested: market => 'Modellguider för ' + market,
    demand: 'Baserat på de senaste sökningarna på den här marknadssidan.', stock: 'Matchande motorcyklar i lager',
    generalEmpty: 'Inga publicerade motorcyklar i lager just nu.', stockEmpty: 'Inga matchande motorcyklar i lager just nu.',
    stockUnavailable: 'Lagret är tillfälligt otillgängligt.', results: 'Matchande modellguider'
  }
};

function searchCopy(data) {
  const fallback = strings[data.locale] || strings.en;
  if (!data.ui) return fallback;
  const translate = countryCopy(data);
  return {
    ...Object.fromEntries(Object.entries(strings.en)
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [key, data.ui[value] ? translate(value) : fallback[key]])),
    popular: market => data.ui['Popular motorcycles in ']
      ? translate('Popular motorcycles in ') + market : fallback.popular(market),
    suggested: market => data.ui['Motorcycle guides for ']
      ? translate('Motorcycle guides for ') + market : fallback.suggested(market)
  };
}

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

function searchActions(rows, onClick, translate) {
  const list = node('ul');
  list.className = 'country-search-results';
  const compare = node('a',translate('Compare selected', 'Comparer la sélection'));
  compare.className = 'btn btn-primary';
  compare.hidden = true;
  const choices = new Set();
  const hint = node('p',translate('Select 2–4 motorcycles to compare.', 'Sélectionnez 2 à 4 motos à comparer.'));
  const controls = [];
  function refresh() {
    for (const control of controls) control.disabled = choices.size >= 4 && !control.checked;
    compare.hidden = choices.size < 2;
    if (!compare.hidden) compare.href = '/compare-motorcycles.html?bikes=' + [...choices].join(',');
    else compare.removeAttribute('href');
  }
  for (const row of rows) {
    const name = row.make + ' ' + row.model;
    const item = node('li');
    item.append(node('h3',name));
    const actions = node('div');
    actions.className = 'country-pills country-search-actions';
    const guide = node('a',translate('View guide', 'Voir le guide'));
    guide.href = row.url;
    guide.setAttribute('aria-label',(translate('View guide for ', 'Voir le guide '))+name);
    const stock = node('a',translate('Find matching stock', 'Voir le stock correspondant'));
    stock.href = '/available-stock.html?' + new URLSearchParams({make:row.make,model:row.model});
    stock.setAttribute('aria-label',(translate('Find matching stock for ', 'Voir le stock pour '))+name);
    const label = node('label');
    label.className = 'country-compare-choice';
    const choose = node('input');
    choose.type = 'checkbox';
    choose.setAttribute('aria-label',(translate('Compare ', 'Comparer '))+name);
    choose.addEventListener('change',()=>{
      if (choose.checked) choices.add(row.model_id);
      else choices.delete(row.model_id);
      refresh();
    });
    controls.push(choose);
    label.append(choose,document.createTextNode(translate('Compare', 'Comparer')));
    for (const link of [guide,stock]) link.addEventListener('click',()=>onClick(row.model_id));
    actions.append(guide,stock,label);
    item.append(actions);
    list.append(item);
  }
  return {list, hint, compare};
}

export function countryModelSearch(data) {
  const copy = searchCopy(data);
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
  const summary = node('div');
  summary.className = 'country-search-summary';
  const compareControls = node('div');
  compareControls.className = 'country-search-compare';
  summary.append(status,compareControls);
  const results = node('div');
  results.setAttribute('aria-label',copy.results);
  const browse = node('a',copy.browse);
  browse.href = '/motorcycle-models.html';
  const translate = countryCopy(data);
  const navigation = node('nav');
  navigation.className = 'country-pills';
  const compare = node('a',translate('Compare Motorcycles', 'Comparer les motos'));
  compare.href = '/compare-motorcycles.html';
  const riding = node('a',translate('Browse by Riding Style', 'Parcourir par style'));
  riding.href = '/motorcycle-types.html';
  navigation.append(browse,compare,riding);
  wrap.append(heading,form,summary,results,navigation);
  let request = 0;
  form.addEventListener('submit',async event => {
    event.preventDefault();
    const current = ++request;
    const query = search.value.trim();
    results.replaceChildren();
    compareControls.replaceChildren();
    if (!query) { status.textContent = copy.empty; return; }
    status.textContent = copy.loading;
    try {
      const {exact,matches} = findCountryModels(await models(),query);
      if (current !== request) return;
      const ids = new Set(exact.map(row => row.model_id));
      const unique = ids.size === 1 ? [...ids][0] : null;
      if (unique) record(data.slug,unique);
      if (matches.length) {
        const {list, hint, compare} = searchActions(matches,id => {
          if (id !== unique) record(data.slug,id);
        },translate);
        results.append(list);
        compareControls.append(hint,compare);
      }
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

let countryStockRequest;
function fetchCountryStock() {
  countryStockRequest ??= fetch(publishedStock,{
    signal:AbortSignal.timeout(9000),credentials:'omit',cache:'no-store'
  }).then(async response => {
    const payload = response.ok ? await response.json() : null;
    if (!Array.isArray(payload?.items)) throw Error('Published stock unavailable');
    return payload.items.filter(item => item.publication_eligible === true && /^[1-9][0-9]*$/.test(String(item.item_id)));
  }).catch(error => { countryStockRequest = undefined; throw error; });
  return countryStockRequest;
}

function publishedStockCard(item, locale) {
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
  body.append(node('h3',name));
  if (Number.isFinite(Number(item.price)) && Number(item.price)>0) body.append(countryPrice(item.price,locale));
  card.append(photo,body);
  return card;
}

async function fillStock(holder, select, copy, locale, empty = copy.stockEmpty) {
  try {
    const rows = select(await fetchCountryStock());
    holder.replaceChildren(...(rows.length ? rows.map(item=>publishedStockCard(item,locale)) : [node('p',empty)]));
  } catch { holder.replaceChildren(node('p',copy.stockUnavailable)); }
}

export async function loadCountryAvailableStock(main, data, ranking) {
  const {locale} = data;
  const holder = main.querySelector('[data-country-section="available_stock"] .stock-grid');
  if (!holder) return;
  const copy = searchCopy(data);
  const models = await ranking;
  await fillStock(holder,items=>{
    const featured = new Set(stockForPopularModels(items,models).map(item=>String(item.item_id)));
    return items.filter(item=>!featured.has(String(item.item_id))).slice(0,4);
  },copy,locale,countryCopy(data)('Browse the full catalogue for more motorcycles.', 'Voir le catalogue complet via le lien.'));
}

async function addMatchingStock(section, models, copy, locale) {
  const holder = node('div');
  holder.className = 'stock-grid';
  section.append(node('h3',copy.stock),holder);
  await fillStock(holder,items=>stockForPopularModels(items,models),copy,locale);
}

export async function loadRankedCountryModels(market) {
  try {
    const response = await fetch(api+'rpc/public_anybike_country_popular_models_v1?' + new URLSearchParams({p_market:market}),
      {headers,signal:AbortSignal.timeout(9000)});
    if (!response.ok) return [];
    const ranked = await response.json();
    if (!Array.isArray(ranked) || !ranked.length) return [];
    const catalog = new Map((await models()).map(row => [row.model_id,row]));
    const ids = [...new Set(ranked.map(row=>Number(row?.model_id)))];
    return ids.map(id=>catalog.get(id)).filter(Boolean);
  } catch { return []; }
}

export async function loadPopularModels(main, data, ranking) {
  const copy = searchCopy(data);
  const anchor = main.querySelector('.country-model-search');
  const existing = main.querySelector('[data-country-section="model_guides"]');
  const heading = existing?.querySelector('.section-head h2');
  const intro = existing?.querySelector('.section-head p');
  if (heading && /popular/i.test(heading.textContent)) heading.textContent = copy.suggested(data.market);
  const rows = await ranking;
  if (!anchor?.isConnected || !rows.length || main.querySelector('.country-popular-models')) return;

  const grid = existing?.querySelector('.model-grid');
  if (grid) {
    if (heading) heading.textContent = copy.suggested(data.market);
    if (intro) intro.textContent = copy.demand;
    grid.replaceChildren(guideList(rows));
    grid.classList.add('country-ranked-guide-grid');
  }

  const section = node('section');
  section.className = 'wrap country-popular-models';
  section.append(node('h2',copy.popular(data.market)),node('p',copy.demand),guideList(rows));
  anchor.after(section);
  await addMatchingStock(section, rows, copy, data.locale);
}
