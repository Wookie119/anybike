#!/usr/bin/env node
// Run from repository root: node scripts/check-approved-v2-route-identity.mjs
// Check exact BMW/Harley identities before any dedicated page adopts V2.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolveApprovedV2Identity,normalizeModelIdentity} from '../model-template/approved-v2-route-identity.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const rows=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
const renderer=read('model-template/approved-v2-universal-preview.mjs');
const protectedPaths=new Set(['/bmw-r1300gs.html','/bmw-r1300gs-v2.html','/bmw-r1300gs-v2-approved-20261102.html']);
assert(Array.isArray(rows)&&rows.length>0);
const seen=new Set();
for(const row of rows){
 assert(!seen.has(row.url),'Duplicate approved URL '+row.url);seen.add(row.url);
 assert(existsSync(new URL('../'+row.url.slice(1),import.meta.url)), 'Missing existing dedicated page '+row.url);
 const match=resolveApprovedV2Identity(row.url,rows);
 assert(match,'Approved page must resolve uniquely: '+row.url);
 assert.equal(normalizeModelIdentity(match.make),normalizeModelIdentity(row.make));
 assert.equal(normalizeModelIdentity(match.model),normalizeModelIdentity(row.model));
}
for(const unsafe of ['/motorcycle-model-guide.html','/motorcycle-brand.html','/harley-davidson-.html','/bmw-../admin.html','/bmw-missing.html']){
 assert.equal(resolveApprovedV2Identity(unsafe,rows),null,'Unapproved URL must fail closed: '+unsafe);
}
assert.equal(resolveApprovedV2Identity(rows[0].url,[...rows,rows[0]]),null,'Duplicate route registration must fail closed');
assert.match(renderer,/approvedDedicatedRoute=identity\.url/);
assert.match(renderer,/new URL\(approvedDedicatedRoute,location\.origin\)/);
assert.match(renderer,/Dedicated model route\/query conflict/);
assert.match(renderer,/public_anybike_manufacturer_catalogue_names_v1/);
assert.match(renderer,/stockForCanonicalModel/);
for(const protectedPath of protectedPaths){
 assert(!renderer.includes("location.replace('"+protectedPath+"')"));
}
console.log('PASS approved dedicated V2 route identities: '+rows.length+' pages; duplicate, unknown, conflicting and canonical guards');
