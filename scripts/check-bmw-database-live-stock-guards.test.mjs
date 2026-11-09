import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isExactPublicMotorcycle} from '../model-template/exact-public-model-stock.mjs';

const stock=readFileSync(new URL('../public-international-model-stock.js',import.meta.url),'utf8');
const research=readFileSync(new URL('../model-template/bmw-db-research-sections.mjs',import.meta.url),'utf8');
const shell=readFileSync(new URL('../model-template/approved-bmw-page-shell.mjs',import.meta.url),'utf8');

test('empty exact-model feed must not suppress an existing approved stock gallery',()=>{
 assert.match(stock,/if \(selected\.length && currentStock && currentStock !== panel/);
 assert.match(stock,/No exact /);
 assert.doesNotMatch(stock,/No published " \+ name \+ " stock is currently listed/);
 assert.match(stock,/catalogue_identity_status === "verified"/);
 assert.match(stock,/publication_eligible === true/);
 assert.match(stock,/exactIds\.size === 1/);
});

test('the existing BMW page keeps stock ahead of database-driven research',()=>{
 assert.match(shell,/applyBmwDatabaseSections\(body,published\)/);
 assert.match(shell,/requested_path:location\.pathname/);
 assert.match(research,/primary\.replaceWith\(card\)/);
 assert.match(research,/if\(!card\.isConnected\)/);
});

test('shared exact matcher does not confuse distinct BMW motorcycle models',()=>{
 const item=(model)=>({make:'BMW',model,item_id:'stock-1',image_url:'https://example.com/approved.jpg',price:12500});
 assert.equal(isExactPublicMotorcycle(item('F 900 GS'),{make:'BMW',model:'F 900 GS'}),true);
 assert.equal(isExactPublicMotorcycle(item('F 900 GS Adventure'),{make:'BMW',model:'F 900 GS'}),false);
 assert.equal(isExactPublicMotorcycle(item('S 1000 RR'),{make:'BMW',model:'S 1000 R'}),false);
 assert.equal(isExactPublicMotorcycle(item('R 1250 GS Adventure'),{make:'BMW',model:'R 1250 GS'}),false);
});
