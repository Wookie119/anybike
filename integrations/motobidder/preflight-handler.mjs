import { createHash, timingSafeEqual } from "node:crypto";
import { validateMotobidderBooking } from "./validate-booking.mjs";

const json=(status,body)=>({status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"},body});
const MAX_JSON_BYTES=20000;
function tokenMatches(candidate,expected){
 if(!candidate||!expected||expected.length<32)return false;
 const hash=s=>createHash("sha256").update(s).digest();
 return timingSafeEqual(hash(candidate),hash(expected));
}
/**
 * Restricted, framework-independent validation route.
 * Caller must enforce TLS, rate limiting and body-size limits before buffering.
 * This does NOT create customers, shipments, or send Quick Send messages.
 */
export function handlePreflight({method,authorization,rawBody,sharedSecret}){
 if(method!=="POST")return json(405,{error:"method_not_allowed"});
 const bearer=typeof authorization==="string"&&authorization.startsWith("Bearer ")?authorization.slice(7):"";
 if(!tokenMatches(bearer,sharedSecret))return json(401,{error:"unauthorized"});
 if(typeof rawBody!=="string"||Buffer.byteLength(rawBody,"utf8")>MAX_JSON_BYTES)return json(413,{error:"invalid_body_size"});
 let booking;
 try{booking=JSON.parse(rawBody);}catch{return json(400,{error:"invalid_json"});}
 const result=validateMotobidderBooking(booking);
 return json(result.valid?200:422,{
  status:result.valid?"preflight_review_required":"preflight_rejected",
  booking_reference:typeof booking?.transport_booking_id==="string"?booking.transport_booking_id:null,
  errors:result.errors,review:result.review,ready_to_submit:false,
  // Reference proposal only; no persistent reservation or idempotency ledger yet.
  idempotency_key:result.idempotency_key
 });
}
