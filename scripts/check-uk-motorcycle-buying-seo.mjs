// Run: node scripts/check-uk-motorcycle-buying-seo.mjs
// Protect UK motorcycle acquisition wording and buyer/seller journey across shared guides.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const main=fs.readFileSync('sell-your-motorcycle.html','utf8');
const shared=fs.readFileSync('motorcycle-brand.html','utf8');
const guide=fs.readFileSync('motorcycle-model-guide.html','utf8');
assert(main.includes('We buy motorcycles in the UK — request a trade assessment'),'Missing UK motorcycle buying content');
assert(main.includes('no obligation to sell')&&main.includes('does not guarantee an offer'),'Misleading or missing offer safeguards');
assert(main.includes('/uk-motorcycle-selling.html'),'UK selling submission route missing');
assert(main.includes('/motorcycle-manufacturers.html'),'Manufacturer discovery route missing');
assert(main.includes('rel="canonical" href="https://www.anybike.co.uk/sell-your-motorcycle.html"'),'Main selling canonical missing');
assert(/<meta name="robots" content="index, follow">/.test(main),'Public selling landing page must remain indexable');
assert(shared.includes('id="manufacturerSellingHeading"')&&shared.includes('Sell My "+make+" Motorcycle in the UK'),'Make-specific UK selling heading missing');
assert(shared.includes('id="manufacturerSellLink"')&&shared.includes('/uk-motorcycle-selling.html?make='),'Manufacturer prefilling route missing');
assert(shared.includes('id="modelGroups"'),'Manufacturer model catalog removed');
assert(guide.indexOf('id="ukSellerAction"')>=0&&guide.indexOf('id="ukSellerAction"')<guide.indexOf('id="nextAction"'),'Keep UK seller before international buyer');
assert(guide.includes('UK owners: Sell My '),'Model-specific owner CTA missing');
assert(/<meta name="robots" content="noindex,follow">/.test(fs.readFileSync('uk-motorcycle-selling.html','utf8')),'Customer submission form should remain noindex');
console.log('PASS: UK motorcycle-buying SEO and the separate international buyer journey are intact.');
