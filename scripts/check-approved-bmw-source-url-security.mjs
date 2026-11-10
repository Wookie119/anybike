// Shared approved BMW shell: factory references and licensed hero sources
// must be valid safe HTTPS URLs. No page or stock changes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const source=readFileSync(new URL('../model-template/approved-bmw-page-shell.mjs',import.meta.url),'utf8');
const start=source.indexOf('const safeSource=url=>');
const end=source.indexOf('async function publishedBmwResearch()',start);
assert(start>=0&&end>start,'BMW shared safeSource gate missing');
const code=source.slice(start,end);
const safeSource=new Script(code+'\nsafeSource').runInNewContext({URL,RegExp});
for(const value of [
 'https://www.press.bmwgroup.com/example',
 'https://example.org/licence?edition=GS%20Trophy',
 'https://cdn.example.org/photo.jpg'
]) assert(safeSource(value),'Legitimate manufacturer HTTPS source rejected: '+value);
for(const value of [
 'http://example.org/photo.jpg','javascript:alert(1)','//example.org/photo.jpg',
 'https://user:pass@example.org/photo.jpg','https://user@example.org/photo.jpg',
 'https://example.org/photo.jpg\nInjected: true',
 'https://','not-a-link',null,42,' https://example.org/photo.jpg '
]) assert(!safeSource(value),'Unsafe manufacturer source accepted: '+String(value));
assert(source.includes('!safeSource(data.image_url)')&&
 source.includes('!safeSource(data.source_page_url)')&&
 source.includes('!safeSource(data.licence_url)'),
 'Approved BMW hero must retain three independent source URL checks');
console.log('PASS: manufacturer source, image and licence URLs require valid credential-free HTTPS');
