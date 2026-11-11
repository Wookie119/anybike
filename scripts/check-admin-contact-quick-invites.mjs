// Guard the compact dealer-invitation flow against old SMS drafts returning.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync(new URL('../admin-contact-directory.html',import.meta.url),'utf8');
const result=page.indexOf('id="body"');
const quick=page.indexOf('id="contactInviteActions"');
const preview=page.indexOf('id="advancedInvitations"');
const editor=page.indexOf('id="editor"');
assert(result>=0&&quick>result&&preview>quick&&editor>preview,
 'Selected contact actions and their preview must be directly under contact results');
for(const id of ['quickInviteReview','quickInviteEmail','quickInviteSms','quickInviteClear'])
 assert(page.includes('id="'+id+'"'),'Missing quick invitation action: '+id);
assert(page.includes('data-quick-invite'), 'Each directory row needs a one-click Invite shortcut');

assert(page.includes("function mountInlineInviteActions(id)"),
 'Invite must expand email/SMS controls beside the selected table row');
assert(page.includes("btn.closest('tr').after(tr)"),
 'Inline invitation controls must appear immediately below the contact');
assert(page.includes("activeInlineInviteId=id;chosen.clear();chosen.add(id);render();"),
 'Inviting a row must select only that contact');
assert(page.includes("reviewSingleQuickInvite(button.dataset.inlineChannel,{inline:true})"),
 'Inline controls must reuse the existing guarded invitation review');
assert(page.includes("target.replaceChildren(preview)"),
 'Reviewed email/SMS card and original send handlers must be moved, not re-created');
assert(page.includes("const smsOk=/^07\\d{9}$/.test(String(r.phone||'').replace(/\\s/g,''))"),
 'Inline SMS must only be available for a valid UK 07 mobile');

assert(page.includes('chosen.clear();chosen.add(id);render();'),
 'Clicking Invite must focus exactly one contact without sending anything');
assert(page.includes('if(selected.length!==1)'),
 'Quick invitations must never accidentally include another selected contact');
assert(page.includes('if(!r.approved_for_invitation)'),
 'Invitation permission is mandatory');
assert(page.includes("reviewInvitations({channel})"),
 'Both quick actions must use the existing reviewed invitation preview');
assert(page.includes("channel==='sms'?[]"),
 'SMS quick review must not prepare unrelated email drafts');
assert(page.includes("channel!=='email'"),
 'Email quick review must not bring back old SMS drafts');
assert(page.includes("r.sms_invite_selected&&(savedSmsOnly||chosen.has(r.id))"),
 'Previous SMS selections must be excluded unless history explicitly requested');
assert(page.includes("reviewInvitations({savedSmsOnly:true})"),
 'Saved SMS invitation history must remain available');
assert(page.includes("update({sms_invite_selected:true})"),
 'SMS quick action must save selection, not send directly');
assert(page.includes('This saves the SMS selection but DOES NOT send a text.'),
 'SMS selection needs an explicit non-send confirmation');
assert(page.includes("functions.invoke('anybike-send-dealer-invitation-sms'"),
 'Actual chargeable SMS send still needs the existing confirmed server call');
assert(page.includes('This is a REAL chargeable SMS.'),
 'A chargeable provider send must have final explicit confirmation');

// Everyday dealer recruitment uses open contact cards. The full table remains
// available for advanced editing and historic/bulk invitation workflows.
assert(page.includes('id="contactCards" class="dealer-cards"'),
 'The primary dealer directory must render spacious contact cards');
assert(page.includes('id="directoryTable" hidden'),
 'The dense contact table must not be the initial view');
assert(page.includes('function renderContactCards(shown)'),
 'Contact cards must respect the current filtered and paginated results');
assert(page.includes("renderContactCards(shown)"),
 'The normal directory refresh must update the card view');
assert(page.includes('data-card-channel="email"')&&page.includes('data-card-channel="sms"'),
 'Each card must expose email and SMS invitation review together');
assert(page.includes("reviewSingleQuickInvite(channel,{card:true})"),
 'Card invitations must use the original guarded preview/send handlers');
assert(page.includes("target.replaceChildren(preview)"),
 'A new card preview must move the existing source reviewed message');
assert(page.includes("if(existing)existing.remove()")&&page.includes("if(target)target.append(existing)"),
 'A contact refresh must retain the already reviewed invitation');
assert(page.includes("table.classList.toggle('simple-contact-table',!showTable)"),
 'Switching to the advanced table must restore its permission columns');
assert(page.includes("const smsOK=/^07\\d{9}$/.test(phone)"),
 'SMS cards must require a valid UK mobile');
assert(page.includes("!/^unknown@/i.test(email)"),
 'Imported placeholder email addresses cannot be invited');
assert(page.includes("const prohibited=!consent||registered"),
 'Unapproved and already registered contacts must not get active invitation buttons');
assert(page.includes('id="pageSize"><option value="12" selected>12'),
 'The open directory must show a manageable number of cards per page');


assert(page.includes('class="dealer-card-filters"'),
 'Everyday directory needs a visible ready/invited/permission quick filter');
assert(page.includes("cardQuickFilter==='ready'&&r.approved_for_invitation"),
 'Ready-to-invite filter must require existing invitation permission');
assert(page.includes("cardQuickFilter==='invited'&&contactRecruitmentStatus(r)==='invited'"),
 'Previous invitations must remain discoverable without re-sending');
assert(page.includes("$('simpleContactQuery').addEventListener('input'"),
 'Directory search should update results as the admin types');
assert(page.includes("cardQuickFilter='all';$('simpleContactQuery').value=''"),
 'Show all should reset the daily filters');
assert(page.includes('id="contactCards" class="dealer-cards"'),
 'Open card view should be available');
assert(page.includes('id="directoryTable" hidden'),
 'Dense table must start hidden');

const script=page.slice(page.lastIndexOf('<script>')+8,page.lastIndexOf('</script>'));
assert.doesNotThrow(()=>new Function(script),'Admin invitation JavaScript syntax');
console.log('PASS: single-contact review, email and SMS actions share the results area and retain send safeguards');
