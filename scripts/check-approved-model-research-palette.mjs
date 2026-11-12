import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../model-template/public-verified-model-facts.mjs',import.meta.url),'utf8');
const guide=readFileSync(new URL('../motorcycle-model-guide.html',import.meta.url),'utf8');
assert(src.includes("db.rpc('public_anybike_verified_model_facts_v1'")||src.includes('public_anybike_verified_model_facts_v1'),'Verified public research endpoint missing');
assert(src.includes('border-top:1px solid #626262'),'Neutral research dividers missing');
assert(!src.includes('color:#ff4850'),'Unapproved pink source links returned');
assert(guide.includes('public-verified-model-facts.mjs?v=20261112-approved-palette12'),'Model guide research cache not updated');
console.log('PASS: verified Supabase research retains approved AnyBike palette');
