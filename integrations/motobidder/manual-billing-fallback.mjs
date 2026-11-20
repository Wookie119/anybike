/**
 * Motobidder billing-review fallback.
 *
 * The date and payer fields are documented by Logxa, but this returns a
 * non-submittable draft until Move confirms the booking-date wire field.
 * Other fields use Logxa shipment/create and the tenant custom IDs. The custom price IS NOT a shipping
 * charge and this module NEVER asserts that freight has been invoiced.
 *
 * Caller must run booking preflight, trusted geographic tariff review, durable
 * deduplication, buyer account authentication and manual billing controls.
 */
import {validateMotobidderBooking} from "./validate-booking.mjs";

const oneLine=v=>String(v ?? "").replace(/[\r\n\t]+/g," ").trim();
const field=(form,name,value)=>{if(value!==undefined&&value!==null&&oneLine(value)!=="")form.set(name,oneLine(value));};
function addParty(form,prefix,p){
 field(form,prefix+"_name",p.dealership);
 field(form,prefix+"_phone",p.mobile);
 field(form,prefix+"_email",p.email);
 field(form,prefix+"_street_address",p.street_address);
 field(form,prefix+"_city",p.city);
 field(form,prefix+"_state",p.county);
 field(form,prefix+"_country",p.country);
 field(form,prefix+"_code",p.postcode);
}
/**
 * Returns a safe **draft**, not an API request. No network calls occur.
 * Manual billing acceptance must be recorded by Move staff before creation.
 */
export function prepareManualBillingShipment(booking,{mainlandVerified=false,rateBandVerified=false}={}){
 const validation=validateMotobidderBooking(booking);
 if(!validation.valid) return {ok:false,status:"invalid_booking",errors:validation.errors};
 if(!mainlandVerified||!rateBandVerified)
   return {ok:false,status:"geography_review_required",errors:["Mainland and tariff-zone checks must be completed before shipment creation"]};
 const f=new FormData();
 addParty(f,"sender",booking.sender);addParty(f,"receiver",booking.receiver);
 field(f,"pname[]",[booking.motorcycle.make,booking.motorcycle.model].map(oneLine).join(" "));
 field(f,"pquantity[]","1");
 // The booking has one immutable source date from Motobidder; never substitute today's date.
 // Logxa: date = Booking/pickup date in YYYY-MM-DD.
 field(f,"date",booking.ready_date);
 field(f,"type","Motorcycle or Scooter");
 field(f,"mode","Up to 7 Working days from ready date");
 field(f,"custom_field[11548]",booking.motorcycle.make);
 field(f,"custom_field[11549]",booking.motorcycle.model);
 field(f,"custom_field[11550]",booking.motorcycle.registration||booking.motorcycle.vin);
 field(f,"custom_field[11556]",booking.freight_inc_vat.toFixed(2));
 const payer=booking.payer==="sender"?"Sender":"Receiver";
 field(f,"payer",payer);
 // Extra operational details, not ledger entries. Never put motorcycle
 // purchase price in the freight fields.
 const annotation=[
   "MOTOBIDDER: "+oneLine(booking.transport_booking_id),
   "AUCTION: "+oneLine(booking.auction_sale_id),
   "READY DATE: "+oneLine(booking.ready_date),
   "FREIGHT INCL VAT: GBP "+booking.freight_inc_vat.toFixed(2),
   "TRANSPORT INVOICE TO: "+payer,
   "MOVE STAFF: MANUALLY ENTER SHIPPING CHARGE AND INVOICE SELECTED PARTY",
   "NO LOADING UNTIL SELLER CONFIRMS MOTORCYCLE PAYMENT",
 ].join(" | ");
 field(f,"custom_field[11557]",annotation);
 field(f,"instructions",annotation);
 // Logxa documents the payer values; the freight charge ledger remains unverified.
 // Do not send charges until billing format is confirmed.
 // Omit pprice[] / ptotal[]: motorcycle purchase is NOT freight invoicing.
 return {ok:true,status:"manual_billing_review_required",form:f,
  booking_reference:oneLine(booking.transport_booking_id),
  invoice_to:booking.payer,amount_inc_vat:booking.freight_inc_vat,
  ready_to_submit:false,
  ready_date_mapping_verified:true,
  booking_date_field_candidate:"date",
  reminder:"Logxa confirms date is the booking date (YYYY-MM-DD) and payer accepts Sender/Receiver. Still verify shipment readback and manually enter the freight charge; custom_field[11556] is NOT a freight ledger entry."
 };
}
