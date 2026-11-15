#!/usr/bin/env node
// Syntax-check inline public catalogue scripts without running browser APIs.
// Stops a malformed manufacturer/library script reaching DealerWebs visitors.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const pages=['motorcycle-brand.html','motorcycle-model-library.html'];
let count=0;
for(const page of pages){
 const html=fs.readFileSync(page,'utf8');
 const blocks=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
 for(const [i,block] of blocks.entries()){
  const attrs=block[1];
  const source=block[2].trim();
  if(!source||/\bsrc\s*=/.test(attrs)||/\btype\s*=\s*["']application\/json["']/.test(attrs))continue;
  const module=/\btype\s*=\s*["']module["']/.test(attrs);
  const result=spawnSync(process.execPath,['--check',...(module?['--input-type=module']:[])],{input:source,encoding:'utf8'});
  if(result.status!==0){console.error('Invalid public catalogue script',page,i,result.stderr);process.exitCode=1;}
  else count++;
 }
}
if(!count){console.error('No public catalogue inline scripts checked');process.exitCode=1;}
console.log('Checked',count,'public catalogue inline scripts');
