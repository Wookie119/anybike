// Preserve source-attributed public guide facts when V2 editorial is already
// published. Approved V2 text is authoritative; legacy facts only fill empty
// research fields for the exact same motorcycle identity.
const norm=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const validSource=value=>typeof value==='string'&&/^https:\/\/[^\s]+$/.test(value);
const cleanRows=(rows,required)=>Array.isArray(rows)?rows.filter(row=>
 row&&typeof row==='object'&&validSource(row.source)&&
 required.every(k=>row[k]!==null&&row[k]!==undefined&&String(row[k]).trim())):[];
export function supplementPublishedV2Guide(editorial,legacy,{make,model}={}){
 if(!editorial||typeof editorial!=='object'||!legacy||typeof legacy!=='object')return editorial;
 if(norm(legacy.make)!==norm(make)||norm(legacy.model)!==norm(model)||
    norm(editorial.make)!==norm(make)||norm(editorial.model)!==norm(model))return editorial;
 const production={...(editorial.production||{})},older=legacy.production||{};
 for(const [key,required] of [
  ['documented_milestones',['year','event']],
  ['specifications',['model_year']],
  ['official_colours',['model_year','name']]
 ]){
  if(Array.isArray(production[key])&&production[key].length)continue;
  const accepted=cleanRows(older[key],required);
  if(accepted.length)production[key]=accepted;
 }
 return {...editorial,production};
}
