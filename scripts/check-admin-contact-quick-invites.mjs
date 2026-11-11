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


// Open contact editor is the SAME existing form, moved into the selected card.
// Saving preserves the current scroll position and keeps the card visible.
assert(page.includes('id="editorHome"'),'The original admin editor must have a stable home');
assert(page.includes('edit(Number(button.dataset.cardEdit),{inCard:true})'),
 'Daily Edit contact must open inside its own card instead of scrolling');
assert(page.includes("slot.append(editor)")&&page.includes("if(inlineEditId&&editId===Number(inlineEditId))editor.remove()"),
 'Card refreshes must preserve the form, unsaved values and status');
assert(page.includes("if(!cardsShown.some(r=>r.id===pending.id))cardsShown=[pending,...cardsShown]"),
 'Saving consent should not remove the current card from the active filter');
assert(page.includes('const previousTop=editingCard?.getBoundingClientRect().top'),
 'Saving must anchor the contact card to its viewport position');
assert(page.includes('window.scrollBy(0,sameCard.getBoundingClientRect().top-previousTop)'),
 'Saving must not jump away from the selected contact');
assert(page.includes("$('cancel').onclick=()=>{closeSavedContactEditor();}"),
 'Cancelling must use the same safe editor collapse as Save');
assert(page.includes("$('editorHome').after(editor)"),
 'Closing must restore the single editor node to its home');

assert(page.includes("recentlySavedContactId=anchorId?Number(anchorId):null"),
 'Successful edit must show saved state on the same contact');
assert(page.includes("closeSavedContactEditor();\n }\n // Update the contact card"),
 'Successful save must collapse before refreshing the card');
assert(page.includes("recentlySavedContactId===id?'✓ Saved successfully."),
 'The updated contact card must display saved confirmation');
assert(page.includes("if((editingInline&&editId!==null||recentlySavedContactId!==null)"),
 'Saving while a recruitment filter is active must keep the edited card visible');
assert(page.includes("if(!error){"),
 'Editor must collapse only after database save success');
assert(page.includes("function closeSavedContactEditor()"),
 'Successful save needs a single explicit editor-collapse function');
assert(page.includes("editor.style.setProperty('display','none','important')"),
 'Editor collapse must override legacy CSS on card forms');
assert(page.includes(".dealer-contact-card #editor[hidden]{display:none!important}"),
 'Hidden editor cannot be reopened by card-specific legacy CSS');
assert(page.includes("editor.style.removeProperty('display')"),
 'Opening the editor must clear forced display-none from previous save');
assert(page.includes("items.push(data);closeSavedContactEditor()"),
 'Created contacts must also collapse after save');
assert(page.includes("closeSavedContactEditor();\n }\n // Update the contact card"),
 'Saved existing contacts must collapse before refreshing the card');

// Multi-contact selection stays on the open dealer cards, with no bulk send.
assert(page.includes('id="bulkContactReview"')&&page.includes('id="bulkPreviewSlot"'),
 'Card selection and reviewed drafts must be visible together');
assert(page.includes('data-card-select')&&page.includes("input.checked?chosen.add(id):chosen.delete(id)"),
 'Each visible contact card must support multi-selection');
assert(page.includes("view().slice(page*pageSize(),page*pageSize()+pageSize()).forEach(r=>chosen.add(r.id))"),
 'Select visible must never select unrelated directory pages');
assert(page.includes('updateBulkContactReview()'),
 'Current selected counts must update without opening the dense directory');
assert(page.includes("await reviewInvitations({channel:'email'})"),
 'Multi-contact review prepares email drafts and never sends them');
assert(page.includes("slot.replaceChildren(preview)"),
 'Bulk preview must move the existing guarded previews, not copy send handlers');
assert(page.includes("const approved=items.filter(r=>r.approved_for_invitation&&!['registered','approved'].includes(contactRecruitmentStatus(r)))"),
 'Registered dealers and unapproved contacts cannot enter the invitation preview');
assert(page.includes("chosen.has(r.id)&&/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test"),
 'Bulk email invitations require valid email addresses');
assert(!page.includes('bulkSendSelected'),
 'Multiple contact review must not introduce an automatic bulk sender');

assert(page.includes('id="bulkReviewContacts" disabled'),
 'Selected contacts need a visible review action even when none are approved');
assert(page.includes("$('bulkReviewContacts').onclick=()=>"),
 'Selected-contact review button must open the permission queue');
assert(page.includes("edit(r.id,{inCard:true})"),
 'Bulk selection should open the existing individual contact editor');
assert(page.includes("!r.approved_for_invitation&&"),
 'Permission review queue should only include contacts needing individual review');
assert(page.includes("Click Review selected contacts again for the next contact."),
 'Permission queue must advance by explicit admin action, not automatically approve');

assert(page.includes("$('bulkReviewContacts').disabled=!selected.length"),
 'Ten selected contacts must have an enabled review action even with zero approvals');
assert(page.includes("pending.length?'Review '+pending.length+' selected permissions'"),
 'The button must explain that consent review is the current next step');
assert(page.includes("if(approved.length){$('bulkReviewSelected').click();return;}"),
 'Once individually approved, selected contacts can progress to individual email drafts');
assert(page.includes("edit(r.id,{inCard:true})"),
 'Contact permission review uses the existing individual editor');

// Everyday selection and review must be visible without an accordion.
assert(page.includes('id="bulkReviewContacts" disabled>Review selected contacts'),
 'Selection review button belongs in the always-visible card toolbar');
assert(page.includes('id="bulkReviewResults" hidden'),
 'Prepared individual drafts expand directly inside the visible selection toolbar');
assert(page.includes('Advanced invitation history and draft tools'),
 'The collapsed panel is clearly labelled for advanced history, not routine reviewing');
assert(page.includes("position:sticky;top:8px;z-index:15"),
 'Selection controls stay accessible when scrolling through contact cards');
assert(page.includes('class="contact-pager"'),
 'Compact contact pagination replaces oversized navigation');
assert(page.includes("$('pages').textContent=(page+1)+' / '+totalPages"),
 'Pagination should show a concise page counter');
assert(page.includes("$('prev').disabled=page===0")&&page.includes("$('next').disabled=page>=totalPages-1"),
 'Pagination must disable unavailable directions');

assert((page.match(/id="hideUnknown"/g)||[]).length===1,
 'Keep one Hide unknown email addresses filter, not duplicate inputs');
assert(page.indexOf('id="hideUnknown"')>page.indexOf('class="dealer-card-filters"')&&
 page.indexOf('id="hideUnknown"')<page.indexOf('id="simpleContactMessage"'),
 'Unknown email filter must stay visible in the everyday contact search');
assert(page.includes("$('hideUnknown').onchange=()=>{page=0;render()}"),
 'Hide unknown emails must continue to re-render the cards immediately');
assert((page.match(/id="onlyMobile"/g)||[]).length===1,
 'Keep only one UK mobile filter checkbox');
assert(page.indexOf('id="onlyMobile"')>page.indexOf('id="hideUnknown"')&&
 page.indexOf('id="onlyMobile"')<page.indexOf('id="simpleContactMessage"'),
 'UK mobile filter must appear immediately after Hide unknown emails');
assert(page.includes("$('onlyMobile').onchange=()=>{page=0;render()}"),
 'Mobile filter must update results immediately');
assert(page.includes('let cardsShown=cardMode?v:shown'),
 'Every filtered dealer must appear on the same card page, not just the first 12');
assert(page.includes("renderContactCards(cardsShown)"),
 'The everyday card renderer must receive all matching contacts');
assert(page.includes("$('contactPager').hidden=cardMode"),
 'Pagination must disappear in everyday dealer card view');
assert(page.includes("($('directoryTable').hidden?view():view().slice(page*pageSize(),page*pageSize()+pageSize())).forEach(r=>chosen.add(r.id))"),
 'Select matching must cover all visible cards rather than a hidden first page');
assert(page.includes("if(!cardsShown.some(r=>r.id===pending.id))cardsShown=[pending,...cardsShown]"),
 'Saving permission must keep edited card visible on the same page');
assert(page.includes('.dealer-contact-card{content-visibility:auto;contain-intrinsic-size:auto 260px}'),
 'Long one-page results need deferred browser layout for off-screen cards');
const script=page.slice(page.lastIndexOf('<script>')+8,page.lastIndexOf('</script>'));
assert.doesNotThrow(()=>new Function(script),'Admin invitation JavaScript syntax');
console.log('PASS: single-contact review, email and SMS actions share the results area and retain send safeguards');
