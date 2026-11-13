#!/usr/bin/env node
// Protect every Harley's existing public research before true V2 conversion.
// This is a preservation inventory, not permission to auto-publish draft facts
// or reuse a photo without its original licensing and attribution.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveApprovedV2Identity} from '../model-template/approved-v2-route-identity.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const approved=JSON.parse(read('data/approved-dedicated-model-routes.json')).models;
const archive=JSON.parse(read('data/harley-v2-legacy-preservation.json'));
const routes=approved.filter(x=>x.make==='Harley-Davidson');
assert.equal(routes.length,18);
assert.equal(archive.schema_version,1);
assert.equal(archive.publication_status,'migration_snapshot_only_not_automatically_publication_approved');
assert.equal(archive.captured_from_approved_routes,18);
assert.equal(archive.models.length,18);
const seen=new Set();
let sections=0,sourced=0,photos=0;
for(const entry of archive.models){
 assert(!seen.has(entry.url),'Duplicate Harley preserved URL: '+entry.url);seen.add(entry.url);
 const identity=resolveApprovedV2Identity(entry.url,approved);
 assert(identity&&identity.make===entry.make&&identity.model===entry.model,'Cross-model source preservation blocked: '+entry.url);
 assert(/^[a-f0-9]{40}$/.test(entry.source_blob_sha),'Missing original Git file identity: '+entry.url);
 assert(Array.isArray(entry.sections)&&entry.sections.length>0,'Uncaptured research: '+entry.url);
 for(const section of entry.sections){
  assert(section.title&&section.text,'Empty source section: '+entry.url);
  assert(Array.isArray(section.references));
  assert(['requires_reference_review','unverified_preservation_only'].includes(section.source_status));
  if(section.references.length){
   sourced++;
   assert.equal(section.source_status,'requires_reference_review');
   for(const reference of section.references)assert(/^https:\/\//.test(reference),'Unsafe preserved source URL');
  }else assert.equal(section.source_status,'unverified_preservation_only');
  sections++;
 }
 for(const photo of entry.photographs){
  assert(/^https:\/\//.test(photo.image_url),'Photo lacks existing public URL');
  assert(photo.credit_text,'Photo lacks existing attribution');
  assert(Array.isArray(photo.credit_links),'Photo lacks source/licence references');
  photos++;
 }
}
assert.equal(sections,212);
assert.equal(sourced,43);
assert.equal(photos,13);
assert.equal(seen.size,18);
console.log('PASS: all 18 Harley histories preserved, 212 sections, 43 reference-bearing, 13 credited photos; auto-publication prohibited');
