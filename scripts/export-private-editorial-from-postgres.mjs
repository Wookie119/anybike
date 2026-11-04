/**
 * BACKEND ONLY: export the current private AnyBike editorial catalogue from
 * PostgreSQL to a local protected report for source-only preview builds.
 *
 * Requires PostgreSQL client psql plus PGHOST, PGPORT (optional), PGDATABASE,
 * PGUSER, and PGPASSWORD provided by a trusted build environment.
 * NEVER configure this on browser/123-reg public pages and never commit secrets.
 *
 * Run:
 *   node scripts/export-private-editorial-from-postgres.mjs
 *   node scripts/build-verified-editorial-navigation.mjs --data=reports/private-editorial-export.json
 *
 * No network request is performed unless explicitly run by an authorized
 * server-side operator with credentials. No Supabase mutations or deployments.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

export function validatePrivateEditorialExport(data) {
 if(!data || !Array.isArray(data.routes) || !Array.isArray(data.manufacturers) ||
    !Array.isArray(data.models) || !Array.isArray(data.countryLinks) ||
    !Array.isArray(data.globalStories))throw new Error('Invalid private editorial export shape');
 const seen=new Set();
 for(const r of data.routes) {
  if(!/^\/(?:markets\/[a-z0-9-]+|global\/[a-z0-9-]+|[a-z0-9-]+)\.html$/.test(String(r.public_path||'')))
   throw new Error('Invalid private route path');
  if(seen.has(r.public_path))throw new Error('Duplicate private route path');
  seen.add(r.public_path);
  if(!['candidate','verified','published'].includes(r.publication_state))
   throw new Error('Unexpected publication status');
  if(r.publication_state==='published' &&
     (!r.source_verified_at || !r.live_verified_at || !r.editorial_verified_at))
   throw new Error('Published route lacks independent verification');
 }
 return {routes:data.routes.length,manufacturers:data.manufacturers.length,
   models:data.models.length,published:data.routes.filter(r=>r.publication_state==='published').length};
}

export function exportPrivateEditorialData({
  environment=process.env,
  output=path.join(process.cwd(),'reports','private-editorial-export.json'),
  queryFile=path.join(process.cwd(),'scripts','sql','export-private-editorial-navigation.sql'),
  executor=spawnSync
}={}) {
 for(const name of ['PGHOST','PGDATABASE','PGUSER','PGPASSWORD']) {
  if(!environment[name])throw new Error('Missing private backend connection setting: '+name);
 }
 const root=path.resolve(process.cwd());
 const destination=path.resolve(output);
 const reports=path.join(root,'reports');
 if(!destination.startsWith(reports+path.sep))
  throw new Error('Private database export must remain in ignored reports/');
 if(fs.existsSync(destination))throw new Error('Existing private export must not be silently overwritten');
 const result=executor('psql',[
  '--no-psqlrc','--tuples-only','--no-align','--set=ON_ERROR_STOP=1',
  '--file='+queryFile
 ],{encoding:'utf8',env:{...environment,PGCONNECT_TIMEOUT:'10'},maxBuffer:15*1024*1024,timeout:60000});
 if(result.error || result.status!==0)
  throw new Error('Private database export failed; check backend configuration and DB privileges');
 let data;
 try { data=JSON.parse(String(result.stdout||'').trim()); }
 catch { throw new Error('Private SQL export did not return a JSON object'); }
 const counts=validatePrivateEditorialExport(data);
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 fs.writeFileSync(destination,JSON.stringify(data)+'\n',{mode:0o600,flag:'wx'});
 return {mode:'private-backend-only; no website publication',
   output:'reports/private-editorial-export.json',...counts};
}

if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 try{console.log(JSON.stringify(exportPrivateEditorialData(),null,2));}
 catch(err){console.error(String(err.message||err));process.exitCode=1;}
}
