// Navigation-only contract: valid regional routes do not certify country
// research publication, motorcycle stock availability or model-specific facts.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {groupDatabaseCountryRoutes} from '../model-template/public-country-market-navigation.mjs';

const cases=[
 {label:'United Kingdom',region:'Europe',url:'/markets/united-kingdom.html'},
 {label:'France',region:'Europe',url:'/markets/france.html'},
 {label:'Japan',region:'Asia',url:'/markets/japan.html'},
 {label:'France again',region:'Europe',url:'/markets/france.html'},
 {label:'Not a public market',region:'Europe',url:'/admin-enquiries.html'},
 {label:'External destination',region:'Asia',url:'https://example.org/markets/japan.html'},
 {label:'',region:'Asia',url:'/markets/empty-name.html'},
 {label:'Missing region',region:'',url:'/markets/no-region.html'},
 {label:'Preview route',region:'Europe',url:'/markets/preview.html?draft=true'}
];
const groups=groupDatabaseCountryRoutes(cases);
assert.deepEqual(groups.map(g=>g.region),['Asia','Europe']);
assert.deepEqual(groups[0].entries.map(x=>x.label),['Japan']);
assert.deepEqual(groups[1].entries.map(x=>x.label),['France','United Kingdom']);
assert.equal(groups.reduce((n,g)=>n+g.entries.length,0),3);
assert.deepEqual(groupDatabaseCountryRoutes(null),[]);
const large=Array.from({length:217},(_,i)=>({
 label:'Market '+String(i+1),region:i<100?'Region A':'Region B',
 url:'/markets/market-'+(i+1)+'.html'
}));
const complete=groupDatabaseCountryRoutes(large);
assert.equal(complete.reduce((n,g)=>n+g.entries.length,0),217,
 '217 existing country routes must not be silently truncated');
const file=readFileSync(new URL('../model-template/public-country-market-navigation.mjs',import.meta.url),'utf8');
assert(!file.includes('#813438'),'Off-brand burgundy chips must not return');
assert(file.includes('public_anybike_country_navigation_v1'),
 'Keep country links sourced from read-only shared public navigation');
assert(file.includes('addDatabaseCountryNavigation(root,data)'),
 'Shared country regions must continue to use one implementation');
assert(!file.includes("publication_state='published'"),
 'A browser-side publication-state guess is not the country editorial gate');
console.log('PASS: regional country navigation, 217-route coverage, unique safe links and AnyBike colours');
