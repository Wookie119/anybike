import test from 'node:test';
import assert from 'node:assert/strict';
import { renderEditorialLinksForPage, EDITORIAL_LINK_CSS } from './render-editorial-related-links.mjs';
test('renders crawlable reciprocal navigation grouped by type',()=>{
 const html=renderEditorialLinksForPage({url:'/bmw-r1300gs.html',links:[
  {type:'manufacturer',title:'BMW',url:'/bmw-motorcycles.html'},
  {type:'country',title:'Kenya',url:'/markets/kenya.html'},
  {type:'manufacturer',title:'BMW',url:'/bmw-motorcycles.html'}
 ]});
 assert.match(html,/<section/);
 assert.match(html,/<a href="\/bmw-motorcycles\.html">BMW<\/a>/);
 assert.match(html,/<a href="\/markets\/kenya\.html">Kenya<\/a>/);
 assert.equal((html.match(/bmw-motorcycles\.html/g)||[]).length,1);
 assert.match(EDITORIAL_LINK_CSS,/#ed1c24/);
});
test('escapes labels and rejects external or unsafe URLs',()=>{
 const html=renderEditorialLinksForPage({url:'/bmw-r1300gs.html',links:[
  {type:'model',title:'<script>alert(1)</script>',url:'/bmw-r1250gs.html'},
  {type:'model',title:'Evil',url:'javascript:alert(1)'},
  {type:'model',title:'External',url:'https://external.example.org/sale'},
  {type:'model',title:'Self',url:'/bmw-r1300gs.html'}
 ]});
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);
 assert.doesNotMatch(html,/external\.example/);
 assert.doesNotMatch(html,/javascript:/);
 assert.doesNotMatch(html,/>Self</);
});
test('no approved links yields no HTML',()=>{
 assert.equal(renderEditorialLinksForPage({url:'/bmw-motorcycles.html',links:[]}), '');
 assert.equal(renderEditorialLinksForPage(null), '');
});
