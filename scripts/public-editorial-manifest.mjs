/**
 * Gate Supabase editorial identities against the audited HTML source inventory.
 *
 * The URL inventory is repository evidence only: it cannot establish that
 * 123-reg has published the page. The caller must separately confirm deployment.
 * No page is published merely because it is in the sitemap or in Supabase.
 *
 * identity records: {id, type, title, url, published:true, liveVerified:true}
 * IDs are namespaced: manufacturer:15, model:72, country:KE, global:8.
 *
 * The output can be passed to graphFromCatalogueRows() and never contains
 * unapproved identities or inferred URLs.
 */
const TYPES = new Set(['manufacturer', 'model', 'country', 'global']);
const IDS = /^(manufacturer|model|country|global):[A-Za-z0-9_-]+$/;
export function makePublicEditorialManifest({ inventory, identities=[] } = {}) {
  const diagnostics = [];
  const candidates = new Map();
  const duplicatedSourceUrls = new Set();
  for (const row of inventory?.candidates ?? []) {
    if (!row?.sourceEligible || typeof row.url !== 'string') continue;
    if (duplicatedSourceUrls.has(row.url)) continue;
    if (candidates.has(row.url)) {
      diagnostics.push({code:'duplicate-source-url',url:row.url});
      duplicatedSourceUrls.add(row.url);
      candidates.delete(row.url);
      continue;
    }
    candidates.set(row.url,row);
  }
  const pages=[];
  const seenIds=new Set();
  const seenUrls=new Set();
  for (const p of identities) {
    // Distinguish editorial approval from independently confirmed deployment.
    if (p?.published !== true || p?.liveVerified !== true) continue;
    if (typeof p.id !== 'string' || !IDS.test(p.id) ||
      !TYPES.has(p.type) || !p.id.startsWith(p.type+':') ||
      typeof p.title !== 'string' || !p.title.trim() ||
      typeof p.url !== 'string') {
      diagnostics.push({code:'invalid-identity',id:p?.id??null});
      continue;
    }
    const source = candidates.get(p.url);
    if (!source || source.type !== p.type) {
      diagnostics.push({code:'not-source-eligible',id:p.id,url:p.url});
      continue;
    }
    if (seenIds.has(p.id) || seenUrls.has(p.url)) {
      diagnostics.push({code:'duplicate-public-identity',id:p.id,url:p.url});
      continue;
    }
    seenIds.add(p.id);
    seenUrls.add(p.url);
    pages.push({id:p.id,type:p.type,title:p.title.trim(),url:new URL(p.url).pathname,published:true});
  }
  pages.sort((a,b)=>a.url.localeCompare(b.url));
  return {pages, diagnostics};
}
