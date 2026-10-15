(() => {
'use strict';
const $ = id => document.getElementById(id);
const contacts = [
  {id:'c001',org:'Western India Cotton Association',type:'Association',state:'Maharashtra',city:'Mumbai',sectors:['Cotton'],name:'Anita Mehta',designation:'Research Coordinator',email:'anita.mehta@example.org'},
  {id:'c002',org:'Western India Cotton Association',type:'Association',state:'Maharashtra',city:'Mumbai',sectors:['Cotton'],name:'Rahul Shah',designation:'Member Relations',email:'rahul.shah@example.org'},
  {id:'c003',org:'Sambalpur Handloom Cooperative',type:'Cluster / Cooperative',state:'Odisha',city:'Sambalpur',sectors:['Handloom','Cotton'],name:'Bikash Pradhan',designation:'Cooperative Secretary',email:'bikash.pradhan@example.org'},
  {id:'c004',org:'Gujarat Synthetic Textile Works',type:'Manufacturer',state:'Gujarat',city:'Surat',sectors:['MMF','Processing'],name:'Nilesh Patel',designation:'Commercial Manager',email:'nilesh.patel@example.org'},
  {id:'c005',org:'Gujarat Synthetic Textile Works',type:'Manufacturer',state:'Gujarat',city:'Surat',sectors:['MMF','Processing'],name:'Priya Desai',designation:'Compliance Officer',email:'priya.desai@example.org'},
  {id:'c006',org:'Tamil Nadu Knitwear Export Forum',type:'Exporter',state:'Tamil Nadu',city:'Tiruppur',sectors:['Apparel','Cotton'],name:'Kavitha Raman',designation:'Export Documentation Lead',email:'kavitha.raman@example.org'},
  {id:'c007',org:'Eastern Silk Research Centre',type:'Research / Institution',state:'West Bengal',city:'Berhampore',sectors:['Silk','Processing'],name:'Dr. S. Banerjee',designation:'Research Officer',email:'s.banerjee@example.org'},
  {id:'c008',org:'Maharashtra Technical Fabric Labs',type:'Manufacturer',state:'Maharashtra',city:'Pune',sectors:['Technical Textiles','MMF'],name:'A. Kulkarni',designation:'Business Development',email:'a.kulkarni@example.org'},
  {id:'c009',org:'North India Wool Traders',type:'Exporter',state:'Uttar Pradesh',city:'Kanpur',sectors:['Wool'],name:'Imran Siddiqui',designation:'Director',email:'imran.siddiqui@example.org'},
  {id:'c010',org:'Odisha Natural Fibre Research Group',type:'Research / Institution',state:'Odisha',city:'Bhubaneswar',sectors:['Jute','Handloom'],name:'Madhuri Das',designation:'Project Officer',email:''}
];
const selected = new Set();
const attachments = [];
const history = [];
let draftCounter = 0;
let campaignCounter = 0;

const recipientModal = bootstrap.Modal.getOrCreateInstance($('recipientsModal'));
const messageModal = bootstrap.Modal.getOrCreateInstance($('messagePreviewModal'));
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(text){$('demoToastBody').textContent=text;bootstrap.Toast.getOrCreateInstance($('demoToast'),{delay:3800}).show();}
function humanSize(bytes){if(bytes===0)return'0 B';const units=['B','KB','MB','GB'];const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),3);return`${(bytes/1024**i).toFixed(i===0?0:1)} ${units[i]}`;}
function nowLabel(){return new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}
function selectedContacts(){return contacts.filter(c=>selected.has(c.id));}
function filteredContacts(){
 const q=$('contactSearch').value.trim().toLowerCase(),sector=$('contactSector').value,state=$('contactState').value,type=$('contactOrgType').value,emailMode=$('contactStatus').value;
 return contacts.filter(c=>{
  if(sector&&!c.sectors.includes(sector))return false;
  if(state&&c.state!==state)return false;
  if(type&&c.type!==type)return false;
  if(emailMode==='email'&&!c.email)return false;
  const hay=[c.org,c.type,c.state,c.city,c.sectors.join(' '),c.name,c.designation,c.email].join(' ').toLowerCase();
  return !q||hay.includes(q);
 });
}
function refreshStats(){
 $('statAvailable').textContent=contacts.filter(c=>c.email).length;
 $('statSelected').textContent=selected.size;
 $('statDrafts').textContent=history.filter(h=>h.status==='Draft').length;
 $('statPrepared').textContent=history.filter(h=>h.status==='Prepared (demo)').length;
 $('selectedRecipientCount').textContent=selected.size;
 $('previewRecipientsButton').disabled=selected.size===0;
}
function renderContacts(){
 const list=filteredContacts(),container=$('recipientList');
 $('filteredContactCount').textContent=`${list.length} matching contact(s)`;
 container.innerHTML='';
 if(!list.length){
  container.innerHTML='<div class="empty-state"><i class="bi bi-person-x d-block mb-2"></i><strong class="d-block text-dark mb-1">No matching contacts</strong><span class="small">Try changing the filters.</span></div>';
 } else {
  list.forEach(c=>{
   const div=document.createElement('div');
   div.className='recipient-row';
   const initials=c.name.split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase();
   div.innerHTML=`<input class="form-check-input recipient-check" type="checkbox" data-contact-id="${esc(c.id)}" aria-label="Select ${esc(c.name)}" ${selected.has(c.id)?'checked':''} ${!c.email?'disabled':''}><div class="recipient-avatar">${esc(initials)}</div><div class="flex-grow-1 min-w-0"><div class="recipient-name">${esc(c.name)}</div><div class="recipient-meta">${esc(c.designation)} · ${esc(c.org)}<br>${esc(c.city)}, ${esc(c.state)}</div><div class="recipient-email">${c.email?`<i class="bi bi-envelope me-1"></i>${esc(c.email)}`:'<i class="bi bi-exclamation-circle me-1"></i>No email address on file'}</div><div class="recipient-tags">${c.sectors.map(s=>`<span>${esc(s)}</span>`).join('')}</div></div>`;
   container.appendChild(div);
  });
 }
 const selectable=list.filter(c=>c.email);
 $('selectFilteredButton').disabled=selectable.length===0;
 refreshStats();
}
function renderAttachments(){
 const container=$('attachmentList');container.innerHTML='';
 if(!attachments.length)return;
 attachments.forEach((item,index)=>{
  const div=document.createElement('div');div.className='attachment-item';
  div.innerHTML=`<div class="d-flex align-items-center gap-2 min-w-0"><i class="bi bi-file-earmark text-primary fs-5"></i><div class="min-w-0"><div class="fw-bold text-break">${esc(item.file.name)}</div><div class="text-secondary">${humanSize(item.file.size)}</div></div></div><button type="button" class="btn btn-sm btn-light border" data-remove-attachment="${index}" aria-label="Remove attachment"><i class="bi bi-x-lg"></i></button>`;
  container.appendChild(div);
 });
}
function formData(){
 return {subject:$('messageSubject').value.trim(),body:$('messageBody').value.trim(),recipients:selectedContacts(),attachments:[...attachments],date:nowLabel()};
}
function validateMessage(){
 const data=formData();
 if(!data.recipients.length){toast('Select at least one recipient with a valid email address.');return null;}
 if(!data.subject){$('messageSubject').focus();toast('Enter a subject before continuing.');return null;}
 if(!data.body){$('messageBody').focus();toast('Write a message before continuing.');return null;}
 return data;
}
function saveHistory(status){
 const data=formData();
 if(status==='Prepared (demo)'&&!validateMessage())return;
 const entry={id:`msg-${Date.now()}-${++draftCounter}`,subject:data.subject||'(No subject)',body:data.body,recipientIds:data.recipients.map(c=>c.id),recipientCount:data.recipients.length,attachmentNames:data.attachments.map(a=>a.file.name),date:nowLabel(),status};
 history.unshift(entry);renderHistory();refreshStats();
 $('composerMessage').textContent=status==='Draft'?'Draft saved in this browser session.':'Campaign prepared in demo mode. No email was sent.';
 toast(status==='Draft'?'Draft saved in this browser session.':'Campaign prepared in demo mode. No email was sent.');
}
function renderHistory(){
 const body=$('historyTableBody');body.innerHTML='';
 $('emptyHistory').classList.toggle('d-none',history.length>0);
 history.forEach(h=>{
  const tr=document.createElement('tr');
  const statusClass=h.status==='Draft'?'history-draft':h.status==='Prepared (demo)'?'history-prepared':'history-review';
  tr.innerHTML=`<td><div class="fw-bold small">${esc(h.subject)}</div><div class="text-secondary" style="font-size:10px">${esc(h.attachmentNames.length?`${h.attachmentNames.length} attachment(s)`:'No attachments')}</div></td><td class="text-nowrap small">${h.recipientCount}</td><td class="text-nowrap small">${esc(h.date)}</td><td><span class="history-status ${statusClass}">${esc(h.status)}</span></td><td><button type="button" class="btn btn-sm btn-light border" data-history-action="load" data-history-id="${esc(h.id)}" title="Load this draft"><i class="bi bi-box-arrow-in-up-right"></i></button></td>`;
  body.appendChild(tr);
 });
 refreshStats();
}
function fillTemplate(value){
 const templates={
  monthly:{subject:'Monthly Textile Industry Research Update',body:'Dear Stakeholder,\\n\\nThe Market Research Division is sharing its monthly textile industry research update for your information.\\n\\nPlease review the attached material and share any relevant observations through the established official communication channel.\\n\\nRegards,\\nMarket Research Division\\nTextiles Committee'},
  survey:{subject:'Request for Textile Industry Data / Survey Response',body:'Dear Stakeholder,\\n\\nThe Market Research Division requests your support in providing the information specified in the attached survey / data request. Your response will support textile industry research and statistical reporting.\\n\\nPlease submit the requested information through the prescribed official channel by the communicated deadline.\\n\\nRegards,\\nMarket Research Division\\nTextiles Committee'},
  report:{subject:'Textile Industry Research Report for Reference',body:'Dear Stakeholder,\\n\\nPlease find the attached textile industry research report for your reference.\\n\\nThe document is shared for the stated official/research purpose. Please direct any questions or corrections to the Market Research Division.\\n\\nRegards,\\nMarket Research Division\\nTextiles Committee'},
  verification:{subject:'Request to Verify Industry Contact Information',body:'Dear Stakeholder,\\n\\nThe Market Research Division is reviewing its Industry and Stakeholder Directory. Kindly verify the organization and contact details maintained by our office, and share any corrections through the official response channel.\\n\\nThank you for your cooperation.\\n\\nRegards,\\nMarket Research Division\\nTextiles Committee'}
 };
 if(!value)return;
 const item=templates[value];if(item){$('messageSubject').value=item.subject;$('messageBody').value=item.body.replace(/\\n/g,'\n');$('bodyCharCount').textContent=$('messageBody').value.length;toast('Template loaded. Review the content before use.');}
}
$('recipientList').addEventListener('change',event=>{
 const box=event.target.closest('[data-contact-id]');if(!box)return;
 box.checked?selected.add(box.dataset.contactId):selected.delete(box.dataset.contactId);
 renderContacts();
});
['contactSearch','contactSector','contactState','contactOrgType','contactStatus'].forEach(id=>$(id).addEventListener('input',renderContacts));
$('globalSearch').addEventListener('input',()=>{$('contactSearch').value=$('globalSearch').value;renderContacts();});
$('contactSearch').addEventListener('input',()=>{if($('globalSearch').value!==$('contactSearch').value)$('globalSearch').value=$('contactSearch').value;});
$('selectFilteredButton').addEventListener('click',()=>{filteredContacts().filter(c=>c.email).forEach(c=>selected.add(c.id));renderContacts();toast('All currently filtered contacts with email addresses were selected.');});
$('clearRecipientsButton').addEventListener('click',()=>{selected.clear();renderContacts();});
$('previewRecipientsButton').addEventListener('click',()=>{
 const list=selectedContacts();
 if(!list.length)return;
 $('recipientPreviewContent').innerHTML=`<div class="d-flex justify-content-between align-items-center mb-3"><strong>${list.length} selected recipient(s)</strong><span class="small text-secondary">Sender-only preview</span></div>`+list.map(c=>`<div class="recipient-row px-0"><div class="recipient-avatar">${esc(c.name.split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase())}</div><div><div class="recipient-name">${esc(c.name)}</div><div class="recipient-meta">${esc(c.org)} · ${esc(c.state)}</div><div class="recipient-email">${esc(c.email)}</div></div></div>`).join('');
 recipientModal.show();
});
$('messageTemplate').addEventListener('change',()=>fillTemplate($('messageTemplate').value));
$('messageBody').addEventListener('input',()=>$('bodyCharCount').textContent=$('messageBody').value.length);
$('attachmentInput').addEventListener('change',event=>{
 const allowed=new Set(['pdf','xls','xlsx','csv','doc','docx','jpg','jpeg','png']);
 [...event.target.files].forEach(file=>{
  const ext=file.name.includes('.')?file.name.split('.').pop().toLowerCase():'';
  if(!allowed.has(ext)){toast(`Unsupported attachment skipped: ${file.name}`);return;}
  if(attachments.some(a=>a.file.name===file.name&&a.file.size===file.size)){return;}
  attachments.push({file});
 });
 event.target.value='';renderAttachments();
});
$('attachmentList').addEventListener('click',event=>{
 const button=event.target.closest('[data-remove-attachment]');if(!button)return;
 attachments.splice(Number(button.dataset.removeAttachment),1);renderAttachments();
});
$('previewMessageButton').addEventListener('click',()=>{
 const data=validateMessage();if(!data)return;
 $('previewSubject').textContent=data.subject;
 $('previewDelivery').textContent=`Private multi-recipient distribution · ${data.recipients.length} recipient(s) · recipient list should be hidden using BCC/mail-merge delivery.`;
 $('previewBody').textContent=data.body;
 $('previewAttachments').textContent=data.attachments.length?`Attachments selected locally: ${data.attachments.map(a=>a.file.name).join(', ')}`:'No attachments selected.';
 messageModal.show();
});
$('prepareCampaignButton').addEventListener('click',()=>{
 const data=validateMessage();if(!data)return;
 campaignCounter++;saveHistory('Prepared (demo)');
});
$('saveDraftButton').addEventListener('click',()=>saveHistory('Draft'));
$('saveDraftTopButton').addEventListener('click',()=>saveHistory('Draft'));
$('resetComposeButton').addEventListener('click',()=>{
 $('messageSubject').value='';$('messageBody').value='';$('messageTemplate').value='';$('bodyCharCount').textContent='0';
 attachments.splice(0,attachments.length);renderAttachments();
 $('composerMessage').textContent='Composer reset. Recipient selection was kept.';
 toast('Composer reset. Recipient selection remains unchanged.');
});
$('historyTableBody').addEventListener('click',event=>{
 const button=event.target.closest('[data-history-action="load"]');if(!button)return;
 const item=history.find(h=>h.id===button.dataset.historyId);if(!item)return;
 $('messageSubject').value=item.subject==='(No subject)'?'':item.subject;
 $('messageBody').value=item.body||'';
 $('bodyCharCount').textContent=$('messageBody').value.length;
 selected.clear();item.recipientIds.forEach(id=>selected.add(id));
 renderContacts();$('composerMessage').textContent=`Loaded ${item.status.toLowerCase()} into the composer. Add attachments again if needed.`;
 toast('Message loaded. Attachments must be reselected because this is a browser-only demo.');
});
$('clearHistoryButton').addEventListener('click',()=>{
 if(!history.length){toast('Communication history is already empty.');return;}
 history.splice(0,history.length);renderHistory();toast('Session history cleared.');
});
renderContacts();renderHistory();
})();