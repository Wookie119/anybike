/**
 * Read-only extraction of source-backed motorcycle model introduction text.
 * Exact existing HTML wording only. Never generates model facts or updates
 * canonical Supabase overview/specification fields without independent QA.
 */
const clean = value => String(value || '')
  .replace(/<[^>]*>/g,' ')
  .replace(/&amp;/gi,'&').replace(/&nbsp;/gi,' ')
  .replace(/&#39;/g,"'").replace(/&quot;/gi,'"')
  .replace(/&#8217;/g,"’").replace(/&mdash;/gi,'—')
  .replace(/\s+/g,' ').trim();

const normal = value => String(value||'').normalize('NFKD')
  .toLowerCase().replace(/[^a-z0-9]/g,'');

export function extractApprovedModelHero({
 html,sourcePath,modelName,sourceSha
}={}) {
 if(typeof html!=='string'||typeof sourcePath!=='string'||
    !/^\/[a-z0-9-]+\.html$/.test(sourcePath) ||
    !/^[a-f0-9]{40}$/.test(String(sourceSha||'')) ||
    typeof modelName!=='string'||!modelName.trim())
  return {eligible:false,reason:'missing-or-invalid-source-identity'};
 const canonical=[...html.matchAll(/<link\b[^>]*>/gi)]
   .map(x=>x[0]).filter(x=>/\brel\s*=\s*["']canonical["']/i.test(x));
 const href=canonical.length===1 ? canonical[0]
   .match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] : null;
 if(href!=='https://www.anybike.co.uk'+sourcePath)
  return {eligible:false,reason:'canonical-mismatch'};
 const robots=[...html.matchAll(/<meta\b[^>]*>/gi)].map(x=>x[0])
  .filter(x=>/\bname\s*=\s*["'](?:robots|googlebot)["']/i.test(x)).join(' ');
 if(/\b(?:noindex|none|nofollow)\b/i.test(robots))
  return {eligible:false,reason:'source-indexing-restriction'};
 const match=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>\s*<p\b[^>]*class=["'][^"']*\b(?:lead|intro)\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
 if(!match) return {eligible:false,reason:'no-supported-approved-hero'};
 const title=clean(match[1]),summary=clean(match[2]);
 if(normal(title)!==normal(modelName))
  return {eligible:false,reason:'source-model-name-mismatch'};
 if(summary.length<15 || summary.length>2000)
  return {eligible:false,reason:'hero-extract-length-invalid'};
 const generation=html.match(/<h2\b[^>]*>Model years and generations<\/h2>\s*<p\b[^>]*>([\s\S]*?)<\/p>/i);
 return {
  eligible:true,
  record:{
   public_path:sourcePath,original_title:title,hero_summary:summary,
   generation_note:clean(generation?.[1])||null,
   source_sha:sourceSha,
   extraction_method:'approved-html-hero-v1',
   extraction_status:'source_capture_only'
  }
 };
}
