#!/usr/bin/env node
/**
 * AnyBike public-page link audit.
 * Read-only. Runs on a repository checkout with Node.js 20+:
 *   node scripts/audit-public-links.mjs
 *   node scripts/audit-public-links.mjs --strict
 *   node scripts/audit-public-links.mjs --json
 *
 * Deliberately scans HTML source rather than pretending to test JS-generated
 * links, Supabase publication policies, live hosting, or responsive rendering.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const strict = process.argv.includes('--strict');
const json = process.argv.includes('--json');
const SKIP_DIRS = new Set(['.git', 'node_modules', '.next', 'dist', 'build', '.vercel', 'coverage']);
const PUBLIC_FAMILIES = [
  /^markets\/[^/]+\.html$/i,
  /^(?:bmw|harley-davidson)-motorcycles\.html$/i,
  /^motorcycle-manufacturers\.html$/i,
  /^anybike-global(?:\/.*)?\.html$/i,
  /^motorcycle-models\.html$/i
];
const allFiles = new Set();
const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
    } else if (entry.isFile()) {
      const rel = path.relative(root, path.join(dir, entry.name)).replaceAll(path.sep, '/');
      allFiles.add(rel);
      if (/\.html?$/i.test(rel)) htmlFiles.push(rel);
    }
  }
}
walk(root);

const missing = [];
const byFamily = {};
const incoming = new Map();
const pageData = [];
const external = new Set();
const dynamic = [];
const htmlSet = new Set(htmlFiles);
const isFamily = (p) => PUBLIC_FAMILIES.some((re) => re.test(p));
function attrs(html, tag) {
  const results = [];
  const tagRe = new RegExp('<' + tag + '\\b[^>]*>', 'gi');
  for (const match of html.matchAll(tagRe)) {
    const src = match[0];
    const found = src.match(/\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (found) results.push(found[1] ?? found[2] ?? found[3]);
  }
  return results;
}
function resolveLink(from, raw) {
  const value = raw.trim();
  if (!value || value.startsWith('#')) return null;
  if (/^(?:mailto:|tel:|sms:|javascript:|data:|blob:)/i.test(value)) return null;
  if (/\$\{|{{|<%|\+/.test(value)) return { dynamic: true };
  let url;
  try { url = new URL(value, 'https://www.anybike.co.uk/' + from); }
  catch { return { dynamic: true }; }
  if (!['anybike.co.uk', 'www.anybike.co.uk'].includes(url.hostname)) {
    external.add(url.hostname); return null;
  }
  let target;
  try { target = decodeURIComponent(url.pathname).replace(/^\/+/, ''); }
  catch { return { dynamic: true }; }
  if (!target || target.endsWith('/')) target += 'index.html';
  if (target.includes('..')) return { dynamic: true };
  return { target };
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const links = attrs(html, 'a');
  const targets = new Set();
  for (const href of links) {
    const resolved = resolveLink(file, href);
    if (!resolved) continue;
    if (resolved.dynamic) { dynamic.push({ source: file, href }); continue; }
    const { target } = resolved;
    targets.add(target);
    incoming.set(target, (incoming.get(target) ?? 0) + 1);
    if (!allFiles.has(target) && !allFiles.has(target + '/index.html')) {
      missing.push({ source: file, href, target });
    }
  }
  const family = isFamily(file) ? 'selected-public' : 'other-html';
  byFamily[family] ??= { pages: 0, staticLinks: 0 };
  byFamily[family].pages++;
  byFamily[family].staticLinks += targets.size;
  pageData.push({ file, family, links: targets.size });
}

const orphanCandidates = htmlFiles.filter((file) => isFamily(file) && !incoming.has(file));
const result = {
  generatedAt: new Date().toISOString(),
  scope: 'Repository static HTML links only; NOT live hosting, JS links, database data, or mobile rendering',
  htmlPages: htmlFiles.length,
  familyCounts: byFamily,
  missingLinkCount: missing.length,
  missingLinks: missing,
  selectedPublicPagesWithNoIncomingStaticLinks: orphanCandidates,
  dynamicLinkCandidates: dynamic.slice(0, 100),
  externalHostCount: external.size
};
if (json) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
else {
  console.log('AnyBike source link audit: ' + htmlFiles.length + ' HTML files');
  console.log('Broken local HTML links: ' + missing.length);
  console.log('Selected public pages with no incoming static links: ' + orphanCandidates.length);
  for (const item of missing.slice(0, 60)) console.log('MISSING ' + item.source + ' -> ' + item.target);
  for (const file of orphanCandidates.slice(0, 40)) console.log('NO INCOMING STATIC LINK ' + file);
  if (missing.length > 60) console.log('Additional missing links omitted; run --json');
  console.log('NOTE: Dynamic content, Supabase links, live publication, mobile and RLS require separate checks.');
}
if (strict && missing.length) process.exitCode = 1;
