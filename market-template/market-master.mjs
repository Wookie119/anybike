import {api, headers} from '../model-template/riding-style.mjs';

const tags = new Set('section div header article aside nav h1 h2 h3 h4 p strong em b i small span a img figure figcaption ul ol li dl dt dd details summary br hr blockquote table caption thead tbody tr th td'.split(' '));
const attributes = new Set('class id title alt width height loading decoding aria-label aria-labelledby aria-hidden role open hidden scope colspan rowspan'.split(' '));
const storyRoute = /^\/global\/[a-z0-9-]+\.html$/;
const commercialSlots = new Set(['classifieds', 'ad-after-global', 'ad-footer']);

const labels = {
  en: { local: 'From this market', fallback: 'From around the world', all: 'Explore AnyBike Global', unavailable: 'Country guide unavailable. Open the current market guide.' },
  fr: { local: 'Dans ce marché', fallback: 'À travers le monde', all: 'Découvrir AnyBike Global', unavailable: 'Guide indisponible. Ouvrez le guide actuel du marché.' }
};

export function safeUrl(value, origin = location.origin) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value, origin);
    return (url.protocol === 'https:' || url.origin === origin) && !url.username && !url.password ? value : null;
  } catch {
    return null;
  }
}

function element(tag, text, classes) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (classes) node.className = classes;
  return node;
}

function link(label, url) {
  const node = element('a', label);
  node.href = url;
  return node;
}

function sectionNode(item) {
  if (typeof item === 'string') return document.createTextNode(item);
  if (!item || !tags.has(item.tag)) return document.createTextNode('');
  const node = element(item.tag);
  for (const [key, value] of Object.entries(item.attrs || {})) {
    if (attributes.has(key)) node.setAttribute(key, value);
    if ((key === 'href' && item.tag === 'a' || key === 'src' && item.tag === 'img') && safeUrl(value)) {
      node.setAttribute(key, value);
    }
  }
  node.append(...(item.children || []).map(sectionNode));
  return node;
}

export function chooseStories(local, worldwide) {
  const keep = rows => (rows || []).filter(story => storyRoute.test(story.url) && story.title);
  const regional = keep(local);
  return regional.length ? {regional: true, stories: regional.slice(0, 3)} :
    {regional: false, stories: keep(worldwide).slice(0, 3)};
}

function storyPanel(data, copy) {
  const {regional, stories} = chooseStories(data.localStories, data.worldwideStories);
  const section = element('section', '', 'country-global');
  section.setAttribute('aria-labelledby', 'country-global-heading');
  const heading = element('h2', 'AnyBike ');
  heading.id = 'country-global-heading';
  heading.append(element('span', 'Global'));
  const masthead = element('header', '', 'country-global-masthead');
  const explore = link(copy.all, '/anybike-global.html');
  explore.className = 'btn';
  masthead.append(heading, explore);
  section.append(masthead);
  if (!stories.length) return section;
  section.append(element('p', regional ? copy.local : copy.fallback, 'country-global-edition'));
  const grid = element('div', '', 'country-global-stories');
  for (const story of stories) {
    const article = element('article', '', 'country-global-story');
    if (safeUrl(story.image) && safeUrl(story.source) && safeUrl(story.licenceUrl) && story.credit && story.licence) {
      const figure = element('figure');
      const photo = element('img');
      photo.src = story.image;
      photo.alt = story.alt || '';
      photo.loading = 'lazy';
      const credit = element('figcaption');
      credit.append(link(story.credit, story.source), ' · ', link(story.licence, story.licenceUrl));
      figure.append(photo, credit);
      article.append(figure);
    }
    const heading = element('h3');
    heading.append(link(story.title, story.url));
    article.append(heading, element('p', story.summary));
    grid.append(article);
  }
  section.append(grid);
  return section;
}

function commercialMounts(data) {
  return new Map((data.slots || []).filter(slot => commercialSlots.has(slot.key)).map(slot => {
    const mount = element('section');
    mount.hidden = true;
    mount.dataset.countryPlacement = slot.key;
    mount.dataset.countryMarket = data.slug;
    mount.dataset.enabled = String(slot.enabled === true);
    if (slot.adSlot) mount.dataset.adSlot = slot.adSlot;
    return [slot.key, mount];
  }));
}

export function render(main, data) {
  const copy = labels[data.locale] || labels.en;
  document.documentElement.lang = data.locale;
  document.title = data.title;
  document.querySelector('meta[name="description"]').content = data.description;
  const mounts = commercialMounts(data);
  const sections = data.sections.map(({kind, content}) => {
    const section = sectionNode(content);
    section.dataset.countrySection = kind;
    return section;
  });
  if (!sections.some(section => section.dataset.countrySection === 'local_interest')) {
    const interest = element('section', '', 'section');
    interest.hidden = true;
    interest.dataset.countrySection = 'local_interest';
    const wrap = element('div', '', 'wrap');
    const heading = data.locale === 'fr' ? 'Motos consultées récemment' : 'Motorcycles attracting local interest';
    wrap.append(element('h2', heading), element('div', '', 'stock-grid'));
    interest.append(wrap);
    sections.splice(1, 0, interest);
  }
  const global = storyPanel(data, copy);
  const enquiry = sections.find(section => section.dataset.countrySection === 'enquiry');
  const position = enquiry ? sections.indexOf(enquiry) : sections.length;
  sections.splice(position, 0, global);
  const display = document.createDocumentFragment();
  for (const section of sections) {
    display.append(section);
    if (section === global) {
      for (const key of ['ad-after-global', 'classifieds']) {
        if (mounts.has(key)) display.append(mounts.get(key));
      }
    }
  }
  if (mounts.has('ad-footer')) display.append(mounts.get('ad-footer'));
  main.replaceChildren(display);
}

function requestedLocale(params) {
  const preferred = params.get('lang') || localStorage.getItem('anybikeLanguage') || 'en';
  return preferred.toLowerCase().split('-')[0];
}

async function marketQuery(resource, query) {
  const response = await fetch(api + resource + '?' + new URLSearchParams(query), {
    headers, signal: AbortSignal.timeout(9000)
  });
  if (!response.ok) throw Error('Market feed unavailable');
  return response.json();
}

function stockCard(row, locale) {
  const id = row.bike_id ?? row.id;
  if (!/^\d+$/.test(id)) return null;
  const title = [row.year, row.make, row.model, row.variant].filter(Boolean).join(' ');
  if (!title.trim()) return null;
  const card = link('', '/bike-details.html?id=' + encodeURIComponent(id));
  card.className = 'stock-card';
  const photo = element('img');
  photo.src = safeUrl(row.image_url) || '/anybike-logo-new.jpg';
  photo.alt = title;
  photo.loading = 'lazy';
  photo.addEventListener('error', () => { photo.src = '/anybike-logo-new.jpg'; }, {once: true});
  const copy = element('div', '', 'stock-copy');
  copy.append(element('h3', title));
  if (Number(row.price_gbp) > 0) {
    const price = new Intl.NumberFormat(locale, {style: 'currency', currency: 'GBP', maximumFractionDigits: 0});
    copy.append(element('p', price.format(row.price_gbp), 'stock-price'));
  }
  card.append(photo, copy);
  return card;
}

async function loadMarketFeeds(main, data) {
  const stock = main.querySelector('[data-country-section="available_stock"] .stock-grid');
  const interest = main.querySelector('[data-country-section="local_interest"]');
  const interestGrid = interest?.querySelector('.stock-grid');
  const french = data.locale === 'fr';
  const show = async (grid, resource, query, empty) => {
    if (!grid) return [];
    try {
      const rows = await marketQuery(resource, query);
      const cards = rows.map(row => stockCard(row, data.locale)).filter(Boolean);
      grid.replaceChildren(...(cards.length ? cards : [element('p', empty)]));
      return rows;
    } catch {
      grid.replaceChildren(element('p', french ? 'Sélection momentanément indisponible.' : 'Selection temporarily unavailable.'));
      return [];
    }
  };
  const stockJob = show(stock, 'public_available_stock', {
    select: 'id,make,model,variant,year,price_gbp,image_url', make: 'not.is.null',
    model: 'not.is.null', order: 'created_at.desc', limit: 4
  }, french ? 'Aucune moto disponible actuellement.' : 'No motorcycles are currently available.');
  const interestJob = show(interestGrid, 'rpc/get_country_motorcycle_interest_v1', {
    p_country: data.market, p_limit: 8
  }, french ? 'Pas encore assez de données.' : 'No recent selection for this market.');
  const [, rows] = await Promise.all([stockJob, interestJob]);
  if (interest && interestGrid) {
    for (const [selector, value] of [['#interestMakes', row => row.make], ['#interestModels', row => [row.make, row.model].filter(Boolean).join(' ')]]) {
      const target = interest.querySelector(selector);
      const names = [...new Set(rows.map(value).filter(Boolean))].slice(0, 8);
      if (target) target.replaceChildren(element('span', names.join(' · ') || (french ? 'Pas encore assez de données.' : 'No recent selection for this market.')));
    }
    interest.hidden = !rows.length && data.slug !== 'reunion';
    if (!rows.length) return;
    try {
      const similar = await marketQuery('rpc/get_country_similar_motorcycles_v2', {
        p_country: data.market, p_limit: 8
      });
      const viewed = new Set(rows.map(row => String(row.bike_id ?? row.id)));
      const alternatives = similar.filter(row => !viewed.has(String(row.bike_id ?? row.id)))
        .map(row => stockCard(row, data.locale)).filter(Boolean);
      if (alternatives.length) {
        const heading = french ? 'Motos similaires disponibles' : 'Similar motorcycles available';
        interestGrid.append(element('h3', heading, 'stock-group-label'), ...alternatives);
      }
    } catch {
      // A missing alternative feed does not affect the observed interest cards.
    }
  }
}

async function load(main) {
  const params = new URLSearchParams(location.search);
  const slug = main.dataset.countryMaster || params.get('market') || 'sweden';
  const locale = requestedLocale(params);
  if (!/^[a-z0-9-]+$/.test(slug) || !/^[a-z]{2}$/.test(locale)) return;
  const market = '/markets/' + slug + '.html';
  const endpoint = api + 'rpc/public_anybike_country_master_v1?p_slug=' + slug + '&p_locale=' + locale;
  try {
    const response = await fetch(endpoint, {headers, signal: AbortSignal.timeout(9000)});
    const data = response.ok ? await response.json() : null;
    if (!data || data.slug !== slug || !Array.isArray(data.sections) || !data.sections.length) throw Error('Market not available');
    if (locale !== requestedLocale(params)) return;
    render(main, data);
    loadMarketFeeds(main, data);
  } catch {
    if (locale !== requestedLocale(params)) return;
    const copy = labels[locale] || labels.en;
    const notice = element('div', '', 'wrap section');
    notice.append(link(copy.unavailable, market));
    main.replaceChildren(notice, storyPanel({}, copy));
  }
}

if (typeof document !== 'undefined') {
  const main = document.querySelector('[data-country-master]');
  if (main) {
    load(main);
    window.addEventListener('anybikeLanguageChanged', () => load(main));
  }
}
