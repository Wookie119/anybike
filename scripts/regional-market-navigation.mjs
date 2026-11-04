/**
 * Regional market navigation, derived from private Supabase editorial routes.
 *
 * Source-verified candidates may be rendered ONLY into staging previews.
 * Production navigation requires publication_state='published' plus ALL three
 * independent verification timestamps; no access to private tables in browsers.
 * Never infer model-country sourcing or stock availability from shared region.
 */
const ALLOWED_REGION=new Set([
 'Europe','North America','Central America','Caribbean','South America',
 'Africa','Middle East','Asia','Oceania'
]);
const validPath = path => typeof path === 'string' &&
 /^\/markets\/[a-z0-9-]+\.html$/.test(path);
function eligible(row,mode) {
 if(row?.entity_type!=='country' || !validPath(row.public_path) ||
    row.public_path!==`/markets/${row.country_slug}.html` ||
    !row.source_verified_at || typeof row.country_name!=='string' ||
    !row.country_name.trim() || !ALLOWED_REGION.has(row.country_region))return false;
 if(mode==='staging')return row.publication_state==='candidate'||row.publication_state==='published';
 return mode==='published' && row.publication_state==='published' &&
   Boolean(row.live_verified_at && row.editorial_verified_at);
}
export function regionalMarketNavigation({routes=[],mode='published',maxLinks=6}={}) {
 if(!['staging','published'].includes(mode))throw new TypeError('mode must be staging or published');
 if(!Number.isSafeInteger(maxLinks)||maxLinks<1||maxLinks>12)throw new TypeError('maxLinks must be 1 to 12');
 const diagnostics=[],groups=new Map(),valid=[];
 const pathSeen=new Set(),slugSeen=new Set();
 for(const r of routes){
  if(!eligible(r,mode))continue;
  if(pathSeen.has(r.public_path)||slugSeen.has(r.country_slug)) {
   diagnostics.push({code:'duplicate-country-route',path:r.public_path});
   continue;
  }
  pathSeen.add(r.public_path);slugSeen.add(r.country_slug);
  valid.push(r);
  const group=groups.get(r.country_region)||[];
  group.push(r);groups.set(r.country_region,group);
 }
 const pages=[];
 for(const [region,group] of groups){
  group.sort((a,b)=>a.country_name.localeCompare(b.country_name,'en-GB') ||
    a.public_path.localeCompare(b.public_path));
  for(let i=0;i<group.length;i++){
   const self=group[i],links=[],taken=new Set();
   // Balanced adjacent neighbours in the region; stable and no fake relation
   // with models or stock. Wraparound ensures smaller regions can still link.
   for(let distance=1;distance<group.length && links.length<maxLinks;distance++){
    for(const j of [(i+distance)%group.length,(i-distance+group.length)%group.length]){
     const other=group[j];
     if(other.public_path===self.public_path||taken.has(other.public_path))continue;
     taken.add(other.public_path);
     links.push({id:'country:'+other.country_slug,type:'country',
       title:other.country_name,url:other.public_path,
       relationship:'same-region-navigation'});
     if(links.length===maxLinks)break;
    }
   }
   pages.push({
    id:'country:'+self.country_slug,
    type:'country', title:self.country_name, region,
    url:self.public_path, links, published:mode==='published'
   });
  }
 }
 pages.sort((a,b)=>a.url.localeCompare(b.url));
 return {mode,pages,diagnostics,counts:{
  inputRoutes:routes.length,eligibleCountryRoutes:valid.length,
  generatedNavigationLinks:pages.reduce((n,p)=>n+p.links.length,0),
  regions:groups.size
 }};
}
