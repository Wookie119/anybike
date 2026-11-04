/**
 * Render a safe, crawlable navigation fragment from the approved editorial graph.
 * Intended for BUILD-TIME insertion into static HTML, never browser-side only.
 * The caller must supply pages from assemblePublicEditorialGraph() only.
 *
 * Returns an empty string when no approved related links exist.
 * Does not replace, restyle, or remove any existing page content.
 */
const LABELS = Object.freeze({
  manufacturer: 'Motorcycle manufacturers',
  model: 'Motorcycle model guides',
  country: 'International markets',
  global: 'AnyBike Global stories'
});
const TYPES = ['manufacturer','model','country','global'];
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
));
const safePath = p => typeof p === 'string' &&
  /^\/(?:markets\/[a-z0-9-]+|global\/[a-z0-9-]+|[a-z0-9-]+)\.html(?:#[a-z0-9_-]+)?$/i.test(p);

export function renderEditorialLinksForPage(page) {
  if (!page || !Array.isArray(page.links) || page.links.length === 0) return '';
  const sections = [];
  const seen = new Set();
  for (const type of TYPES) {
    const links = [];
    for (const item of page.links) {
      if (item?.type !== type || !safePath(item.url) || typeof item.title !== 'string' || !item.title.trim()) continue;
      if (item.url === page.url || seen.has(item.url)) continue;
      seen.add(item.url);
      links.push('<a href="' + escapeHtml(item.url) + '">' + escapeHtml(item.title.trim()) + '</a>');
    }
    if (links.length) sections.push('<div class="anybike-related-group"><h3>' + LABELS[type] + '</h3><nav aria-label="' + LABELS[type] + '">' + links.join('') + '</nav></div>');
  }
  if (!sections.length) return '';
  return '<section class="anybike-related-editorial" data-anybike-generated-links="v1" aria-label="Related AnyBike guides"><h2>Explore related motorcycle guides</h2>' + sections.join('') + '</section>';
}
export const EDITORIAL_LINK_CSS = '.anybike-related-editorial{max-width:1380px;margin:24px auto;padding:20px;background:#171717;color:#fff;border:1px solid #ed1c24;border-radius:12px}.anybike-related-editorial h2{font-size:22px;margin:0 0 14px;color:#fff}.anybike-related-group h3{font-size:17px;margin:16px 0 10px;color:#fff}.anybike-related-group nav{display:flex;flex-wrap:wrap;gap:9px}.anybike-related-group a{display:inline-flex;align-items:center;padding:8px 12px;border:1px solid #ed1c24;border-radius:999px;background:#242424;color:#fff;text-decoration:none;font-size:13px;font-weight:700}.anybike-related-group a:hover,.anybike-related-group a:focus-visible{background:#ed1c24;color:#fff}';
