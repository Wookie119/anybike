/**
 * Maps EXISTING Supabase relationship rows into the shared public link graph.
 *
 * No queries, writes, guessed slugs, or direct browser access. The caller is
 * responsible for fetching rows securely, checking public HTML actually exists,
 * and supplying an allowlist of pages with published:true.
 *
 * The only relation sources accepted here are existing AnyBike tables:
 * motorcycle_model_country_links,
 * motorcycle_global_story_manufacturers_v1 + motorcycle_global_stories_v1,
 * motorcycle_catalog_model_relationships.
 */
import { buildPublicLinkGraph } from './public-editorial-link-graph.mjs';

const VALID_REVIEW = new Set(['approved', 'verified', 'published']);
const id = (kind, value) => kind + ':' + String(value);

export function graphFromCatalogueRows({
  publicPages = [],
  countryLinks = [],
  globalStories = [],
  storyManufacturers = [],
  modelRelationships = [],
  manufacturers = [],
  models = []
} = {}) {
  const relationRows = [];
  // Use only canonical names and verified public endpoints; never guess URLs from slugs.
  const normName = value => typeof value === 'string' ? value.trim().toLocaleLowerCase('en-GB').replace(/\s+/g, ' ') : '';
  const makeByName = new Map();
  for (const make of manufacturers) {
    if (make?.id == null || !normName(make.display_name)) continue;
    const key = normName(make.display_name);
    if (makeByName.has(key)) makeByName.set(key, null); // ambiguous manufacturer names must not auto-link
    else makeByName.set(key, make.id);
  }
  for (const model of models) {
    if (model?.id == null) continue;
    const makeId = makeByName.get(normName(model.manufacturer));
    if (makeId == null) continue;
    relationRows.push({from:id('manufacturer',makeId),to:id('model',model.id),type:'manufacturer-model',approved:true});
  }
  const publishedStories = new Set(
    globalStories.filter(s => s?.editorial_status === 'published' &&
      publicPages.some(p => p.id === id('global', s.id) &&
        p.published === true && p.url === s.story_url))
      .map(s => String(s.id))
  );
  for (const row of countryLinks) {
    if (row?.is_published !== true || row.model_id == null || !String(row.country_code ?? '').trim()) continue;
    // Match country code only with an explicitly verified public country URL.
    const countryId = id('country', String(row.country_code ?? '').toUpperCase());
    const country = publicPages.find(p => p.id === countryId &&
      p.published === true && p.url === row.market_url);
    if (!country) continue;
    relationRows.push({
      from: id('model', row.model_id), to: countryId,
      type: 'model-country', approved: true
    });
  }
  for (const row of storyManufacturers) {
    if (row?.story_id == null || row?.manufacturer_id == null || !publishedStories.has(String(row.story_id))) continue;
    relationRows.push({
      from: id('global', row.story_id),
      to: id('manufacturer', row.manufacturer_id),
      type: 'story-manufacturer', approved: true
    });
  }
  for (const row of modelRelationships) {
    if (row?.parent_model_id == null || row?.child_model_id == null || !VALID_REVIEW.has(row?.review_status)) continue;
    relationRows.push({
      from: id('model', row.parent_model_id),
      to: id('model', row.child_model_id),
      type: row.relationship_type || 'related-model',
      approved: true
    });
  }
  return buildPublicLinkGraph({ pages: publicPages, relations: relationRows });
}
