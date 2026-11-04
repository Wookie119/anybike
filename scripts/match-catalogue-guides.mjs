/**
 * Safe catalogue-to-guide resolver for SOURCE-ONLY staging.
 *
 * Never derive a publishable page URL from a Supabase slug.
 * Each link requires a real, eligible HTML file with self canonical + sitemap.
 * Punctuation/spacing may vary between the two names; every letter and digit
 * must match. Ambiguities are excluded, never arbitrarily resolved.
 */
const norm = value => typeof value === 'string'
  ? value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '')
  : '';
export function matchCatalogueGuides({inventory,manufacturers=[],models=[]}={}) {
 const diagnostics=[],pages=[],seenPagePaths=new Set();
 const eligible=(inventory?.candidates||[]).filter(p=>p?.sourceEligible===true && ['manufacturer','model'].includes(p.type));
 const allMakes=new Map();
 for(const make of manufacturers){
  const key=norm(make?.display_name);
  if(!key || !Number.isSafeInteger(make.id) || make.id<=0)continue;
  if(allMakes.has(key))allMakes.set(key,null);
  else allMakes.set(key,make);
 }
 const allModels=new Map();
 for(const model of models){
  const key=norm(String(model?.manufacturer||'')+String(model?.model||''));
  if(!key || !Number.isSafeInteger(model.id) || model.id<=0)continue;
  if(allModels.has(key))allModels.set(key,null);
  else allModels.set(key,model);
 }
 const sourceKeys=new Map();
 for(const item of eligible) {
  const file=item.path?.split('/').pop();
  if(!file || !/^[a-z0-9-]+\.html$/i.test(file))continue;
  const base=file.slice(0,-5);
  const key=norm(item.type==='manufacturer' && base.endsWith('-motorcycles') ? base.slice(0,-12) : base);
  const k=item.type+':'+key;
  sourceKeys.set(k,(sourceKeys.get(k)||0)+1);
 }
 for(const item of eligible){
  const filename=item.path?.split('/').pop();
  if(!filename || !/^[a-z0-9-]+\.html$/i.test(filename))continue;
  const base=filename.slice(0,-5);
  const key=norm(item.type==='manufacturer' && base.endsWith('-motorcycles') ? base.slice(0,-12) : base);
  if(sourceKeys.get(item.type+':'+key)>1){
   diagnostics.push({code:'duplicate-source-match',path:item.path});
   continue;
  }
  const entry=item.type==='manufacturer'?allMakes.get(key):allModels.get(key);
  if(!entry){
   diagnostics.push({code: 'unmatched-or-ambiguous-guide',path:item.path});
   continue;
  }
  const id=item.type+':'+entry.id;
  if(seenPagePaths.has(id)){
   diagnostics.push({code:'duplicate-model-identity',path:item.path,id});
   continue;
  }
  const type=item.type;
  pages.push({
   id,type,
   title:type==='manufacturer'?entry.display_name:entry.manufacturer+' '+entry.model,
   url:'/'+item.path,
   published:true
  });
  seenPagePaths.add(id);
 }
 pages.sort((a,b)=>a.url.localeCompare(b.url));
 diagnostics.sort((a,b)=>(a.path||'').localeCompare(b.path||''));
 return {pages,diagnostics,counts:{
  catalogueManufacturers:manufacturers.length,
  catalogueModels:models.length,
  eligibleSourceGuides:eligible.length,
  matchedGuides:pages.length,
  unmatchedGuides:diagnostics.length
 }};
}
