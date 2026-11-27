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

const finder = document.getElementById('story-finder');
const wideLayout = window.matchMedia('(min-width: 1041px)');
function placeFinder(){
  document.getElementById(wideLayout.matches ? 'front-main' : 'finder-home').append(finder);
}
wideLayout.addEventListener('change',placeFinder);
placeFinder();

const spotlight = document.getElementById('lead-spotlight');
const choices = document.getElementById('lead-choices');
const heritageLead = spotlight.querySelector('.lead-story');
const categories = [['Race report','Racing'],['Model launch','Model launch'],['Rider story','Rider story']];
const latest = [...document.querySelectorAll('#latest .news-item')]
  .sort((a,b)=>b.dataset.published.localeCompare(a.dataset.published));
const editions = categories.flatMap(([tag,label])=>{
  const source = latest.find(article=>article.querySelector('.tag').textContent.endsWith(' · '+tag));
  if(!source) return [];
  const article = document.createElement('article');
  article.className = 'lead-story';
  const photo = source.querySelector('figure').cloneNode(true);
  photo.classList.remove('news-photo');
  photo.querySelector('img').loading = 'eager';
  const copy = source.querySelector('.news-copy').cloneNode(true);
  copy.className = 'lead-copy';
  const heading = document.createElement('h2');
  heading.append(...copy.querySelector('h3').childNodes);
  copy.querySelector('h3').replaceWith(heading);
  const storyLink = document.createElement('a');
  storyLink.className = 'button';
  storyLink.href = heading.querySelector('a').getAttribute('href');
  storyLink.textContent = 'Read the story →';
  const actions = document.createElement('div');
  actions.className = 'link-actions';
  actions.append(storyLink);
  copy.append(actions);
  article.append(photo,copy);
  article.hidden = true;
  spotlight.append(article);
  return [{label,article,date:source.dataset.published}];
}).sort((a,b)=>b.date.localeCompare(a.date));
editions.push({label:'Burt Munro',article:heritageLead});
const buttons = editions.map(({label})=>{
  const button = document.createElement('button');
  button.className = 'pill';
  button.type = 'button';
  button.textContent = label;
  choices.append(button);
  return button;
});
function showLead(selected){
  editions.forEach(({article},index)=>{
    article.hidden = index !== selected;
    buttons[index].setAttribute('aria-pressed',String(index === selected));
  });
}
buttons.forEach((button,index)=>button.addEventListener('click',()=>showLead(index)));
choices.hidden = editions.length < 2;
function revealHeritageLink(){
  if(location.hash !== '#'+heritageLead.id) return false;
  showLead(editions.length-1);
  return true;
}
if(!revealHeritageLink()) showLead(0);
window.addEventListener('hashchange',revealHeritageLink);

const today = new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'});
const events = [...document.querySelectorAll('[data-event-end]')];
for(const event of events) event.hidden = event.dataset.eventEnd < today;
if(events.every(event=>event.hidden)){
  document.getElementById('upcoming-events').hidden = true;
  document.querySelector('.desks a[href="#upcoming-events"]').hidden = true;
}
