/**
 * Validate country names, nine regions and verified ISO code mappings against
 * the approved AnyBike country directory and existing market metadata.
 * Source snapshot is from private registry; no credentials or writes.
 */
import fs from 'node:fs';
import {auditCountryCodeCrosswalk} from './audit-country-code-crosswalk.mjs';

const directoryHtml=fs.readFileSync('international-markets.html','utf8');
const marketJs=fs.readFileSync('market-page-standardisation.js','utf8');
const snapshot=JSON.parse(fs.readFileSync('scripts/fixtures/verified-country-directory-preview-20261104.json','utf8'));
const namesMatch=directoryHtml.match(/const markets\s*=\s*(\[[\s\S]*?\]);/);
const dataMatch=marketJs.match(/const MARKET_DATA=(\{[\s\S]*?\});\s*const CURATED_MARKETS/);
if(!namesMatch || !dataMatch)throw new Error('Approved AnyBike source data missing');
const report=auditCountryCodeCrosswalk({routes:snapshot.routes,
 directory:JSON.parse(namesMatch[1]),marketData:JSON.parse(dataMatch[1])});
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/country-code-crosswalk-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({counts:report.counts,issues:report.issues,scope:
 'Source consistency only; code mapping is not live Google or model-country approval'},null,2));
if(report.issues.length)process.exitCode=1;
