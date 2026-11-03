#!/usr/bin/env node
/**
 * AnyBike manufacturer preservation inventory (read-only).
 * Usage: node tools/audit-manufacturer-backups.mjs [repo-root]
 * Requires Node 18+ only; no npm dependencies; no database/network access.
 *
 * Reports headings, static links, image references, and JS-built content markers
 * before ANY migration. It deliberately never modifies source files.
 *
 * NOTE: H2 entries created dynamically by inline JS will not occur as static
 * DOM headings; the required heading count is asserted separately.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(process.argv[2] || '.');
const sources = [
  { file: 'bmw-motorcycles-numbered-backup-20261102.html', expected: 12, brand: 'BMW' },
  { file: 'harley-davidson-motorcycles-numbered-backup-20261102.html', expected: 22, brand: 'Harley-Davidson' }
];
const headings = {
  BMW: [
    [9],[2],[3],[17],[18],[9],[19],[18],[20],[15],[10,11,17],[15]
  ],
  'Harley-Davidson': [
    [9],[2],[3],[4,7],[5,8,10,12],[12,13],[12,17],[5,12,13],[9,16],[5,6,8],[3,6,7],[16,20],[5,16],[17],[18],[9],[19],[18],[20],[15],[10,11,17],[15]
  ]
};
const stripTags = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const hash = s => createHash('sha256').update(s).digest('hex');
const unique = xs => [...new Set(xs)];
let failed = false;
const results = sources.map(({file,expected,brand}) => {
  const src = readFileSync(resolve(root, file), 'utf8');
  const h2 = [...src.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(m=>stripTags(m[1])).filter(h=>/^\d{2}\./.test(h));
  // A known static/dynamic mix: both numbered backup files contain JS-generated
  // credits headings. The exact expected number refers to *all* H2 expressions.
  const actual = h2.length;
  const dynamic = [...src.matchAll(/innerHTML\s*=\s*['\x22`][\s\S]{0,200}?<h2\b/gi)].length;
  const matching = h2.length === expected && h2.every((h,i)=>h.startsWith(String(i+1).padStart(2,'0')+'.'));
  // If a backup contains generated final headings, report that fact rather than
  // interpreting their absence from static HTML as a deleted section.
  const allNumbered = unique([...src.matchAll(/(?:<h2\b[^>]*>[\s\S]*?|'<h2[^>]*>)[\s\S]{0,180}?(\d{2})\.<\/span>/gi)].map(m=>Number(m[1])));
  const anchored = [...src.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map(m=>m[1]);
  const images = [...src.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
  const report = {
    brand,file,source_sha256:hash(src),bytes:Buffer.byteLength(src),
    numbered_static_h2_count:actual,expected_numbered_sections:expected,
    static_numbering_sequential:matching,
    numbering_detected_in_original_source:allNumbered,
    headings:h2.map((title,i)=>({source_section:i+1,title,universal_sections:headings[brand][i]})),
    href_count:anchored.filter(s=>!s.match(/\.(?:png|jpg|jpeg|webp|js|css)$/i)).length,
    source_image_elements:images.length,
    image_missing_alt:images.filter(t=>!/\balt\s*=/.test(t)).length,
    script_references:unique(anchored.filter(x=>/\.js(?:\?|$)/.test(x))),
    global_connector:src.includes('/global-manufacturer-stories.js'),
    related_connector:src.includes('/motorcycle-related-manufacturers.js'),
    inline_photo_credits:src.includes('photo-credits'),
    script_dynamic_h2_detected:dynamic
  };
  if(!matching){failed=true;report.error='Numbered heading sequence or count changed; DO NOT MIGRATE';}
  return report;
});
console.log(JSON.stringify({generated_at:new Date().toISOString(),results},null,2));
if(failed)process.exitCode=1;
