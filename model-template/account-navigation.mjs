const localPage = /^\/[a-z0-9-]+\.html(?:#[a-z0-9-]+)?$/;

export function applyNavigation(doc, menu, language, logoutLinks = []) {
  const label = entry => entry.labels[language] || entry.labels.en;
  const makeLink = entry => {
    const link = doc.createElement('a');
    link.href = entry.path;
    link.textContent = label(entry);
    return link;
  };
  const entries = menu.items.filter(entry => entry.labels?.en && (!entry.path || localPage.test(entry.path)));
  for (const item of entries.filter(entry => entry.section === 'public')) {
    doc.querySelectorAll('[data-navigation-key="'+item.key+'"]').forEach(link => {
      link.href = item.path;
      link.textContent = label(item);
    });
  }
  const guest = menu.audience === 'guest';
  const ids = guest ? ['loggedOutMenu','mobileLoggedOutMenu'] : ['loggedInMenu','mobileLoggedInMenu'];
  ids.forEach((id, index) => {
    const host = doc.getElementById(id);
    if (!host) return;
    const groups = doc.createDocumentFragment();
    const account = entries.filter(entry => entry.section !== 'public');
    if (menu.audience === 'uk_dealer') {
      const wrapper = doc.createElement('div');
      wrapper.className = 'anybike-dealer-account-groups';
      for (const heading of account.filter(entry => entry.section.endsWith('_heading'))) {
        const group = doc.createElement('section');
        group.className = 'anybike-dealer-account-group';
        const title = doc.createElement('strong');
        title.textContent = label(heading);
        group.append(title);
        const section = heading.section.replace('_heading','');
        for (const entry of account.filter(entry => entry.path && entry.section === section)) group.append(makeLink(entry));
        wrapper.append(group);
      }
      groups.append(wrapper);
    } else {
      for (const entry of account.filter(entry => entry.path)) groups.append(makeLink(entry));
    }
    if (!guest && logoutLinks[index]) groups.append(doc.createElement('hr'),logoutLinks[index]);
    host.replaceChildren(groups);
  });
}

export async function loadNavigation(client, user, logoutLinks, language) {
  const {data,error} = await client.rpc('public_anybike_navigation_v1');
  if (error || !Array.isArray(data?.items) || (data.audience === 'guest') !== !user) return;
  const render = lang => applyNavigation(document,data,lang,logoutLinks);
  render(window.anybikeLanguage || language);
  window.addEventListener('anybikeLanguageChanged', event => render(event.detail.language));
}
