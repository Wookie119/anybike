import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validatePrivateEditorialExport,exportPrivateEditorialData}
  from './export-private-editorial-from-postgres.mjs';

const rows={
 routes:[{entity_type:'country',public_path:'/markets/kenya.html',
  country_slug:'kenya',publication_state:'candidate',source_verified_at:'ok',
  live_verified_at:null,editorial_verified_at:null}],
 manufacturers:[{id:15,display_name:'BMW'}],
 models:[{id:77,manufacturer:'BMW',model:'R 1300 GS'}],
 countryLinks:[],globalStories:[]
};
test('private SQL export must be complete and use unique safe paths',()=>{
 assert.equal(validatePrivateEditorialExport(rows).routes,1);
 assert.throws(()=>validatePrivateEditorialExport({...rows,routes:[...rows.routes,rows.routes[0]]}),/Duplicate/);
 assert.throws(()=>validatePrivateEditorialExport({...rows,routes:[{...rows.routes[0],public_path:'/admin/secret.html'}]}),/Invalid/);
 assert.throws(()=>validatePrivateEditorialExport({...rows,routes:[{...rows.routes[0],publication_state:'published'}]}),/independent verification/);
 assert.throws(()=>validatePrivateEditorialExport({...rows,models:null}),/shape/);
});
test('backend-only process enforces connection variables and protected output',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'anybike-sql-export-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const environment={PGHOST:'localhost',PGUSER:'backend',PGDATABASE:'anybike',PGPASSWORD:'test-only'};
 let calls=0;
 const executor=(command,args,options)=>{
  calls++;
  assert.equal(command,'psql');
  assert.ok(args.includes('--no-psqlrc'));
  assert.ok(args.some(x=>x.includes('ON_ERROR_STOP')));
  assert.equal(options.env.PGPASSWORD,'test-only');
  return {status:0,stdout:JSON.stringify(rows),stderr:''};
 };
 assert.throws(()=>exportPrivateEditorialData({environment,executor,
   output:path.join(root,'public.html')}),/ignored reports/);
 assert.throws(()=>exportPrivateEditorialData({environment:{},executor,
   output:path.join(root,'reports','x.json')}),/Missing private backend/);
 // A custom report path under this process's actual checkout is required.
 const target=path.join(process.cwd(),'reports','private-export-test-'+process.pid+'.json');
 t.after(()=>fs.rmSync(target,{force:true}));
 const result=exportPrivateEditorialData({environment,executor,output:target});
 assert.equal(result.routes,1);
 assert.equal(calls,1);
 assert.equal(JSON.parse(fs.readFileSync(target,'utf8')).routes.length,1);
 assert.throws(()=>exportPrivateEditorialData({environment,executor,output:target}),/silently overwritten/);
});
test('database command failure never writes output or leaks backend password in error',t=>{
 const target=path.join(process.cwd(),'reports','private-export-error-'+process.pid+'.json');
 t.after(()=>fs.rmSync(target,{force:true}));
 const environment={PGHOST:'localhost',PGUSER:'backend',PGDATABASE:'anybike',PGPASSWORD:'very-private-password'};
 assert.throws(()=>exportPrivateEditorialData({environment,output:target,
  executor:()=>({status:1,stdout:'',stderr:'very-private-password'})}),err=>
  /Private database export failed/.test(err.message) && !err.message.includes('very-private-password'));
 assert.equal(fs.existsSync(target),false);
});
