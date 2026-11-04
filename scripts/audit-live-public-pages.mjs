/**
 * Read-only 123-reg public-page smoke test; zero authenticated requests.
 * Runs from CI with Node 20+ and produces JSON even on HTTP/network failure.
 * Not a layout or browser-rendering test. Run:
 *   node scripts/audit-live-public-pages.mjs > live-audit.json
 *   node scripts/audit-live-public-pages.mjs --strict
 */
const BASE='https://www.anybike.co.uk';
const PAGES=[
 '/bmw-motorcycles.html',
 '/harley-davidson-motorcycles.html',
 '/markets/belgium.html',
 '/markets/kenya.html',
 '/markets/samoa.html'
];
async function check(path){
 const url=BASE+path;
 try{
  const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'AnyBike-Public-Page-HealthCheck/1.0'}});
  const html=(await response.text()).slice(0,1_500_000);
  const canon=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0])
   .filter(x=>/\brel\s*=\s*["']canonical["']/i.test(x))
   .map(x=>x.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]).filter(Boolean);
  const robot=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0])
   .filter(x=>/\bname\s*=\s*["']robots["']/i.test(x)).join(' ');
  const issues=[];
  if(!response.ok)issues.push('http-'+response.status);
  if(response.url!==url)issues.push('redirected');
  if(canon.length!==1 || canon[0]!==url)issues.push('canonical-mismatch');
  if(/\bnoindex\b/i.test(robot))issues.push('noindex');
  if(!/<h1\b/i.test(html))issues.push('missing-h1');
  return {path,status:response.status,issues};
 }catch(error){
  return {path,status:null,issues:['fetch-failed'],error:String(error?.message||error).slice(0,250)};
 }
}
const results=await Promise.all(PAGES.map(check));
const report={timestamp:new Date().toISOString(),scope:'public HTTP response only, not full browser rendering',results,passed:results.filter(r=>!r.issues.length).length,failed:results.filter(r=>r.issues.length).length};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(process.argv.includes('--strict') && report.failed)process.exitCode=1;
