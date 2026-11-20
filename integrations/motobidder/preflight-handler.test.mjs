import assert from "node:assert/strict";
import {handlePreflight} from "./preflight-handler.mjs";
const secret="12345678901234567890123456789012";
const sample={
 auction_sale_id:"s1",transport_booking_id:"t1",
 motorcycle:{make:"Honda",model:"CB500",vin:"TESTVIN"},
 sender:{dealership:"A",contact_name:"A",email:"a@example.com",mobile:"07700900001",street_address:"1 Test Road",city:"Oxford",postcode:"OX1 1AA",country:"United Kingdom"},
 receiver:{dealership:"B",contact_name:"B",email:"b@example.com",mobile:"07700900002",street_address:"2 Test Road",city:"Reading",postcode:"RG1 1AA",country:"United Kingdom"},
 ready_date:"2026-11-23",payer:"sender",currency:"GBP",vat_included:true,freight_inc_vat:199,rate_band:"mainland"
};
const call=(body,token=secret,method="POST")=>handlePreflight({method,authorization:"Bearer "+token,rawBody:body,sharedSecret:secret});
assert.equal(call(JSON.stringify(sample)).status,200);
assert.equal(call(JSON.stringify(sample)).body.ready_to_submit,false);
assert.equal(call(JSON.stringify({...sample,payer:"other"})).status,422);
assert.equal(call(JSON.stringify({...sample,receiver:{...sample.receiver,postcode:"PO30 1AA"}})).status,422);
assert.equal(call(JSON.stringify(sample),"bad").status,401);
assert.equal(call(JSON.stringify(sample),secret,"GET").status,405);
assert.equal(call("{bad").status,400);
assert.equal(call("x".repeat(20001)).status,413);
assert.equal(call(JSON.stringify({...sample,rate_band:"toString"})).status,422);
console.log("Preflight handler: 9 assertions passed");
