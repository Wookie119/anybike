/**
 * Motobidder -> Move: preflight validation. Safe, pure code; DOES NOT create
 * shipments, customers, send notifications, or calculate unpublished zones.
 * A restricted server endpoint must perform authentication and idempotency.
 */
const RATE_INC_VAT = Object.freeze({
  mainland: 199,
  glasgow_edinburgh: 299,
  above_glasgow_edinburgh: 349,
  above_inverness: 389,
});
const MONEY_SCALE = 100;
const text = (v) => typeof v === "string" ? v.trim() : "";
const postcode = (v) => text(v).toUpperCase().replace(/\s+/g, "");
const mobile = (v) => text(v).replace(/[\s()-]/g, "");
const validMobile = (v) => /^(?:\+44(?:7\d{9})|07\d{9})$/.test(mobile(v));
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(v)) && text(v).length <= 254;
const ukPostcode = (v) => /^(GIR0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}))$/.test(postcode(v));
// Certain island/overseas postcode prefixes are unambiguously outside UK mainland.
// This list is intentionally not comprehensive: every other route must still
// pass an authoritative mainland coverage check before booking.
const definitelyExcluded = (v) => {
  const code = postcode(v);
  if (/^(?:BT|IM|JE|GY|HS|ZE)/.test(code)) return true;
  const match = /^PO(\d{1,2})/.exec(code);
  return !!match && Number(match[1]) >= 30 && Number(match[1]) <= 41;
};
const isoDate = (v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text(v))) return false;
  const d = new Date(v+"T12:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === v;
};
function validateParty(p, role, errors) {
  if (!p || typeof p !== "object" || Array.isArray(p)) { errors.push(role+" must be an object"); return; }
  for (const k of ["dealership","contact_name","email","mobile","street_address","city","postcode"]) {
    if (!text(p[k])) errors.push(role+"."+k+" is required");
  }
  if (text(p.email) && !validEmail(p.email)) errors.push(role+".email invalid");
  if (text(p.mobile) && !validMobile(p.mobile)) errors.push(role+".mobile must be a UK mobile");
  if (text(p.postcode) && !ukPostcode(p.postcode)) errors.push(role+".postcode invalid");
  if (text(p.postcode) && definitelyExcluded(p.postcode)) errors.push(role+".postcode is outside covered UK mainland");
  if (text(p.country).toUpperCase() !== "UNITED KINGDOM") errors.push(role+".country must be United Kingdom");
}
function pennyAmount(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  const pennies = Math.round(value * MONEY_SCALE);
  return Math.abs(value * MONEY_SCALE - pennies) < 1e-7 ? pennies : null;
}
/** Returns a review-only result until rate-zone approvals and Logxa payer/charge encoding are confirmed. */
export function validateMotobidderBooking(booking) {
  const errors = [], review = [];
  if (!booking || typeof booking !== "object" || Array.isArray(booking)) return {valid:false,ready_to_submit:false,errors:["Booking body must be an object"],review:[]};
  for (const key of ["auction_sale_id","transport_booking_id"]) {
    if (!text(booking[key]) || text(booking[key]).length > 120) errors.push(key+" is required (max 120 characters)");
  }
  if (!booking.motorcycle || typeof booking.motorcycle !== "object") errors.push("motorcycle is required");
  else {
    if (!text(booking.motorcycle.make)) errors.push("motorcycle.make is required");
    if (!text(booking.motorcycle.model)) errors.push("motorcycle.model is required");
    if (!text(booking.motorcycle.registration) && !text(booking.motorcycle.vin)) errors.push("motorcycle registration or VIN required");
  }
  validateParty(booking.sender,"sender",errors);
  validateParty(booking.receiver,"receiver",errors);
  if (!isoDate(booking.ready_date)) errors.push("ready_date must be a valid YYYY-MM-DD date");
  if (!["sender","receiver"].includes(booking.payer)) errors.push("payer must be sender or receiver");
  if (booking.currency !== "GBP") errors.push("currency must be GBP");
  if (booking.vat_included !== true) errors.push("vat_included must be true; all agreed rates include VAT");
  const pence = pennyAmount(booking.freight_inc_vat);
  if (pence === null) errors.push("freight_inc_vat must be a non-negative 2-decimal number");
  const expected = Object.hasOwn(RATE_INC_VAT,booking.rate_band) ? RATE_INC_VAT[booking.rate_band] : undefined;
  if (expected === undefined) errors.push("rate_band must identify an agreed mainland rate");
  else if (pence !== null && pence !== expected*100) errors.push("freight_inc_vat does not match agreed inclusive-VAT rate band");
  // All islands are excluded; never automatically assert a mainland route
  // from a UK postcode alone. Exact serviceability & Scottish bands require
  // authoritative postcode coverage, not a guessed prefix threshold.
  review.push("Confirm both postcodes are on covered mainland UK routes (all islands excluded).");
  review.push("Confirm Scottish rate band against approved postcode-zone table.");
  review.push("Logxa payer and charges multipart encoding and readback remain unverified.");
  review.push("Check/activate existing or new buyer and seller accounts via a trusted backend.");
  return {
    valid:errors.length===0,
    ready_to_submit:false,
    errors,review,
    idempotency_key:errors.length===0?"motobidder:"+text(booking.transport_booking_id):null,
    rate_inc_vat:expected??null
  };
}
export {RATE_INC_VAT};
