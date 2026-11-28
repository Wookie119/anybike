import {countryCopy} from './country-copy.mjs';
const languagePreferences = new Map();
let displayCurrency;
const referenceRequests = new Map();

function savedCountryPreference(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function saveCountryPreference(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Keep the preference for this page session. */ }
}
export function marketLanguage(slug, params) {
  return (languagePreferences.get(slug) || params.get('lang')
    || savedCountryPreference('anybikeCountryLanguage:' + slug) || '').toLowerCase().split('-')[0];
}

function availableCountryRates(data) {
  return Object.fromEntries([['GBP',1], ...Object.entries(data.currencyRates || {})
    .filter(([code,rate])=>code !== 'GBP' && /^[A-Z]{3}$/.test(code) && Number.isFinite(rate) && rate > 0
      && Date.parse(data.currencyRateExpiry?.[code]) > Date.now())]);
}

export async function withCountryReferenceRates(data) {
  const active = availableCountryRates(data);
  const missing = (data.displayCurrencies || []).filter(code => /^[A-Z]{3}$/.test(code) && !Object.hasOwn(active, code)).sort();
  if (!missing.length) return data;
  const key = missing.join(',');
  if (!referenceRequests.has(key)) {
    const url = new URL('https://api.frankfurter.dev/v2/rates');
    url.search = new URLSearchParams({base:'GBP', quotes:key, providers:'ecb'});
    referenceRequests.set(key, fetch(url, {signal:AbortSignal.timeout(3500), credentials:'omit'})
      .then(response => response.ok ? response.json() : [])
      .catch(() => { referenceRequests.delete(key); return []; }));
  }
  const rows = await referenceRequests.get(key);
  const rates = {...data.currencyRates};
  const expiry = {...data.currencyRateExpiry};
  for (const {base, quote, rate, date} of Array.isArray(rows) ? rows : []) {
    if (base !== 'GBP' || !missing.includes(quote) || !Number.isFinite(rate) || rate <= 0) continue;
    const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(date) : NaN;
    if (!(timestamp <= Date.now() && timestamp + 5 * 86400000 > Date.now())) continue;
    rates[quote] = rate;
    expiry[quote] = new Date(timestamp + 5 * 86400000).toISOString();
  }
  return {...data, currencyRates:rates, currencyRateExpiry:expiry,
    defaultCurrency:Object.hasOwn(rates,data.preferredDisplayCurrency) ? data.preferredDisplayCurrency : data.defaultCurrency};
}

export function countryPrice(amount, locale) {
  const el = document.createElement('p');
  el.dataset.countryPriceGbp = amount;
  el.dataset.countryPriceLocale = locale;
  el.textContent = new Intl.NumberFormat(locale,{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(amount);
  return el;
}

export function updateCountryPrices(root, data) {
  const rates = availableCountryRates(data);
  const selected = displayCurrency || savedCountryPreference('anybikeCountryDisplayCurrency')
    || data.defaultCurrency;
  const code = Object.hasOwn(rates,selected) ? selected : 'GBP';
  for (const element of root.querySelectorAll('[data-country-price-gbp]')) {
    const original = Number(element.dataset.countryPriceGbp);
    const format = currency => new Intl.NumberFormat(data.locale,{style:'currency',currency,maximumFractionDigits:0});
    element.textContent = code === 'GBP' ? format('GBP').format(original) :
      '≈ ' + format(code).format(original * rates[code]) + ' · ' + format('GBP').format(original);
  }
}

export function mountMarketPreferences(root, data, reload, {fixedLocale} = {}) {
  const bar = document.createElement('div');
  bar.className = 'country-preferences country-pills';
  const swedish = data.locale === 'sv';
  const options = Array.isArray(data.availableLocales) ? data.availableLocales : [];
  let languageButton;
  if (!fixedLocale && options.includes('en') && options.includes('sv')) {
    const target = swedish ? 'en' : 'sv';
    languageButton = document.createElement('button');
    languageButton.type = 'button';
    languageButton.className = 'btn';
    languageButton.textContent = target === 'en' ? 'English' : 'Svenska';
    languageButton.lang = target;
    languageButton.addEventListener('click',()=>{
      languagePreferences.set(data.slug,target);
      saveCountryPreference('anybikeCountryLanguage:' + data.slug,target);
      reload();
    });
    bar.append(languageButton);
  }
  const rates = availableCountryRates(data);
  if (Object.keys(rates).length > 1) {
    const label = document.createElement('label');
    label.append(document.createTextNode(countryCopy(data)('Currency', 'Devise')));
    const select = document.createElement('select');
    for (const code of Object.keys(rates)) {
      const option = document.createElement('option');
      option.value = option.textContent = code;
      select.append(option);
    }
    select.value = displayCurrency || savedCountryPreference('anybikeCountryDisplayCurrency')
      || data.defaultCurrency || 'GBP';
    if (!select.value) select.value = 'GBP';
    select.addEventListener('change',()=>{
      displayCurrency = select.value;
      saveCountryPreference('anybikeCountryDisplayCurrency',select.value);
      updateCountryPrices(root,data);
    });
    label.append(select);
    bar.append(label);
  }
  if (bar.childElementCount) root.prepend(bar);
  return {languageButton};
}
