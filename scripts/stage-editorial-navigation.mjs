/**
 * AnyBike build-time editorial navigation publisher (STAGING ONLY).
 *
 * Given a trusted assembled graph and a repository checkout, renders a preview
 * of pages with crawlable related links under an OUTPUT directory. Never edits
 * source HTML and never deploys. Safeguards protect existing approved layouts.
 *
 * CLI: node scripts/stage-editorial-navigation.mjs --graph=reports/verified-link-graph.json
 * Output: reports/editorial-navigation-preview/ by default.
 */
import fs from 'node:fs';
import path from 'node:path';
import { renderEditorialLinksForPage, EDITORIAL_LINK_CSS } from './render-editorial-related-links.mjs';

const BEGIN='<!-- ANYBIKE GENERATED EDITORIAL NAVIGATION START -->';
const END='<!-- ANYBIKE GENERATED EDITORIAL NAVIGATION END -->';
function relativeHtmlFile(p) {
  if(typeof p !== 'string' || !/^\/(?:markets\/[a-z0-9-]+|global\/[a-z0-9-]+|[a-z0-9-]+)\.html$/i.test(p))return null;
  return p.slice(1);
}
export function renderStagedEditorialHtml(sourceHtml,page) {
  if(typeof sourceHtml !== 'string')throw new TypeError('HTML source required');
  if(sourceHtml.includes(BEGIN) || sourceHtml.includes(END))
    throw new Error('Existing generated-navigation markers require explicit review');
  const nav=renderEditorialLinksForPage(page);
  if(!nav)return sourceHtml;
  const style='<style data-anybike-editorial-links="v1">'+EDITORIAL_LINK_CSS+'</style>';
  const closeMain=/<\/main\s*>/i;
  if(!closeMain.test(sourceHtml)) throw new Error('Page has no closing main landmark');
  // Insert one complementary navigation section at the end of the existing main,
  // without editing, reordering or removing any approved content.
  return sourceHtml.replace(closeMain,BEGIN+'\n'+style+'\n'+nav+'\n'+END+'\n</main>');
}
export function stageEditorialNavigation({root,output,graph}) {
  if(!root || !output || !Array.isArray(graph?.pages))throw new TypeError('root, output, graph.pages required');
  const sourceRoot=path.resolve(root),destRoot=path.resolve(output);
  if(destRoot===sourceRoot || destRoot.startsWith(sourceRoot+path.sep) && !destRoot.includes('preview'))
    throw new Error('Use a separate preview output directory');
  const staged=[],skipped=[],errors=[],prepared=[];
  const destinations=new Set();
  for(const page of graph.pages) {
    const rel=relativeHtmlFile(page.url);
    if(!rel){
      errors.push({id:page.id,path:String(page.url??''),error:'Invalid or unsafe HTML page path'});
      continue;
    }
    if(!page.links?.length){skipped.push(page.id);continue;}
    const input=path.join(sourceRoot,rel),destination=path.join(destRoot,rel);
    if(destinations.has(destination)){
      errors.push({id:page.id,path:rel,error:'Duplicate staged destination'});
      continue;
    }
    destinations.add(destination);
    try{
      if(!fs.existsSync(input))throw new Error('Missing source HTML file');
      // No source files may be modified. Every page must validate before any
      // preview is written, avoiding partial releases that appear successful.
      const original=fs.readFileSync(input,'utf8');
      const revised=renderStagedEditorialHtml(original,page);
      if(revised===original){skipped.push(page.id);continue;}
      if(fs.existsSync(destination))throw new Error('Existing preview requires a clean staging destination');
      prepared.push({id:page.id,path:rel,destination,content:revised,related:page.links.length});
    }catch(error){errors.push({id:page.id,path:rel,error:String(error.message||error)});}
  }
  // Strict all-or-nothing preflight. No preview files are written on errors.
  if(errors.length)return {staged:[],skipped,errors,sourceFilesModified:false};
  for(const item of prepared){
    fs.mkdirSync(path.dirname(item.destination),{recursive:true});
    fs.writeFileSync(item.destination,item.content);
    staged.push({id:item.id,path:item.path,related:item.related});
  }
  return {staged,skipped,errors,sourceFilesModified:false};
}
if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
  const arg=process.argv.find(x=>x.startsWith('--graph='));
  if(!arg){console.error('Usage: node scripts/stage-editorial-navigation.mjs --graph=path/to/verified-link-graph.json');process.exitCode=2;}
  else {
    const graph=JSON.parse(fs.readFileSync(arg.slice('--graph='.length),'utf8'));
    const report=stageEditorialNavigation({root:process.cwd(),output:path.join(process.cwd(),'reports/editorial-navigation-preview'),graph});
    console.log(JSON.stringify(report,null,2));
    if(report.errors.length)process.exitCode=1;
  }
}
