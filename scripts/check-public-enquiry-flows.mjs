#!/usr/bin/env node
/**
 * AnyBike public lead funnel regression guard.
 *
 * Pure source audit: no credentials, submissions, uploads, or database writes.
 * It checks the publicly callable lead entry points continue to exist and
 * that protected message-centre inserts are not reintroduced in browser code.
 *
 * This does NOT prove the live site, Edge Functions, SMTP or Supabase RLS work.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(file)=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const checks=[
  {
    route:'AnyBike Connect',file:'anybike-connect.html',
    required:['public_submit_connect_enquiry_v1','connectForm','Send Message'],
    forbidden:['.from("message_centre_threads").insert(']
  },
  {
    route:'VMoto retail',file:'vmoto.html',
    required:['public_submit_vmoto_retail_enquiry_v1','vmotoRetailForm']
  },
  {
    route:'Global buyer request',file:'bulk-buying-request.html',
    required:['public_submit_global_buyer_request_v1','bulkRequestForm'],
    forbidden:['.from("message_centre_threads")']
  },
  {
    route:'Available stock guest enquiry',file:'bike-details.html',
    required:['guestEnquiryIdentity','submitGuestStockEnquiry','public_submit_connect_enquiry_v1'],
    forbidden:['function openEnquiryModal(){\n  if(!currentUser){\n    redirectToCustomerLogin();']
  },
  {
    route:'Dealer partnership',file:'partners-integrations.html',
    required:['submit_integration_request','integrationForm']
  },
  {
    route:'Private selling',file:'uk-motorcycle-selling.js',
    required:['seller-quick-intake','submitSeller']
  },
  {
    route:'General selling',file:'sell-your-motorcycle.html',
    required:['seller-quick-intake','sellBikeForm']
  },
  {
    route:'International model example',file:'bmw-s1000rr.html',
    required:['international-guest-enquiry','internationalGuestRequestForm']
  },
  {
    route:'International stock',file:'international-vq-motorcycle.html',
    required:['international-guest-enquiry']
  }
];
let failures=0;
for(const {route,file,required,forbidden=[]} of checks){
  try{
    const s=read(file);
    for(const marker of required)assert.ok(s.includes(marker),route+': missing '+marker);
    for(const marker of forbidden)assert.ok(!s.includes(marker),route+': forbidden '+marker);
    console.log('PASS '+route+' ('+file+')');
  }catch(error){
    failures++;
    console.error('FAIL '+route+': '+error.message);
  }
}
console.log('Routes checked: '+checks.length+'; failures: '+failures);
console.log('Scope: static repository markers only; live guest requests and bell notifications require separate verification.');
if(failures)process.exitCode=1;
