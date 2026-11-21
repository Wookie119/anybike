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
assert(page.includes("activeInlineInviteId=id;render();"),
 'Opening an inline invitation must preserve other contact ticks');
assert(page.includes("reviewSingleQuickInvite(button.dataset.inlineChannel,{inline:true,contactId:id})"),
 'Inline controls must reuse the existing guarded invitation review');
assert(page.includes("target.replaceChildren(preview)"),
 'Reviewed email/SMS card and original send handlers must be moved, not re-created');
assert(page.includes("const smsOk=/^07\\d{9}$/.test(String(r.phone||'').replace(/\\s/g,''))"),
 'Inline SMS must only be available for a valid UK 07 mobile');

assert(page.includes("if(activeCardInviteId!==id){activeCardInviteId=id;render();}"),
 'Opening a contact-card review must preserve other contact ticks');
assert(page.includes('if(selected.length!==1)'),
 'Quick invitations must never accidentally include another selected contact');
assert(page.includes('if(!r.approved_for_invitation)'),
 'Invitation permission is mandatory');
assert(page.includes("reviewInvitations({channel,onlyContactId:contactId})"),
 'Both quick actions must use the existing reviewed invitation preview');
assert(page.includes("channel==='sms'?[]"),
 'SMS quick review must not prepare unrelated email drafts');
assert(page.includes("channel!=='email'"),
 'Email quick review must not bring back old SMS drafts');
assert(page.includes("r.sms_invite_selected&&(savedSmsOnly||(onlyContactId!==null?r.id===onlyContactId:chosen.has(r.id)))"),
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
assert(page.includes("reviewSingleQuickInvite(channel,{card:true,contactId:id})"),
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
assert(page.includes('id="pageSize"><option value="12">12')&&page.includes('<option value="500" selected>500'),
 'The directory must default to 500 contacts per page and retain compact options');


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
assert(page.includes("const approved=items.filter(r=>r.approved_for_invitation&&!isAlreadyRegisteredContact(r)&&(savedSmsOnly||matchingIds.has(r.id))&&(onlyContactId===null||r.id===onlyContactId)&&invitationAudienceMatches(r))"),
 'Registered private and dealer accounts or contacts outside current filters cannot enter invitation preview');
assert(page.includes("(onlyContactId!==null?r.id===onlyContactId:chosen.has(r.id))&&/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test"),
 'Bulk email invitations require valid email addresses');
assert(!page.includes('bulkSendSelected'),
 'Multiple contact review must not introduce an automatic bulk sender');

assert(page.includes("const selected=items.filter(r=>contactId!==null?r.id===contactId:chosen.has(r.id))"),'One-contact review must leave other selected contacts untouched');
assert(page.includes("await reviewInvitations({channel,onlyContactId:contactId})"),'One-contact review must only prepare that recipient');
assert(page.includes("chosen.delete(id);queue=queue.filter(r=>r.id!==id);smsQueue=smsQueue.filter(r=>r.id!==id)"),'Skip must remove only the skipped contact');
assert(page.includes("updateQuickInviteSelection();updateBulkContactReview()"),'Skip must update selected counts without clearing ticks');
assert(page.includes('id="bulkReviewContacts" disabled'),
 'Selected contacts need a visible review action even when none are approved');
assert(page.includes("$('bulkReviewContacts').onclick=()=>"),
 'Selected-contact review button must open the bulk-review panel');
assert(page.includes('id="bulkPermissionPanel" hidden'),
 'Bulk selection should open an evidence-based group permission review panel');
assert(page.includes("!r.approved_for_invitation&&"),
 'Permission review queue should only include contacts needing individual review');
assert(page.includes("if(!confirm('Approve invitation eligibility for '+candidates.length"),
 'Bulk permission must require explicit confirmation before saving');

assert(page.includes("$('bulkReviewContacts').disabled=!selected.length"),
 'Ten selected contacts must have an enabled review action even with zero approvals');
assert(page.includes("needsReview.length?'Review permission ('+needsReview.length+')'"),
 'Button should show bulk review rather than one-by-one permissions');
assert(page.includes("await reviewInvitations({channel:'email'})"),
 'After saved bulk review, email drafts remain separately prepared, never sent automatically');
assert(page.includes("marketing_permission:note"),
 'Bulk permission must record review evidence alongside approval');

// Everyday selection and review must be visible without an accordion.
assert(page.includes('id="bulkReviewContacts" disabled>Review permission'),
 'Bulk permission review is accessible from always-visible selection toolbar');
assert(page.includes('id="bulkReviewResults" hidden'),
 'Prepared individual drafts expand directly inside the visible selection toolbar');
assert(page.includes('Advanced invitation history and draft tools'),
 'The collapsed panel is clearly labelled for advanced history, not routine reviewing');
assert(page.includes("#bulkContactReview{position:relative;top:auto;z-index:auto;box-shadow:none}"),
 'Bulk review must not become an oversized sticky panel that traps long invitation drafts');
assert(page.includes('class="contact-pager"'),
 'Compact contact pagination replaces oversized navigation');
assert(page.includes("$('pages').textContent=(page+1)+' / '+totalPages"),
 'Pagination should show a concise page counter');
assert(page.includes("$('prev').disabled=page===0")&&page.includes("$('next').disabled=page>=totalPages-1"),
 'Pagination must disable unavailable directions');

assert((page.match(/id="hideUnknown"/g)||[]).length===1,
 'Keep one Hide unknown email addresses filter, not duplicate inputs');
assert(page.indexOf('id="hideUnknown"')>page.indexOf('Contact invitations — trade and private')&&
 page.indexOf('id="hideUnknown"')<page.indexOf('id="bulkContactReview"'),
 'Unknown email filter must be visible immediately above the invitation cards');
assert(page.includes("$('hideUnknown').onchange=()=>{page=0;render()}"),
 'Hide unknown emails must continue to re-render the cards immediately');
assert((page.match(/id="onlyMobile"/g)||[]).length===1,
 'Keep only one UK mobile filter checkbox');
assert(page.indexOf('id="onlyMobile"')>page.indexOf('id="hideUnknown"')&&
 page.indexOf('id="onlyMobile"')<page.indexOf('id="bulkContactReview"'),
 'UK mobile filter must remain beside email and invitation exclusions');
assert(page.includes("$('onlyMobile').onchange=()=>{page=0;render()}"),
 'Mobile filter must update results immediately');
assert(page.includes('let cardsShown=shown;'),
 'The cards must show the chosen 12, 25, 50 or 100 contacts per page');
assert(page.includes("renderContactCards(cardsShown)"),
 'The everyday card renderer must receive all matching contacts');
assert(page.includes("$('contactPager').hidden=false;"),
 'Pagination must remain available in everyday card view');
assert(page.includes("view().slice(page*pageSize(),page*pageSize()+pageSize()).forEach(r=>chosen.add(r.id))"),
 'Bulk selection must select the visible page only');
assert(page.includes("if(!cardsShown.some(r=>r.id===pending.id))cardsShown=[pending,...cardsShown]"),
 'Saving permission must keep edited card visible on the same page');
assert(page.includes('.dealer-contact-card{content-visibility:auto;contain-intrinsic-size:auto 260px}'),
 'Long one-page results need deferred browser layout for off-screen cards');
assert(page.includes("smsOK?'Mobile for SMS':'Telephone / mobile'"),
 'Mobile number must be clearly labelled for SMS in the filtered card view');
assert(page.includes('Mobile number is ready. Review invitation permission to enable SMS.'),
 'An SMS-ready contact without permission needs an explanatory next action');
assert(page.includes('Review and approve invitation permission first'),
 'SMS disabled state must explain why permission is needed');
assert(page.includes('data-approve-sms'),
 'Contact cards must offer an explicit per-contact invitation approval beside a valid UK mobile');
assert(page.includes("host.querySelectorAll('[data-approve-sms]')"),
 'Contact approval must be saved through its own checkbox handler');
assert(page.includes("Confirm you have reviewed and have a lawful basis to invite "),
 'Approval must require explicit confirmation of lawful invitation basis');
assert(page.includes(".update({approved_for_invitation:approved}).eq('id',id)"),
 'Approval must update only the one confirmed contact');
assert(page.includes("This approves this individual contact for invitations, but does not send an SMS."),
 'Approval must not be confused with sending');
assert(page.includes("input.checked=!approved;input.disabled=false"),
 'Save failures must restore the checkbox and allow retry');

// Invitation shortlist filters: clear email, valid mobile, explicit trade grouping,
// and safe default exclusions for previously invited and registered contacts.
assert(page.includes('id="tradeContactFilter"')&&page.includes('id="cardPageSize"'),'Visible trade filter and page size are required');
assert(page.includes('id="excludeInvited" type="checkbox" checked')&&page.includes('id="excludeRegistered" type="checkbox" checked'),'Previously invited and registered users must be excluded by default');
assert(page.includes("!contactLastSent(r)")&&page.includes("!isAlreadyRegisteredContact(r)"),'Sent and registered exclusions must drive the actual contact query');
assert(page.includes('const matchingIds=new Set(view().map(r=>r.id))'),'Bulk drafts must respect active contact filters');
assert(page.includes("if(channel==='both'&&recordForPermission&&!recordForPermission.approved_for_invitation"),'Review permission must open the individual editor rather than silently approve');
// Bulk previews and selected ticks are distinct: close/skip must never wipe others.
assert(page.includes('id="closeBulkPreviews"'),'Bulk invitation preview needs an explicit close button');
assert(page.includes("function closeBulkPreviewPanel()"),'Close the preview without clearing selected contacts');
assert(page.includes("$('closeBulkPreviews').onclick=()=>{closeBulkPreviewPanel();updateBulkContactReview();"),'Close preview button must preserve selected ticks');
assert(page.includes("function refreshBulkPreviewSummary()"),'Preview draft count must reflect remaining visible drafts');
assert(page.includes("chosen.delete(id);queue=queue.filter(r=>r.id!==id);smsQueue=smsQueue.filter(r=>r.id!==id)"),'Skip must only deselect one contact');
assert(page.includes("reviewCard.remove();refreshBulkPreviewSummary();"),'Confirmed Outlook emails must disappear from the draft list');
assert(page.includes("if(count===0)closeBulkPreviewPanel();"),'Empty preview must close automatically');
assert(page.includes("if(candidates.length>100)"),'Batch permission review must cap writes to 100 at a time');
assert(page.includes("canSelectForEmailReview(r)"),'Batch review must exclude previously contacted and invalid email recipients');
assert(page.includes("!isAlreadyRegisteredContact(r)"),'Batch review must exclude previously registered users');
assert(page.includes('id="bulkPermissionEvidence"'),'Batch permission requires an evidence source');
assert(page.includes('id="bulkPermissionConfirmed"'),'Batch permission requires an explicit checked attestation');
assert(page.includes("for(let offset=0;offset<candidates.length;offset+=25)"),'Bulk review should save manageable checked batches');
assert(!page.includes("Click Review selected contacts again for the next contact."),'Old one-by-one permission workflow must not return');
assert(page.includes("$('bulkReviewSelected').disabled=!selected.length"),'Preparing drafts should explain missing approval instead of being inert for selected contacts');
assert(page.includes("$('bulkReviewContacts').click();"),'Unapproved selection must open the existing bulk permission review');
assert(page.includes("$('bulkPermissionEvidence').focus();"),'Missing bulk permission evidence must be brought into focus');
assert(page.includes("approved.length?'Prepare invitations ('+approved.length+'"),'Approved draft count must be clear before preview');
assert(page.includes("No approved contacts yet. Review and save the permission evidence"),'Unapproved contacts must receive a useful explanation');
assert(page.includes("function select100UsableContacts()"),'Bulk email selection must fill up to 100 across filtered pages');
assert(page.includes("const candidates=view().filter(r=>hasInvitationEmail(r)&&!isAlreadyRegisteredContact(r)&&!contactLastSent(r)&&(both||invitationAudienceMatches(r)))"),'Bulk selection must exclude unusable emails and registered or previously invited contacts');
assert(page.includes("chosen=new Set(ids)"),'Bulk email batch must contain precisely the selected usable contacts');
assert(page.includes("if(changeCount&&!confirm("),'Replacing ticks outside a batch must require confirmation');
assert(page.includes("if(channel==='email'&&!savedSmsOnly){smsHistory=new Map();}"),'Email-only draft preparation must not depend on SMS history');
assert(page.includes("const eligible=selected.filter(r=>r.approved_for_invitation&&canSelectForEmailReview(r))"),'Only approved usable email recipients can prepare email drafts');
assert(page.includes('id="invitationAudience"'),'Invitation type must be selectable');
assert(page.includes("function explicitInvitationKind(r)"),'Combined invitation must require explicit contact classification');
assert(page.includes("if(mode==='both')return 'both';"),'Both must use a single combined invitation without guessing contact types');
assert(page.includes("&&invitationAudienceMatches(r)"),'Prepared invitations must obey chosen audience');
assert(page.includes("function invitationSubject(r)"),'Subjects must distinguish private and trade messages');
assert(page.includes("AnyBike invitation — sell your motorcycle free"),'Private email must focus on free selling');
assert(page.includes("https://www.anybike.co.uk/sell-your-motorcycle.html"),'Private CTA must point to the free motorcycle selling page');
assert(page.includes("function richInvitationHtml(r)"),'Private and dealer invitations must have HTML buttons');
assert(page.includes("const subject=invitationSubject(r);"),'Outlook drafts must use the correct subject');
assert(page.includes("const r=queue[pos],body=emailBody(r),subject=invitationSubject(r);"),'Legacy draft action must also use recipient-specific text');
assert(page.includes("if(invitationTypeFor(r)==='private')return 'Hi '"),'Private SMS draft must not use dealer wording');
assert(page.includes('id="cardPageSize"')&&page.includes('<option value="500" selected>500'),'Cards must also default to 500 per page');
assert(page.includes("function inviteIntro(r){return ''}"),'SMS and email invite templates must not add personal or transport business intros');
assert(page.includes("AnyBike invitation — UK motorcycle dealers"),'Dealer subject must use AnyBike invitation branding');
assert(!page.includes('Andy Gifford at Move Motorcycles personally thought'),'Outgoing invitations must not use personal naming');
assert(page.includes('<details id="simpleContactSearch"'),'Specific-contact search must be collapsed by default');
assert(page.includes('<details id="advancedDirectoryFilters"'),'Advanced search remains optional');
assert(page.includes('Prepare invitations</button>'),'Primary invite workflow has a short action label');
assert(page.includes("const both=$('invitationAudience').value==='both';"),'Both invitations must use the classification-capable bulk selector');
assert(page.includes("$('bulkClassifyPanel').hidden=true;"),'Combined selection must no longer require a second contact type choice');
assert(page.includes("function selectedUnclassifiedContacts()"),'Classification panel must only target unclassified eligible contacts');
assert(page.includes("update({segment:kind})"),'Classification must record a type without approving marketing');
assert(page.includes('id="bulkClassifyPanel" hidden'),'Contact classification form should be hidden until needed');
assert(page.includes('id="bulkClassifyKind"'),'Review must ask whether selected contacts are dealers or private owners');
assert(page.includes("if(invitationTypeFor(r)==='both')return 'Hello '+name+"),'Combined invitation must include its own purpose-specific email body');
assert(page.includes("$('bulkReviewContacts').onclick=()=>{\n const candidates=bulkPermissionCandidates();"),'Combined recipients must proceed directly to permission review');
assert(page.includes("chosen=new Set(ids);"),'Bulk selection must retain selected ids');
assert(page.includes("if(alreadySelected){"),'Selecting all filtered contacts again must produce feedback rather than appear inert');
assert(page.includes("All '+batch.length+' matching selected"),'Select button must show the actual available filtered count');
assert(page.includes("To find more, change the filters or invitation type above"),'Insufficient contacts must be explained without changing criteria automatically');
assert(page.includes("(!unknown&&!needsReview.length)"),'Already reviewed contacts must not offer an inert permission review button');
assert(page.includes("AnyBike invitation — motorcycles for owners and dealers"),'Combined message needs a distinct AnyBike subject');
assert(page.includes("https://www.anybike.co.uk/sell-your-motorcycle.html"),'Combined invitation must include free selling');
assert(page.includes("https://www.anybike.co.uk/uk-dealer-welcome.html"),'Combined invitation must include dealer registration');
assert(page.includes("kind==='both'?[['https://www.anybike.co.uk/sell-your-motorcycle.html'"),'Combined email HTML must render two CTAs');
assert(page.includes("invitationTypeFor(r)!=='dealer'?'disabled"),'Combined invitation must not use dealer-only direct SMS sender');
assert(page.includes("#bulkPreviewSlot{display:grid;gap:12px;max-height:72vh;overflow-y:auto"),'Bulk previews need a bounded vertical scroll area');
assert(page.includes('aria-label="Scrollable invitation drafts"'),'Preview list must be accessible to keyboard scrolling');
assert(page.includes("Scroll inside the invitation list to review the next contact"),'The review must explain where to scroll');
const script=page.slice(page.lastIndexOf('<script>')+8,page.lastIndexOf('</script>'));
assert.doesNotThrow(()=>new Function(script),'Admin invitation JavaScript syntax');
console.log('PASS: single-contact review, email and SMS actions share the results area and retain send safeguards');
