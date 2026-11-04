/**
 * Fail-closed, pure release preflight for AnyBike editorial navigation.
 *
 * This authorises NOTHING by itself: a deployment is a distinct, explicit
 * operation by hosting tooling. A source-verified candidate cannot pass.
 * All checks are for the selected URLs (pilot or full batch), not necessarily
 * all routes in the private registry.
 *
 * Inputs:
 * - private registry rows, containing independent source/live/editorial checks;
 * - fresh public HTTP audit for the exact URL and final canonical destination;
 * - successful tests and authorised deployment context supplied by the caller.
 *
 * No credentials, network, writes or GitHub/123-reg deployment in this module.
 */
const HOST='https://www.anybike.co.uk';
const SAFE=/^\/(?:markets\/[a-z0-9-]+|global\/[a-z0-9-]+|[a-z0-9-]+)\.html$/;
export function assessEditorialReleaseReadiness({
  routes=[],selectedPaths=[],liveResponses=[],testsPassed=false,
  sourceAuditPassed=false,approvedByOwner=false
}={}) {
  const blockers=[];
  if(!Array.isArray(selectedPaths)||!selectedPaths.length)blockers.push('no-selected-pages');
  if(!testsPassed)blockers.push('automated-tests-not-confirmed-passed');
  if(!sourceAuditPassed)blockers.push('source-indexability-audit-not-confirmed-passed');
  if(!approvedByOwner)blockers.push('deployment-not-approved');
  const paths=new Set(),routeByPath=new Map(),liveByUrl=new Map();
  for(const route of routes){
    if(!SAFE.test(String(route?.public_path||'')))continue;
    const p=route.public_path;
    if(routeByPath.has(p))blockers.push('duplicate-registry-route:'+p);
    routeByPath.set(p,route);
  }
  for(const response of liveResponses){
    if(!response?.url)continue;
    if(liveByUrl.has(response.url))blockers.push('duplicate-live-check:'+response.url);
    liveByUrl.set(response.url,response);
  }
  for(const raw of selectedPaths){
    if(!SAFE.test(String(raw||''))) {
      blockers.push('invalid-selected-path:'+String(raw));continue;
    }
    if(paths.has(raw)) {blockers.push('duplicate-selected-path:'+raw);continue;}
    paths.add(raw);
    const row=routeByPath.get(raw);
    if(!row){blockers.push('missing-private-registry-route:'+raw);continue;}
    if(row.publication_state!=='published')blockers.push('not-published-in-registry:'+raw);
    if(!row.source_verified_at)blockers.push('source-not-verified:'+raw);
    if(!row.live_verified_at)blockers.push('live-publication-not-verified:'+raw);
    if(!row.editorial_verified_at)blockers.push('editorial-not-approved:'+raw);
    const http=liveByUrl.get(HOST+raw);
    if(!http || http.checked!==true || http.issues?.length || http.status!==200 ||
       http.finalUrl!==HOST+raw){
      blockers.push('live-http-indexability-unconfirmed:'+raw);
    }
  }
  return {
    status:blockers.length?'blocked':'ready-for-separate-authorised-deployment',
    selectedPages:paths.size,
    ready:blockers.length===0,
    blockers:[...new Set(blockers)],
    note:'This preflight never publishes, replaces HTML, uploads to 123-reg or requests Google indexing.'
  };
}
