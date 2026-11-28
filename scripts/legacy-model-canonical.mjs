// The preferred destination for an approved legacy URL is its exact permanent
// model identity in the public registry, never a matching slug or nearby model.
import {readFileSync} from 'node:fs';
import {normalizeModelIdentity} from '../model-template/approved-v2-route-identity.mjs';

const read=file=>JSON.parse(readFileSync(new URL('../data/'+file,import.meta.url),'utf8')).models;
const legacy=read('approved-dedicated-model-routes.json');
const permanent=read('universal-v2-model-routes.json');
const key=row=>normalizeModelIdentity(row.make)+'|'+normalizeModelIdentity(row.model);

export function legacyModelCanonical(route){
 const source=legacy.find(row=>row.url==='/'+route.replace(/^\//,''));
 if(!source)throw Error('Unregistered legacy model URL: '+route);
 const matches=permanent.filter(row=>key(row)===key(source));
 if(matches.length!==1)throw Error('Expected one permanent URL for '+route);
 return 'https://www.anybike.co.uk'+matches[0].url;
}

export function hasLegacyModelCanonical(html,route){
 const canonical=[...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/gi)];
 return canonical.length===1&&canonical[0][1]===legacyModelCanonical(route);
}
