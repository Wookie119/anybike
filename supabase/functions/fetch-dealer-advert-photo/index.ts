import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const cors={"Access-Control-Allow-Origin":"https://www.anybike.co.uk","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const fail=(message:string,status=400)=>new Response(JSON.stringify({error:message}),{status,headers:{...cors,"content-type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("",{headers:cors});
 if(req.method!=="POST")return fail("Method not allowed",405);
 if(!/^Bearer\s+\S+$/i.test(req.headers.get("authorization")||""))return fail("Sign in required",401);
 try{
  const input=await req.json();
  const photo=new URL(String(input.image_url||""));
  const source=new URL(String(input.advert_url||""));
  if(photo.protocol!=="https:"||source.protocol!=="https:"||!(photo.hostname.toLowerCase()===source.hostname.toLowerCase()||((source.hostname.toLowerCase()==="www.autotrader.co.uk"||source.hostname.toLowerCase()==="autotrader.co.uk")&&photo.hostname.toLowerCase()==="m.atcdn.co.uk"&&photo.pathname.startsWith("/a/media/")))||photo.port||source.port||photo.username||photo.password||source.username||source.password)return fail("Image must come from the original public advert website");
  const host=photo.hostname.toLowerCase();
  if(!host.includes(".")||host==="localhost"||host.endsWith(".local")||host.endsWith(".internal")||host.endsWith(".test")||host.endsWith(".example")||/^(?:\d+\.){3}\d+$/.test(host)||host.includes(":"))return fail("Invalid image host");
  if(!/\.(?:jpe?g|png|webp)(?:$)/i.test(photo.pathname))return fail("Unsupported photo type");
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
  let response:Response;
  try{response=await fetch(photo.href,{redirect:"manual",signal:controller.signal,headers:{"accept":"image/avif,image/webp,image/png,image/jpeg"}});}finally{clearTimeout(timer)}
  if(!response.ok)return fail("Source image unavailable",502);
  const mime=(response.headers.get("content-type")||"").split(";")[0].toLowerCase();
  if(!["image/jpeg","image/png","image/webp"].includes(mime))return fail("Source did not return a supported image",415);
  const size=Number(response.headers.get("content-length")||0);
  if(size>8_000_000)return fail("Photo is too large",413);
  const reader=response.body?.getReader();if(!reader)return fail("Image unavailable",502);
  const parts:Uint8Array[]=[];let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>8_000_000){await reader.cancel();return fail("Photo is too large",413)}parts.push(value)}
  const bytes=new Uint8Array(total);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length}
  return new Response(bytes,{headers:{...cors,"content-type":mime,"cache-control":"no-store"}});
 }catch{return fail("Could not retrieve the advert photograph",502)}
});