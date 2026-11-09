import test from 'node:test';
import assert from 'node:assert/strict';
import {groupDatabaseCountryRoutes} from '../model-template/bmw-db-research-sections.mjs';

test('region grouping rejects duplicates, unsafe routes and missing labels',()=>{
 const input=[
  {region:'Europe',label:'France',url:'/markets/france.html'},
  {region:'Africa',label:'Kenya',url:'/markets/kenya.html'},
  {region:'Europe',label:'France again',url:'/markets/france.html'},
  {region:'Europe',label:'Unknown',url:'https://other.example/markets/unknown.html'},
  {region:'Europe',label:'Unsafe',url:'//other.example/path'},
  {region:'Europe',url:'/markets/spain.html'},
  {region:'Europe',label:'Spain',url:'/markets/spain.html'}
 ];
 assert.deepEqual(groupDatabaseCountryRoutes(input),[
  {region:'Africa',entries:[{label:'Kenya',url:'/markets/kenya.html'}]},
  {region:'Europe',entries:[{label:'France',url:'/markets/france.html'},{label:'Spain',url:'/markets/spain.html'}]}
 ]);
});
test('all empty and invalid feeds stay empty without fabricated destinations',()=>{
 assert.deepEqual(groupDatabaseCountryRoutes([]),[]);
 assert.deepEqual(groupDatabaseCountryRoutes(null),[]);
 assert.deepEqual(groupDatabaseCountryRoutes([{region:'Africa',label:'Kenya',url:'/markets/kenya.html?fake=1'}]),[]);
});
