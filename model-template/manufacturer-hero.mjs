const figure = document.querySelector('[data-manufacturer-hero]');
const make = figure?.dataset.manufacturerHero || new URLSearchParams(location.search).get('make');

if (figure && make) {
  fetch('/data/manufacturer-heroes.json?v=20261127')
    .then(response => {
      if (!response.ok) throw new Error('Manufacturer photo catalogue unavailable');
      return response.json();
    })
    .then(photos => {
      const key = Object.keys(photos).find(name => name.toLowerCase() === make.trim().toLowerCase());
      if (!key) return;
      const photo = photos[key];
      const image = document.createElement('img');
      image.alt = photo.alt;
      image.width = photo.width;
      image.height = photo.height;
      image.fetchPriority = 'high';

      const credit = document.createElement('figcaption');
      const source = document.createElement('a');
      source.href = photo.source;
      source.textContent = photo.credit;
      const licence = document.createElement('a');
      licence.href = photo.licenceUrl;
      licence.textContent = photo.licence;
      credit.append(source, ' · ', licence, ' · Resized');

      image.addEventListener('load', () => {
        figure.append(image, credit);
        figure.hidden = false;
      }, {once: true});
      image.src = photo.src;
    })
    .catch(error => console.warn('Manufacturer photo temporarily unavailable', error));
}

const heading = document.querySelector('main .manufacturer-hero h1, main .hero h1');

if (make && heading) {
  fetch('/data/manufacturer-logos.json?v=20261127-identity')
    .then(response => {
      if (!response.ok) throw new Error('Manufacturer logo registry unavailable');
      return response.json();
    })
    .then(logos => {
      const name = Object.keys(logos).find(brand => brand.toLowerCase() === make.trim().toLowerCase());
      if (!name) return;
      const logo = logos[name];
      const badge = document.createElement('a');
      badge.className = 'manufacturer-logo';
      badge.dataset.background = logo.background;
      badge.href = logo.source;
      const image = document.createElement('img');
      image.alt = name === 'Honda' ? 'Honda motorcycle wing logo' : name + ' motorcycle manufacturer logo';
      image.addEventListener('load', () => {
        badge.append(image);
        heading.before(badge);
      }, {once: true});
      image.src = logo.image;
    })
    .catch(error => console.warn('Manufacturer logo temporarily unavailable', error));
}
