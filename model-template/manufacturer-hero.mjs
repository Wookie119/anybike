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
