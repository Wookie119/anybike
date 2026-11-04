import fs from 'node:fs';
/**
 * Convert country source-indexability results into private BACKEND IMPORT candidates.
 * No database writes. Never marks anything live, approved or published.
 *
 * Input: result of auditCountryIndexability().
 * Output: {rows:[{entity_type,country_slug,public_path,publication_state}],excluded}
 * Importer must independently compare with existing registry and check live
 * publication before changing publication_state.
 */
export function makeCountryRouteCandidates(audit) {
 if (!audit || !Array.isArray(audit.pages)) throw new TypeError('Country audit required');
 const rows=[],excluded=[],seenSlugs=new Set(),seenPaths=new Set();
 const badPaths=new Set((audit.issues||[])
   .filter(x=>x?.code==='duplicate-market-sitemap-loc'||x?.code==='sitemap-market-source-missing')
   .map(x=>x.path));
 for(const page of audit.pages) {
  const p=page?.path||'';
  const m=p.match(/^markets\/([a-z0-9-]+)\.html$/);
  const slug=m?.[1]||null;
  const expected='https://www.anybike.co.uk/'+p;
  if(!slug || !page.sourceEligible || page.url!==expected || badPaths.has(page.url)){
   excluded.push({path:p,reason:'unverified-or-invalid-source'});continue;
  }
  if(seenSlugs.has(slug)||seenPaths.has(p)){
   excluded.push({path:p,reason:'duplicate-candidate'});continue;
  }
  seenSlugs.add(slug);seenPaths.add(p);
  rows.push({entity_type:'country',country_slug:slug,public_path:'/'+p,
   publication_state:'candidate',
   evidence_note:'Repository source verified by country SEO audit; live server and editorial review not confirmed'});
 }
 rows.sort((a,b)=>a.country_slug.localeCompare(b.country_slug));
 return {scope:'staging-only; no automatic Supabase mutation',rows,excluded,
  counts:{sourcePages:audit.pages.length,candidates:rows.length,excluded:excluded.length}};
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
 const file=process.argv[2];
 if(!file){console.error('Usage: node scripts/build-country-route-candidates.mjs country-indexability.json');process.exitCode=2;}
 else {
  const audit=JSON.parse(fs.readFileSync(file,'utf8'));
  console.log(JSON.stringify(makeCountryRouteCandidates(audit),null,2));
 }
}
