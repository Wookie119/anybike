/**
 * Run the private manufacturer identity audit against a server-side Supabase
 * export, never against browser-accessible credentials or public data.
 *
 * node scripts/check-private-catalogue-manufacturers.mjs --data=reports/private-editorial-export.json
 */
import fs from 'node:fs';
import path from 'node:path';
import {auditCatalogueManufacturerResolution} from './audit-catalogue-manufacturer-resolution.mjs';

export function checkPrivateCatalogueManufacturers(data){
 if(!data||!Array.isArray(data.manufacturers)||!Array.isArray(data.models))
  throw new TypeError('Private catalogue export with manufacturer and model arrays required');
 return auditCatalogueManufacturerResolution({
  manufacturers:data.manufacturers,
  models:data.models,
  manufacturerAliases:data.manufacturerAliases||[]
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const flag=process.argv.find(x=>x.startsWith('--data='));
 if(!flag){console.error('Usage: node scripts/check-private-catalogue-manufacturers.mjs --data=reports/private-editorial-export.json');process.exitCode=2;}
 else{
  const report=checkPrivateCatalogueManufacturers(JSON.parse(fs.readFileSync(flag.slice(7),'utf8')));
  fs.mkdirSync('reports',{recursive:true});
  fs.writeFileSync('reports/private-manufacturer-resolution-audit.json',JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log(JSON.stringify({counts:report.counts,needsReview:report.needsReview,issues:report.issues},null,2));
  if(report.issues.length)process.exitCode=1;
 }
}
