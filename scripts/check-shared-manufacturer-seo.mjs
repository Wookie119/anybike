// node scripts/check-shared-manufacturer-seo.mjs
// Static guard for the shared manufacturer template. Browser-rendered Google indexing
// must be validated separately before adding brand query URLs to the sitemap.
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
require(dynamic.length===0,'Dynamic manufacturer URLs in sitemap before server-rendered canonical validation: '+dynamic.length);
if(issues.length){issues.forEach(x=>console.error('FAIL '+x));process.exitCode=1}
else console.log('PASS: shared manufacturer page retains unique headings, dynamic SEO tags and no premature query-URL sitemap entries.');
