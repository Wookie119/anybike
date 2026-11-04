/**
 * Stage REAL AnyBike catalogue relationships without changing the live site.
 *
 * Reads a dated, verified Supabase catalogue snapshot (manufacturer and model IDs),
 * repository HTML, canonicals, noindex and sitemap evidence. Produces protected
 * staging copies and a JSON report. Never infers publication or deploys anything.
 *
 * node scripts/stage-real-catalogue-pilot.mjs
 * Output: reports/editorial-navigation-preview/ (ignored by deployment workflow).
 */
import fs from 'node:fs';
import path from 'node:path';
import { inventoryEditorialUrls } from './build-editorial-url-inventory.mjs';
import { graphFromCatalogueRows } from './catalogue-link-adapter.mjs';
import { stageEditorialNavigation } from './stage-editorial-navigation.mjs';

const BASE='https://www.anybike.co.uk';
const SOURCE='scripts/fixtures/editorial-catalogue-pilot-20261104.json';
export function stageRealCataloguePilot({root=process.cwd(),snapshot,output}={}) {
 const file=snapshot || path.join(root,SOURCE);
 const dataset=JSON.parse(fs.readFileSync(file,'utf8'));
 const inventory=inventoryEditorialUrls(root);
 const byUrl=new Map(inventory.candidates.filter(p=>p.sourceEligible).map(p=>[p.url,p]));
 const pages=[];
 const exclusions=[];
 function add(type,id,title,url){
  if(typeof id !== 'number' || !Number.isInteger(id) || id<=0 || typeof title !== 'string' || !title.trim() ||
     typeof url !== 'string' || !/^\/(?:[a-z0-9-]+\.html)$/i.test(url)) {
   exclusions.push({type,id,reason:'invalid-snapshot-record'});return;
  }
  const expected=BASE+url;
  const source=byUrl.get(expected);
  if(!source || source.type!==type){exclusions.push({type,id,reason:'source-not-eligible',url});return;}
  pages.push({id:type+':'+id,type,title,url,published:true});
 }
 for(const m of dataset.manufacturers||[])add('manufacturer',m.id,m.display_name,m.url);
 for(const m of dataset.models||[])add('model',m.id,m.manufacturer+' '+m.model,m.url);
 // These are eligible *staging* identities, not validated live-public identities.
 const graph=graphFromCatalogueRows({
  publicPages:pages,
  manufacturers:dataset.manufacturers||[],
  models:dataset.models||[]
 });
 const target=output || path.join(root,'reports','editorial-navigation-preview');
 const staged=stageEditorialNavigation({root,output:target,graph});
 const result={
  mode:'source-only staging — NEVER live deployment or verification',
  sourceFixture:SOURCE,
  candidatePages:pages.length,
  links:graph.pages.reduce((n,p)=>n+p.links.length,0),
  exclusions,
  diagnostics:graph.diagnostics,
  staging:staged
 };
 return result;
}
if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const report=stageRealCataloguePilot();
 fs.mkdirSync('reports',{recursive:true});
 fs.writeFileSync('reports/editorial-catalogue-pilot-report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 if(report.staging.errors.length || report.exclusions.length || report.diagnostics.length)process.exitCode=1;
}
