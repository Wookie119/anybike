/**
 * PRIVATE Supabase editorial route registry -> publication-gated identities.
 *
 * A publishing backend reads anybike_publishing.editorial_page_routes using
 * server credentials. No credentials or SQL in public HTML/JS.
 * Never infer live publication from a source file, sitemap, or model slug.
 *
 * Returns identities for makePublicEditorialManifest() only when ALL three
 * independent checks are recorded in the private registry.
 */
const safeId = value => Number.isSafeInteger(value) && value > 0;
const pathOK = value => typeof value==='string' &&
 /^\/(?:markets\/|global\/)?[a-z0-9-]+\.html$/i.test(value);
const normalized = s => String(s||'').trim().toLocaleLowerCase('en-GB');
export function verifiedIdentitiesFromRoutes({
 routes=[],manufacturers=[],models=[],stories=[],countries=[]
}={}) {
 const makeById=new Map(manufacturers.map(m=>[m.id,m]));
 const modelById=new Map(models.map(m=>[m.id,m]));
 const storyById=new Map(stories.map(s=>[s.id,s]));
 const countryBySlug=new Map(countries.map(c=>[c.slug,c]));
 const identities=[],diagnostics=[];
 let unpublished=0;
 for(const row of routes) {
  if(row?.publication_state!=='published' || !row?.source_verified_at ||
     !row?.live_verified_at || !row?.editorial_verified_at) {
   unpublished++;
   continue;
  }
  if(!pathOK(row.public_path)) {
   diagnostics.push({code:'invalid-public-path',routeId:row.id});continue;
  }
  let id,title;
  if(row.entity_type==='manufacturer' && safeId(row.manufacturer_id)){
   const make=makeById.get(row.manufacturer_id);
   if(make && typeof make.display_name==='string' && make.display_name.trim()){
    id='manufacturer:'+make.id;title=make.display_name.trim();
   }
  }else if(row.entity_type==='model' && safeId(row.model_id)){
   const model=modelById.get(row.model_id);
   const makeMatch=manufacturers.some(m=>normalized(m.display_name)===normalized(model?.manufacturer));
   if(model && makeMatch && String(model.model||'').trim()){
    id='model:'+model.id;title=model.manufacturer+' '+model.model;
   }
  }else if(row.entity_type==='country' && typeof row.country_slug==='string'){
   const country=countryBySlug.get(row.country_slug);
   if(country?.code && country?.name && row.public_path==='/markets/'+row.country_slug+'.html'){
    id='country:'+String(country.code).toUpperCase();title=country.name;
   }
  }else if(row.entity_type==='global' && safeId(row.story_id)){
   const story=storyById.get(row.story_id);
   if(story?.editorial_status==='published' && story.story_url===row.public_path) {
    id='global:'+story.id;title=story.headline;
   }
  }
  if(!id || !title){
   diagnostics.push({code:'unmatched-route-identity',routeId:row.id});continue;
  }
  identities.push({
   id,type:row.entity_type,title,
   url:'https://www.anybike.co.uk'+row.public_path,
   published:true,liveVerified:true
  });
 }
 return {identities,skippedUnpublished:unpublished,diagnostics};
}
