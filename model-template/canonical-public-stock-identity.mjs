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
  // The endpoint has final authority over publication, permissions and available listings.
  if (item.publication_eligible !== true) return false;
  return item.item_id != null && String(item.item_id).length > 0;
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
