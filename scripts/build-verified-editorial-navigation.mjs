/**
 * AnyBike end-to-end private-database editorial publishing preview.
 *
 * Input is a server-side JSON export of anybike_publishing.editorial_page_routes
 * and supporting catalogue/relationship rows, prepared with private backend
 * permissions. NEVER embed service credentials, login data or this input JSON
 * in public pages. This command has no network/DB write or deployment ability.
 *
 * Only explicitly published AND independently verified routes survive the
 * registry gate; repository HTML and the sitemap are checked again.
 * Staged HTML is written exclusively to a separate preview directory.
 *
 * node scripts/build-verified-editorial-navigation.mjs --data=/secure/anybike-routes.json
 */
import fs from 'node:fs';
import path from 'node:path';
import {inventoryEditorialUrls} from './build-editorial-url-inventory.mjs';
import {verifiedIdentitiesFromRoutes} from './verified-editorial-route-identities.mjs';
import {assemblePublicEditorialGraph} from './assemble-public-editorial-graph.mjs';
import {stageEditorialNavigation} from './stage-editorial-navigation.mjs';

export function buildVerifiedEditorialNavigation({
 root=process.cwd(),data,output
}={}) {
 if(!data || !Array.isArray(data.routes))throw new TypeError('Private registry export requires routes array');
 const manufacturers=data.manufacturers||[];
 const models=data.models||[];
 const stories=data.globalStories||[];
 if(!Array.isArray(manufacturers)||!Array.isArray(models)||!Array.isArray(stories))
  throw new TypeError('Malformed catalogue export');
 const inventory=inventoryEditorialUrls(root,{manufacturers,models});
 const verified=verifiedIdentitiesFromRoutes({
  routes:data.routes,manufacturers,models,stories,countries:data.countries||[]
 });
 const graph=assemblePublicEditorialGraph({
  inventory,identities:verified.identities,manufacturers,models,
  regionalCountryRoutes:data.routes,
  countryLinks:data.countryLinks||[],
  globalStories:stories,
  storyManufacturers:data.storyManufacturers||[],
  modelRelationships:data.modelRelationships||[]
 });
 const destination=output||path.join(root,'reports','verified-editorial-navigation-preview');
 const staged=stageEditorialNavigation({root,output:destination,graph});
 return {
  mode:'build-time preview only; no mutation of live HTML or Supabase',
  inputRoutes:data.routes.length,
  publicationGatePassed:verified.identities.length,
  publicationGateBlocked:verified.skippedUnpublished,
  publishedSourceEligiblePages:graph.pages.length,
  generatedLinks:graph.counts.generatedLinks,
  stagedPages:staged.staged.length,
  sourceFilesModified:staged.sourceFilesModified,
  diagnostics:[...verified.diagnostics,...graph.diagnostics,...staged.errors]
 };
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const input=process.argv.find(x=>x.startsWith('--data='));
 if(!input) {console.error('Usage: node scripts/build-verified-editorial-navigation.mjs --data=/secure/private-export.json');process.exitCode=2;}
 else {
  const data=JSON.parse(fs.readFileSync(input.slice('--data='.length),'utf8'));
  const report=buildVerifiedEditorialNavigation({data});
  fs.mkdirSync('reports',{recursive:true});
  fs.writeFileSync('reports/verified-editorial-navigation-report.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if(report.diagnostics.length)process.exitCode=1;
 }
}
