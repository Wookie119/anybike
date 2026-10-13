// Verify model guide links using the same slugs and catalogue categories as the BMW model renderer.
// Run from repository root: node scripts/check-bmw-related-links.mjs
import {readFileSync,existsSync} from 'node:fs';
const catalogue=JSON.parse(readFileSync('data/motorcycle-catalogue-base.json','utf8'));
const models=catalogue.models.filter(x=>x.make==='BMW');
const slug=name=>'bmw-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'')+'.html';
let errors=[];
for(const model of models){
 const path=slug(model.model);
 if(!existsSync(path)){errors.push('Missing BMW model guide: '+path);continue;}
 const html=readFileSync(path,'utf8');
 if(!html.includes('Explore related BMW models'))errors.push(path+': related-model section missing');
 const related=models.filter(x=>x.model!==model.model&&x.category===model.category).slice(0,4);
 for(const other of related)if(!existsSync(slug(other.model)))errors.push(path+': target not found '+slug(other.model));
 if(html.includes("'.html+'"))errors.push(path+': malformed href construction');
 if(!html.includes('/uk-motorcycle-selling.html?make=BMW'))errors.push(path+': missing expected selling entry route');
}
if(errors.length){errors.forEach(s=>console.error('FAIL',s));process.exitCode=1}
else console.log('PASS: All 27 BMW model guides have existing related-model targets and expected UK selling links.');
