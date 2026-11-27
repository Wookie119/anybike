// node scripts/check-shared-manufacturer-seo.mjs
// Check the published manufacturer routes and the shared template's SEO tags.
import fs from 'node:fs';
import {Script} from 'node:vm';
const html=fs.readFileSync('motorcycle-brand.html','utf8');
const head=html.split('</head>')[0];
const script=html.slice(html.indexOf('const guides='),html.lastIndexOf('})();'));
const issues=[];
const require=(ok,message)=>{if(!ok)issues.push(message)};
require((html.match(/<h1\b/g)||[]).length===1,'Shared manufacturer template must have one H1');
require((head.match(/name="description"/g)||[]).length===1,'Exactly one initial description tag needed');
require(!/<link\b[^>]*rel=["']canonical["']/i.test(head),'Shared source HTML must leave canonical selection to the renderer');
for(const element of ['title','intro','modelGroups','categoryCards','categoryNavigation','brandOgTitle','brandOgDescription','brandOgUrl','brandTwitterTitle','brandTwitterDescription']){
 require(html.includes('id="'+element+'"'),'Missing renderer element #'+element);
}
for(const token of ['encodeURIComponent(make)','document.title=brandPageTitle','document.getElementById("brandOgTitle").content','document.getElementById("brandOgUrl").content']){
 require(script.includes(token),'Missing dynamic SEO update: '+token);
}
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const dynamic=[...sitemap.matchAll(/<loc>(https:\/\/www\.anybike\.co\.uk\/motorcycle-brand\.html\?[^<]+)<\/loc>/g)].map(x=>x[1]);
const directory=fs.readFileSync('motorcycle-manufacturers.html','utf8');
require(head.includes('<meta name="robots" content="index,follow">'),
 'Published manufacturer renderer must allow indexing');
require(directory.includes('/bmw-motorcycles.html'),'BMW approved manufacturer route missing');
require(directory.includes('/harley-davidson-motorcycles.html'),'Harley-Davidson approved manufacturer route missing');
require(new Set(dynamic).size===dynamic.length,'Duplicate manufacturer query URLs in sitemap');
const approved=new Set([...directory.matchAll(/href="(\/motorcycle-brand\.html\?make=[^"]+)"/g)]
 .map(match=>'https://www.anybike.co.uk'+match[1]));
for(const url of approved)require(dynamic.includes(url),'Published manufacturer missing from sitemap: '+url);
for(const url of dynamic)require(approved.has(url),'Manufacturer sitemap route missing from the A-Z directory: '+url);

// Execute the route and head setup from the actual template before model rendering.
const setupEnd=script.indexOf(' document.getElementById("manufacturer-stories").setAttribute');
if(setupEnd<0)throw Error('Missing manufacturer renderer setup');
const setup=new Script('(function(){'+script.slice(0,setupEnd)+'})()');
function render(search){
 const links=[],robots={content:'index,follow'},ogUrl={};
 const directoryLinks=[...approved].map(url=>({
  dataset:{brand:new URL(url).searchParams.get('make')},
  setAttribute(){}
 }));
 const result={links,robots,ogUrl};
 setup.runInNewContext({
  URLSearchParams,
  location:{search,replace(url){result.redirect=url;}},
  document:{
   createElement(){return {};},
   head:{appendChild(link){links.push(link);}},
   querySelector(){return robots;},
   querySelectorAll(){return directoryLinks;},
   getElementById(id){return id==='brandOgUrl'?ogUrl:{};}
  }
 });
 return result;
}
for(const url of approved){
 const {links,robots,ogUrl}=render(new URL(url).search);
 require(links.length===1&&links[0].rel==='canonical'&&links[0].href===url,'Wrong manufacturer canonical: '+url);
 require(robots.content==='index,follow'&&ogUrl.content===url,'Wrong robots or social URL: '+url);
}
const fallback='https://www.anybike.co.uk/motorcycle-manufacturers.html';
for(const search of ['', '?make=Unknown+Manufacturer']){
 const {links,robots}=render(search);
 require(links.length===1&&links[0].href===fallback&&robots.content==='noindex,follow','Unexpected indexable lookup route: '+search);
}
require(render('?make=moto+guzzi&source=example').links[0]?.href==='https://www.anybike.co.uk/motorcycle-brand.html?make=Moto%20Guzzi',
 'Manufacturer aliases must use the published spelling and omit tracking parameters');
for(const [make,route] of [['BMW','bmw'],['Harley-Davidson','harley-davidson'],['Indian','indian']]){
 require(render('?make='+make).redirect==='/'+route+'-motorcycles.html','Dedicated route must still redirect: '+make);
}
if(issues.length){issues.forEach(x=>console.error('FAIL '+x));process.exitCode=1}
else console.log('PASS: sitemap matches '+approved.size+' shared manufacturer routes linked from A-Z.');
