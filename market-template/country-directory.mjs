import {countryCopy} from './country-copy.mjs';
import {api, headers} from '../model-template/riding-style.mjs';
import {groupDatabaseCountryRoutes} from '../model-template/public-country-market-navigation.mjs';

const marketRoute = /^\/markets\/[a-z0-9-]+\.html$/;
const makeRoute = /^\/(?:motorcycle-brand\.html\?make=[^&#]+|[a-z0-9-]+-motorcycles\.html)$/;
const modelRoute = /^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/;

function directoryNode(tag, text) {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  return el;
}

function pill(label, url) {
  const anchor = directoryNode('a',label);
  anchor.href = url;
  return anchor;
}

function pills(label, entries) {
  const nav = directoryNode('nav');
  nav.className = 'country-pills';
  nav.setAttribute('aria-label',label);
  for (const {label,url} of entries) nav.append(pill(label,url));
  return nav;
}

function directoryPanel(title) {
  const panel = directoryNode('section');
  panel.className = 'country-directory-panel';
  panel.append(directoryNode('h2',title));
  return panel;
}

function legacyLinks(section, pattern) {
  return [...(section?.querySelectorAll('a[href]') || [])].flatMap(anchor => {
    const url = anchor.getAttribute('href');
    const label = anchor.textContent.replace(/\s*→\s*$/,'').trim();
    return pattern.test(url) && label ? [{url,label}] : [];
  });
}

async function updateManufacturers(nav) {
  try {
    const response = await fetch('/motorcycle-manufacturers.html',{signal:AbortSignal.timeout(8500)});
    if (!response.ok) return;
    const directory = new DOMParser().parseFromString(await response.text(),'text/html');
    const brands = new Map();
    for (const anchor of directory.querySelectorAll('a.brand[href]')) {
      const url = anchor.getAttribute('href');
      const label = anchor.querySelector('strong')?.textContent.trim();
      if (label && makeRoute.test(url)) brands.set(label,{url,label});
    }
    if (brands.size) nav.replaceChildren(...[...brands.values()]
      .sort((a,b)=>a.label.localeCompare(b.label)).map(({label,url})=>pill(label,url)));
  } catch { /* The retained local links and directory link are still available. */ }
}

async function updateCountries(panel, path, translate) {
  try {
    const response = await fetch(api+'rpc/public_anybike_country_navigation_v1',{headers,signal:AbortSignal.timeout(8500)});
    if (!response.ok) return;
    const rows = await response.json();
    if (!Array.isArray(rows)) return;
    const groups = groupDatabaseCountryRoutes(rows.filter(item=>item?.url!==path));
    const regionGrid = directoryNode('div');
    regionGrid.className = 'country-region-grid';
    for (const {region,entries} of groups) {
      const details = directoryNode('details');
      const title = translate(region);
      details.append(directoryNode('summary',title+' ('+entries.length+')'),pills(title,entries));
      regionGrid.append(details);
    }
    if (groups.length) panel.append(regionGrid);
  } catch { /* Nearby markets and the country directory remain available. */ }
}

function modelGuidePills(panel, title, suggested, ranking, translate) {
  const subsection = directoryNode('div');
  subsection.className = 'country-directory-guides';
  const heading = directoryNode('h3',title);
  const list = pills(title,suggested);
  const browse = translate('All motorcycle model guides', 'Tous les guides moto');
  subsection.append(heading,list,pills(title,[{label:browse,url:'/motorcycle-models.html'}]));
  panel.append(subsection);
  ranking.then(rows=>{
    if (!rows.length || !subsection.isConnected) return;
    heading.textContent = translate('Popular model guides in this market', 'Guides moto populaires sur ce marché');
    list.setAttribute('aria-label',heading.textContent);
    list.replaceChildren(...rows.map(row=>pill(row.make+' '+row.model,row.url)));
  });
}

export function mountCountryDirectory(main, data, ranking) {
  const old = main.querySelector('[data-country-section="related_guides_and_markets"]');
  const translate = countryCopy(data);
  const manufacturerTitle = translate('Motorcycle manufacturers', 'Constructeurs de motos');
  const marketsTitle = translate('Other motorcycle markets', 'Autres marchés');
  const modelsTitle = translate('Motorcycle model guides', 'Guides moto');
  const manufacturers = directoryPanel(manufacturerTitle);
  const brands = pills(manufacturerTitle,legacyLinks(old,makeRoute));
  manufacturers.append(brands,pills(manufacturerTitle,[{url:'/motorcycle-manufacturers.html',label:translate('All manufacturers A–Z', 'Tous les constructeurs A–Z')}]));
  const countries = directoryPanel(marketsTitle);
  countries.append(pills(marketsTitle,[
    ...legacyLinks(old,marketRoute).filter(item=>item.url!==data.path),
    {url:'/international-markets.html',label:translate('All international markets', 'Tous les marchés')}
  ]));
  const models = legacyLinks(old,modelRoute);
  modelGuidePills(manufacturers,modelsTitle,models,ranking,translate);
  const panels = directoryNode('div');
  panels.className = 'country-directories';
  panels.append(manufacturers,countries);
  if (old) old.replaceWith(panels);
  else main.insertBefore(panels,main.querySelector('[data-country-placement="ad-footer"]'));
  updateManufacturers(brands);
  updateCountries(countries,data.path,translate);
}
