const api = 'https://tuehtnezhdnkqbbhttgp.supabase.co/rest/v1/';
const headers = {apikey: 'sb_publishable_mrkBKDxEPVmdj2n7gPWsbg_l4CShtcK'};
const directory = document.querySelector('[data-popular-guides]');
const groups = Array.from(document.querySelectorAll('[data-guide-categories]'));

async function read(url, options = {}) {
  const response = await fetch(url, {...options, signal: AbortSignal.timeout(8000)});
  if (!response.ok) throw new Error('Guide directory unavailable');
  return response.json();
}

function link(model, pill = false) {
  const a = document.createElement('a');
  a.href = model.url;
  a.textContent = model.make + ' ' + model.model + (pill ? ' →' : '');
  return a;
}

async function populate() {
  const [index, registry, featured] = await Promise.all([
    read(api + 'rpc/public_anybike_universal_model_index_v1', {headers}),
    read('/data/universal-v2-model-routes.json'),
    directory ? read(api + 'anybike_popular_model_guides_v1?select=model_id&order=position', {headers}) : []
  ]);
  const paths = new Map(registry.models.filter(row => /^\/models\/[a-z0-9-]+\/[a-z0-9-]+\.html$/.test(row.url)).map(row => [row.model_id, row.url]));
  const models = index.filter(row => paths.has(row.model_id)).map(row => ({...row, url: paths.get(row.model_id)}));
  if (directory) {
    const byId = new Map(models.map(row => [row.model_id, row]));
    const links = featured.map(row => byId.get(row.model_id)).filter(Boolean).map(row => link(row, true));
    if (links.length) directory.replaceChildren(...links);
  }
  for (const group of groups) {
    const categories = group.dataset.guideCategories.split('|');
    const matches = models.filter(row => categories.includes(row.category));
    const list = group.querySelector('ul');
    if (!matches.length || !list) continue;
    list.replaceChildren(...matches.map(row => {
      const item = document.createElement('li');
      item.append(link(row));
      return item;
    }));
  }
}

if (directory || groups.length) populate().catch(() => {});
