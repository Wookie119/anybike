/**
 * AnyBike public editorial link graph.
 *
 * Pure, side-effect-free helper for future database-to-HTML publishing.
 * The publisher must supply explicit, VERIFIED public URLs and published flags.
 * Never derive public URLs from catalogue slugs or expose draft records.
 *
 * Input: { pages:[{ id, type, title, url, published }],
 *          relations:[{ from, to, type, approved }] }
 * Output: { pages:[{...page, links:[{id,type,title,url,relationship}]}],
 *           diagnostics:[{code,...}] }
 */
const KINDS = new Set(['manufacturer', 'model', 'country', 'global']);
const ALLOWED_PATH = /^(?:\/(?:markets\/[a-z0-9-]+|[a-z0-9-]+)\.html)$/i;
function canonicalPath(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, 'https://www.anybike.co.uk');
    if (url.hostname !== 'www.anybike.co.uk' || url.username || url.password ||
        url.search || url.hash || url.protocol !== 'https:') return null;
    if (value.startsWith('//')) return null;
    if (!ALLOWED_PATH.test(url.pathname)) return null;
    return url.pathname;
  } catch { return null; }
}
export function buildPublicLinkGraph({ pages = [], relations = [] } = {}) {
  const diagnostics = [];
  const nodes = new Map();
  const urls = new Map();
  for (const p of pages) {
    if (p?.published !== true) continue;
    if (!KINDS.has(p.type) || typeof p.id !== 'string' || !p.id ||
        typeof p.title !== 'string' || !p.title.trim()) {
      diagnostics.push({ code: 'invalid-public-page', id: p?.id ?? null });
      continue;
    }
    const url = canonicalPath(p.url);
    if (!url) {
      diagnostics.push({ code: 'unverified-public-url', id: p.id });
      continue;
    }
    if (nodes.has(p.id) || urls.has(url)) {
      diagnostics.push({ code: 'duplicate-public-identity', id: p.id, url });
      continue;
    }
    const node = { id: p.id, type: p.type, title: p.title.trim(), url, links: [] };
    nodes.set(p.id, node);
    urls.set(url, p.id);
  }
  const added = new Set();
  const add = (a, b, relation) => {
    if (a === b) return;
    const key = a.id + '|' + b.id;
    if (added.has(key)) return;
    added.add(key);
    a.links.push({
      id: b.id, type: b.type, title: b.title, url: b.url,
      relationship: relation
    });
  };
  for (const rel of relations) {
    if (rel?.approved !== true) continue;
    const from = nodes.get(rel.from), to = nodes.get(rel.to);
    if (!from || !to) {
      diagnostics.push({ code: 'unpublished-relation-endpoint', from: rel.from, to: rel.to });
      continue;
    }
    const kind = typeof rel.type === 'string' && rel.type.trim() ? rel.type.trim() : 'related';
    add(from, to, kind);
    add(to, from, 'reverse-' + kind);
  }
  const output = [...nodes.values()].sort((a,b) => a.url.localeCompare(b.url));
  for (const node of output) node.links.sort((a,b) => a.title.localeCompare(b.title) || a.url.localeCompare(b.url));
  return { pages: output, diagnostics };
}
