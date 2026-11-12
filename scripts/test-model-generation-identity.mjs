#!/usr/bin/env node
// Offline regression test for model-name collisions across historical generations.
// This test does NOT rewrite or deduplicate the source catalogue.
import assert from 'node:assert/strict';
const generations=[
 {id:1,make:'BMW',model:'R 12',start_year:1935,end_year:1942,platform:'pre-war boxer'},
 {id:2,make:'BMW',model:'R 12',start_year:2023,end_year:null,platform:'modern cruiser'},
 {id:3,make:'BMW',model:'R 1200 GS',start_year:2004,end_year:2012,platform:'oil-cooled'},
 {id:4,make:'BMW',model:'R 1200 GS',start_year:2013,end_year:2018,platform:'liquid-cooled'}
];
const byModel=new Map();
for(const row of generations){
 const key=[row.make.toLowerCase(),row.model.toLowerCase()].join('|');
 const existing=byModel.get(key)||[];
 existing.push(row);byModel.set(key,existing);
}
assert.equal(byModel.get('bmw|r 12').length,2,'A reintroduced name must retain both generations');
assert.equal(byModel.get('bmw|r 1200 gs').length,2,'Different platforms must retain separate generation records');
assert.notEqual(byModel.get('bmw|r 12')[0].platform,byModel.get('bmw|r 12')[1].platform);
assert.equal(byModel.get('bmw|r 12')[1].end_year,null,'Unknown production end year must remain unknown');
assert.equal(new Set(generations.map(g=>g.id)).size,generations.length,'Each generation needs an independent stable ID');
console.log('PASS: reintroduced names, distinct platforms and unknown end dates remain separate');
