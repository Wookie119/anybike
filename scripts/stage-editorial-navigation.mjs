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
  const staged=[],skipped=[],errors=[];
  for(const page of graph.pages) {
    const rel=relativeHtmlFile(page.url);
    if(!rel || !page.links?.length){skipped.push(page.id);continue;}
    const input=path.join(sourceRoot,rel),destination=path.join(destRoot,rel);
    try{
      if(!fs.existsSync(input))throw new Error('Missing source HTML file');
      const original=fs.readFileSync(input,'utf8');
      const revised=renderStagedEditorialHtml(original,page);
      if(revised===original){skipped.push(page.id);continue;}
      fs.mkdirSync(path.dirname(destination),{recursive:true});
      fs.writeFileSync(destination,revised);
      staged.push({id:page.id,path:rel,related:page.links.length});
    }catch(error){errors.push({id:page.id,path:rel,error:String(error.message||error)});}
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
