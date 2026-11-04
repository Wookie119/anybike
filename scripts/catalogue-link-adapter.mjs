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
  modelRelationships = []
} = {}) {
  const relationRows = [];
  const publishedStories = new Set(
    globalStories.filter(s => s?.editorial_status === 'published' &&
      publicPages.some(p => p.id === id('global', s.id) &&
        p.published === true && p.url === s.story_url))
      .map(s => String(s.id))
  );
  for (const row of countryLinks) {
    if (row?.is_published !== true) continue;
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
    if (!publishedStories.has(String(row?.story_id))) continue;
    relationRows.push({
      from: id('global', row.story_id),
      to: id('manufacturer', row.manufacturer_id),
      type: 'story-manufacturer', approved: true
    });
  }
  for (const row of modelRelationships) {
    if (!VALID_REVIEW.has(row?.review_status)) continue;
    relationRows.push({
      from: id('model', row.parent_model_id),
      to: id('model', row.child_model_id),
      type: row.relationship_type || 'related-model',
      approved: true
    });
  }
  return buildPublicLinkGraph({ pages: publicPages, relations: relationRows });
}
