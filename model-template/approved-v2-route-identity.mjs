// Reviewed, exact-identity route resolution for the ONE approved V2 renderer.
// Never infer a model from filename slug, brand prefix or partial name.
export const normalizeModelIdentity=value=>String(value??'').toLocaleLowerCase('en-GB').replace(/[^a-z0-9]+/g,' ').trim();
export function resolveApprovedV2Identity(pathname,rows){
 if(typeof pathname!=='string'||!/^\/(?:bmw|harley-davidson)-[a-z0-9-]+\.html$/.test(pathname))return null;
 if(!Array.isArray(rows))return null;
 const matches=rows.filter(row=>row&&row.url===pathname&&
  typeof row.make==='string'&&row.make.trim()&&
  typeof row.model==='string'&&row.model.trim()&&
  (normalizeModelIdentity(row.make)==='bmw'||normalizeModelIdentity(row.make)==='harley davidson'));
 // Duplicate, conflicting or malformed route registrations fail closed.
 if(matches.length!==1)return null;
 return Object.freeze({make:matches[0].make.trim(),model:matches[0].model.trim(),url:pathname});
}
