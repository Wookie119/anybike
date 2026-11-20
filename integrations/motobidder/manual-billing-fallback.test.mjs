import assert from 'node:assert/strict';
import {prepareManualBillingShipment as draft} from './manual-billing-fallback.mjs';
const party=(name,mobile,email,postcode)=>({dealership:name,contact_name:name,email,mobile,street_address:'1 Test Road',city:'Oxford',postcode,country:'United Kingdom'});
const input={
 auction_sale_id:'sale-1',transport_booking_id:'booking-1',
 motorcycle:{make:'Honda',model:'Forza 125',registration:'HON125R'},
 sender:party('Seller','07700900001','seller@example.com','OX1 1AA'),
 receiver:party('Buyer','07700900002','buyer@example.com','RG1 1AA'),
 ready_date:'2026-11-23',payer:'sender',currency:'GBP',vat_included:true,rate_band:'mainland',freight_inc_vat:199
};
assert.equal(draft(input).status,'geography_review_required');
assert.equal(draft({...input,payer:'unknown'},{mainlandVerified:true,rateBandVerified:true}).status,'invalid_booking');
const result=draft(input,{mainlandVerified:true,rateBandVerified:true});
assert.equal(result.ok,true);
assert.equal(result.ready_to_submit,false);
assert.equal(result.invoice_to,'sender');
assert.equal(result.status,'manual_billing_review_required');
assert.equal(result.form.get('custom_field[11556]'),'199.00');
assert.equal(result.form.get('sender_email'),'seller@example.com');
assert.equal(result.form.get('receiver_email'),'buyer@example.com');
assert.equal(result.form.has('charges'),false);
assert.equal(result.form.has('payer'),false);
assert.equal(result.form.has('pprice[]'),false);
assert.match(result.form.get('instructions'),/INVOICE TO: SENDER/);
assert.match(result.form.get('instructions'),/READY DATE: 2026-11-23/);
console.log('Manual billing fallback: 12 assertions passed');
