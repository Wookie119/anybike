// Approved BMW R 1300 GS and Harley designs are immutable navigation hosts.
// This test verifies shared pill enhancement cannot remove or replace page
// sections, hero images, stock blocks or research containers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const nav=fs.readFileSync('motorcycle-complete-catalogue-navigation.js','utf8');
const r1300=fs.readFileSync('bmw-r1300gs.html','utf8');
const header=fs.readFileSync('public-header.js','utf8');
const tree=fs.readdirSync('.').filter(name=>/^harley-davidson-[a-z0-9-]+\.html$/.test(name)&&name!=='harley-davidson-motorcycles.html');
assert(tree.length>=18,'Harley model page count unexpectedly reduced');
for(const [path,html] of [['bmw-r1300gs.html',r1300],...tree.map(p=>[p,fs.readFileSync(p,'utf8')])]){
 assert(html.includes('/public-header.js'),path+' lost shared navigation loader');
 assert(/<main(?:\s|>)/i.test(html),path+' lost approved main layout');
 assert(/<section(?:\s|>)/i.test(html),path+' lost approved sections');
 assert(!html.includes('data-complete-catalogue-navigation="1"'),path+' must not hardcode the navigation overlay');
}
for(const token of ['id="internationalModelStock"','id="ukR1300ModelGallery"','id="generationPanel"','id="body"','class="recovered-hero-photo"']){
 assert(r1300.includes(token),'R1300 GS approved section missing: '+token);
}
for(const token of [
 "const existing=main.querySelector('nav[aria-label=\"Related BMW model guides\"],nav[aria-label=\"Related Harley-Davidson model guides\"]')",
 'existing.replaceChildren(...Array.from(nav.querySelector(\'nav\').children))',
 "existing.setAttribute('aria-label','All '+make+' model guides')",
 'nav.remove();return;',
 'const buyerActions=main.querySelector',
 "nav.dataset.completeCatalogueNavigation='1'",
 "const byModel=new Map(routes.map(x=>[normalize(x.model),x.url]))"
])assert(nav.includes(token),'Approved page navigation integration changed: '+token);
assert(!/main\.innerHTML\s*=/.test(nav),'Navigation must not replace approved page layout');
assert(!/main\.replaceChildren\s*\(/.test(nav),'Navigation must not clear approved page layout');
assert(!/document\.body\.innerHTML\s*=/.test(nav),'Navigation must not replace approved page');
assert(header.includes('motorcycle-complete-catalogue-navigation.js'),'Shared loader missing');
console.log('PASS: R1300 GS and '+tree.length+' Harley model pages retain their approved shells; shared pills only enhance navigation.');
