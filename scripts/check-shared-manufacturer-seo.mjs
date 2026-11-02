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
// Query URLs are permitted only for manufacturers linked by the approved A-Z directory.
// This is a source-level consistency check, not proof that search engines render client-side SEO.
const directory=fs.readFileSync('motorcycle-manufacturers.html','utf8');
const allowed=new Set([...directory.matchAll(/href=["']\\/motorcycle-brand\\.html\\?make=([^"']+)["']/g)].map(m=>'https://www.anybike.co.uk/motorcycle-brand.html?make='+m[1].replace(/&amp;/g,'&')));
require(allowed.size===47,'Expected 47 approved shared manufacturer links; found '+allowed.size);
require(new Set(dynamic).size===dynamic.length,'Duplicate manufacturer query URLs in sitemap');
for(const url of dynamic)require(allowed.has(url),'Unapproved manufacturer sitemap URL: '+url);
for(const url of allowed)require(dynamic.includes(url),'Approved manufacturer missing from sitemap: '+url);
if(issues.length){issues.forEach(x=>console.error('FAIL '+x));process.exitCode=1}
else console.log('PASS: shared manufacturer page retains unique headings, dynamic SEO tags and no premature query-URL sitemap entries.');
