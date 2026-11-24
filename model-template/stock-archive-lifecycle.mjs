// Pure shared lifecycle contract. Server must supply verified rights and public eligibility.
// No source credentials, seller data, prices or original image URLs belong here.
const id = v => Number.isSafeInteger(v) && v > 0;
export function stockLifecycle(item) {
  if (!item || !id(item.item_id) || item.publication_permission !== true ||
      item.channel_eligible !== true || item.excluded === true) return 'withdrawn';
  if (item.source_status === 'live') return item.reserved === true ? 'reserved' : 'available';
  if (item.source_status === 'ended' && item.removal_confirmed === true &&
      item.archive_permission === true && item.substantive_content === true) return 'archived';
  return 'withdrawn';
}
export function stockSitemapEligible(item) {
  return stockLifecycle(item) !== 'withdrawn' && item.indexing_permission === true &&
    item.substantive_content === true && item.canonical_ready === true;
}
export function similarStock(target, candidates, relationships = {}, limit = 24) {
  if (!id(target?.catalog_model_id)) return [];
  const exact = target.catalog_model_id;
  const variants = new Set(relationships.variants || []);
  // Only explicitly related catalogue models, never every model of a manufacturer.
  const related = new Set(relationships.relatedModels || []);
  const comparable = new Set(relationships.comparable || []);
  const seen = new Set();
  const ranked = [];
  for (const bike of candidates || []) {
    if (!id(bike?.item_id) || bike.item_id === target.item_id ||
        bike.publication_eligible !== true || bike.catalogue_identity_status !== 'verified' ||
        bike.source_status !== 'live' || bike.reserved === true || !id(bike.catalog_model_id) ||
        seen.has(bike.item_id)) continue;
    const model = bike.catalog_model_id;
    const rank = model === exact ? 0 : variants.has(model) ? 1 :
      related.has(model) ? 2 : comparable.has(model) ? 3 : -1;
    if (rank < 0) continue;
    seen.add(bike.item_id);
    ranked.push({bike, rank});
  }
  return ranked.sort((a,b) => a.rank-b.rank || a.bike.item_id-b.bike.item_id)
    .slice(0, Math.max(0, Math.min(100, Number(limit)||0))).map(x => x.bike);
}
