// Offline checks. No database writes, network requests or advertising events.
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
function run(read,check){
 const w={};new Function("window",read("motorcycle-listing-master.js"))(w);const m=w.AnyBikeListingMaster;
 const eq=(label,actual,expected)=>check(label,actual===expected);
 for(const [v,expected] of [[0,"0 miles"],["12000","12,000 miles"],[-1,""],[1.5,""],[false,""],["0x12",""],[" ",""],[null,""],["9007199254740992",""]])eq("Mileage "+String(v),m.mileage(v),expected);
 eq("Null description",m.prepareDescription(null),"");
 eq("No invented history",m.prepareDescription({make:"Honda",model:"VFR400R"}),"Honda VFR400R.");
 eq("Unknown omitted",m.prepareDescription({declarations:[["Keys","Unknown"]]}),"");
 check("Missing paperwork explicit",m.factsHTML([["V5C",null]],true).includes("Not supplied"));
 check("Escape seller text",!m.factsHTML([["Condition","<script>"]]).includes("<script>"));
 check("Preserve negative declaration",m.prepareDescription({declarations:[["Spare key","No"]]}).includes("No"));
 for(const path of ["trade-opportunities.html","bike-details.html"]){
  const html=read(path);const slots=[...html.matchAll(/data-listing-placement="(listing_[a-z_]+)"/g)].map(x=>x[1]);
  eq(path+" three ordered slots",slots.join(","),"listing_after_gallery,listing_after_description,listing_bottom");
  check(path+" approved background",html.includes("#050404"));
  check(path+" shared stylesheet",html.includes("/motorcycle-listing-master.css?"));
 }
 const auction=read("trade-opportunities.html"),start=auction.indexOf("function openMineDetails");
 const order=["<h3>Description</h3>","<h3>History and checks</h3>","<h3>Bidding</h3>","Seller-declared paperwork"].map(x=>auction.indexOf(x,start));
 check("Approved section order",order.every((n,i)=>n>=0&&(i===0||n>order[i-1])));
 check("Confidential bidding wording",auction.includes("All offers remain confidential"));
 new Function(read("advertising/admin-slot-layout-manager.js"));check("Admin script syntax",true);
 const css=read("motorcycle-listing-master.css");check("Empty ad slots collapse",css.includes("[data-listing-placement]:empty{display:none!important}"));
 const server=read("supabase-preview/public-advertising-v1/index.ts");check("Retail selector disabled",server.includes('const audience=path==="/trade-opportunities.html"?"trade_dealer":null;'));
}

let passed=0;run(p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8'),(label,ok)=>{assert.ok(ok,label);passed++;console.log('PASS '+label)});console.log(passed+' checks passed');
