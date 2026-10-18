#!/usr/bin/env node
// Regression guard for the verified 18 October 2026 UK-dealer messaging behaviour.
// Run: node scripts/check-messaging-regressions.cjs
const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const header=read('public-header.js');
const messages=read('customer-messages.html');
const dealer=read('my-dealership.html');
function check(name,fn){try{fn();console.log('PASS',name)}catch(e){console.error('FAIL',name+' — '+e.message);process.exitCode=1}}
check('Customer Message Centre links use a cache-busting version',()=>{
 assert.match(header,/function versionCustomerMessageLinks\(/);
 assert.match(header,/searchParams\.set\("v",version\)/);
 assert.match(header,/customer-messages\.html/);
});
check('Clicking a bell item marks only its own notification ID',()=>{
 assert.match(header,/\.eq\("id",notificationId\)/);
 assert.match(header,/\.eq\("customer_id",anybikeHeaderUser\.id\)/);
});
check('Opening a thread never bulk-clears linked bell notifications',()=>{
 const fn=messages.match(/async function markConversationNotificationsRead\(threadId\)\{([\s\S]*?)\n\}/);
 assert.ok(fn,'missing thread notification read handler');
 assert.doesNotMatch(fn[1],/\.update\s*\(|is_read\s*:\s*true|\.in\s*\(/);
});
check('Dealer Messages pill shows a separately computed unread badge',()=>{
 assert.match(dealer,/id="dealerUnreadCount"/);
 assert.match(dealer,/anybikeCustomerUnreadChanged/);
 assert.match(header,/messageCount:displayedMessageCount/);
});
check('UK dealer account routing stays inside My Dealership',()=>{
 assert.match(messages,/link\.href="\/my-dealership\.html"/);
 assert.match(dealer,/href="\/customer-messages\.html"/);
});
check('Inbox renders without waiting for every attachment',()=>{
 assert.match(messages,/setTimeout\(hydrateConversations,0\)/);
 assert.doesNotMatch(messages,/await waitForPublicHeader\(\)/);
});
if(process.exitCode)console.error('Messaging regression checks FAILED.');
else console.log('Messaging regression checks passed. Live click testing is still required after deployments.');
