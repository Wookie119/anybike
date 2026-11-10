/**
 * AnyBike canonical public stock identity contract.
 * No name/substring/trim fallback is permitted for a published model page.
 * The public feed MUST have already applied its normal buyer-entitlement rules.
 * Only verified canonical IDs supplied by the trusted endpoint can be matched.
 */
export const validCatalogueId = value =>
  (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) ||
  (typeof value === 'string' && /^[1-9][0-9]*$/.test(value) && Number.isSafeInteger(Number(value)));
export function canonicalStockMatches(item, page) {
  if (!item || !page || !validCatalogueId(page.catalog_model_id) ||
      !validCatalogueId(item.catalog_model_id)) return false;
  if (Number(item.catalog_model_id) !== Number(page.catalog_model_id)) return false;
  if (item.catalogue_identity_status !== 'verified') return false;
  // A verified ID must not silently override a contradictory advert model label.
  // When both labels are supplied, require exact normalized model identity;
  // missing labels may be legitimate for old feeds and are not used to infer IDs.
  const normalize = value => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (typeof page.model_name === 'string' && page.model_name.trim() &&
      typeof item.model === 'string' && item.model.trim() &&
      normalize(page.model_name) !== normalize(item.model)) return false;
  if (typeof page.manufacturer_name === 'string' && page.manufacturer_name.trim() &&
      typeof item.make === 'string' && item.make.trim() &&
      normalize(page.manufacturer_name) !== normalize(item.make)) return false;
  // The endpoint has final authority over publication, permissions and available listings.
  if (item.publication_eligible !== true) return false;
  // The listing route accepts a positive integer stock ID. Arbitrary values
  // would create unusable or misleading motorcycle detail links.
  return validCatalogueId(item.item_id);
}
export function stockForCanonicalModel(items, page, limit = 6) {
  if (!Array.isArray(items)) return [];
  const bounded = Number.isSafeInteger(limit) ? Math.max(0, Math.min(limit, 24)) : 6;
  const seen = new Set();
  return items.filter(item => {
    if (!canonicalStockMatches(item, page)) return false;
    const id = String(item.item_id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  }).slice(0, bounded);
}
