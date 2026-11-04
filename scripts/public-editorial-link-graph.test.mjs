import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPublicLinkGraph } from './public-editorial-link-graph.mjs';

const pages = [
  { id: 'bmw', type: 'manufacturer', title: 'BMW', url: '/bmw-motorcycles.html', published: true },
  { id: 'gs', type: 'model', title: 'BMW R 1300 GS', url: '/bmw-r1300gs.html', published: true },
  { id: 'ke', type: 'country', title: 'Kenya', url: '/markets/kenya.html', published: true },
  { id: 'draft', type: 'global', title: 'Unpublished story', url: '/anybike-global-draft.html', published: false }
];
test('approved public relationships are bidirectional, deduplicated and sorted', () => {
  const r = buildPublicLinkGraph({
    pages,
    relations: [
      { from: 'bmw', to: 'gs', type: 'manufacturer-model', approved: true },
      { from: 'bmw', to: 'gs', type: 'manufacturer-model', approved: true },
      { from: 'gs', to: 'ke', type: 'model-country', approved: true },
      { from: 'gs', to: 'draft', type: 'related-story', approved: true }
    ]
  });
  assert.equal(r.pages.length, 3);
  const byId = Object.fromEntries(r.pages.map(p => [p.id,p]));
  assert.equal(byId.bmw.links.length, 1);
  assert.equal(byId.bmw.links[0].id, 'gs');
  assert.equal(byId.gs.links.length, 2);
  assert.equal(byId.ke.links[0].id, 'gs');
  assert.ok(r.diagnostics.some(d => d.code === 'unpublished-relation-endpoint'));
  assert.equal(JSON.stringify(r).includes('Unpublished story'), false);
});
test('unapproved relations are ignored', () => {
  const r = buildPublicLinkGraph({ pages, relations: [{ from: 'bmw', to: 'ke', approved: false }] });
  assert.equal(r.pages.reduce((n,p) => n+p.links.length,0), 0);
});
test('unverified URL, external URL, duplicate path and unpublished pages are excluded', () => {
  const r = buildPublicLinkGraph({ pages: [
    ...pages,
    { id: 'evil', type: 'global', title: 'External', url: 'https://example.com/a.html', published: true },
    { id: 'query', type: 'global', title: 'Unverified', url: '/story.html?draft=1', published: true },
    { id: 'dup', type: 'model', title: 'Duplicate BMW', url: '/bmw-motorcycles.html', published: true }
  ] });
  assert.deepEqual(r.pages.map(p=>p.id).sort(), ['bmw','gs','ke']);
  assert.equal(r.diagnostics.length, 3);
});
test('empty graph does not invent links', () => {
  assert.deepEqual(buildPublicLinkGraph(), {pages:[],diagnostics:[]});
});
