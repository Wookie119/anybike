/**
 * Run the expanding BMW and Harley source-guide preview using real Supabase
 * catalogue IDs captured in the snapshot. No credentials, no DB mutation, no
 * public HTML replacement and no publication claims.
 */
import fs from 'node:fs';
import path from 'node:path';
import { inventoryEditorialUrls } from './build-editorial-url-inventory.mjs';
import { matchCatalogueGuides } from './match-catalogue-guides.mjs';
import { graphFromCatalogueRows } from './catalogue-link-adapter.mjs';
import { stageEditorialNavigation } from './stage-editorial-navigation.mjs';

export function stageMatchedCatalogue({root=process.cwd(),snapshot,output}={}) {
 const file=snapshot || path.join(root,'scripts/fixtures/bmw-harley-catalogue-ids-20261104.json');
 const dataset=JSON.parse(fs.readFileSync(file,'utf8'));
 const inventory=inventoryEditorialUrls(root,{manufacturers:dataset.manufacturers,models:dataset.models});
 const matches=matchCatalogueGuides({
  inventory,manufacturers:dataset.manufacturers,models:dataset.models
 });
 const graph=graphFromCatalogueRows({
  publicPages:matches.pages,
  manufacturers:dataset.manufacturers,
  models:dataset.models
 });
 const report=stageEditorialNavigation({
  root,output:output||path.join(root,'reports/matched-catalogue-preview'),
  graph
 });
 return {
  mode:'source-only preview; neither editorial approval nor verified live deployment',
  catalogueModels:dataset.models.length,
  matchedPublicGuideSources:matches.pages.length,
  reciprocalPreviewLinks:graph.pages.reduce((sum,p)=>sum+p.links.length,0),
  exclusions:matches.diagnostics,
  stageErrors:report.errors,
  staged:report.staged,
  sourceFilesModified:report.sourceFilesModified
 };
}
if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const report=stageMatchedCatalogue();
 fs.mkdirSync('reports',{recursive:true});
 fs.writeFileSync('reports/matched-catalogue-preview-report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 if(report.stageErrors.length)process.exitCode=1;
}
