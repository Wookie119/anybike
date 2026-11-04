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
import { regionalMarketNavigation } from './regional-market-navigation.mjs';

const VALID_REVIEW = new Set(['approved', 'verified', 'published']);
const id = (kind, value) => kind + ':' + String(value);

export function graphFromCatalogueRows({
  publicPages = [],
  countryLinks = [],
  globalStories = [],
  storyManufacturers = [],
  modelRelationships = [],
  manufacturers = [],
  models = [],
  regionalCountryRoutes = []
} = {}) {
  const relationRows = [];
  // A partial rollout must never create phantom relations to unverified pages.
  const publishedNodes = new Set(publicPages.filter(p=>p?.published===true).map(p=>p.id));
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
    if (!publishedNodes.has(id('manufacturer',makeId)) || !publishedNodes.has(id('model',model.id))) continue;
    relationRows.push({from:id('manufacturer',makeId),to:id('model',model.id),type:'manufacturer-model',approved:true});
  }
  // Regional directory links use only fully approved & live-verified
  // country routes. They DO NOT imply motorcycle availability in a country.
  const regional = regionalMarketNavigation({
    routes: regionalCountryRoutes, mode: 'published', maxLinks: 6
  });
  for (const page of regional.pages) {
    if (!publishedNodes.has(page.id)) continue;
    for (const link of page.links) {
      if (!publishedNodes.has(link.id)) continue;
      relationRows.push({
        from: page.id,to:link.id,
        type:'regional-country-navigation',approved:true
      });
    }
  }
  // Build a precise country-code to canonical country-slug crosswalk from
  // fully verified *published* private routes. Country display names, ISO
  // codes and geographic region are independent fields, never guessed.
  const countryByCode=new Map(),ambiguousCodes=new Set();
  if (regionalCountryRoutes.length) {
    const verifiedRegions=new Set(regional.pages.map(p=>p.id));
    for (const route of regionalCountryRoutes) {
      const code=String(route?.country_code||'').trim().toUpperCase();
      const slug=String(route?.country_slug||'');
      const pageId=id('country',slug);
      if (!/^[A-Z]{2}$/.test(code) || !verifiedRegions.has(pageId) ||
          !publishedNodes.has(pageId) ||
          !publicPages.some(p=>p.id===pageId && p.published===true &&
            p.url===route.public_path))continue;
      if (countryByCode.has(code))ambiguousCodes.add(code);
      else countryByCode.set(code,route);
    }
    for (const code of ambiguousCodes)countryByCode.delete(code);
  }
  const publishedStories = new Set(
    globalStories.filter(s => s?.editorial_status === 'published' &&
      publicPages.some(p => p.id === id('global', s.id) &&
        p.published === true && p.url === s.story_url))
      .map(s => String(s.id))
  );
  for (const row of countryLinks) {
    if (row?.is_published !== true || row.model_id == null || !String(row.country_code ?? '').trim()) continue;
    // When the private country registry is supplied, require an exact
    // published code + canonical slug + relationship URL match. Legacy code
    // IDs remain supported ONLY when no private route registry is supplied.
    const code=String(row.country_code).trim().toUpperCase();
    let countryId;
    if (regionalCountryRoutes.length) {
      const record=countryByCode.get(code);
      if (!record || record.public_path!==row.market_url)continue;
      countryId=id('country',record.country_slug);
    } else {
      countryId=id('country',code);
    }
    const country = publicPages.find(p => p.id === countryId &&
      p.published === true && p.url === row.market_url);
    if (!country || !publishedNodes.has(id('model',row.model_id))) continue;
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
