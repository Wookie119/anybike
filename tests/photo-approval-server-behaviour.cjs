async function run(source,check){
 // Remove only the known TypeScript annotations and import for a dependency-free mocked runtime.
 const js=source.replace(/^import[^\n]+\n/,"").replace(/:string\b|:unknown\b|:Uint8Array\b|:string\[\]/g,"").replace("const errors[]","const errors");
 const photo=(id,status="pending")=>({id,position:id,final_status:status,original_storage_path:"original/"+id,original_mime_type:"image/jpeg"});
 async function scenario(opts={}){
 const calls=[],photos=opts.photos??[photo(1),photo(2)];let handler;
 const body={submission_id:1,confirmed_inspected:true,...opts.body};
 const bytes=new Uint8Array(120);bytes.set([255,216,255]);
 const db={from(table){let updating=false;const q={select(){return q},eq(k,v){if(updating)calls.push("guard:"+k+":"+v);return q},order(){return Promise.resolve({data:photos})},update(){updating=true;calls.push("update");return q},maybeSingle(){return Promise.resolve({data:updating?(opts.conflict?null:{id:1}):{id:1,reference:"fixture"}})}};return q},storage:{from(){return {download:async()=>{calls.push("download");return {data:{arrayBuffer:async()=>bytes.buffer}}},upload:async()=>{calls.push("upload");return {}},getPublicUrl:()=>({data:{publicUrl:"https://example.invalid/image"}}),remove:async()=>{calls.push("cleanup");return {}}}}},rpc:async()=>{calls.push("refresh");return {}}};
 const caller={auth:{getUser:async()=>({data:{user:opts.unauth?null:{id:"admin"}}})},rpc:async()=>({data:!opts.nonadmin})};
 const Deno={env:{get:()=>"fixture"},serve:f=>{handler=f}};
 const Response={json:(body,o)=>({body,status:o.status})};
 new Function("createClient","Deno","Response","crypto",js)((u,k,o)=>o.global?caller:db,Deno,Response,{randomUUID:()=>"fixture"});
 const result=await handler({method:"POST",headers:{get:k=>k==="origin"?"https://www.anybike.co.uk":"Bearer fixture"},json:async()=>body});
 return {result,calls};
 }
 const cases=[
 ["non-admin rejected",{nonadmin:true},s=>s.result.status===403&&!s.calls.length],
 ["unauthenticated rejected",{unauth:true},s=>s.result.status===401&&!s.calls.length],
 ["missing confirmation rejected",{body:{confirmed_inspected:false}},s=>s.result.status===400&&!s.calls.length],
 ["duplicate IDs rejected",{body:{reviewed_photo_ids:[1,1]}},s=>s.result.status===400&&!s.calls.length],
 ["string IDs rejected",{body:{reviewed_photo_ids:["1",2]}},s=>s.result.status===400&&!s.calls.length],
 ["fractional IDs rejected",{body:{reviewed_photo_ids:[1.1,2]}},s=>s.result.status===400&&!s.calls.length],
 ["null IDs rejected",{body:{reviewed_photo_ids:null}},s=>s.result.status===400&&!s.calls.length],
 ["new photo blocks all writes",{body:{reviewed_photo_ids:[1]}},s=>s.result.status===409&&!s.calls.length],
 ["replaced photo blocks all writes",{body:{reviewed_photo_ids:[1,3]}},s=>s.result.status===409&&!s.calls.length],
 ["empty reviewed list blocks pending photos",{body:{reviewed_photo_ids:[]}},s=>s.result.status===409&&!s.calls.length],
 ["matching unordered IDs approve",{body:{reviewed_photo_ids:[2,1]}},s=>s.result.body.success&&s.result.body.approved===2],
 ["approved photos excluded",{photos:[photo(1,"approved"),photo(2)],body:{reviewed_photo_ids:[2]}},s=>s.result.body.approved===1],
 ["empty pending list succeeds",{photos:[],body:{reviewed_photo_ids:[]}},s=>s.result.body.success&&s.result.body.approved===0],
 ["legacy callers remain compatible",{},s=>s.result.body.approved===2],
 ["concurrent conflict cleans up copied files",{conflict:true,body:{reviewed_photo_ids:[1,2]}},s=>!s.result.body.success&&s.result.body.approved===0&&s.calls.filter(x=>x==="cleanup").length===2&&!s.calls.includes("refresh")],
 ["conditional writes match original state",{body:{reviewed_photo_ids:[1,2]}},s=>s.calls.includes("guard:final_status:pending")&&s.calls.includes("guard:original_storage_path:original/1")]
 ];
 for(const [label,options,verify] of cases)check(label,!!verify(await scenario(options)));
}

const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
let passed=0;run(fs.readFileSync(path.join(__dirname,"../supabase-preview/admin-approve-seller-originals/index.ts"),"utf8"),(label,ok)=>{assert.ok(ok,label);console.log("PASS",label);passed++}).then(()=>console.log(passed+" checks passed")).catch(e=>{console.error(e);process.exitCode=1});
