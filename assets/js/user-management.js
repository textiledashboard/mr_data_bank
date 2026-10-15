(() => {
'use strict';
const $ = id => document.getElementById(id);
const categories=['Production','Domestic Market','International Trade','Cotton','MMF','Silk','Wool','Handloom','Apparel','Technical Textiles','Processing','Research & Reports'];
let nextId=9,editingId=null,detailsId=null,pendingAction=null;
const selected=new Set();
const users=[
 {id:'usr-001',name:'Soheb Siddique',email:'soheb.siddique@example.gov.in',employeeId:'MRD-ADM-001',department:'Market Research Division',phone:'',role:'Administrator',status:'Active',categories:[...categories],bulkEmail:true,download:true,updated:'2026-10-12',updatedBy:'System Demo',notes:'Sample administrator account.'},
 {id:'usr-002',name:'R. Sharma',email:'r.sharma@example.gov.in',employeeId:'MRD-EMP-002',department:'Production & Fibre Research',phone:'',role:'Researcher',status:'Active',categories:['Production','Cotton','Wool'],bulkEmail:false,download:true,updated:'2026-10-11',updatedBy:'Soheb Siddique',notes:'Assigned to production, cotton and wool records.'},
 {id:'usr-003',name:'A. Khan',email:'a.khan@example.gov.in',employeeId:'MRD-EMP-003',department:'International Trade Research',phone:'',role:'Researcher',status:'Active',categories:['International Trade','Apparel','MMF'],bulkEmail:true,download:true,updated:'2026-10-10',updatedBy:'Soheb Siddique',notes:'Allowed to prepare bulk campaigns in the sample model.'},
 {id:'usr-004',name:'S. Patel',email:'s.patel@example.gov.in',employeeId:'MRD-EMP-004',department:'Handloom Research',phone:'',role:'Researcher',status:'Active',categories:['Handloom','Cotton'],bulkEmail:false,download:true,updated:'2026-10-08',updatedBy:'Soheb Siddique',notes:'Handloom category assignment.'},
 {id:'usr-005',name:'M. Das',email:'m.das@example.gov.in',employeeId:'MRD-EMP-005',department:'Research & Reports',phone:'',role:'Researcher',status:'Active',categories:['Silk','Research & Reports','Processing'],bulkEmail:false,download:true,updated:'2026-10-06',updatedBy:'Soheb Siddique',notes:'Research and report preparation.'},
 {id:'usr-006',name:'V. Iyer',email:'v.iyer@example.gov.in',employeeId:'MRD-READ-006',department:'Read-only Review',phone:'',role:'Read-only',status:'Active',categories:[],bulkEmail:false,download:true,updated:'2026-10-05',updatedBy:'Soheb Siddique',notes:'Review access only; upload permissions disabled.'},
 {id:'usr-007',name:'K. Nair',email:'k.nair@example.gov.in',employeeId:'MRD-EMP-007',department:'Domestic Market Research',phone:'',role:'Researcher',status:'Inactive',categories:['Domestic Market','Apparel'],bulkEmail:false,download:true,updated:'2026-09-28',updatedBy:'Soheb Siddique',notes:'Inactive demo record; history should remain in production.'},
 {id:'usr-008',name:'P. Rao',email:'p.rao@example.gov.in',employeeId:'MRD-EMP-008',department:'Data Review',phone:'',role:'Researcher',status:'Active',categories:['Research & Reports'],bulkEmail:false,download:false,updated:'2026-09-25',updatedBy:'Soheb Siddique',notes:'Download permission disabled in this example.'}
];
const formModal=bootstrap.Modal.getOrCreateInstance($('userFormModal'));
const detailsModal=bootstrap.Modal.getOrCreateInstance($('userDetailsModal'));
const confirmModal=bootstrap.Modal.getOrCreateInstance($('userConfirmModal'));
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(text){$('demoToastBody').textContent=text;bootstrap.Toast.getOrCreateInstance($('demoToast'),{delay:3800}).show();}
function initials(name){return String(name||'?').split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();}
function roleClass(role){return role==='Administrator'?'role-admin':role==='Researcher'?'role-researcher':'role-readonly';}
function statusClass(status){return status==='Active'?'status-active':'status-inactive';}
function filteredUsers(){
 const q=$('userSearch').value.trim().toLowerCase(),role=$('roleFilter').value,status=$('userStatusFilter').value,email=$('emailPermissionFilter').value,upload=$('uploadPermissionFilter').value,showInactive=$('showInactiveToggle').checked;
 return users.filter(u=>{
  if(!showInactive&&u.status==='Inactive')return false;
  if(role&&u.role!==role)return false;
  if(status&&u.status!==status)return false;
  if(email==='yes'&&!u.bulkEmail)return false;
  if(email==='no'&&u.bulkEmail)return false;
  if(upload==='yes'&&!(u.role==='Administrator'||u.categories.length>0))return false;
  if(upload==='no'&&(u.role==='Administrator'||u.categories.length>0))return false;
  const hay=[u.name,u.email,u.employeeId,u.department,u.role,u.status,u.categories.join(' '),u.updatedBy,u.notes].join(' ').toLowerCase();
  return !q||hay.includes(q);
 }).sort((a,b)=>a.name.localeCompare(b.name));
}
function updateStats(){
 $('statTotalUsers').textContent=users.length;
 $('statActiveUsers').textContent=users.filter(u=>u.status==='Active').length;
 $('statAdmins').textContent=users.filter(u=>u.role==='Administrator'&&u.status==='Active').length;
 $('statEmailAuthorized').textContent=users.filter(u=>u.bulkEmail&&u.status==='Active').length;
}
function updateBulk(){
 $('selectedUsersCount').textContent=selected.size;
 $('userBulkBar').classList.toggle('visible',selected.size>0);
}
function actionButton(action,icon,label,extra=''){
 return `<button type="button" class="action-btn ${extra}" data-action="${action}" aria-label="${esc(label)}" title="${esc(label)}"><i class="bi bi-${icon}"></i></button>`;
}
function renderTable(){
 const list=filteredUsers(),tbody=$('usersTableBody');tbody.innerHTML='';
 list.forEach(u=>{
  const tr=document.createElement('tr');tr.dataset.userId=u.id;
  const perms=u.role==='Administrator'?'<span class="permission-tag all">All categories</span>':u.categories.length?u.categories.slice(0,3).map(c=>`<span class="permission-tag">${esc(c)}</span>`).join('')+(u.categories.length>3?`<span class="permission-tag">+${u.categories.length-3}</span>`:''):'<span class="text-secondary small">No upload access</span>';
  tr.innerHTML=`<td class="ps-4"><input class="form-check-input record-check row-check" type="checkbox" data-select-id="${esc(u.id)}" aria-label="Select ${esc(u.name)}" ${selected.has(u.id)?'checked':''}></td>
  <td><div class="d-flex align-items-center gap-3"><div class="user-avatar">${esc(initials(u.name))}</div><div><div class="user-name">${esc(u.name)}</div><div class="user-meta">${esc(u.email)}</div><div class="user-meta">${esc(u.department||'Department not specified')}</div></div></div></td>
  <td><span class="role-pill ${roleClass(u.role)}">${esc(u.role)}</span></td>
  <td style="min-width:180px">${perms}</td>
  <td>${u.bulkEmail?'<span class="status-pill status-active">Authorized</span>':'<span class="status-pill status-inactive">No</span>'}</td>
  <td><span class="status-pill ${statusClass(u.status)}">${esc(u.status)}</span></td>
  <td class="text-nowrap small">${esc(u.updated)}</td>
  <td class="pe-4"><div class="action-buttons">${actionButton('view','eye','View user')}${actionButton('edit','pencil-square','Edit user and permissions')}${u.status==='Active'?actionButton('deactivate','person-x','Deactivate user','danger'):actionButton('activate','person-check','Reactivate user')}</div></td>`;
  tbody.appendChild(tr);
 });
 $('emptyUsers').classList.toggle('d-none',list.length>0);
 $('usersTable').classList.toggle('d-none',list.length===0);
 $('userRecordCount').textContent=`Showing ${list.length} of ${users.length} sample user account(s)`;
 $('selectAllUsers').checked=list.length>0&&list.every(u=>selected.has(u.id));
 $('selectAllUsers').indeterminate=list.some(u=>selected.has(u.id))&&!$('selectAllUsers').checked;
 updateBulk();updateStats();
}
function selectedCategories(){return [...document.querySelectorAll('input[name="uploadCategories"]:checked')].map(c=>c.value);}
function setCategories(values){document.querySelectorAll('input[name="uploadCategories"]').forEach(c=>c.checked=values.includes(c.value));}
function applyRoleRules(){
 const role=$('userRole').value;
 const checks=[...document.querySelectorAll('input[name="uploadCategories"]')];
 const admin=role==='Administrator',readonly=role==='Read-only';
 checks.forEach(c=>{c.disabled=admin||readonly;if(admin||readonly)c.checked=false;});
 $('canSendBulkEmail').disabled=admin;
 if(admin)$('canSendBulkEmail').checked=true;
 if(readonly)$('canSendBulkEmail').checked=false;
 $('categoryPermissionHint').textContent=admin?'Administrators have all category permissions by role; category checkboxes are not individually assigned.':readonly?'Read-only users cannot upload; upload categories are disabled.':'Select one or more categories this Researcher is allowed to upload.';
}
function resetForm(){
 $('userForm').reset();$('userRecordId').value='';$('userFullName').classList.remove('is-invalid');$('userEmail').classList.remove('is-invalid');$('userRole').classList.remove('is-invalid');
 $('userRole').value='Researcher';$('userStatus').value='Active';$('userLastUpdatedBy').value='Soheb Siddique';setCategories([]);applyRoleRules();
}
function openAdd(){
 editingId=null;resetForm();$('userFormTitle').textContent='Add user';$('saveUserButton').innerHTML='<i class="bi bi-check2-circle me-1"></i>Save user';formModal.show();
}
function openEdit(u){
 editingId=u.id;resetForm();
 $('userRecordId').value=u.id;$('userFullName').value=u.name;$('userEmail').value=u.email;$('userEmployeeId').value=u.employeeId||'';$('userDepartment').value=u.department||'';$('userPhone').value=u.phone||'';
 $('userRole').value=u.role;$('userStatus').value=u.status;$('userLastUpdatedBy').value='Soheb Siddique';$('canSendBulkEmail').checked=u.bulkEmail;$('canDownloadFiles').checked=u.download;$('userAdminNotes').value=u.notes||'';
 applyRoleRules();if(u.role==='Researcher')setCategories(u.categories);
 $('userFormTitle').textContent='Edit user & permissions';$('saveUserButton').innerHTML='<i class="bi bi-check2-circle me-1"></i>Save changes';formModal.show();
}
function showDetails(u){
 detailsId=u.id;$('userDetailsTitle').textContent=u.name;$('userDetailsSubtitle').textContent=`${u.employeeId||u.id} · ${u.email} · ${u.status}`;
 const categoryHtml=u.role==='Administrator'?'<span class="permission-tag all">All categories (Administrator)</span>':u.categories.length?u.categories.map(c=>`<span class="permission-tag">${esc(c)}</span>`).join(' '):'<span class="text-secondary small">No upload categories assigned</span>';
 $('userDetailsBody').innerHTML=`<div class="row g-2 mb-3">
 <div class="col-sm-6"><div class="permission-box"><div class="small text-secondary mb-1">Role</div><span class="role-pill ${roleClass(u.role)}">${esc(u.role)}</span></div></div>
 <div class="col-sm-6"><div class="permission-box"><div class="small text-secondary mb-1">Account status</div><span class="status-pill ${statusClass(u.status)}">${esc(u.status)}</span></div></div>
 <div class="col-sm-6"><div class="permission-box"><div class="small text-secondary mb-1">Department / assignment</div><strong class="small">${esc(u.department||'Not specified')}</strong></div></div>
 <div class="col-sm-6"><div class="permission-box"><div class="small text-secondary mb-1">Employee ID / reference</div><strong class="small">${esc(u.employeeId||'Not specified')}</strong></div></div>
 <div class="col-12"><div class="permission-box"><div class="title">Upload categories</div>${categoryHtml}</div></div>
 <div class="col-sm-6"><div class="permission-box"><div class="title">Bulk email campaigns</div><div class="desc">${u.bulkEmail?'Authorized in sample permission model':'Not authorized'}</div></div></div>
 <div class="col-sm-6"><div class="permission-box"><div class="title">File downloads</div><div class="desc">${u.download?'Allowed in sample permission model':'Disabled in sample permission model'}</div></div></div>
 <div class="col-sm-6"><div class="permission-box"><div class="title">Last updated</div><div class="desc">${esc(u.updated)} by ${esc(u.updatedBy||'Not recorded')}</div></div></div>
 <div class="col-12"><div class="permission-box"><div class="title">Admin notes</div><div class="desc">${esc(u.notes||'No notes')}</div></div></div></div>
 <div class="alert alert-warning small mb-0"><i class="bi bi-shield-lock me-1"></i>In production, this summary must reflect permissions enforced by the Laravel backend, not only client-side state.</div>`;
}
function requestStatusChange(u,status){
 $('userConfirmTitle').textContent=status==='Inactive'?'Deactivate account?':'Reactivate account?';
 $('userConfirmText').textContent=status==='Inactive'?`Deactivate ${u.name}'s account? Existing file ownership and audit history should be retained.`:`Reactivate ${u.name}'s account? Verify the user's assignment before restoring access.`;
 $('confirmUserAction').className=status==='Inactive'?'btn btn-danger':'btn btn-primary';
 $('confirmUserAction').innerHTML=status==='Inactive'?'<i class="bi bi-person-x me-1"></i>Deactivate':'<i class="bi bi-person-check me-1"></i>Reactivate';
 pendingAction=()=>{u.status=status;u.updated=new Date().toISOString().slice(0,10);u.updatedBy='Soheb Siddique';selected.delete(u.id);renderTable();toast(status==='Inactive'?'User deactivated in this page session.':'User reactivated in this page session.');};
 confirmModal.show();
}
function exportCsv(list,filename='mr-user-management.csv'){
 const headers=['User ID','Full name','Email','Employee ID','Department','Phone','Role','Status','Upload categories','Bulk email authorized','File downloads allowed','Last updated','Updated by','Admin notes'];
 const rows=list.map(u=>[u.id,u.name,u.email,u.employeeId,u.department,u.phone,u.role,u.status,u.role==='Administrator'?'All categories':u.categories.join('; '),u.bulkEmail?'Yes':'No',u.download?'Yes':'No',u.updated,u.updatedBy,u.notes]);
 const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
 const csv=[headers,...rows].map(row=>row.map(q).join(',')).join('\r\n');
 const blob=new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 toast(`Exported ${list.length} sample user record(s) to CSV.`);
}
$('addUserButton').addEventListener('click',openAdd);
$('userRole').addEventListener('change',applyRoleRules);
$('userForm').addEventListener('submit',event=>{
 event.preventDefault();
 const name=$('userFullName').value.trim(),email=$('userEmail').value.trim(),role=$('userRole').value;
 const nameOK=!!name,emailOK=!!email&&$('userEmail').checkValidity(),roleOK=!!role;
 $('userFullName').classList.toggle('is-invalid',!nameOK);$('userEmail').classList.toggle('is-invalid',!emailOK);$('userRole').classList.toggle('is-invalid',!roleOK);
 if(!nameOK||!emailOK||!roleOK){toast('Complete the required user fields before saving.');return;}
 const duplicate=users.find(u=>u.email.toLowerCase()===email.toLowerCase()&&u.id!==editingId);
 if(duplicate){$('userEmail').classList.add('is-invalid');$('userEmail').nextElementSibling.textContent='This email address is already used by another sample account.';toast('A user with this email already exists.');return;}
 let cats=selectedCategories();
 if(role==='Administrator')cats=[...categories];
 if(role==='Read-only')cats=[];
 const data={name,email,employeeId:$('userEmployeeId').value.trim(),department:$('userDepartment').value.trim(),phone:$('userPhone').value.trim(),role,status:$('userStatus').value,categories:cats,bulkEmail:role==='Administrator'?true:(role==='Read-only'?false:$('canSendBulkEmail').checked),download:$('canDownloadFiles').checked,updated:new Date().toISOString().slice(0,10),updatedBy:$('userLastUpdatedBy').value.trim()||'Administrator',notes:$('userAdminNotes').value.trim()};
 if(editingId){const u=users.find(x=>x.id===editingId);Object.assign(u,data);toast('User and permissions updated in this page session.');}
 else{data.id=`usr-${String(nextId++).padStart(3,'0')}`;users.push(data);toast('User added in this page session. No real login was created.');}
 selected.clear();formModal.hide();renderTable();
});
$('usersTableBody').addEventListener('click',event=>{
 const button=event.target.closest('[data-action]');if(!button)return;
 const u=users.find(x=>x.id===button.closest('tr')?.dataset.userId);if(!u)return;
 if(button.dataset.action==='view'){showDetails(u);detailsModal.show();}
 if(button.dataset.action==='edit')openEdit(u);
 if(button.dataset.action==='deactivate')requestStatusChange(u,'Inactive');
 if(button.dataset.action==='activate')requestStatusChange(u,'Active');
});
$('usersTableBody').addEventListener('change',event=>{
 const box=event.target.closest('.row-check');if(!box)return;
 box.checked?selected.add(box.dataset.selectId):selected.delete(box.dataset.selectId);renderTable();
});
$('selectAllUsers').addEventListener('change',()=>{
 filteredUsers().forEach(u=>$('selectAllUsers').checked?selected.add(u.id):selected.delete(u.id));renderTable();
});
['userSearch','roleFilter','userStatusFilter','emailPermissionFilter','uploadPermissionFilter','showInactiveToggle'].forEach(id=>{
 $(id).addEventListener('input',renderTable);$(id).addEventListener('change',renderTable);
});
$('globalSearch').addEventListener('input',()=>{$('userSearch').value=$('globalSearch').value;renderTable();});
$('userSearch').addEventListener('input',()=>{if($('globalSearch').value!==$('userSearch').value)$('globalSearch').value=$('userSearch').value;});
$('resetUserFilters').addEventListener('click',()=>{
 $('userSearch').value='';$('globalSearch').value='';$('roleFilter').value='';$('userStatusFilter').value='';$('emailPermissionFilter').value='';$('uploadPermissionFilter').value='';$('showInactiveToggle').checked=false;selected.clear();renderTable();toast('User filters reset.');
});
$('clearUserSelection').addEventListener('click',()=>{selected.clear();renderTable();});
$('exportUsersButton').addEventListener('click',()=>exportCsv(filteredUsers()));
$('exportSelectedUsers').addEventListener('click',()=>exportCsv(users.filter(u=>selected.has(u.id)),'mr-user-selected-records.csv'));
$('deactivateSelectedUsers').addEventListener('click',()=>{
 const active=users.filter(u=>selected.has(u.id)&&u.status==='Active');
 if(!active.length){toast('No active selected users to deactivate.');return;}
 $('userConfirmTitle').textContent='Deactivate selected users?';
 $('userConfirmText').textContent=`Deactivate ${active.length} selected active account(s)? Their sample records and upload ownership remain in the directory.`;
 $('confirmUserAction').className='btn btn-danger';$('confirmUserAction').innerHTML='<i class="bi bi-person-x me-1"></i>Deactivate selected';
 pendingAction=()=>{active.forEach(u=>{u.status='Inactive';u.updated=new Date().toISOString().slice(0,10);u.updatedBy='Soheb Siddique';});selected.clear();renderTable();toast(`Deactivated ${active.length} sample account(s) in this page session.`);};confirmModal.show();
});
$('confirmUserAction').addEventListener('click',()=>{if(pendingAction)pendingAction();pendingAction=null;confirmModal.hide();});
$('editFromDetailsButton').addEventListener('click',()=>{
 const u=users.find(x=>x.id===detailsId);if(!u)return;
 detailsModal.hide();
 detailsModal._element.addEventListener('hidden.bs.modal',function handler(){detailsModal._element.removeEventListener('hidden.bs.modal',handler);openEdit(u);});
});
$('userFormModal').addEventListener('hidden.bs.modal',()=>{editingId=null;});
renderTable();
})();