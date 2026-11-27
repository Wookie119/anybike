// The public creative view already excludes expired and unapproved campaigns.
// Exercise the actual layout selector against snapshots of that view.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {stripTypeScriptTypes} = require('node:module');
const path = require('node:path');
const {test} = require('node:test');

const file = path.join(__dirname,'../supabase/functions/public-advertising-v1/index.ts');
const source = stripTypeScriptTypes(fs.readFileSync(file,'utf8'));
const selector = source.slice(source.indexOf('const publishedLayoutForPage='),source.indexOf('const verifiedCountry='));
const getSelector = new Function('db','sign',selector+'\nreturn publishedLayoutForPage;');
const placement = {slot_code:'AB-UK-TEST',page_path:'/motorcycle-type-sports.html',placement_key:'main_end'};
const ids = ['abr','move','show','fourth'];

function fixture() {
  const layout = {...placement,advert_count:4,campaign_ids:ids,artwork_formats:ids.map(()=>'square')};
  const tables = {
    advertising_slot_published_layouts:layout,
    advertising_campaigns:ids.map(id=>({id,partner_id:id,status:'active'})),
    advertising_partner_artwork_library:ids.map(id=>({partner_id:id,creative_format:'square',active_artwork_id:id})),
    advertising_client_artwork:ids.map(id=>({id,status:'approved',public_url:'https://example.com/'+id+'.webp'})),
    public_advertising_creatives_v1:ids.map(id=>({id,partner_name:id,countries:['GB'],destination_url:'https://example.com/'+id}))
  };
  const errors = new Set();
  const db = {from(table) {
    const query = {
      select:()=>query,eq:()=>query,in:()=>query,not:()=>query,maybeSingle:()=>query,
      then:resolve=>resolve({data:tables[table],error:errors.has(table)?{message:'unavailable'}:null})
    };
    return query;
  }};
  const select = getSelector(db,async payload=>payload);
  return {tables,errors,show:(market='GB',model=null)=>select(placement,market,model)};
}

test('all four eligible advertisers appear in booking order',async()=>{
  const {show}=fixture();
  assert.deepEqual((await show()).map(a=>a.id),ids);
});

test('expiring the second booking keeps the other three and their tracking positions',async()=>{
  const {tables,show}=fixture();
  tables.public_advertising_creatives_v1.splice(1,1);
  for(const model of [null,42]){
    const result=await show('GB',model);
    assert.deepEqual(result.map(ad=>[ad.id,ad.token.slot,ad.token.mid]),[
      ['abr','AB-UK-TEST-1',model],['show','AB-UK-TEST-3',model],['fourth','AB-UK-TEST-4',model]
    ]);
  }
});

test('paused bookings, missing approved artwork and other markets are excluded independently',async()=>{
  const {tables,show}=fixture();
  tables.advertising_campaigns[0].status='paused';
  tables.advertising_client_artwork[1].status='draft';
  tables.public_advertising_creatives_v1[3].countries=['FR'];
  assert.deepEqual((await show()).map(ad=>ad.id),['show']);
  tables.public_advertising_creatives_v1=[];
  assert.equal(await show(),null);
});

test('an unavailable data source, ineligible market or invalid layout still fails closed',async()=>{
  const {tables,errors,show}=fixture();
  assert.equal(await show('FR'),null);
  for(const table of Object.keys(tables)){
    errors.add(table);
    assert.equal(await show(),null);
    errors.delete(table);
  }
  tables.advertising_slot_published_layouts.artwork_formats[0]='invalid';
  assert.equal(await show(),null);
});
