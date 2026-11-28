import {countryCopy} from './country-copy.mjs';
const endpoint = 'https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/public-advertising-v1';
const slotCode = 'AB-COUNTRY-FOOTER';

async function requestCountryAds(body, keepalive = false) {
  const response = await fetch(endpoint, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body), keepalive, credentials: 'omit',
    signal: AbortSignal.timeout(8500)
  });
  return response.ok ? response.json() : null;
}

function advertUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export async function loadCountryFooterAds(main, market, data) {
  const slot = main.querySelector('[data-country-placement="ad-footer"][data-enabled="true"]');
  if (!slot || slot.dataset.adSlot !== slotCode || !/^[a-z0-9-]+$/.test(market)) return;
  try {
    const page_path = '/markets/' + market + '.html';
    const response = await requestCountryAds({action:'select_country_footer',page_path});
    if (!Array.isArray(response?.layout) || !slot.isConnected) return;
    const disclosure = countryCopy(data)('Advertisement', 'Publicité');
    for (const ad of response.layout.slice(0,3)) {
      const imageUrl = advertUrl(ad.image_url);
      const destination = advertUrl(ad.destination_url);
      if (ad.slot_code !== slotCode || ad.format !== 'square' || !ad.token || !imageUrl || !destination || !ad.partner_name) continue;
      const card = document.createElement('figure');
      card.dataset.anybikeAdAuthorized = '1';
      const link = document.createElement('a');
      link.href = destination;
      link.rel = 'noopener noreferrer sponsored';
      link.target = '_blank';
      link.dataset.anybikeAdAuthorized = '1';
      const photo = document.createElement('img');
      photo.src = imageUrl;
      photo.alt = ad.alt_text || ad.partner_name;
      photo.loading = 'lazy';
      photo.width = 600;
      photo.height = 600;
      const caption = document.createElement('figcaption');
      caption.textContent = disclosure + ' · ' + ad.partner_name;
      link.append(photo);
      card.append(link,caption);
      slot.append(card);
      slot.hidden = false;
      let seen = false;
      let clicked = false;
      const emit = event_type => requestCountryAds({action:'event',event_type,token:ad.token},true).catch(() => {});
      const impression = () => { if (!seen) { seen = true; emit('impression'); } };
      const click = () => { if (!clicked) { clicked = true; impression(); emit('click'); } };
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio>=.5) && photo.complete && photo.naturalWidth) {
          impression();
          observer.disconnect();
        }
      },{threshold:.5});
      photo.addEventListener('load',() => observer.observe(card),{once:true});
      if (photo.complete && photo.naturalWidth) observer.observe(card);
      photo.addEventListener('error',() => {
        observer.disconnect();
        card.remove();
        slot.hidden = !slot.childElementCount;
      },{once:true});
      link.addEventListener('click',click);
      link.addEventListener('auxclick',event => { if (event.button===1) click(); });
    }
  } catch { /* Editorial content remains available during an ad outage. */ }
}
