/**
 * AnyBike public guide photo reference extraction.
 * Records existing STATIC Wikimedia Commons references only. No downloading,
 * image rights claims, licence approval, or automatic model/year attribution.
 */
const sourcePattern=/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//;
function readAttr(tag,name) {
 const m=tag.match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\x27([^\x27]*)\x27)','i'));
 return m ? m[1]??m[2] : null;
}
export function inspectApprovedModelPhotoReferences({html,sourcePath,sourceGitBlobSha,modelId}={}) {
 if(typeof html!=='string' || !Number.isSafeInteger(modelId) || modelId<1 ||
  !/^\/[a-z0-9-]+\.html$/.test(String(sourcePath||'')) ||
  !/^[a-f0-9]{40}$/.test(String(sourceGitBlobSha||'')))
   return {eligible:false,reason:'invalid-model-source',candidates:[]};
 const canon=[...html.matchAll(/<link\b[^>]*>/gi)]
   .map(m=>m[0]).filter(t=>/\brel\s*=\s*["']canonical["']/i.test(t));
 const href=canon.length===1?readAttr(canon[0],'href'):null;
 if(href!=='https://www.anybike.co.uk'+sourcePath)
   return {eligible:false,reason:'canonical-not-verified',candidates:[]};
 const meta=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0])
   .filter(t=>/\bname\s*=\s*["'](?:robots|googlebot)["']/i.test(t)).join(' ');
 if(/\b(?:noindex|none|nofollow)\b/i.test(meta))
   return {eligible:false,reason:'restricted-source',candidates:[]};
 const credits=[...html.matchAll(/<a\b[^>]*>/gi)].map(m=>readAttr(m[0],'href'))
   .filter(u=>typeof u==='string'&&u.startsWith('https://commons.wikimedia.org/wiki/File:'));
 const seen=new Set(),candidates=[];
 for(const match of html.matchAll(/<img\b[^>]*>/gi)) {
  const tag=match[0],url=readAttr(tag,'src');
  if(!sourcePattern.test(String(url||'')) || seen.has(url))continue;
  seen.add(url);
  const alt=readAttr(tag,'alt')||'';
  candidates.push({
   model_id:modelId,source_public_path:sourcePath,
   source_git_blob_sha:sourceGitBlobSha,image_url:url,image_alt:alt,
   attribution_link:credits.length===1?credits[0]:null,
   rights_review_status:'requires_review',year_accuracy_status:'unverified'
  });
 }
 return {eligible:true,candidates,creditLinksFound:credits.length,
  note:'Commons URL/credit existence does not establish licence, attribution accuracy, or model-year suitability.'};
}
