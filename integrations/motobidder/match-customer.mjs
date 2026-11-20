/**
 * Safe read-only customer match for Logxa GET /admin/customers.
 * Never creates/activates accounts or shares authentication tokens.
 */
const normalizeEmail = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
const normalizePhone = (value) => typeof value === "string" ? value.replace(/[^+\d]/g,"") : "";
export function resolveExistingMoveCustomer({email,phone}, response) {
  const wanted = normalizeEmail(email);
  if (!wanted || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wanted))
    return {state:"invalid",reason:"Valid email required before lookup"};
  if (!response || response.status !== "success" || !Array.isArray(response.customers))
    return {state:"lookup_failed",reason:"Customer lookup must return an authenticated success response"};
  const matches = response.customers.filter(c =>
    c && Number.isSafeInteger(c.id) && c.id>0 && normalizeEmail(c.email) === wanted);
  if (matches.length === 0) return {state:"new",reason:"No exact email match; confirm no conflicting dealer record before account creation"};
  if (matches.length > 1) return {state:"review_required",reason:"Multiple exact email matches; never choose automatically"};
  const c = matches[0];
  const requestedPhone = normalizePhone(phone);
  const knownPhone = normalizePhone(c.phone);
  // A mismatched phone may be stale data rather than fraud, but requires admin
  // review before silently reassigning an existing customer.
  if (requestedPhone && knownPhone && requestedPhone !== knownPhone)
    return {state:"review_required",reason:"Email matched but phone differs",customer_id:c.id};
  return {state:"existing",customer_id:c.id};
}
