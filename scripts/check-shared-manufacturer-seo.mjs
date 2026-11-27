// node scripts/check-shared-manufacturer-seo.mjs
// Check the published manufacturer routes and the shared template's SEO tags.
import fs from 'node:fs';
const html=fs.readFileSync('motorcycle-brand.html','utf8');
const head=html.split('</head>')[0];
const script=html.slice(html.indexOf('const guides='),html.lastIndexOf('})();'));
const issues=[];
const require=(ok,message)=>{if(!ok)issues.push(message)};
require((html.match(/<h1\b/g)||[]).length===1,'Shared manufacturer template must have one H1');
require((head.match(/name="description"/g)||[]).length===1,'Exactly one initial description tag needed');
require((head.match(/rel="canonical"/g)||[]).length===1,'Exactly one initial canonical tag needed');
for(const element of ['title','intro','modelGroups','categoryCards','categoryNavigation','canonicalLink','brandOgTitle','brandOgDescription','brandOgUrl','brandTwitterTitle','brandTwitterDescription']){
 require(html.includes('id="'+element+'"'),'Missing renderer element #'+element);
}
for(const token of ['encodeURIComponent(make)','document.title=make+','document.getElementById("brandOgTitle").content','document.getElementById("brandOgUrl").content','document.getElementById("canonicalLink").href']){
 require(script.includes(token),'Missing dynamic SEO update: '+token);
}
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const dynamic=[...sitemap.matchAll(/<loc>(https:\/\/www\.anybike\.co\.uk\/motorcycle-brand\.html\?[^<]+)<\/loc>/g)].map(x=>x[1]);
const directory=fs.readFileSync('motorcycle-manufacturers.html','utf8');
require(head.includes('<meta name="robots" content="index,follow">'),
 'Published manufacturer renderer must allow indexing');
require(html.includes('if(!knownBrand){')&&html.includes('.content="noindex,follow"'),
 'Unknown manufacturer routes must be excluded from indexing');
require(directory.includes('/bmw-motorcycles.html'),'BMW approved manufacturer route missing');
require(directory.includes('/harley-davidson-motorcycles.html'),'Harley-Davidson approved manufacturer route missing');
require(new Set(dynamic).size===dynamic.length,'Duplicate manufacturer query URLs in sitemap');
const approved=new Set([...directory.matchAll(/href="(\/motorcycle-brand\.html\?make=[^"]+)"/g)]
 .map(match=>'https://www.anybike.co.uk'+match[1]));
for(const url of approved)require(dynamic.includes(url),'Published manufacturer missing from sitemap: '+url);
for(const url of dynamic)require(approved.has(url),'Manufacturer sitemap route missing from the A-Z directory: '+url);
if(issues.length){issues.forEach(x=>console.error('FAIL '+x));process.exitCode=1}
else console.log('PASS: sitemap matches '+approved.size+' shared manufacturer routes linked from A-Z.');
