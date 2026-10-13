// Run from repository root: node scripts/check-harley-editorial-photographs.mjs
// Do not use unrelated motorcycle photographs as historical or modification evidence.
import {readFileSync} from 'node:fs';
const manufacturer=readFileSync('harley-davidson-motorcycles.html','utf8');
const global=readFileSync('anybike-global.html','utf8');
const errors=[];
const disallowed={
 'V-Rod: Revolution engine and Porsche collaboration':true,
 'XR1000: race engineering for the road':true,
 '1957 · Sportster begins':true,
 '2017 · Milwaukee-Eight Touring':true,
 'Superchargers and turbochargers':true
};
for(const [title] of Object.entries(disallowed)){
 const heading='<h3>'+title+'</h3>';
 const at=manufacturer.indexOf(heading);
 if(at<0){errors.push('Missing historical section '+title);continue}
 if(manufacturer.slice(at+heading.length,at+heading.length+65).includes('harley-editorial-photo'))errors.push('Unverified illustrated photograph immediately after '+title);
}
const turbo=global.indexOf('<h3>Harley-Davidson superchargers and turbochargers</h3>');
if(turbo<0)errors.push('Global forced-induction story missing');
else {
 const open=global.lastIndexOf('<article',turbo),tag=global.slice(open,global.indexOf('>',open)+1);
 if(tag.includes('data-photo='))errors.push('Forced-induction story must not display an unmodified model as turbo/supercharger evidence');
}
for(const match of manufacturer.matchAll(/<figure class="harley-editorial-photo">([\s\S]*?)<\/figure>/g)){
 if(!match[1].includes('Photo and licence details'))errors.push('Uncredited editorial photograph');
}
if(errors.length){errors.forEach(e=>console.error('FAIL '+e));process.exitCode=1}
else console.log('PASS: Harley editorial image mismatch guard is satisfied.');
