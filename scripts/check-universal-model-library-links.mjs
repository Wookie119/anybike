import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const library=readFileSync(new URL('../motorcycle-model-library.html',import.meta.url),'utf8');
const guide=readFileSync(new URL('../motorcycle-model-guide.html',import.meta.url),'utf8');
assert(!library.includes('const isGuide='),'Model library must not whitelist selected manufacturers/models');
assert(library.includes('const guide="/motorcycle-model-guide.html?make="+encodeURIComponent(m.make)+"&model="+encodeURIComponent(m.model)'),'Every catalogue identity must route to shared guide');
assert(library.includes("'<a href=\"'+esc(guide)+'\">View model guide →</a>'"),'Model guide action must not be conditional on a whitelist');
assert(guide.includes('/model-template/approved-r1300gs-model-design.css'),'Shared guide must load approved R 1300 GS design');
console.log('PASS: every model library entry offers the shared approved model guide');
