(() => {
'use strict';
const $=id=>document.getElementById(id);
const allowed=new Set(['pdf','xls','xlsx','csv','doc','docx','jpg','jpeg','png']);
let nextId=5,currentDuplicateId=null,currentRestoreId=null,running=false,paused=false,timer=null,progressValue=0,currentJobItems=[];
const backups=[
{id:'bkp-20261012-001',name:'Nightly metadata snapshot',date:'12 Oct 2026 · 23:30',size:'Metadata estimate 86 MB',status:'Completed (sample)',scope:'File metadata and directory records'},
{id:'bkp-20261011-001',name:'Weekly repository snapshot',date:'11 Oct 2026 · 02:00',size:'Storage size not measured',status:'Completed (sample)',scope:'Sample repository snapshot'}
];
const queue=[
{id:'q001',name:'Cotton Production Survey.xlsx',size:2516582,source:'Legacy share / Production',category:'Production',status:'Ready',decision:'None',progress:0,error:'',local:false},
{id:'q002',name:'Monthly Export Summary.pdf',size:1153433,source:'Legacy share / Trade',category:'International Trade',status:'Duplicate review',decision:'Review',progress:0,error:'Possible duplicate of MRD-EXP-2026-000124 based on sample name/size comparison.',duplicate:true,local:false},
{id:'q003',name:'Handloom Cluster Directory.csv',size:700416,source:'Legacy share / Handloom',category:'Handloom',status:'Staged',decision:'None',progress:0,error:'',local:false},
{id:'q004',name:'Old Survey - damaged.pdf',size:0,source:'Legacy share / Unsorted',category:'To be classified',status:'Error',decision:'None',progress:0,error:'Sample validation error: file size is zero or unreadable. Re-select or verify the source file.',local:false}
];
const duplicateModal=bootstrap.Modal.getOrCreateInstance($('duplicateDecisionModal'));
const restoreModal=bootstrap.Modal.getOrCreateInstance($('restoreBackupModal'));
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(text){$('demoToastBody').textContent=text;bootstrap.Toast.getOrCreateInstance($('demoToast'),{delay:3900}).show();}
function ext(name){return name.includes('.')?name.split('.').pop().toLowerCase():'';}
function size(bytes){if(!bytes)return'0 B';const units=['B','KB','MB','GB'];const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),3);return`${(bytes/1024**i).toFixed(i===0?0:1)} ${units[i]}`;}
function stamp(){return new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}
function statusClass(s){return s==='Ready'?'queue-ready':s==='Duplicate review'?'queue-duplicate':s==='Error'?'queue-error':s==='Migrated (demo)'||s==='Skipped'?'queue-migrated':'queue-staged';}
function updateStats(){$('statStaged').textContent=queue.filter(q=>!['Migrated (demo)','Skipped'].includes(q.status)).length;$('statReady').textContent=queue.filter(q=>q.status==='Ready'&&q.category!=='To be classified').length;$('statReview').textContent=queue.filter(q=>q.status==='Duplicate review'||q.status==='Error').length;$('statBackups').textContent=backups.length;}
function matches(){const q=$('queueSearch').value.trim().toLowerCase(),status=$('queueStatusFilter').value;return queue.filter(x=>(!status||x.status===status)&&(!q||[x.name,x.id,x.category,x.source,x.status,x.error].join(' ').toLowerCase().includes(q)));}
function catOptions(current){return ['To be classified','Production','Domestic Market','International Trade','Cotton','MMF','Silk','Wool','Handloom','Apparel','Technical Textiles','Processing','Research & Reports'].map(c=>`<option ${c===current?'selected':''}>${esc(c)}</option>`).join('');}
function renderQueue(){
 const body=$('stagingTableBody');body.innerHTML='';const list=matches();
 list.forEach(x=>{
  const tr=document.createElement('tr');tr.dataset.id=x.id;
  tr.innerHTML=`<td class="ps-4"><div class="file-short">${esc(x.name)}</div><div class="file-meta-small">${esc(x.id)}${x.local?' · Local device selection':''}</div>${x.duplicate?'<div class="file-meta-small text-warning"><i class="bi bi-files me-1"></i>Potential duplicate</div>':''}${x.error?`<div class="file-meta-small text-danger">${esc(x.error)}</div>`:''}</td>
  <td><div class="small fw-semibold">${esc(x.source)}</div><div class="file-meta-small">${size(x.size)}</div></td>
  <td style="min-width:170px"><select class="form-select form-select-sm category-select" aria-label="Category">${catOptions(x.category)}</select></td>
  <td><span class="queue-badge ${statusClass(x.status)}">${esc(x.status)}</span></td>
  <td style="min-width:145px"><select class="form-select form-select-sm decision-select" ${x.duplicate?'':'disabled'} aria-label="Duplicate decision"><option ${x.decision==='None'?'selected':''}>None</option><option ${x.decision==='Review'?'selected':''}>Review</option><option ${x.decision==='Skip'?'selected':''}>Skip</option><option ${x.decision==='Keep separate'?'selected':''}>Keep separate</option></select></td>
  <td style="min-width:100px"><div class="d-flex align-items-center gap-2"><div class="mini-progress flex-grow-1"><div class="progress-bar bg-primary" style="width:${x.progress}%;height:100%"></div></div><span class="file-meta-small">${x.progress}%</span></div></td>
  <td class="pe-4"><div class="queue-actions"><button type="button" class="queue-action" data-action="detect" title="Check duplicate"><i class="bi bi-files"></i></button><button type="button" class="queue-action" data-action="remove" title="Remove from staging"><i class="bi bi-x-lg"></i></button></div></td>`;
  body.appendChild(tr);
  tr.querySelector('.category-select').addEventListener('change',e=>{x.category=e.target.value;if(x.status==='Staged'&&x.category!=='To be classified'&&!x.duplicate)x.status='Ready';if(x.status==='Ready'&&x.category==='To be classified')x.status='Staged';renderQueue();});
  tr.querySelector('.decision-select').addEventListener('change',e=>applyDecision(x,e.target.value));
 });
 $('emptyQueue').classList.toggle('d-none',list.length>0);$('stagingTable').classList.toggle('d-none',list.length===0);
 $('queueCount').textContent=`Showing ${list.length} of ${queue.length} staged records`;
 renderErrors();updateStats();
}
function renderErrors(){
 const errors=queue.filter(x=>x.status==='Error'||x.status==='Duplicate review');$('errorCountBadge').textContent=`${errors.length} ${errors.length===1?'item':'items'}`;
 const box=$('errorQueue');box.innerHTML='';
 if(!errors.length){box.innerHTML='<div class="queue-empty py-3"><i class="bi bi-check-circle d-block mb-2"></i>No errors currently in the demo queue.</div>';return;}
 errors.forEach(x=>{const d=document.createElement('div');d.className='error-item';d.innerHTML=`<div class="error-title">${esc(x.name)}</div><div class="error-copy">${esc(x.error||'Requires review before migration.')}</div><div class="d-flex gap-2 mt-2"><button class="btn btn-sm btn-light border" data-error="review" data-id="${x.id}">Review</button><button class="btn btn-sm btn-soft" data-error="retry" data-id="${x.id}">Retry validation</button></div>`;box.appendChild(d);});
}
function applyDecision(x,decision){
 x.decision=decision;
 if(decision==='Skip'){x.status='Skipped';x.error='Skipped by decision; excluded from migration.';}
 else if(decision==='Keep separate'){x.status=x.category==='To be classified'?'Staged':'Ready';x.error='';}
 else if(decision==='Review'){x.status='Duplicate review';x.error='Awaiting human review of a possible duplicate.';}
 else{x.status=x.category==='To be classified'?'Staged':'Ready';x.error='';}
 renderQueue();toast(`Duplicate decision recorded: ${decision}.`);
}
function addFiles(files){
 let accepted=0,rejected=[];
 [...files].forEach(file=>{
  if(!allowed.has(ext(file.name))){rejected.push(file.name);return;}
  const dup=queue.some(x=>x.name.toLowerCase()===file.name.toLowerCase()&&x.size===file.size);
  const x={id:`q${String(nextId++).padStart(3,'0')}`,name:file.name,size:file.size,source:'Local device (demo selection)',category:$('defaultCategory').value,status:dup?'Duplicate review':($('defaultCategory').value==='To be classified'?'Staged':'Ready'),decision:dup?'Review':'None',progress:0,error:dup?'Possible duplicate by filename + size comparison; review required.':'',duplicate:dup,local:true};
  queue.push(x);accepted++;
 });
 renderQueue();
 if(rejected.length)toast(`${accepted} file(s) staged. Unsupported extensions skipped: ${rejected.slice(0,2).join(', ')}${rejected.length>2?' and more':''}.`);
 else if(accepted)toast(`${accepted} file(s) added to staging in this browser only.`);
}
function checkDuplicates(){
 const seen=new Map();let flagged=0;
 queue.forEach(x=>{const k=`${x.name.toLowerCase()}|${x.size}`;if(seen.has(k)&&x.status!=='Migrated (demo)'){x.duplicate=true;if(x.decision==='None')x.decision='Review';x.status=x.decision==='Keep separate'?'Ready':'Duplicate review';x.error='Possible duplicate based on filename and size; confirm before migration.';flagged++;}else seen.set(k,x.id);});
 renderQueue();toast(flagged?`${flagged} possible duplicate(s) flagged. No cryptographic hash was calculated.`:'No filename/size duplicate pairs found in the current queue.');
}
function updateJob(){
 $('jobProgressBar').style.width=`${progressValue}%`;$('jobPercent').textContent=`${progressValue}%`;$('jobProgress').setAttribute('aria-valuenow',String(progressValue));
 $('jobProcessed').textContent=currentJobItems.filter(x=>x.status==='Migrated (demo)'||x.status==='Error').length;
 $('jobSuccess').textContent=currentJobItems.filter(x=>x.status==='Migrated (demo)').length;$('jobErrors').textContent=currentJobItems.filter(x=>x.status==='Error').length;
 $('pauseMigrationButton').disabled=!(running||paused);$('cancelMigrationButton').disabled=!(running||paused);
 $('pauseMigrationButton').innerHTML=paused?'<i class="bi bi-play-fill me-1"></i>Resume':'<i class="bi bi-pause-fill me-1"></i>Pause';
}
function startMigration(){
 if(running||paused){toast('A demo migration job is already active.');return;}
 const ready=queue.filter(x=>x.status==='Ready'&&x.category!=='To be classified'&&x.decision!=='Skip'&&(!x.duplicate||x.decision==='Keep separate'));
 if(!ready.length){toast('No files are ready. Classify staged files and resolve duplicate reviews first.');return;}
 currentJobItems=ready;progressValue=0;running=true;paused=false;
 $('jobStateBadge').textContent='Running (demo)';$('jobStateBadge').className='queue-badge queue-staged';$('jobTitle').textContent=`Demo job · ${ready.length} file(s)`;$('jobMessage').textContent='Simulated progress only. No file is copied to server storage.';
 updateJob();timer=setInterval(()=>{
  if(paused)return;
  progressValue=Math.min(100,progressValue+Math.floor(Math.random()*12)+8);
  const completed=Math.min(currentJobItems.length,Math.floor(progressValue/100*currentJobItems.length));
  currentJobItems.forEach((x,i)=>x.progress=i<completed?100:(i===completed?progressValue%100:0));
  if(progressValue>=100){
   clearInterval(timer);timer=null;running=false;currentJobItems.forEach(x=>{if(x.status!=='Error'){x.status='Migrated (demo)';x.progress=100;}});
   $('jobStateBadge').textContent='Completed (demo)';$('jobStateBadge').className='queue-badge queue-ready';$('jobMessage').textContent='Demo completed. Production must create File IDs, verify checksums, store files securely and write audit logs.';
   updateJob();renderQueue();toast('Demo migration completed. No real files were moved.');return;
  }
  updateJob();renderQueue();
 },500);
}
function createBackup(){
 const id=`bkp-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(backups.length+1).padStart(3,'0')}`;
 backups.unshift({id,name:'Manual demo snapshot',date:stamp(),size:`${queue.length} queue metadata item(s)`,status:'Completed (demo)',scope:'Queue metadata only — no source files'});
 renderBackups();updateStats();$('lastBackupValue').textContent=stamp();$('recoveryCheckValue').textContent='Restore request demo only';toast('Demo backup entry created. No actual file or database backup was performed.');
}
function renderBackups(){
 const box=$('backupList');box.innerHTML='';
 backups.forEach(b=>{const el=document.createElement('div');el.className='backup-item';el.innerHTML=`<div class="backup-icon"><i class="bi bi-hdd-stack"></i></div><div class="flex-grow-1"><div class="d-flex flex-wrap gap-2 align-items-center"><div class="backup-title">${esc(b.name)}</div><span class="backup-status">${esc(b.status)}</span></div><div class="backup-meta">${esc(b.id)} · ${esc(b.date)}<br>${esc(b.size)}<br>Scope: ${esc(b.scope)}</div><div class="d-flex gap-2 mt-2"><button type="button" class="btn btn-sm btn-light border" data-backup="details" data-id="${esc(b.id)}">Details</button><button type="button" class="btn btn-sm btn-soft" data-backup="restore" data-id="${esc(b.id)}"><i class="bi bi-arrow-counterclockwise me-1"></i>Request restore</button></div></div>`;box.appendChild(el);});
 $('statBackups').textContent=backups.length;
}
function exportQueue(){
 const headers=['Queue ID','File name','Size bytes','Source','Category','Status','Duplicate decision','Progress percent','Error'];
 const rows=queue.map(x=>[x.id,x.name,x.size,x.source,x.category,x.status,x.decision,x.progress,x.error]);
 const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;const csv=[headers,...rows].map(r=>r.map(q).join(',')).join('\r\n');
 const blob=new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mr-data-bank-migration-queue.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast(`Exported ${queue.length} queue records to CSV.`);
}
$('browseLegacyFiles').addEventListener('click',()=>$('legacyFileInput').click());
$('migrationDropZone').addEventListener('click',e=>{if(!e.target.closest('#browseLegacyFiles'))$('legacyFileInput').click();});
$('migrationDropZone').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('legacyFileInput').click();}});
['dragenter','dragover'].forEach(type=>$('migrationDropZone').addEventListener(type,e=>{e.preventDefault();e.stopPropagation();$('migrationDropZone').classList.add('drag-over');}));
['dragleave','drop'].forEach(type=>$('migrationDropZone').addEventListener(type,e=>{e.preventDefault();e.stopPropagation();$('migrationDropZone').classList.remove('drag-over');}));
$('migrationDropZone').addEventListener('drop',e=>addFiles(e.dataTransfer.files));
$('legacyFileInput').addEventListener('change',e=>{addFiles(e.target.files);e.target.value='';});
$('clearStagedButton').addEventListener('click',()=>{for(let i=queue.length-1;i>=0;i--)if(queue[i].local)queue.splice(i,1);renderQueue();toast('Newly selected files cleared from the demo queue.');});
$('checkDuplicatesButton').addEventListener('click',checkDuplicates);
$('queueSearch').addEventListener('input',renderQueue);$('queueStatusFilter').addEventListener('change',renderQueue);
$('startMigrationButton').addEventListener('click',startMigration);
$('pauseMigrationButton').addEventListener('click',()=>{if(running){paused=true;running=false;$('jobStateBadge').textContent='Paused (demo)';$('jobStateBadge').className='queue-badge queue-duplicate';$('jobMessage').textContent='Paused simulated job. Click Resume to continue.';updateJob();}else if(paused){paused=false;running=true;$('jobStateBadge').textContent='Running (demo)';$('jobStateBadge').className='queue-badge queue-staged';updateJob();}});
$('cancelMigrationButton').addEventListener('click',()=>{if(timer){clearInterval(timer);timer=null;}running=false;paused=false;$('jobStateBadge').textContent='Cancelled (demo)';$('jobStateBadge').className='queue-badge queue-error';$('jobMessage').textContent='Demo job cancelled. Files remain in the queue; nothing was changed on a server.';updateJob();toast('Demo migration cancelled.');});
$('clearJobButton').addEventListener('click',()=>{if(running||paused){toast('Pause or cancel the job before clearing its display.');return;}progressValue=0;currentJobItems=[];$('jobStateBadge').textContent='Idle';$('jobStateBadge').className='queue-badge queue-staged';$('jobTitle').textContent='No migration job running';$('jobMessage').textContent='Migration jobs are simulated in this frontend.';updateJob();});
$('retryErrorsButton').addEventListener('click',()=>{const err=queue.filter(x=>x.status==='Error');if(!err.length){toast('No validation errors to retry.');return;}err.forEach(x=>{if(x.size>0){x.status=x.category==='To be classified'?'Staged':'Ready';x.error='';x.progress=0;}});renderQueue();toast('Retry performed on sample error items with a non-zero size.');});
$('stagingTableBody').addEventListener('click',e=>{const btn=e.target.closest('[data-action]');if(!btn)return;const x=queue.find(q=>q.id===btn.closest('tr')?.dataset.id);if(!x)return;if(btn.dataset.action==='remove'){if(x.status==='Migrated (demo)'){toast('Migrated demo records are retained in the queue.');return;}queue.splice(queue.indexOf(x),1);renderQueue();toast('Record removed from staging.');}else{currentDuplicateId=x.id;x.duplicate=true;x.decision='Review';x.status='Duplicate review';x.error='Manual duplicate review requested.';$('duplicateDetailsText').textContent=`${x.name} (${size(x.size)}) is flagged for duplicate review. This demo compares filename and size only; it has not calculated a cryptographic checksum.`;duplicateModal.show();renderQueue();}});
document.querySelectorAll('[data-dupe-choice]').forEach(btn=>btn.addEventListener('click',()=>{const x=queue.find(q=>q.id===currentDuplicateId);if(!x)return;applyDecision(x,btn.dataset.dupeChoice);duplicateModal.hide();}));
$('errorQueue').addEventListener('click',e=>{const b=e.target.closest('[data-error]');if(!b)return;const x=queue.find(q=>q.id===b.dataset.id);if(!x)return;if(b.dataset.error==='retry'){if(x.size>0){x.status=x.category==='To be classified'?'Staged':'Ready';x.error='';x.progress=0;toast('Sample record returned to staging/ready.');}else toast('This sample file is still zero bytes. Re-select a valid source file.');renderQueue();}else{currentDuplicateId=x.id;$('duplicateDetailsText').textContent=`${x.name}: ${x.error||'Review this item before migration.'}`;duplicateModal.show();}});
$('backupList').addEventListener('click',e=>{const b=e.target.closest('[data-backup]');if(!b)return;const backup=backups.find(x=>x.id===b.dataset.id);if(!backup)return;if(b.dataset.backup==='details'){toast(`${backup.name}: ${backup.scope}. This is a sample record only.`);}else{currentRestoreId=backup.id;$('restoreBackupText').textContent=`Create a demo restore request for "${backup.name}" (${backup.id})?`;restoreModal.show();}});
$('confirmRestoreButton').addEventListener('click',()=>{const b=backups.find(x=>x.id===currentRestoreId);restoreModal.hide();if(b){$('recoveryCheckValue').textContent='Restore request recorded (demo)';toast(`Restore request recorded for ${b.id}. No data was restored.`);}});
$('createBackupButton').addEventListener('click',createBackup);$('createBackupTop').addEventListener('click',createBackup);$('exportQueueButton').addEventListener('click',exportQueue);
$('globalSearch').addEventListener('input',()=>{$('queueSearch').value=$('globalSearch').value;renderQueue();});
$('queueSearch').addEventListener('input',()=>{if($('globalSearch').value!==$('queueSearch').value)$('globalSearch').value=$('queueSearch').value;});
function init(){renderQueue();renderBackups();$('lastBackupValue').textContent=backups[0]?.date||'Not available';$('jobStateBadge').textContent='Idle';updateJob();}
init();
})();