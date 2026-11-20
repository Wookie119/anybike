import assert from 'node:assert/strict';
import {validateMotobidderBooking as validate} from './validate-booking.mjs';

const sample = {
  auction_sale_id:'SALE-123', transport_booking_id:'TRANSPORT-123',
  motorcycle:{make:'Honda',model:'Forza 125',registration:'HON125R'},
  sender:{dealership:'Ducati Nottingham',contact_name:'Example Seller',email:'seller@example.com',mobile:'07700900123',street_address:'1 Example Rd',city:'Nottingham',postcode:'NG1 1AA',country:'United Kingdom'},
  receiver:{dealership:'KH Motorcycles',contact_name:'Example Buyer',email:'buyer@example.com',mobile:'07700900456',street_address:'2 Example Rd',city:'Oxford',postcode:'OX1 1AA',country:'United Kingdom'},
  ready_date:'2026-11-23',payer:'receiver',currency:'GBP',vat_included:true,freight_inc_vat:199,rate_band:'mainland'
};
let x=validate(sample);
assert.equal(x.valid,true);
assert.equal(x.ready_to_submit,false); // must NOT call Logxa without verified encoding and coverage
assert.equal(x.idempotency_key,'motobidder:TRANSPORT-123');
assert.equal(x.rate_inc_vat,199);
assert.equal(validate({...sample,payer:'neither'}).valid,false);
assert.equal(validate({...sample,freight_inc_vat:199.50}).valid,false);
assert.equal(validate({...sample,rate_band:'above_inverness',freight_inc_vat:389}).valid,true);
assert.equal(validate({...sample,receiver:{...sample.receiver,email:''}}).valid,false);
assert.equal(validate({...sample,sender:{...sample.sender,mobile:'01111111111'}}).valid,false);
assert.equal(validate({...sample,ready_date:'2026-02-30'}).valid,false);
assert.equal(validate({...sample,vat_included:false}).valid,false);
assert.equal(validate({...sample,sender:{...sample.sender,country:'Isle of Man'}}).valid,false);
assert.equal(validate({...sample,transport_booking_id:''}).valid,false);
console.log('Motobidder preflight tests passed (11 cases).');
