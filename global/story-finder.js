(() => {
  const form = document.querySelector('#story-finder form');
  const list = document.getElementById('story-finder-results');
  const status = document.getElementById('story-finder-status');
  const more = document.getElementById('story-finder-more');
  const split = value => (value || '').split(',').map(item => item.trim()).filter(Boolean);
  const fields = ['country', 'manufacturer', 'topic'];
  const controls = Object.fromEntries(fields.map(field => [field, form.elements.namedItem(field)]));
  const groupTopics = {
    'new-features': 'Engineering',
    'world-stories': 'Riding culture',
    'indian-stories': 'Heritage',
    surprising: 'Engineering',
    'japanese-motorcycle-history': 'Engineering, Heritage',
    features: 'Reviews & comparisons',
    'harley-performance-history': 'Heritage, Engineering',
    'harley-upgrade-guides': 'Ownership',
    design: 'Engineering',
    'more-stories': 'Road & touring',
    explore: 'Riding culture',
    'racing-legends': 'Racing, Heritage'
  };
  const countries = new Set(['Canada','India','Italy','Japan','New Zealand','Portugal','United Kingdom','United States']);
  const entries = [...document.querySelectorAll('.lead-story, main > section .tile')]
    .filter(card => !card.closest('#voices'))
    .flatMap(card => {
      const heading = card.querySelector('h2,h3');
      if (!heading || !card.id) return [];
      const tag = card.querySelector('.tag,.eyebrow')?.textContent.trim() || '';
      const country = tag.split('·')[0].trim();
      return [{
        title: heading.textContent.trim(),
        href: card.dataset.storyUrl || heading.querySelector('a[href^="/global/"]')?.getAttribute('href') ||
          card.querySelector('a[href^="/global/"]')?.getAttribute('href') || '#' + card.id,
        tag,
        country: split(card.dataset.country || (countries.has(country) ? country : '')),
        manufacturer: split(card.dataset.manufacturer),
        topic: split(card.dataset.topics || groupTopics[card.closest('section').id])
      }];
    });
  const url = new URL(location.href);
  const pageSize = 8;
  let limit = pageSize;

  for (const field of fields) {
    const values = [...new Set(entries.flatMap(entry => entry[field]))].sort((a,b) => a.localeCompare(b,'en-GB'));
    for (const value of values) controls[field].add(new Option(value,value));
    const requested = url.searchParams.get(field);
    if (values.includes(requested)) controls[field].value = requested;
  }

  function render() {
    const matches = entries.filter(entry => fields.every(field => !controls[field].value || entry[field].includes(controls[field].value)));
    status.textContent = matches.length === 0 ? 'No matching stories. Try clearing a filter.' :
      `${matches.length} ${matches.length === 1 ? 'story' : 'stories'} found`;
    list.replaceChildren(...matches.slice(0,limit).map(entry => {
      const row = document.createElement('li');
      const link = document.createElement('a');
      link.href = entry.href;
      link.textContent = entry.title;
      row.append(link);
      if (entry.tag) {
        const label = document.createElement('small');
        label.textContent = entry.tag;
        row.append(label);
      }
      return row;
    }));
    more.hidden = matches.length <= limit;
  }

  function filter() {
    for (const field of fields) {
      const value = controls[field].value;
      if (value) url.searchParams.set(field,value);
      else url.searchParams.delete(field);
    }
    url.hash = 'story-finder';
    history.replaceState(history.state,'',url);
    limit = pageSize;
    render();
  }

  form.addEventListener('change',filter);
  form.addEventListener('submit',event => {
    event.preventDefault();
    filter();
  });
  form.addEventListener('reset',event => {
    event.preventDefault();
    for (const field of fields) controls[field].value = '';
    filter();
  });
  more.addEventListener('click',() => {
    const firstNew = limit;
    limit += pageSize;
    render();
    list.children[firstNew]?.querySelector('a').focus();
  });
  form.hidden = false;
  render();
})();

const loadVideo = document.getElementById('load-global-video');
loadVideo?.addEventListener('click',() => {
  const frame = document.createElement('iframe');
  frame.src = 'https://www.youtube-nocookie.com/embed/uYNfleLjobs?autoplay=1';
  frame.title = 'Inside Japan’s Forgotten Coastal Paradise by Itchy Boots';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  loadVideo.replaceWith(frame);
  frame.focus();
});
