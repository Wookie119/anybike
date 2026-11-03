#!/usr/bin/env node
// Complete preview-only Harley photo credit placement after the shared builder.
// Usage: node tools/finalise-manufacturer-preview.mjs [repo-root]
// Never touches approved backups, production pages or database.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(process.argv[2]||'.');
const input=resolve(root,'development-preview/manufacturer-harley-davidson-20-section-preview.html');
const source=resolve(root,'harley-davidson-motorcycles-numbered-backup-20261102.html');
let page=readFileSync(input,'utf8');
const original=readFileSync(source,'utf8');
const mount='<div id="manufacturer-photo-credits-slot"></div>';
if(!page.includes(mount))throw Error('No section 15 credit slot found');
if(!page.includes('id="harley-credits-mount"'))page=page.replace(mount,mount+'<div id="harley-credits-mount"></div>');
// Copy separately authored editorial attribution details, which sit outside
// the 22 static source sections in the protected Harley backup.
const start=original.indexOf('<details class="harley-editorial-attributions"');
if(start<0)throw Error('Harley editorial attribution block missing');
const end=original.indexOf('</details>',start);
if(end<0)throw Error('Harley editorial attribution block unclosed');
const details=original.slice(start,end+'</details>'.length);
if(!page.includes('class="harley-editorial-attributions"'))page=page.replace('<div id="harley-credits-mount"></div>','<div id="harley-credits-mount"></div>'+details);
if(!page.includes('id="harley-credits-mount"')||!page.includes('class="harley-editorial-attributions"'))throw Error('Failed to place photo attributions');
writeFileSync(input,page);
console.log('Harley photo credits and editorial attributions preserved in development preview');
