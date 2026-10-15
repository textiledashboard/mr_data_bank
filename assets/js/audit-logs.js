(() => {
'use strict';
const $=id=>document.getElementById(id);
const events=[
{id:'AUD-20261013-001',timestamp:'2026-10-13T09:42:18',actor:'Soheb Siddique',role:'Administrator',action:'Login',module:'Authentication',resource:'Admin session',outcome:'Success',severity:'Low',ip:'192.0.2.24',requestId:'REQ-DM-0001',description:'Administrator authenticated successfully in the demo activity dataset.',changes:'Authentication result: accepted (sample).',context:'Browser-based pilot demonstration',correlation:'CORR-DEMO-101'},
{id:'AUD-20261013-002',timestamp:'2026-10-13T09:36:02',actor:'R. Sharma',role:'Researcher',action:'Upload',module:'Upload',resource:'Cotton Production Survey.xlsx',outcome:'Success',severity:'Low',ip:'192.0.2.41',requestId:'REQ-DM-0002',description:'Sample file was added to the upload workflow for validation.',changes:'Category: Production; state: sample upload validation.',context:'Frontend upload flow',correlation:'CORR-DEMO-102'},
{id:'AUD-20261013-003',timestamp:'2026-10-13T09:22:44',actor:'A. Khan',role:'Researcher',action:'Email prepared',module:'Email Communication',resource:'Monthly Textile Industry Research Update',outcome:'Warning',severity:'Medium',ip:'192.0.2.56',requestId:'REQ-DM-0003',description:'A sample multi-recipient campaign was prepared but not sent.',changes:'Recipients: 12 (illustrative); mail delivery: not connected.',context:'Campaign preparation demo',correlation:'CORR-DEMO-103'},
{id:'AUD-20261013-004',timestamp:'2026-10-13T08:58:11',actor:'System',role:'System',action:'Access denied',module:'User Management',resource:'Category permission check',outcome:'Blocked',severity:'High',ip:'192.0.2.73',requestId:'REQ-DM-0004',description:'Example of an upload request rejected because the user lacked the required category permission.',changes:'Requested category: Silk; assigned categories did not include Silk.',context:'Simulated policy decision; not a real security alert',correlation:'CORR-DEMO-104'},
{id:'AUD-20261012-005',timestamp:'2026-10-12T17:32:27',actor:'Soheb Siddique',role:'Administrator',action:'Permission change',module:'User Management',resource:'R. Sharma · MRD-EMP-002',outcome:'Success',severity:'Medium',ip:'192.0.2.24',requestId:'REQ-DM-0005',description:'Sample researcher category permissions were updated by an administrator.',changes:'Added category: Wool; removed category: —.',context:'Permissions screen demonstration',correlation:'CORR-DEMO-105'},
{id:'AUD-20261012-006',timestamp:'2026-10-12T16:48:50',actor:'S. Patel',role:'Researcher',action:'Download',module:'Data Bank',resource:'Handloom Cluster Directory.csv',outcome:'Success',severity:'Low',ip:'192.0.2.88',requestId:'REQ-DM-0006',description:'Sample download event from the file repository.',changes:'File ID: MRD-EXP-2026-000123; size shown in sample metadata.',context:'Data Bank demo',correlation:'CORR-DEMO-106'},
{id:'AUD-20261012-007',timestamp:'2026-10-12T15:14:12',actor:'M. Das',role:'Researcher',action:'Preview',module:'Data Bank',resource:'Silk Industry Briefing.docx',outcome:'Success',severity:'Low',ip:'192.0.2.92',requestId:'REQ-DM-0007',description:'A sample file metadata preview was opened.',changes:'No record changes.',context:'Preview modal demonstration',correlation:'CORR-DEMO-107'},
{id:'AUD-20261012-008',timestamp:'2026-10-12T12:03:41',actor:'Soheb Siddique',role:'Administrator',action:'Directory change',module:'Industry Directory',resource:'Sambalpur Handloom Cooperative',outcome:'Success',severity:'Medium',ip:'192.0.2.24',requestId:'REQ-DM-0008',description:'An illustrative organization record was updated.',changes:'Contact verification status changed in sample data.',context:'Industry directory demo',correlation:'CORR-DEMO-108'},
{id:'AUD-20261012-009',timestamp:'2026-10-12T10:50:33',actor:'System',role:'System',action:'Backup',module:'Backup',resource:'Nightly metadata snapshot',outcome:'Success',severity:'Low',ip:'',requestId:'JOB-DM-0009',description:'Sample record showing a successful scheduled backup status.',changes:'Metadata estimate 86 MB; no real backup performed.',context:'Illustrative backup activity',correlation:'CORR-DEMO-109'},
{id:'AUD-20261012-010',timestamp:'2026-10-12T09:41:09',actor:'Soheb Siddique',role:'Administrator',action:'Migration',module:'Migration',resource:'Legacy file staging queue',outcome:'Warning',severity:'Medium',ip:'192.0.2.24',requestId:'JOB-DM-0010',description:'A sample migration job flagged a possible duplicate for review.',changes:'Possible duplicate: Monthly Export Summary.pdf.',context:'Migration demo',correlation:'CORR-DEMO-110'},
{id:'AUD-20261011-011',timestamp:'2026-10-11T18:05:59',actor:'R. Sharma',role:'Researcher',action:'Logout',module:'Authentication',resource:'Researcher session',outcome:'Success',severity:'Low',ip:'192.0.2.41',requestId:'REQ-DM-0011',description:'A sample session was closed normally.',changes:'Session result: closed (sample).',context:'Authentication event demo',correlation:'CORR-DEMO-111'},
{id:'AUD-20261011-012',timestamp:'2026-10-11T14:27:06',actor:'System',role:'System',action:'Access denied',module:'Data Bank',resource:'Restricted file access attempt',outcome:'Failed',severity:'High',ip:'192.0.2.105',requestId:'REQ-DM-0012',description:'Illustrative denied access event. This is not a real access attempt or detected incident.',changes:'Policy result: deny; authorization required.',context:'Security-event example',correlation:'CORR-DEMO-112'},
{id:'AUD-20261010-013',timestamp:'2026-10-10T11:12:00',actor:'Soheb Siddique',role:'Administrator',action:'Restore request',module:'Backup',resource:'Weekly repository snapshot',outcome:'Info',severity:'Medium',ip:'192.0.2.24',requestId:'REQ-DM-0013',description:'A sample restore request was created for demonstration.',changes:'Restore scope awaiting approval in example workflow.',context:'Backup/restore demo',correlation:'CORR-DEMO-113'},
{id:'AUD-20261009-014',timestamp:'2026-10-09T16:44:31',actor:'A. Khan',role:'Researcher',action:'Directory change',module:'Industry Directory',resource:'Gujarat Synthetic Textile Works',outcome:'Warning',severity:'Medium',ip:'192.0.2.56',requestId:'REQ-DM-0014',description:'An example organization record was left under verification.',changes:'Verification status: Under Verification.',context:'Directory status demo',correlation:'CORR-DEMO-114'},
{id:'AUD-20261008-015',timestamp:'2026-10-08T09:03:16',actor:'System',role:'System',action:'Logout',module:'Authentication',resource:'Expired session',outcome:'Info',severity:'Low',ip:'',requestId:'JOB-DM-0015',description:'Sample automated session expiry event.',changes:'Session state: expired.',context:'Authentication system example',correlation:'CORR-DEMO-115'}
];
const modal=bootstrap.Modal.getOrCreateInstance($('auditDetailsModal'));
let selectedEventId=null;
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(t){$('demoToastBody').textContent=t;bootstrap.Toast.getOrCreateInstance($('demoToast'),{delay:3500}).show();}
function fmtDate(iso){const d=new Date(iso);return d.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});}
function outClass(out){if(out==='Success')return'outcome-success';if(out==='Warning')return'outcome-warning';if(out==='Failed'||out==='Blocked')return'outcome-failed';return'outcome-info';}
function sevClass(s){return s==='High'?'severity-high':s==='Medium'?'severity-medium':'severity-low';}
function initials(name){return name==='System'?'SY':String(name||'?').split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase();}
function filteredEvents(){
 const q=$('auditSearch').value.trim().toLowerCase(),from=$('dateFrom').value,to=$('dateTo').value,actor=$('actorFilter').value,module=$('moduleFilter').value,action=$('actionFilter').value,outcome=$('outcomeFilter').value,severity=$('severityFilter').value,sort=$('sortFilter').value;
 return events.filter(e=>{
  const date=e.timestamp.slice(0,10);
  if(from&&date<from)return false;
  if(to&&date>to)return false;
  if(actor&&e.actor!==actor)return false;
  if(module&&e.module!==module)return false;
  if(action&&e.action!==action)return false;
  if(outcome&&e.outcome!==outcome)return false;
  if(severity&&e.severity!==severity)return false;
  const hay=[e.id,e.actor,e.role,e.action,e.module,e.resource,e.outcome,e.severity,e.description,e.changes,e.requestId,e.correlation,e.context].join(' ').toLowerCase();
  return !q||hay.includes(q);
 }).sort((a,b)=>sort==='oldest'?a.timestamp.localeCompare(b.timestamp):b.timestamp.localeCompare(a.timestamp));
}
function renderStats(list){
 $('statEvents').textContent=list.length;
 $('statSuccess').textContent=list.filter(e=>e.outcome==='Success').length;
 $('statWarnings').textContent=list.filter(e=>e.outcome==='Warning').length;
 $('statFailed').textContent=list.filter(e=>['Failed','Blocked'].includes(e.outcome)).length;
}
function render(){
 const list=filteredEvents(),body=$('auditTableBody');body.innerHTML='';
 list.forEach(e=>{
  const tr=document.createElement('tr');
  tr.innerHTML=`<td class="ps-4 text-nowrap"><div class="fw-semibold" style="font-size:11px">${esc(fmtDate(e.timestamp))}</div><div class="audit-event-meta">${esc(e.id)}</div></td>
   <td><div class="d-flex align-items-center gap-2"><div class="actor-avatar">${esc(initials(e.actor))}</div><div><div class="actor-name">${esc(e.actor)}</div><div class="actor-role">${esc(e.role)}</div></div></div></td>
   <td style="min-width:220px"><div class="audit-event">${esc(e.action)}</div><div class="audit-event-meta">${esc(e.resource)}</div></td>
   <td><span class="module-tag">${esc(e.module)}</span></td>
   <td><span class="outcome-pill ${outClass(e.outcome)}">${esc(e.outcome)}</span></td>
   <td><span class="severity-pill ${sevClass(e.severity)}">${esc(e.severity)}</span></td>
   <td class="pe-4"><button type="button" class="action-btn" data-view-event="${esc(e.id)}" title="View event details" aria-label="View event details"><i class="bi bi-eye"></i></button></td>`;
  body.appendChild(tr);
 });
 $('emptyAudit').classList.toggle('d-none',list.length>0);
 $('auditTable').classList.toggle('d-none',list.length===0);
 $('auditCount').textContent=`Showing ${list.length} of ${events.length} sample audit event(s)`;
 $('visibleEventsBadge').textContent=`${list.length} events`;
 renderStats(list);
}
function showDetails(e){
 selectedEventId=e.id;
 $('auditDetailsTitle').textContent=`${e.action} · ${e.id}`;
 $('auditDetailsSubtitle').textContent=`${fmtDate(e.timestamp)} · ${e.actor}`;
 $('auditDetailsBody').innerHTML=`<div class="row g-2 mb-3">
 <div class="col-sm-6"><div class="event-detail"><div class="detail-label">Event ID</div><div class="detail-value">${esc(e.id)}</div></div></div>
 <div class="col-sm-6"><div class="event-detail"><div class="detail-label">Timestamp</div><div class="detail-value">${esc(fmtDate(e.timestamp))}</div></div></div>
 <div class="col-sm-6"><div class="event-detail"><div class="detail-label">Actor</div><div class="detail-value">${esc(e.actor)} · ${esc(e.role)}</div></div></div>
 <div class="col-sm-6"><div class="event-detail"><div class="detail-label">Action / module</div><div class="detail-value">${esc(e.action)} · ${esc(e.module)}</div></div></div>
 <div class="col-sm-6"><div class="event-detail"><div class="detail-label">Outcome / severity</div><div><span class="outcome-pill ${outClass(e.outcome)}">${esc(e.outcome)}</span> <span class="severity-pill ${sevClass(e.severity)}">${esc(e.severity)}</span></div></div></div>
 <div class="col-sm-6"><div class="event-detail"><div class="detail-label">Affected resource</div><div class="detail-value">${esc(e.resource)}</div></div></div>
 <div class="col-sm-6"><div class="event-detail"><div class="detail-label">Request ID</div><div class="detail-value">${esc(e.requestId)}</div></div></div>
 <div class="col-sm-6"><div class="event-detail"><div class="detail-label">Correlation ID</div><div class="detail-value">${esc(e.correlation)}</div></div></div>
 <div class="col-sm-6"><div class="event-detail"><div class="detail-label">Sample client IP</div><div class="detail-value">${esc(e.ip||'Not recorded')}</div><div class="audit-event-meta">Reserved example address; not a real user location.</div></div></div>
 <div class="col-sm-6"><div class="event-detail"><div class="detail-label">Context</div><div class="detail-value">${esc(e.context)}</div></div></div>
 <div class="col-12"><div class="event-detail"><div class="detail-label">Event description</div><div class="event-description">${esc(e.description)}</div></div></div>
 <div class="col-12"><div class="event-detail"><div class="detail-label">Change/result summary</div><div class="event-description">${esc(e.changes)}</div></div></div>
 </div><div class="alert alert-warning small mb-0"><i class="bi bi-info-circle me-1"></i>This is sample audit metadata. Production event facts must be recorded by the server at the time the action is processed.</div>`;
 modal.show();
}
function exportCSV(){
 const list=filteredEvents();
 const headers=['Event ID','Timestamp ISO','Timestamp local','Actor','Role','Action','Module','Resource','Outcome','Severity','Request ID','Correlation ID','Sample IP','Description','Change/result summary','Context'];
 const rows=list.map(e=>[e.id,e.timestamp,fmtDate(e.timestamp),e.actor,e.role,e.action,e.module,e.resource,e.outcome,e.severity,e.requestId,e.correlation,e.ip,e.description,e.changes,e.context]);
 const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
 const csv=[headers,...rows].map(row=>row.map(q).join(',')).join('\r\n');
 const blob=new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='mr-data-bank-audit-logs.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 toast(`Exported ${list.length} sample audit event(s) to CSV.`);
}
['auditSearch','dateFrom','dateTo','actorFilter','moduleFilter','actionFilter','outcomeFilter','severityFilter','sortFilter'].forEach(id=>{
 $(id).addEventListener('input',render);$(id).addEventListener('change',render);
});
$('globalSearch').addEventListener('input',()=>{$('auditSearch').value=$('globalSearch').value;render();});
$('auditSearch').addEventListener('input',()=>{if($('globalSearch').value!==$('auditSearch').value)$('globalSearch').value=$('auditSearch').value;});
$('auditTableBody').addEventListener('click',event=>{const b=event.target.closest('[data-view-event]');if(!b)return;const e=events.find(x=>x.id===b.dataset.viewEvent);if(e)showDetails(e);});
$('exportAuditButton').addEventListener('click',exportCSV);
$('refreshAuditButton').addEventListener('click',()=>{render();toast('Audit event view refreshed from sample data. No backend request was made.');});
$('resetFiltersButton').addEventListener('click',()=>{
 ['auditSearch','dateFrom','dateTo','actorFilter','moduleFilter','actionFilter','outcomeFilter','severityFilter'].forEach(id=>$(id).value='');
 $('sortFilter').value='newest';$('globalSearch').value='';render();toast('Audit filters reset.');
});
$('clearSearchButton').addEventListener('click',()=>{$('auditSearch').value='';$('globalSearch').value='';render();});
$('copyEventIdButton').addEventListener('click',()=>{
 if(!selectedEventId)return;
 const text=selectedEventId;
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>toast('Event ID copied.')).catch(()=>toast(`Event ID: ${text}`));}
 else toast(`Event ID: ${text}`);
});
render();
})();