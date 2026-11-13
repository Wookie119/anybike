/* One brand-neutral research-preview controller. Production model routes
 * remain unchanged until the approved V2 master passes cross-brand tests.
 * Page identity comes only from an exact name in the public catalogue.
 * Research comes only from the exact-model approved public facts RPC.
 * No unpublished records, unsafe HTML, BMW data, or inventory claims.
 */
import {installVerifiedModelFacts} from '/model-template/public-verified-model-facts.mjs?v=20261113-chronological1';
const $=id=>document.getElementById(id);
const error=message=>{
 $('previewStatusError').textContent=message;
 $('previewStatusError').hidden=false;
};
const normalize=s=>String(s||'').toLocaleLowerCase('en-GB').replace(/[^a-z0-9]+/g,' ').trim();
const params=new URLSearchParams(location.search);
const requestedMake=(params.get('make')||'').trim();
const requestedModel=(params.get('model')||'').trim();
if(!requestedMake||!requestedModel||requestedMake.length>90||requestedModel.length>120){
 error('Choose a published manufacturer and motorcycle model. Example: ?make=Suzuki&model=RM250');
}else{
 try{
  const response=await fetch('/data/motorcycle-catalogue-master.json',{cache:'no-cache'});
  if(!response.ok)throw Error('Published motorcycle catalogue unavailable');
  const catalogue=await response.json();
  const matches=(Array.isArray(catalogue.models)?catalogue.models:[]).filter(row=>
   normalize(row.make)===normalize(requestedMake)&&
   normalize(row.model)===normalize(requestedModel));
  if(matches.length!==1)throw Error('This manufacturer and motorcycle model could not be matched to a unique published catalogue entry');
  const selected=matches[0];
  const make=String(selected.make).trim(),model=String(selected.model).trim();
  const title=make+' '+model;
  const enquiry='/bulk-buying-request.html?make='+encodeURIComponent(make)+'&model='+encodeURIComponent(model);
  const manufacturer='/motorcycle-brand.html?make='+encodeURIComponent(make);
  const category=String(selected.category||'').trim();
  document.title=title+' — Approved AnyBike V2 Master Preview';
  $('heading').textContent=title;
  $('category').textContent=category||'Motorcycle model';
  $('summary').textContent='Explore the documented history and specifications of the '+title+
   '. Research below comes from source-verified records for this exact model; available fields vary by model year.';
  $('years').textContent='Factory research is organised by documented model year, not assumed across every production year.';
  $('source').href=enquiry;$('parent').href=manufacturer;
  $('parent').textContent='Explore '+make+' motorcycles →';
  $('specificationHeading').textContent='Documented '+title+' research';
  $('marketHeading').textContent='Explore the '+title+' worldwide';
  $('enquiryHeading').textContent='Ask AnyBike to source a '+title;
  $('enquiryLink').href=enquiry;$('enquiryLink').textContent='Enquire about '+title+' →';
  $('universalV2Preview').hidden=false;
  const identity=Object.freeze({make,model});
  window.__anybikeV2ModelIdentity=identity;
  window.dispatchEvent(new Event('anybike:v2-model-identity-ready'));
  const count=await installVerifiedModelFacts({body:$('body'),...identity});
  $('previewResearchStatus').textContent=count?
   count+' source-verified '+title+' research records loaded.':
   'No verified facts currently available for this exact motorcycle. Ask AnyBike to source it or explore published model guides.';
  window.__anybikeV2EditorialReady=true;
  window.dispatchEvent(new Event('anybike:v2-editorial-ready'));
 }catch(e){
  console.warn('Universal V2 preview blocked: unverified model identity or catalogue error',e);
  error(e.message||'Motorcycle data unavailable');
 }
}