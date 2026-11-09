import test from 'node:test';
import assert from 'node:assert/strict';
import {filterModelNavigationEntries} from '../model-template/bmw-db-research-sections.mjs';

test('BMW database links only lead to approved page route shapes',()=>{
 const values=[
  {label:'F 900 GS Adventure',url:'/bmw-f900gs-adventure.html'},
  {label:'F 900 GS Adventure again',url:'/bmw-f900gs-adventure.html'},
  {label:'Current model',url:'/bmw-f900gs.html'},
  {label:'Unknown external',url:'https://example.com/bmw-f900gs.html'},
  {label:'Bad link',url:'//evil.example.com'},
  {label:'Markets',url:'/markets/france.html'},
  {label:'Types',url:'/motorcycle-type-adventure.html'},
  {label:'Missing URL'},
  {url:'/bmw-k1600gt.html'}
 ];
 assert.deepEqual(filterModelNavigationEntries(values,'/bmw-f900gs.html'),[
  values[5],values[6]
 ]);
});
test('BMW model route filter leaves order intact and handles empty feed',()=>{
 assert.deepEqual(filterModelNavigationEntries(null,'/bmw-f900gs.html'),[]);
 const items=[{label:'R 1250 GS',url:'/bmw-r1250gs.html'},{label:'R 1300 GS',url:'/bmw-r1300gs.html'}];
 assert.deepEqual(filterModelNavigationEntries(items,'/bmw-f900gs.html'),items);
});
