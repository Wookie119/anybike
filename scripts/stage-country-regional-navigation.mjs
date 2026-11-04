/**
 * Build a NONDEPLOYING regional navigation preview for all country pages.
 *
 * Every staged link is taken from a source-verified private Supabase route.
 * The source snapshot is compared with the approved market directory AND
 * repository HTML/sitemap; discrepancies block the build.
 * Never alters original HTML or sets publishing flags.
 *
 * Run: node scripts/stage-country-regional-navigation.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import {auditCountryIndexability} from './audit-country-indexability.mjs';
import {regionalMarketNavigation} from './regional-market-navigation.mjs';
import {stageEditorialNavigation} from './stage-editorial-navigation.mjs';

export function stageCountryRegionalNavigation({root=process.cwd(),snapshot,
  output,expectedCount=217}={}) {
 const filename=snapshot||path.join(root,'scripts/fixtures/verified-country-directory-preview-20261104.json');
 const data=JSON.parse(fs.readFileSync(filename,'utf8'));
 if(!Array.isArray(data?.routes))throw new Error('Private country route export required');
 const audit=auditCountryIndexability(root,{expectedCountryCount:expectedCount});
 if(audit.issues.length)throw new Error('Country source audit failed: '+JSON.stringify(audit.issues.slice(0,6)));
 if(data.routes.length!==expectedCount)throw new Error('Country route count mismatch');
 const directory=fs.readFileSync(path.join(root,'international-markets.html'),'utf8');
 const match=directory.match(/const markets\s*=\s*(\[[\s\S]*?\]);/);
 if(!match)throw new Error('Approved International Markets directory not found');
 const entries=JSON.parse(match[1]);
 if(entries.length!==expectedCount)throw new Error('Approved market directory count mismatch');
 const known=new Map(entries.map(m=>[m.url,m]));
 if(known.size!==expectedCount)throw new Error('Duplicate market directory paths');
 const sourcePaths=new Set(audit.pages.filter(p=>p.sourceEligible).map(p=>'/'+p.path));
 for(const r of data.routes){
  const listing=known.get(r.public_path);
  if(!listing || listing.name!==r.country_name || listing.region!==r.country_region ||
    !sourcePaths.has(r.public_path) || r.publication_state!=='candidate' ||
    !r.source_verified_at || r.live_verified_at || r.editorial_verified_at) {
    throw new Error('Unverified or mismatched market route: '+r.public_path);
  }
 }
 const graph=regionalMarketNavigation({routes:data.routes,mode:'staging',maxLinks:6});
 if(graph.pages.length!==expectedCount || graph.counts.regions!==9)
  throw new Error('Missing country identities or regions in preview graph');
 const report=stageEditorialNavigation({
  root,output:output||path.join(root,'reports','regional-market-navigation-preview'),graph
 });
 return {
  mode:'NONDEPLOYING source-verified preview; no live publication',
  countries:graph.pages.length,regions:graph.counts.regions,
  generatedCountryLinks:graph.counts.generatedNavigationLinks,
  stagedPages:report.staged.length,errors:report.errors,
  originalsModified:report.sourceFilesModified
 };
}
if(process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href){
 const result=stageCountryRegionalNavigation();
 fs.mkdirSync('reports',{recursive:true});
 fs.writeFileSync('reports/regional-market-navigation-preview.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
 if(result.errors.length||result.stagedPages!==result.countries)process.exitCode=1;
}
