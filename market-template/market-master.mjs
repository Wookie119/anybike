import {countryCopy} from './country-copy.mjs';
import {marketLanguage, mountMarketPreferences, updateCountryPrices, countryPrice, withCountryReferenceRates} from './country-preferences.mjs';
import {mountCountryDirectory} from './country-directory.mjs';
import {loadCountryFooterAds} from './country-footer-ads.mjs';
import {countryModelSearch, loadPopularModels, loadCountryAvailableStock, loadRankedCountryModels} from './country-model-search.mjs';
import {api, headers} from '../model-template/riding-style.mjs';

const tags = new Set('section div header article aside nav h1 h2 h3 h4 h5 p strong em b i small span a img figure figcaption ul ol li dl dt dd details summary br hr blockquote table caption thead tbody tr th td'.split(' '));
const attributes = new Set('class id lang title alt width height loading decoding aria-label aria-labelledby aria-hidden role open hidden scope colspan rowspan'.split(' '));
const storyRoute = /^\/global\/[a-z0-9-]+\.html$/;
const commercialSlots = new Set(['classifieds', 'ad-after-global', 'ad-footer']);

const labels = {
  en: { local: 'From this market', fallback: 'From around the world', all: 'Explore AnyBike Global', unavailable: 'Country guide unavailable. Open the current market guide.' },
  sv: { local: 'Från den här marknaden', fallback: 'Från hela världen', all: 'Utforska AnyBike Global', unavailable: 'Marknadsguiden är tillfälligt otillgänglig.' },
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
  const matching = stories => stories?.filter(story => story.locale === data.locale || (data.locale === 'en' && !story.locale));
  const {regional, stories} = chooseStories(matching(data.localStories), matching(data.worldwideStories));
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
      if (story.resized) {
        const resized = {sv:'skalad bild',fr:'image redimensionnée'}[data.locale] || 'resized image';
        credit.append(' · ' + resized);
      }
      figure.append(photo, credit);
      article.append(figure);
    }
    const copy = element('div', '', 'country-global-story-copy');
    const heading = element('h3');
    const title = link(story.title, story.url);
    if (story.articleLocale) title.hreflang = story.articleLocale;
    heading.append(title);
    copy.append(heading, element('p', story.summary));
    article.append(copy);
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
    if (slot.key === 'ad-footer') mount.className = 'country-footer-ads';
    return [slot.key, mount];
  }));
}

const buyingServiceLinks = [
  ['/motorcycle-inspection.html','Inspection','Inspection'],
  ['/motorcycle-collection.html','Collection','Collecte'],
  ['/export-crating.html','Export Crating','Caisse export'],
  ['/freight-forwarders.html','Freight Forwarders','Transitaires'],
  ['/services-and-fees.html','Services & Fees','Services et frais']
];

function enquiryChecklist(translate) {
  const panel = element('section', '', 'country-journey-card country-enquiry-checklist');
  panel.id = 'country-enquiry-checklist';
  panel.append(element('h2', translate('Before you enquire', 'Avant votre demande')));
  const list = element('ul', '', 'country-checklist');
  const fields = [
    translate('Make and model', 'Marque et modèle'),
    translate('Year and mileage', 'Année et kilométrage'),
    translate('Budget'),
    translate('Destination town or city', 'Ville de destination'),
    translate('Freight contact, if known', 'Contact du transitaire, si connu')
  ];
  panel.append(element('p',translate('Have these details handy so we can give you a useful sourcing reply.', 'Rassemblez ces informations pour préparer votre demande.')));
  for (const field of fields) {
    const item = element('li');
    const label = element('label');
    const box = element('input');
    box.type = 'checkbox';
    label.append(box,element('span',field));
    item.append(label);
    list.append(item);
  }
  const services = element('nav', '', 'country-pills');
  services.setAttribute('aria-label',translate('AnyBike buying services', 'Services AnyBike'));
  for (const [href,en,fr] of buyingServiceLinks) services.append(link(translate(en, fr),href));
  const request = link(translate('Source a Motorcycle', 'Faire rechercher une moto'),'/buy-motorcycles.html');
  request.className = 'btn btn-primary';
  const actions = element('div', '', 'country-enquiry-actions');
  actions.append(request,services);
  panel.append(list,actions);
  return panel;
}

function jumpPills(targets, translate) {
  const nav = element('nav', '', 'country-pills country-page-jumps');
  nav.setAttribute('aria-label',translate('On this page', 'Sur cette page'));
  for (const [target,id,english,français] of targets) {
    if (!target) continue;
    target.id ||= id;
    const destination = new URL(location.href);
    destination.hash = target.id;
    nav.append(link(translate(english, français),destination.href));
  }
  return nav;
}

function groupHandover(sections, translate) {
  const destinationKinds = new Set(['transport_and_local_information','destination_planning']);
  const destinations = sections.filter(section=>destinationKinds.has(section.dataset.countrySection));
  const uk = sections.filter(section=>['uk_handover','uk_ports'].includes(section.dataset.countrySection));
  if (!destinations.length && !uk.length) return null;
  const group = element('section', '', 'country-journey-card country-handover');
  group.append(element('h2', translate('Transport & handover', 'Transport et remise')));
  for (const [parts,title,className] of [
    [destinations,translate('Destination planning', 'Planification à destination'),''],
    [uk,translate('UK collection & handover', 'Collecte et remise au Royaume-Uni'),' country-handover-uk']
  ]) {
    if (!parts.length) continue;
    const panel = element('section', '', 'country-handover-part' + className);
    if (!parts.some(part=>part.classList.contains('country-delivery-options'))) {
      panel.append(element('h3',title));
    }
    panel.append(...parts);
    for (const part of parts) {
      for (const label of part.querySelectorAll('.eyebrow,.ab-market-eyebrow')) {
        if (label.textContent.trim().toLowerCase() === title.trim().toLowerCase()) label.remove();
      }
      part.querySelectorAll('.section-head h2,.ab-market-head h2').forEach(heading => {
        const subheading = element('h4',heading.textContent);
        heading.replaceWith(subheading);
      });
    }
    group.append(panel);
  }
  const previous = [...destinations,...uk];
  const first = Math.min(...previous.map(section=>sections.indexOf(section)));
  for (const section of previous) sections.splice(sections.indexOf(section),1);
  sections.splice(first,0,group);
  return group;
}

export function render(main, data) {
  const translate = countryCopy(data);
  const defaults = labels[data.locale] || labels.en;
  const copy = Object.fromEntries(Object.entries(defaults)
    .map(([key, value]) => [key, translate(labels.en[key], value)]));
  main.lang = data.locale;
  document.title = data.title;
  document.querySelector('meta[name="description"]').content = data.description;
  const mounts = commercialMounts(data);
  const sections = data.sections.map(({kind, content}) => {
    const section = sectionNode(content);
    section.dataset.countrySection = kind;
    if (kind === 'hero') {
      const photo = section.querySelector('.hero-media img');
      if (photo) {
        photo.fetchPriority = 'high';
        photo.addEventListener('error', () => {
          photo.dataset.missingHero = '';
          photo.src = '/anybike-logo-new.jpg';
        }, {once:true});
      }
    }
    return section;
  });
  if (!sections.some(section => section.dataset.countrySection === 'local_interest')) {
    const interest = element('section', '', 'section');
    interest.hidden = true;
    interest.dataset.countrySection = 'local_interest';
    const wrap = element('div', '', 'wrap');
    const heading = translate('Motorcycles attracting local interest', 'Motos consultées récemment');
    wrap.append(element('h2', heading), element('div', '', 'stock-grid'));
    interest.append(wrap);
    sections.splice(1, 0, interest);
  }
  if (!sections.some(section => section.dataset.countrySection === 'available_stock')) {
    const section = element('section', '', 'section');
    section.dataset.countrySection = 'available_stock';
    const wrap = element('div', '', 'wrap');
    const title = element('h2', translate('Available Stock', 'Motos disponibles'));
    const browse = link(translate('Browse Available Stock', 'Voir les motos disponibles'), '/available-stock.html');
    browse.className = 'btn btn-primary';
    wrap.append(title, element('div', '', 'stock-grid'), browse);
    section.append(wrap);
    sections.splice(Math.min(3, sections.length), 0, section);
  }
  const global = storyPanel(data, copy);
  const heritage = sections.find(section => section.dataset.countrySection === 'manufacturer_heritage');
  if (heritage) {
    sections.splice(sections.indexOf(heritage), 1);
    global.append(heritage);
  }
  const buyingServices = sections.find(section => section.dataset.countrySection === 'buying_services');
  const enquiry = sections.find(section => section.dataset.countrySection === 'enquiry');
  if (buyingServices && enquiry) {
    sections.splice(sections.indexOf(buyingServices), 1);
    sections.splice(sections.indexOf(enquiry), 0, buyingServices);
  }
  const position = buyingServices ? sections.indexOf(buyingServices) : enquiry ? sections.indexOf(enquiry) : sections.length;
  sections.splice(position, 0, global);
  const handover = groupHandover(sections, translate);
  const checklist = enquiryChecklist(translate);
  sections.splice(enquiry ? sections.indexOf(enquiry) : sections.length, 0, checklist);
  const findSection = kind => sections.find(section=>section.dataset.countrySection===kind);
  const search = countryModelSearch(data);
  const jumps = jumpPills([
    [search,'country-search','Search','Recherche'],
    [findSection('available_stock'),'country-stock','Available Stock','Motos disponibles'],
    [findSection('model_guides') || findSection('manufacturer_and_model_guides'),'country-model-guides','Model Guides','Guides moto'],
    [handover || findSection('buying_process'),'country-handover','Buying & Handover','Achat et remise'],
    [findSection('faq'),'country-faq','FAQs','FAQ'],
    [global,'country-global','AnyBike Global','AnyBike Global']
  ], translate);
  const display = document.createDocumentFragment();
  for (const section of sections) {
    display.append(section);
    if (section.dataset.countrySection === "hero") display.append(jumps,search);
    if (section === global) {
      for (const key of ['ad-after-global', 'classifieds']) {
        if (mounts.has(key)) display.append(mounts.get(key));
      }
    }
  }
  if (mounts.has('ad-footer')) display.append(mounts.get('ad-footer'));
  main.replaceChildren(display);
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
    copy.append(countryPrice(row.price_gbp, locale));
  }
  card.append(photo, copy);
  return card;
}

async function loadMarketFeeds(main, data) {
  const interest = main.querySelector('[data-country-section="local_interest"]');
  const interestGrid = interest?.querySelector('.stock-grid');
  const translate = countryCopy(data);
  const show = async (grid, resource, query, empty) => {
    if (!grid) return [];
    try {
      const rows = await marketQuery(resource, query);
      const cards = rows.map(row => stockCard(row, data.locale)).filter(Boolean);
      grid.replaceChildren(...(cards.length ? cards : [element('p', empty)]));
      return rows;
    } catch {
      grid.replaceChildren(element('p', translate('Selection temporarily unavailable.', 'Sélection momentanément indisponible.')));
      return [];
    }
  };
  const rows = await show(interestGrid, 'rpc/get_country_motorcycle_interest_v1', {
    p_country: data.stockMarket || data.market, p_limit: 8
  }, translate('No recent selection for this market.', 'Pas encore assez de données.'));
  if (interest && interestGrid) {
    for (const [selector, value] of [['#interestMakes', row => row.make], ['#interestModels', row => [row.make, row.model].filter(Boolean).join(' ')]]) {
      const target = interest.querySelector(selector);
      const names = [...new Set(rows.map(value).filter(Boolean))].slice(0, 8);
      if (target) target.replaceChildren(element('span', names.join(' · ') || (translate('No recent selection for this market.', 'Pas encore assez de données.'))));
    }
    interest.hidden = !rows.length && data.slug !== 'reunion';
    if (!rows.length) return;
    try {
      const similar = await marketQuery('rpc/get_country_similar_motorcycles_v2', {
        p_country: data.stockMarket || data.market, p_limit: 8
      });
      const viewed = new Set(rows.map(row => String(row.bike_id ?? row.id)));
      const alternatives = similar.filter(row => !viewed.has(String(row.bike_id ?? row.id)))
        .map(row => stockCard(row, data.locale)).filter(Boolean);
      if (alternatives.length) {
        const heading = translate('Similar motorcycles available', 'Motos similaires disponibles');
        interestGrid.append(element('h3', heading, 'stock-group-label'), ...alternatives);
      }
    } catch {
      // A missing alternative feed does not affect the observed interest cards.
    }
  }
}

async function load(main, focusLanguage = false) {
  const params = new URLSearchParams(location.search);
  const slug = main.dataset.countryMaster || params.get('market') || 'sweden';
  const fixedLocale = main.dataset.countryLocale;
  const locale = fixedLocale || marketLanguage(slug, params);
  const activeLanguage = () => fixedLocale || marketLanguage(slug, params);
  if (!/^[a-z0-9-]+$/.test(slug) || (locale && !/^[a-z]{2}$/.test(locale))) return;
  const market = '/markets/' + slug + '.html';
  const query = new URLSearchParams({p_slug:slug});
  if (locale) query.set('p_locale',locale);
  const endpoint = api + 'rpc/public_anybike_country_master_v1?' + query;
  try {
    const valid = data => data?.slug === slug && Array.isArray(data.sections) && data.sections.length > 0
      && (!fixedLocale || data.locale === fixedLocale)
      && (!main.hasAttribute('data-country-translation') || data.translationStatus === 'reviewed');
    const response = await fetch(endpoint, {headers, signal: AbortSignal.timeout(fixedLocale ? 3500 : 9000)})
      .catch(() => null);
    let data = response?.ok ? await response.json().catch(() => null) : null;
    if (fixedLocale && !valid(data)) {
      data = JSON.parse(document.getElementById('country-page-snapshot')?.textContent || 'null');
    }
    if (!valid(data)) throw Error('Market not available');
    if (locale !== activeLanguage()) return;
    data = await withCountryReferenceRates(data);
    if (locale !== activeLanguage()) return;
    const navigation = main.querySelector('[data-country-site-navigation]');
    render(main, data);
    if (navigation) main.prepend(navigation);
    const preferences = mountMarketPreferences(main,data,()=>load(main,true),{fixedLocale});
    if (focusLanguage) preferences.languageButton?.focus();
    const priceRefresh = () => {
      if (main.firstElementChild === activeRoot) updateCountryPrices(main,data);
    };
    const activeRoot = main.firstElementChild;
    loadMarketFeeds(main, data).finally(priceRefresh);
    const ranking = loadRankedCountryModels(data.slug);
    loadPopularModels(main, data, ranking).finally(priceRefresh);
    loadCountryAvailableStock(main, data, ranking).finally(priceRefresh);
    mountCountryDirectory(main, data, ranking);
    loadCountryFooterAds(main, data.slug, data);
  } catch {
    if (fixedLocale || locale !== activeLanguage()) return;
    const copy = labels[locale] || labels.en;
    main.lang = locale || 'en';
    const notice = element('div', '', 'wrap section');
    notice.append(link(copy.unavailable, market));
    main.replaceChildren(notice, storyPanel({}, copy));
  }
}

if (typeof document !== 'undefined') {
  const main = document.querySelector('[data-country-master]');
  if (main) {
    load(main);
    if (!main.dataset.countryLocale) window.addEventListener('anybikeLanguageChanged', () => load(main));
  }
}
