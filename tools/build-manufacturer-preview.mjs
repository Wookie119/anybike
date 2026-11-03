#!/usr/bin/env node
// Preview builder for archived AnyBike manufacturer sections. No network or database calls.
// Usage: node tools/build-manufacturer-preview.mjs [repo-root]
// Run on isolated development branch only. Output under development-preview/.
// Does not modify the protected original manufacturer pages or backups.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(process.argv[2]||'.');
const names=['Manufacturer introduction','Complete motorcycle model library','Manufacturer history','Manufacturing and factories','Engineering and technology','Motorcycle generations and development','Historical timeline','Famous and iconic motorcycles','Motorcycle categories and riding styles','Motorsport history','Factory racing teams and works riders','Performance and specialist engineering','Factory colours and design evolution','Production figures and global markets','Factory and historical photography','Ownership and buying guides','AnyBike Global stories','Related manufacturers and motorcycle comparisons','UK motorcycle services','International buying and exporting'];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const specs=[['bmw','bmw-motorcycles-numbered-backup-20261102.html'],['harley-davidson','harley-davidson-motorcycles-numbered-backup-20261102.html']];
for(const [slug,source] of specs){
 const original=readFileSync(resolve(root,source),'utf8');
 const archive=JSON.parse(readFileSync(resolve(root,'development-data/manufacturer-source-archive-'+slug+'-20261103.json'),'utf8'));
 const start=original.indexOf('<main class="wide">');
 const end=original.indexOf('</main>',start);
 if(start<0||end<0)throw Error('main boundary unavailable: '+slug);
 const main=original.slice(start,end);
 const first=main.search(/<section class="section" aria-label="Browse/);
 if(first<0)throw Error('cannot locate approved hero: '+slug);
 const hero=main.slice(0,first);
 const blocks=archive.records.filter(x=>x.source_html);
 const placed=new Set();
 const get=n=>blocks.filter(x=>x.universal_sections[0]===n).map(x=>{placed.add(x.source_heading_number);return x.source_html;}).join('\n');
 const sections=names.map((name,i)=>{
  const n=i+1,number=String(n).padStart(2,'0');
  let block=get(n);
  if(!block){
   const siblings=blocks.filter(x=>x.universal_sections.includes(n));
   if(siblings.length)block='<p class="preview-note">Relevant source material is preserved in '+siblings.map(s=>'<a href="#section-'+String(s.universal_sections[0]).padStart(2,'0')+'">'+esc(s.heading)+'</a>').join(', ')+'.</p>';
  }
  if(n===15)block+='<div id="manufacturer-photo-credits-slot"></div>';
  if(!block)block='<p class="preview-note">Research and source verification pending. No invented content.</p>';
  return '<section class="preview-section" id="section-'+number+'"><h2 class="preview-heading"><span>'+number+'.</span> '+esc(name)+'</h2>'+block+'</section>';
 }).join('\n');
 if(placed.size!==blocks.length)throw Error('Missing content blocks: '+slug);
 const nav='<nav class="preview-nav" aria-label="Manufacturer sections">'+names.map((x,i)=>'<a href="#section-'+String(i+1).padStart(2,'0')+'">'+String(i+1).padStart(2,'0')+' · '+esc(x)+'</a>').join('')+'</nav>';
 const banner='<p class="preview-banner"><strong>UNPUBLISHED DEVELOPMENT PREVIEW</strong> — approved website pages remain unchanged. Incomplete sections are not publishable.</p>';
 const css='<style>.preview-banner{border-left:4px solid #ed1c24;background:#191919;padding:16px;max-width:1700px;margin:18px auto;color:#fff}.preview-nav{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}.preview-nav a{border:1px solid #ed1c24;border-radius:99px;padding:8px 12px;background:#151515;color:#fff;font-size:13px}.preview-section{padding:22px 0;border-bottom:1px solid #393939;scroll-margin-top:80px}.preview-heading{font-size:clamp(22px,2.6vw,34px);margin:0 0 18px}.preview-heading span{color:#ed1c24}.preview-section>.section{margin-top:10px}.preview-section .sectionhead h2{font-size:clamp(19px,2vw,28px)}.preview-note{padding:18px;background:#151515;border-left:3px solid #ed1c24;color:#ddd}.preview-note a{color:#ed1c24;text-decoration:underline}@media(max-width:700px){.preview-banner{margin:12px 16px}.preview-nav a{font-size:12px}}</style>';
 let output=original.slice(0,start)+banner+hero+nav+sections+'\n'+original.slice(end);
 output=output.replace('<meta name="robots" content="index,follow">','<meta name="robots" content="noindex,nofollow">');
 output=output.replace(/<link rel="canonical" href="[^"]+">/,'');
 output=output.replace('</head>',css+'</head>');
 output=output.replace(/document\.getElementById\("modelFamilies"\)\.appendChild\((photoCreditsSection|creditSection)\);/g,'(document.getElementById("manufacturer-photo-credits-slot")||document.getElementById("modelFamilies")).appendChild($1);');
 mkdirSync(resolve(root,'development-preview'),{recursive:true});
 const path=resolve(root,'development-preview/manufacturer-'+slug+'-20-section-preview.html');
 writeFileSync(path,output);
 console.log(slug+' : 20 slots; '+placed.size+' static archived sections; noindex preview built');
}
