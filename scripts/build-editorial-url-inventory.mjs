/**
 * Build a conservative, read-only inventory of source HTML candidates.
 * Run: node scripts/build-editorial-url-inventory.mjs
 *
 * This checks repository evidence, NOT 123-reg publication. No database IDs
 * or published=true flags are assigned here; a publisher must verify them.
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.anybike.co.uk';
export function inventoryEditorialUrls(root) {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const locs = new Set([...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
    .map(m => m[1].trim()));
  const files = [];
  const issues = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(path.join(root, dir), {withFileTypes:true})) {
      if (entry.isDirectory()) {
        if (dir === '' && ['.git','node_modules','backups','archive','docs','scripts','reports','supabase','assets','images','.github'].includes(entry.name)) continue;
        walk(path.posix.join(dir, entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(path.posix.join(dir, entry.name));
      }
    }
  }
  walk('');
  const candidates = [];
  const typeFor = p => {
    if (/^markets\/[a-z0-9-]+\.html$/i.test(p)) return 'country';
    if (p === 'bmw-motorcycles.html' || p === 'harley-davidson-motorcycles.html') return 'manufacturer';
    if (p === 'anybike-global.html' || /^global\/[a-z0-9-]+\.html$/i.test(p)) return 'global';
    if (/^(?:bmw|harley-davidson)-[a-z0-9-]+\.html$/i.test(p) && !/backup|draft|preview|test|v2/i.test(p)) return 'model';
    return null;
  };
  for (const file of files) {
    const type = typeFor(file);
    if (!type) continue;
    const expectedUrl = BASE + '/' + file;
    const html = fs.readFileSync(path.join(root, file),'utf8');
    const robots = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]).find(x=>/\bname\s*=\s*["']robots["']/i.test(x)) || '';
    const canon = [...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]).filter(x=>/\brel\s*=\s*["']canonical["']/i.test(x));
    const canonical = canon.length === 1 ? (canon[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ?? '') : '';
    const reasons = [];
    if (!locs.has(expectedUrl)) reasons.push('not-in-sitemap');
    if (canonical !== expectedUrl) reasons.push('canonical-missing-or-mismatch');
    if (/\bnoindex\b/i.test(robots)) reasons.push('noindex');
    if (!/<h1\b/i.test(html)) reasons.push('missing-h1');
    if (/http-equiv\s*=\s*["']refresh["']/i.test(html)) reasons.push('redirect');
    const row = {type, path:file, url:expectedUrl, sourceEligible:reasons.length===0, reasons};
    candidates.push(row);
    if (reasons.length) issues.push(row);
  }
  const seen = new Set(candidates.map(x=>x.url));
  for (const url of locs) {
    if (!url.startsWith(BASE+'/')) continue;
    let p;
    try {p = decodeURIComponent(new URL(url).pathname.slice(1));} catch {continue;}
    if (typeFor(p) && !seen.has(BASE+'/'+p)) issues.push({path:p,url,type:typeFor(p),sourceEligible:false,reasons:['sitemap-references-missing-source']});
  }
  candidates.sort((a,b)=>a.path.localeCompare(b.path));
  issues.sort((a,b)=>a.path.localeCompare(b.path));
  return {
    scope: 'source-only; not proof of deployment or Supabase publication',
    candidates,
    issues,
    counts: {total:candidates.length,eligible:candidates.filter(x=>x.sourceEligible).length,flagged:issues.length}
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.url.replace(/^file:\/\//,''))) {
  const r=inventoryEditorialUrls(process.cwd());
  process.stdout.write(JSON.stringify(r,null,2)+'\n');
}
