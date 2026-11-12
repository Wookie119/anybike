// Regression check for legacy model route convergence.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const legacy=readFileSync(new URL('../motorcycle-model.html',import.meta.url),'utf8');
const guide=readFileSync(new URL('../motorcycle-model-guide.html',import.meta.url),'utf8');
const design=readFileSync(new URL('../design/model-template/DESIGN-LOCK.md',import.meta.url),'utf8');
assert(legacy.includes("new URL('/motorcycle-model-guide.html',location.origin)"),'Legacy route must converge on shared guide');
for(const key of ['make','model'])assert(legacy.includes("target.searchParams.set('"+key+"',"),'Legacy route must preserve '+key);
assert(legacy.includes('location.replace(target.href)'),'Legacy redirect missing');
assert(guide.includes('/model-template/approved-r1300gs-model-design.css'),'Shared guide must use approved master stylesheet');
assert(guide.includes('/model-template/public-verified-model-facts.mjs'),'Shared guide must load verified model facts');
assert(design.includes('User has expressly approved'),'Universal rollout approval missing');
console.log('PASS: legacy model route converges on approved shared model renderer with identity intact');
