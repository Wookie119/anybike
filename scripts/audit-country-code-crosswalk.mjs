/**
 * Source-only consistency audit of the private country registry's ISO code
 * crosswalk. Uses existing approved AnyBike directory + market metadata.
 *
 * A unique, exact country-name match is required for automatic code mapping.
 * Ambiguous names remain deliberately unresolved: no guesses about flags,
 * territories, model availability or international shipping.
 */
const key=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
export function auditCountryCodeCrosswalk({routes=[],directory=[],marketData={}}={}) {
 const issues=[],unresolved=[],checked=[];
 const sourceByPath=new Map();
 for(const row of directory){
  if(sourceByPath.has(row.url))issues.push({code:'duplicate-directory-url',url:row.url});
  else sourceByPath.set(row.url,row);
 }
 const codesByName=new Map();
 for(const [code,data] of Object.entries(marketData)){
  if(!/^[A-Z]{2}$/.test(code)||!data?.country)continue;
  const n=key(data.country),list=codesByName.get(n)||[];
  list.push(code);codesByName.set(n,list);
 }
 const seenCodes=new Map(),seenPaths=new Set();
 const reviewedEvidence=new Set(['named-country-flag-plus-ISO-reference','reviewed-ISO-country-alias-and-curated-market-record']);
 for(const route of routes){
  const path=route?.public_path,source=sourceByPath.get(path);
  if(!/^\/markets\/[a-z0-9-]+\.html$/.test(String(path||'')) ||
   route.country_slug!==String(path).split('/').pop().replace(/\.html$/,'') ||
   !source || route.country_name!==source.name || route.country_region!==source.region){
    issues.push({code:'unmatched-directory-identity',path});
    continue;
  }
  if(seenPaths.has(path)){issues.push({code:'duplicate-route',path});continue;}
  seenPaths.add(path);
  const exactCodes=codesByName.get(key(source.name))||[];
  const code=route.country_code;
  if(code != null){
   if(!/^[A-Z]{2}$/.test(code)){
    issues.push({code:'invalid-country-code',path,iso:code});continue;
   }
   if(seenCodes.has(code)){
    issues.push({code:'duplicate-country-code',path,other:seenCodes.get(code),iso:code});continue;
   }
   seenCodes.set(code,path);
   if(exactCodes.length===1 && exactCodes[0]!==code)
    issues.push({code:'code-contradicts-unique-source',path,iso:code});
   if(exactCodes.length!==1 && !reviewedEvidence.has(route.country_code_evidence)) {
    issues.push({code:'country-code-requires-evidence',path,iso:code});
   }
   checked.push({path,name:source.name,code});
  } else {
   if(exactCodes.length===1)issues.push({code:'missing-exact-country-code',path,expected:exactCodes[0]});
   else unresolved.push({path,name:source.name,reason:'ambiguous-or-unmapped-country-name'});
  }
 }
 if(routes.length!==directory.length)issues.push({code:'directory-route-count-mismatch',
  routes:routes.length,directory:directory.length});
 return {counts:{routes:routes.length,verifiedUniqueCodes:checked.length,
    unresolvedNames:unresolved.length,issues:issues.length},issues,unresolved};
}
