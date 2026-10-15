(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const sectorOptions = ['Cotton','MMF','Silk','Wool','Handloom','Apparel','Technical Textiles','Processing','Jute'];
  let nextId = 100;
  let editingId = null;
  let detailsId = null;
  let confirmAction = null;
  const selected = new Set();
  const records = [
    {id:'ind-001',name:'Western India Cotton Association',type:'Association',website:'https://example.org/wica',registration:'DEMO-ASSOC-001',products:'Cotton, yarn and textile market research',sectors:['Cotton'],address:'Sample Market Road',state:'Maharashtra',district:'Mumbai City',city:'Mumbai',pin:'400001',status:'Active',contacts:[{name:'Anita Mehta',designation:'Research Coordinator',mobile:'+91 90000 10001',landline:'',email:'anita.mehta@example.org',alternate:''},{name:'Rahul Shah',designation:'Member Relations',mobile:'+91 90000 10002',landline:'',email:'rahul.shah@example.org',alternate:''}],lastVerified:'2026-10-02',verifiedBy:'MR Division Demo',source:'Illustrative sample record',notes:'Sample only; replace with verified directory data.',archived:false},
    {id:'ind-002',name:'Sambalpur Handloom Cooperative',type:'Cluster / Cooperative',website:'',registration:'DEMO-COOP-002',products:'Sambalpuri Bandha handloom textiles',sectors:['Handloom','Cotton'],address:'Sample Weavers Colony',state:'Odisha',district:'Sambalpur',city:'Sambalpur',pin:'768001',status:'Active',contacts:[{name:'Bikash Pradhan',designation:'Cooperative Secretary',mobile:'+91 90000 20001',landline:'',email:'bikash.pradhan@example.org',alternate:''}],lastVerified:'2026-09-28',verifiedBy:'MR Division Demo',source:'Illustrative sample record',notes:'Sample only; verify contact and GI-related information independently.',archived:false},
    {id:'ind-003',name:'Gujarat Synthetic Textile Works',type:'Manufacturer',website:'https://example.org/gstw',registration:'DEMO-MFG-003',products:'Polyester yarn and woven fabric',sectors:['MMF','Processing'],address:'Industrial Estate, Sample Block',state:'Gujarat',district:'Surat',city:'Surat',pin:'395001',status:'Under Verification',contacts:[{name:'Nilesh Patel',designation:'Commercial Manager',mobile:'+91 90000 30001',landline:'',email:'nilesh.patel@example.org',alternate:''},{name:'Priya Desai',designation:'Compliance Officer',mobile:'',landline:'0261-0000000',email:'priya.desai@example.org',alternate:''}],lastVerified:'',verifiedBy:'',source:'Illustrative sample record',notes:'Sample record awaiting verification.',archived:false},
    {id:'ind-004',name:'Tamil Nadu Knitwear Export Forum',type:'Exporter',website:'',registration:'DEMO-EXP-004',products:'Knitwear and apparel export',sectors:['Apparel','Cotton'],address:'Sample Export Complex',state:'Tamil Nadu',district:'Tiruppur',city:'Tiruppur',pin:'641601',status:'Active',contacts:[{name:'Kavitha Raman',designation:'Export Documentation Lead',mobile:'+91 90000 40001',landline:'',email:'kavitha.raman@example.org',alternate:''}],lastVerified:'2026-09-20',verifiedBy:'MR Division Demo',source:'Illustrative sample record',notes:'Sample only.',archived:false},
    {id:'ind-005',name:'Eastern Silk Research Centre',type:'Research / Institution',website:'https://example.org/esrc',registration:'DEMO-RC-005',products:'Silk fibre and processing research',sectors:['Silk','Processing'],address:'Sample Research Campus',state:'West Bengal',district:'Murshidabad',city:'Berhampore',pin:'742101',status:'Inactive',contacts:[{name:'Dr. S. Banerjee',designation:'Research Officer',mobile:'+91 90000 50001',landline:'',email:'s.banerjee@example.org',alternate:''}],lastVerified:'2026-07-15',verifiedBy:'MR Division Demo',source:'Illustrative sample record',notes:'Sample record marked inactive for interface testing.',archived:false},
    {id:'ind-006',name:'Maharashtra Technical Fabric Labs',type:'Manufacturer',website:'',registration:'DEMO-TECH-006',products:'Industrial fabrics and technical textiles',sectors:['Technical Textiles','MMF'],address:'Sample Technology Park',state:'Maharashtra',district:'Pune',city:'Pune',pin:'411001',status:'Under Verification',contacts:[{name:'A. Kulkarni',designation:'Business Development',mobile:'+91 90000 60001',landline:'',email:'a.kulkarni@example.org',alternate:''}],lastVerified:'',verifiedBy:'',source:'Illustrative sample record',notes:'Sample only.',archived:false},
    {id:'ind-007',name:'North India Wool Traders',type:'Exporter',website:'',registration:'DEMO-WOOL-007',products:'Wool, yarn and woollen fabric',sectors:['Wool'],address:'Sample Trading House',state:'Uttar Pradesh',district:'Kanpur Nagar',city:'Kanpur',pin:'208001',status:'Active',contacts:[{name:'Imran Siddiqui',designation:'Director',mobile:'+91 90000 70001',landline:'',email:'imran.siddiqui@example.org',alternate:''}],lastVerified:'2026-09-12',verifiedBy:'MR Division Demo',source:'Illustrative sample record',notes:'Sample only.',archived:true}
  ];

  const formModal = bootstrap.Modal.getOrCreateInstance($('industryFormModal'));
  const detailsModal = bootstrap.Modal.getOrCreateInstance($('industryDetailsModal'));
  const confirmModal = bootstrap.Modal.getOrCreateInstance($('directoryConfirmModal'));

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function toast(message) {
    $('demoToastBody').textContent = message;
    bootstrap.Toast.getOrCreateInstance($('demoToast'), {delay: 3800}).show();
  }
  function normalize(value) { return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,''); }
  function statusClass(status) {
    if (status === 'Active') return 'status-active';
    if (status === 'Under Verification') return 'status-pending';
    return 'status-inactive';
  }
  function recordStatus(r) { return r.archived ? 'Archived' : r.status; }
  function allVisibleRecords() { return filteredRecords(); }
  function filteredRecords() {
    const q = $('directorySearch').value.trim().toLowerCase();
    const sector = $('sectorFilter').value;
    const state = $('stateFilter').value;
    const type = $('typeFilter').value;
    const status = $('statusFilter').value;
    const showArchived = $('showArchivedToggle').checked;
    return records.filter(r => {
      if (r.archived && !showArchived) return false;
      if (sector && !r.sectors.includes(sector)) return false;
      if (state && r.state !== state) return false;
      if (type && r.type !== type) return false;
      if (status && recordStatus(r) !== status) return false;
      const contactText = r.contacts.map(c => [c.name,c.designation,c.mobile,c.landline,c.email,c.alternate].join(' ')).join(' ');
      const haystack = [r.name,r.type,r.website,r.registration,r.products,r.sectors.join(' '),r.address,r.state,r.district,r.city,r.pin,r.status,r.source,r.notes,r.verifiedBy,contactText].join(' ').toLowerCase();
      return !q || haystack.includes(q);
    }).sort((a,b) => a.name.localeCompare(b.name));
  }
  function statUpdate() {
    $('statOrganizations').textContent = records.filter(r=>!r.archived).length;
    $('statActive').textContent = records.filter(r=>!r.archived && r.status==='Active').length;
    $('statVerification').textContent = records.filter(r=>!r.archived && r.status==='Under Verification').length;
    $('statContacts').textContent = records.filter(r=>!r.archived).reduce((sum,r)=>sum+r.contacts.length,0);
  }
  function updateBulk() {
    $('industrySelectedCount').textContent = selected.size;
    $('industryBulkBar').classList.toggle('visible', selected.size > 0);
  }
  function actionButton(action, icon, label, extra='') {
    return `<button type="button" class="action-btn ${extra}" data-action="${action}" aria-label="${esc(label)}" title="${esc(label)}"><i class="bi bi-${icon}"></i></button>`;
  }
  function renderTable() {
    const list = filteredRecords();
    const body = $('industryTableBody');
    body.innerHTML = '';
    list.forEach(r => {
      const tr = document.createElement('tr');
      tr.dataset.recordId = r.id;
      const sectors = r.sectors.slice(0,2).map(s=>`<span class="sector-tag">${esc(s)}</span>`).join('') + (r.sectors.length>2?`<span class="sector-more">+${r.sectors.length-2}</span>`:'');
      const location = [r.city,r.state].filter(Boolean).join(', ') || 'Not specified';
      tr.innerHTML = `
        <td class="ps-4"><input class="form-check-input record-check row-check" type="checkbox" data-select-id="${esc(r.id)}" aria-label="Select ${esc(r.name)}" ${selected.has(r.id)?'checked':''}></td>
        <td><div class="org-name">${esc(r.name)}${r.archived?' <span class="badge text-bg-secondary ms-1">Archived</span>':''}</div><div class="org-sub">${esc(r.type)}${r.products?' · '+esc(r.products):''}</div></td>
        <td style="min-width:150px">${sectors || '<span class="text-secondary small">Not assigned</span>'}</td>
        <td class="text-nowrap"><div class="fw-semibold small">${esc(location)}</div><div class="org-sub">${r.pin?'PIN '+esc(r.pin):''}${r.district?' · '+esc(r.district):''}</div></td>
        <td><span class="contact-count"><i class="bi bi-people"></i>${r.contacts.length} ${r.contacts.length===1?'contact':'contacts'}</span></td>
        <td class="text-nowrap small">${r.lastVerified?esc(r.lastVerified):'<span class="text-warning">Not verified</span>'}</td>
        <td><span class="status-pill ${r.archived?'status-inactive':statusClass(r.status)}">${esc(recordStatus(r))}</span></td>
        <td class="pe-4"><div class="action-buttons">${actionButton('view','eye','View organization')}${actionButton('edit','pencil-square','Edit organization')}${r.archived?actionButton('restore','arrow-counterclockwise','Restore record'):actionButton('archive','archive','Archive record','danger')}</div></td>`;
      body.appendChild(tr);
    });
    $('emptyDirectory').classList.toggle('d-none', list.length>0);
    $('industryTable').classList.toggle('d-none', list.length===0);
    $('directoryCount').textContent = `Showing ${list.length} of ${records.filter(r=>$('showArchivedToggle').checked||!r.archived).length} visible organization records`;
    $('selectAllIndustries').checked = list.length>0 && list.every(r=>selected.has(r.id));
    $('selectAllIndustries').indeterminate = list.some(r=>selected.has(r.id)) && !$('selectAllIndustries').checked;
    updateBulk();
    statUpdate();
  }
  function appendContact(contact={}) {
    const container = $('contactsContainer');
    const card = document.createElement('div');
    card.className = 'contact-card mb-3';
    card.innerHTML = `
      <div class="d-flex align-items-center justify-content-between mb-3"><strong class="small contact-heading">Contact person</strong><button type="button" class="btn btn-sm btn-light border remove-contact"><i class="bi bi-trash3 me-1"></i>Remove</button></div>
      <div class="row g-2">
       <div class="col-md-4"><label class="form-label">Full name *</label><input class="form-control contact-name" maxlength="120" value="${esc(contact.name||'')}" placeholder="Contact name" required></div>
       <div class="col-md-4"><label class="form-label">Designation</label><input class="form-control contact-designation" maxlength="120" value="${esc(contact.designation||'')}" placeholder="Designation"></div>
       <div class="col-md-4"><label class="form-label">Email</label><input class="form-control contact-email" type="email" maxlength="180" value="${esc(contact.email||'')}" placeholder="name@example.org"></div>
       <div class="col-md-4"><label class="form-label">Mobile</label><input class="form-control contact-mobile" maxlength="40" value="${esc(contact.mobile||'')}" placeholder="+91 ..."></div>
       <div class="col-md-4"><label class="form-label">Landline</label><input class="form-control contact-landline" maxlength="40" value="${esc(contact.landline||'')}" placeholder="Optional"></div>
       <div class="col-md-4"><label class="form-label">Alternate contact</label><input class="form-control contact-alternate" maxlength="120" value="${esc(contact.alternate||'')}" placeholder="Optional"></div>
      </div>`;
    card.querySelector('.remove-contact').addEventListener('click', () => {
      if ($('contactsContainer').querySelectorAll('.contact-card').length <= 1) {
        toast('At least one contact card must remain. You can clear its fields if needed.');
        return;
      }
      card.remove();
      updateContactHeadings();
    });
    container.appendChild(card);
    updateContactHeadings();
  }
  function updateContactHeadings() {
    [...$('contactsContainer').querySelectorAll('.contact-card')].forEach((card,i) => {
      card.querySelector('.contact-heading').textContent = `Contact person ${i+1}`;
    });
  }
  function getContacts() {
    return [...$('contactsContainer').querySelectorAll('.contact-card')].map(card => ({
      name: card.querySelector('.contact-name').value.trim(),
      designation: card.querySelector('.contact-designation').value.trim(),
      email: card.querySelector('.contact-email').value.trim(),
      mobile: card.querySelector('.contact-mobile').value.trim(),
      landline: card.querySelector('.contact-landline').value.trim(),
      alternate: card.querySelector('.contact-alternate').value.trim()
    })).filter(c=>c.name || c.email || c.mobile || c.landline || c.designation || c.alternate);
  }
  function resetForm() {
    $('industryForm').reset();
    $('industryRecordId').value = '';
    $('contactsContainer').innerHTML = '';
    appendContact();
    $('duplicateWarning').classList.add('d-none');
    $('sectorError').classList.add('d-none');
    $('contactError').classList.add('d-none');
    $('orgName').classList.remove('is-invalid');
    $('orgType').classList.remove('is-invalid');
    document.querySelectorAll('input[name="orgSectors"]').forEach(c=>c.checked=false);
  }
  function openAddForm() {
    editingId = null;
    resetForm();
    $('industryFormTitle').textContent = 'Add industry';
    $('saveIndustryButton').innerHTML = '<i class="bi bi-check2-circle me-1"></i>Save organization';
    formModal.show();
  }
  function openEditForm(record) {
    editingId = record.id;
    resetForm();
    $('industryRecordId').value = record.id;
    $('orgName').value = record.name;
    $('orgType').value = record.type;
    $('orgWebsite').value = record.website || '';
    $('orgRegistration').value = record.registration || '';
    $('orgProducts').value = record.products || '';
    $('orgStatus').value = record.status;
    ['address','state','district','city','pin','source','verifiedBy','notes'].forEach(key=>{
      const map = {address:'orgAddress',state:'orgState',district:'orgDistrict',city:'orgCity',pin:'orgPin',source:'orgSource',verifiedBy:'orgVerifiedBy',notes:'orgNotes'};
      $(map[key]).value = record[key] || '';
    });
    document.querySelectorAll('input[name="orgSectors"]').forEach(c=>c.checked=record.sectors.includes(c.value));
    $('contactsContainer').innerHTML = '';
    record.contacts.forEach(c=>appendContact(c));
    $('industryFormTitle').textContent = 'Edit industry';
    $('saveIndustryButton').innerHTML = '<i class="bi bi-check2-circle me-1"></i>Save changes';
    formModal.show();
  }
  function duplicateMatches(candidate, ignoredId) {
    const name = normalize(candidate.name);
    const website = normalize(candidate.website);
    const registration = normalize(candidate.registration);
    return records.filter(r => r.id !== ignoredId && !r.archived).filter(r => {
      const sameName = name && normalize(r.name) === name;
      const sameWebsite = website && normalize(r.website) === website;
      const sameReg = registration && normalize(r.registration) === registration;
      return sameName || sameReg || (sameWebsite && website.length > 4);
    });
  }
  function showDetails(record) {
    detailsId = record.id;
    $('industryDetailsTitle').textContent = record.name;
    $('industryDetailsSubtitle').textContent = `${record.type} · ${record.id} · ${recordStatus(record)}`;
    const sectorHTML = record.sectors.map(s=>`<span class="sector-tag">${esc(s)}</span>`).join(' ');
    const website = record.website ? `<a href="${esc(record.website)}" target="_blank" rel="noopener noreferrer">${esc(record.website)}</a>` : 'Not provided';
    const contacts = record.contacts.length ? record.contacts.map((c,i)=>`
      <div class="contact-detail"><div class="d-flex align-items-start gap-3"><div class="contact-avatar">${esc((c.name||'?').split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase())}</div><div class="flex-grow-1"><div class="fw-bold small">${esc(c.name)}</div><div class="small text-secondary">${esc(c.designation||'Designation not provided')}</div><div class="row g-2 mt-1"><div class="col-md-6 small">${c.email?`<i class="bi bi-envelope me-2 text-primary"></i><a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:'<span class="text-secondary">Email not provided</span>'}</div><div class="col-md-6 small">${c.mobile?`<i class="bi bi-phone me-2 text-primary"></i>${esc(c.mobile)}`:'<span class="text-secondary">Mobile not provided</span>'}</div><div class="col-md-6 small">${c.landline?`<i class="bi bi-telephone me-2 text-primary"></i>${esc(c.landline)}`:''}</div><div class="col-md-6 small">${c.alternate?`<i class="bi bi-person-lines-fill me-2 text-primary"></i>${esc(c.alternate)}`:''}</div></div></div></div></div>`).join('') : '<div class="small text-secondary">No contact persons recorded.</div>';
    const address = [record.address,record.city,record.district,record.state,record.pin].filter(Boolean).join(', ') || 'Not provided';
    $('industryDetailsBody').innerHTML = `
      <div class="row g-2 mb-4">
       <div class="col-md-4"><div class="detail-cell"><div class="detail-label">Sector(s)</div><div class="detail-value fw-normal">${sectorHTML||'Not assigned'}</div></div></div>
       <div class="col-md-4"><div class="detail-cell"><div class="detail-label">Products / business focus</div><div class="detail-value fw-normal">${esc(record.products||'Not provided')}</div></div></div>
       <div class="col-md-4"><div class="detail-cell"><div class="detail-label">Website</div><div class="detail-value fw-normal">${website}</div></div></div>
       <div class="col-md-6"><div class="detail-cell"><div class="detail-label">Address</div><div class="detail-value fw-normal">${esc(address)}</div></div></div>
       <div class="col-md-3"><div class="detail-cell"><div class="detail-label">Registration / membership</div><div class="detail-value">${esc(record.registration||'Not provided')}</div></div></div>
       <div class="col-md-3"><div class="detail-cell"><div class="detail-label">Last verified</div><div class="detail-value">${esc(record.lastVerified||'Not verified')}</div></div></div>
       <div class="col-md-6"><div class="detail-cell"><div class="detail-label">Verified by</div><div class="detail-value">${esc(record.verifiedBy||'Not provided')}</div></div></div>
       <div class="col-md-6"><div class="detail-cell"><div class="detail-label">Source / reference</div><div class="detail-value fw-normal">${esc(record.source||'Not provided')}</div></div></div>
       <div class="col-12"><div class="detail-cell"><div class="detail-label">Internal notes</div><div class="detail-value fw-normal">${esc(record.notes||'No notes')}</div></div></div>
      </div>
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2"><h3 class="h6 fw-bold mb-0">Contact persons (${record.contacts.length})</h3><span class="small text-secondary">Organization → Multiple Contacts</span></div>${contacts}`;
    detailsModal.show();
  }

  $('addIndustryButton').addEventListener('click', openAddForm);
  $('addContactButton').addEventListener('click', () => appendContact());
  $('industryForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('orgName').value.trim();
    const type = $('orgType').value;
    const sectors = [...document.querySelectorAll('input[name="orgSectors"]:checked')].map(c=>c.value);
    const contacts = getContacts();
    const nameOK = !!name, typeOK = !!type, sectorsOK = sectors.length>0;
    $('orgName').classList.toggle('is-invalid', !nameOK);
    $('orgType').classList.toggle('is-invalid', !typeOK);
    $('sectorError').classList.toggle('d-none', sectorsOK);
    const contactsOK = contacts.length>0 && contacts.some(c=>c.name && (c.email || c.mobile || c.landline));
    $('contactError').classList.toggle('d-none', contactsOK);
    if (!nameOK || !typeOK || !sectorsOK || !contactsOK) {
      toast('Please complete required fields, choose a sector and provide at least one usable contact.');
      return;
    }
    if ($('orgWebsite').value.trim() && !$('orgWebsite').checkValidity()) {
      $('orgWebsite').reportValidity();
      return;
    }
    const candidate = {name,website:$('orgWebsite').value.trim(),registration:$('orgRegistration').value.trim()};
    const duplicates = duplicateMatches(candidate, editingId);
    if (duplicates.length) {
      $('duplicateWarningText').textContent = `Possible duplicate: ${duplicates.map(r=>r.name).join(', ')}. Review the existing profile before saving another record.`;
      $('duplicateWarning').classList.remove('d-none');
      toast('Possible duplicate detected. Review the warning before saving.');
      // Let the user intentionally proceed after review; second click is not required.
      if (!event.submitter || event.submitter.dataset.confirmDuplicate !== 'true') {
        $('saveIndustryButton').dataset.confirmDuplicate = 'true';
        $('saveIndustryButton').innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Save anyway after review';
        return;
      }
    } else {
      $('duplicateWarning').classList.add('d-none');
      delete $('saveIndustryButton').dataset.confirmDuplicate;
    }

    const data = {
      name,type,website:candidate.website,registration:candidate.registration,products:$('orgProducts').value.trim(),sectors,
      address:$('orgAddress').value.trim(),state:$('orgState').value,district:$('orgDistrict').value.trim(),city:$('orgCity').value.trim(),pin:$('orgPin').value.trim(),
      status:$('orgStatus').value,contacts,lastVerified:$('orgStatus').value==='Active' ? new Date().toISOString().slice(0,10) : '',
      verifiedBy:$('orgVerifiedBy').value.trim(),source:$('orgSource').value.trim(),notes:$('orgNotes').value.trim(),archived:false
    };
    if (editingId) {
      const existing = records.find(r=>r.id===editingId);
      Object.assign(existing,data);
      toast('Organization record updated in this page session only.');
    } else {
      data.id = `ind-${String(nextId++).padStart(3,'0')}`;
      records.push(data);
      toast('Organization added to this page session only.');
    }
    editingId=null;
    selected.clear();
    formModal.hide();
    renderTable();
  });

  function requestArchive(record) {
    const restore = record.archived;
    $('directoryConfirmTitle').textContent = restore ? 'Restore organization?' : 'Archive organization?';
    $('directoryConfirmMessage').textContent = restore ? `Restore "${record.name}" to the active directory list?` : `Archive "${record.name}" from the active directory list?`;
    $('directoryConfirmHelp').textContent = 'This change affects the sample data in this page session only. No permanent database change occurs.';
    $('directoryConfirmButton').className = restore ? 'btn btn-primary' : 'btn btn-danger';
    $('directoryConfirmButton').innerHTML = restore ? '<i class="bi bi-arrow-counterclockwise me-1"></i>Restore' : '<i class="bi bi-archive me-1"></i>Archive';
    confirmAction = () => {
      record.archived=!record.archived;
      selected.delete(record.id);
      renderTable();
      toast(record.archived ? 'Organization archived in this page session.' : 'Organization restored in this page session.');
    };
    confirmModal.show();
  }

  $('industryTableBody').addEventListener('click', event => {
    const button=event.target.closest('[data-action]');
    if(!button)return;
    const record=records.find(r=>r.id===button.closest('tr')?.dataset.recordId);
    if(!record)return;
    switch(button.dataset.action) {
      case 'view': showDetails(record); break;
      case 'edit': openEditForm(record); break;
      case 'archive':
      case 'restore': requestArchive(record); break;
    }
  });
  $('industryTableBody').addEventListener('change', event => {
    const checkbox=event.target.closest('.row-check');
    if(!checkbox)return;
    checkbox.checked?selected.add(checkbox.dataset.selectId):selected.delete(checkbox.dataset.selectId);
    renderTable();
  });
  $('selectAllIndustries').addEventListener('change', () => {
    filteredRecords().forEach(r=>$('selectAllIndustries').checked?selected.add(r.id):selected.delete(r.id));
    renderTable();
  });
  ['directorySearch','sectorFilter','stateFilter','typeFilter','statusFilter','showArchivedToggle'].forEach(id => {
    $(id).addEventListener('input',renderTable);
    $(id).addEventListener('change',renderTable);
  });
  $('globalSearch').addEventListener('input',() => {
    $('directorySearch').value=$('globalSearch').value;
    renderTable();
  });
  $('directorySearch').addEventListener('input',() => {
    if($('globalSearch').value!==$('directorySearch').value)$('globalSearch').value=$('directorySearch').value;
  });
  $('resetDirectoryFilters').addEventListener('click',()=>{
    $('directorySearch').value='';$('globalSearch').value='';$('sectorFilter').value='';$('stateFilter').value='';$('typeFilter').value='';$('statusFilter').value='';$('showArchivedToggle').checked=false;
    selected.clear();renderTable();toast('Directory filters reset.');
  });
  $('clearIndustrySelection').addEventListener('click',()=>{selected.clear();renderTable();});
  $('exportDirectoryButton').addEventListener('click',()=>exportCSV(filteredRecords(),'mr-industry-directory.csv'));
  $('exportSelectedIndustries').addEventListener('click',()=>exportCSV(records.filter(r=>selected.has(r.id)),'mr-industry-selected-records.csv'));
  $('archiveSelectedIndustries').addEventListener('click',()=>{
    const active=records.filter(r=>selected.has(r.id)&&!r.archived);
    if(!active.length){toast('No active selected organizations to archive.');return;}
    active.forEach(r=>r.archived=true);selected.clear();renderTable();toast(`Archived ${active.length} sample organization(s) in this page session.`);
  });
  $('directoryConfirmButton').addEventListener('click',()=>{if(confirmAction)confirmAction();confirmAction=null;confirmModal.hide();});
  $('editFromDetailsButton').addEventListener('click',()=>{
    const record=records.find(r=>r.id===detailsId);
    if(!record)return;
    detailsModal.hide();
    detailsModal._element.addEventListener('hidden.bs.modal',function handler(){
      detailsModal._element.removeEventListener('hidden.bs.modal',handler);
      openEditForm(record);
    });
  });
  $('industryDetailsBody').addEventListener('click',event=>{
    const link=event.target.closest('a[href^="mailto:"]');
    if(link){event.preventDefault();toast('Email communication is not wired in the demo. No email was sent.');}
  });
  $('contactsContainer').addEventListener('input',event=>{
    if(event.target.classList.contains('contact-name')||event.target.classList.contains('contact-email')||event.target.classList.contains('contact-mobile')||event.target.classList.contains('contact-landline')){
      $('contactError').classList.add('d-none');
    }
  });
  $('industryFormModal').addEventListener('hidden.bs.modal',()=>{
    editingId=null;
    delete $('saveIndustryButton').dataset.confirmDuplicate;
  });

  function exportCSV(list, filename) {
    const headers=['Record ID','Organization name','Organization type','Website','Registration ID','Products','Sectors','Address','State','District','City','PIN','Status','Archived','Contact count','Contacts','Last verified','Verified by','Source','Internal notes'];
    const values=list.map(r=>[
      r.id,r.name,r.type,r.website,r.registration,r.products,r.sectors.join('; '),r.address,r.state,r.district,r.city,r.pin,recordStatus(r),r.archived?'Yes':'No',r.contacts.length,
      r.contacts.map(c=>[c.name,c.designation,c.email,c.mobile,c.landline,c.alternate].filter(Boolean).join(' | ')).join(' || '),r.lastVerified,r.verifiedBy,r.source,r.notes
    ]);
    const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
    const csv=[headers,...values].map(row=>row.map(q).join(',')).join('\r\n');
    const blob=new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    toast(`Exported ${list.length} sample organization record(s) to CSV. No emails were sent.`);
  }

  renderTable();
})();