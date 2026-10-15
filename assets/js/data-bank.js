(() => {
  'use strict';

  let records = [
    {id:'f125',fileId:'MRD-EXP-2026-000125',name:'Cotton Production Survey.xlsx',category:'Cotton',type:'XLSX',sizeBytes:2516582,date:'2026-10-13',uploader:'R. Sharma',status:'Verified',source:'Market Research Division',description:'Consolidated cotton production survey workbook with state and season-level data.',keywords:'cotton production survey statistics crop season',versions:[{version:'v1.0',date:'2026-10-13',user:'R. Sharma',note:'Current verified version',size:'2.4 MB'},{version:'v0.9',date:'2026-10-12',user:'R. Sharma',note:'Corrected state totals before verification',size:'2.3 MB'}]},
    {id:'f124',fileId:'MRD-EXP-2026-000124',name:'Monthly Export Summary.pdf',category:'International Trade',type:'PDF',sizeBytes:1153433,date:'2026-10-12',uploader:'A. Khan',status:'Under review',source:'DGCI&S / Internal compilation',description:'Monthly summary of textile and apparel export trends and selected HS chapters.',keywords:'monthly export trade apparel textiles',versions:[{version:'v1.0',date:'2026-10-12',user:'A. Khan',note:'Submitted for review',size:'1.1 MB'},{version:'v0.8',date:'2026-10-11',user:'A. Khan',note:'Updated charts and country grouping',size:'1.0 MB'}]},
    {id:'f123',fileId:'MRD-EXP-2026-000123',name:'Handloom Cluster Directory.csv',category:'Handloom & Handicrafts',type:'CSV',sizeBytes:700416,date:'2026-10-11',uploader:'S. Patel',status:'Verified',source:'Internal research compilation',description:'Sample directory of handloom clusters for locating relevant research records.',keywords:'handloom cluster district state directory',versions:[{version:'v1.0',date:'2026-10-11',user:'S. Patel',note:'Current verified version',size:'684 KB'}]},
    {id:'f122',fileId:'MRD-EXP-2026-000122',name:'Silk Industry Briefing.docx',category:'Research & Reports',type:'DOCX',sizeBytes:421888,date:'2026-10-10',uploader:'M. Das',status:'Draft',source:'Central Silk Board / Internal compilation',description:'Draft background note on silk industry structure and major value-chain stages.',keywords:'silk industry briefing research',versions:[{version:'v0.7',date:'2026-10-10',user:'M. Das',note:'Draft saved for further edits',size:'412 KB'},{version:'v0.5',date:'2026-10-08',user:'M. Das',note:'Initial draft',size:'398 KB'}]},
    {id:'f121',fileId:'MRD-EXP-2026-000121',name:'Wool Sector Quarterly Note.pdf',category:'Wool',type:'PDF',sizeBytes:1887436,date:'2026-10-08',uploader:'R. Sharma',status:'Verified',source:'Central Wool Development Board / Internal',description:'Quarterly summary note for wool-sector research and market monitoring.',keywords:'wool quarterly report sector',versions:[{version:'v1.0',date:'2026-10-08',user:'R. Sharma',note:'Published to the pilot data bank',size:'1.8 MB'},{version:'v0.9',date:'2026-10-07',user:'R. Sharma',note:'Final review copy',size:'1.7 MB'}]},
    {id:'f120',fileId:'MRD-EXP-2026-000120',name:'Apparel Trade Brief.xlsx',category:'International Trade',type:'XLSX',sizeBytes:958464,date:'2026-10-06',uploader:'A. Khan',status:'Under review',source:'Internal research compilation',description:'Working spreadsheet for apparel trade indicators and selected partner markets.',keywords:'apparel trade exports imports spreadsheet',versions:[{version:'v1.0',date:'2026-10-06',user:'A. Khan',note:'Submitted for review',size:'936 KB'}]},
    {id:'f119',fileId:'MRD-EXP-2026-000119',name:'Technical Textiles Market Note.pdf',category:'Research & Reports',type:'PDF',sizeBytes:1474560,date:'2026-10-03',uploader:'M. Das',status:'Verified',source:'Internal research compilation',description:'Background market note on selected technical textile segments and applications.',keywords:'technical textiles market note',versions:[{version:'v1.0',date:'2026-10-03',user:'M. Das',note:'Verified final',size:'1.4 MB'}]},
    {id:'f118',fileId:'MRD-EXP-2026-000118',name:'Apparel Unit Survey Image.jpg',category:'Apparel',type:'JPG',sizeBytes:524288,date:'2026-09-28',uploader:'S. Patel',status:'Draft',source:'Field survey sample',description:'Illustrative sample image record from an apparel unit survey.',keywords:'apparel unit survey image sample',versions:[{version:'v1.0',date:'2026-09-28',user:'S. Patel',note:'Initial upload',size:'512 KB'}]},
    {id:'f117',fileId:'MRD-EXP-2026-000117',name:'Handloom Survey Backup.xlsx',category:'Handloom & Handicrafts',type:'XLSX',sizeBytes:1232076,date:'2026-09-24',uploader:'R. Sharma',status:'Verified',source:'Market Research Division',description:'Sample backup workbook for handloom-sector survey records.',keywords:'handloom survey backup workbook',versions:[{version:'v1.0',date:'2026-09-24',user:'R. Sharma',note:'Current version',size:'1.2 MB'}],archived:true}
  ];
  const sampleRecords = records.map(record => ({...record, versions: (record.versions || []).map(version => ({...version}))}));

  const el = id => document.getElementById(id);
  const tableBody = el('filesTableBody');
  const table = el('filesTable');
  const searchInput = el('fileTableSearch');
  const categoryFilter = el('categoryFilter');
  const typeFilter = el('typeFilter');
  const statusFilter = el('statusFilter');
  const showArchived = el('showArchived');
  const sortOrder = el('sortOrder');
  const selectAll = el('selectAllRows');
  const bulkBar = el('bulkBar');
  const selectedCount = el('selectedCount');
  const recordCount = el('recordCount');
  const emptyTable = el('emptyTable');
  let activeSort = {key:'date', dir:'desc'};
  let pendingArchiveId = null;
  const selected = new Set();
  let allCategories = window.MRCategoryCatalogue?.getAll() || [];
  let selectedMainCategory = null;
  const initialMainParam = new URLSearchParams(window.location.search).get('main');

  const fileCategoryOverview = el('fileCategoryOverview');
  const fileRecordsSection = el('fileRecordsSection');
  const categoryCardsGrid = el('categoryCardsGrid');
  const categoryCardSearch = el('categoryCardSearch');
  const categoryOverviewEmpty = el('categoryOverviewEmpty');

  const previewModal = bootstrap.Modal.getOrCreateInstance(el('filePreviewModal'));
  const versionModal = bootstrap.Modal.getOrCreateInstance(el('versionHistoryModal'));
  const archiveModal = bootstrap.Modal.getOrCreateInstance(el('archiveModal'));

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function formatSize(bytes) {
    if (!bytes) return '0 B';
    const units=['B','KB','MB','GB'];
    const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1);
    return `${(bytes/1024**i).toFixed(i===0?0:1)} ${units[i]}`;
  }
  function formatDate(iso) {
    const date = new Date(`${iso}T12:00:00`);
    return date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  }
  function typeClass(type) {
    if (type === 'XLSX') return 'type-xlsx';
    if (type === 'CSV') return 'type-csv';
    if (type === 'DOCX') return 'type-docx';
    return '';
  }
  function statusClass(status) {
    if (status === 'Verified') return 'status-success';
    if (status === 'Under review') return 'status-review';
    return 'status-muted';
  }
  function toast(message) {
    const body = el('demoToastBody'), element = el('demoToast');
    if (body) body.textContent = message;
    if (element) bootstrap.Toast.getOrCreateInstance(element,{delay:3800}).show();
  }


  function refreshCategoryCache() {
    allCategories = window.MRCategoryCatalogue?.getAll() || allCategories || [];
    return allCategories;
  }

  function findCategoryByName(name) {
    const key = String(name || '').trim().toLowerCase();
    return allCategories.find(item => String(item.name || '').trim().toLowerCase() === key) || null;
  }

  function findRootForCategory(category) {
    if (!category) return null;
    let current = category;
    const visited = new Set();
    while (current?.parentId) {
      if (visited.has(Number(current.id))) break;
      visited.add(Number(current.id));
      const parent = allCategories.find(item => Number(item.id) === Number(current.parentId));
      if (!parent) break;
      current = parent;
    }
    return current || null;
  }

  function normalizeCategoryRecord(record) {
    const aliases = {
      'handloom': 'Handloom & Handicrafts',
      'mmf': 'Man-made Fibre (MMF)'
    };
    const rawCategory = String(record.category || '').trim();
    const categoryName = aliases[rawCategory.toLowerCase()] || rawCategory;
    const direct = findCategoryByName(categoryName);
    let root = null;
    if (record.mainCategory) {
      root = allCategories.find(item => !item.parentId &&
        (String(item.name).toLowerCase() === String(record.mainCategory).toLowerCase() ||
         String(item.code).toLowerCase() === String(record.mainCategory).toLowerCase())) || null;
    }
    if (!root) root = findRootForCategory(direct);
    if (!root && /fibre|fiber/i.test(categoryName)) root = allCategories.find(item => item.code === 'FIBER') || null;
    const normalizedName = direct?.name || categoryName;
    const subCategory = record.subCategory || (direct?.parentId ? direct.name : '');
    return {
      ...record,
      category: normalizedName,
      categoryId: record.categoryId ?? direct?.id ?? null,
      categoryCode: record.categoryCode || direct?.code || '',
      mainCategory: root?.name || record.mainCategory || normalizedName,
      mainCategoryId: record.mainCategoryId ?? root?.id ?? null,
      subCategory
    };
  }

  function rootForRecord(record) {
    if (record.mainCategory) {
      const root = allCategories.find(item => !item.parentId &&
        String(item.name).toLowerCase() === String(record.mainCategory).toLowerCase());
      if (root) return root;
    }
    return findRootForCategory(findCategoryByName(record.category)) ||
      allCategories.find(item => !item.parentId && item.name === record.category) || null;
  }

  function categoryPath(record) {
    const root = rootForRecord(record);
    const direct = findCategoryByName(record.category);
    const leafName = direct?.name || record.category || '';
    if (root && leafName && leafName !== root.name) return `${root.name} / ${leafName}`;
    return leafName || root?.name || 'Unclassified';
  }

  function isCategoryApprovalPending(record) {
    const item = findCategoryByName(record?.category);
    return item ? item.status === 'pending' : record?.categoryApprovalStatus === 'pending';
  }

  function recordBelongsToRoot(record, root) {
    if (!root) return true;
    const recordRoot = rootForRecord(record);
    return Boolean(recordRoot && Number(recordRoot.id) === Number(root.id));
  }

  function getRootCategories() {
    refreshCategoryCache();
    return allCategories.filter(item => !item.parentId && item.status === 'active')
      .sort((a,b) => a.code === 'FIBER' ? -1 : b.code === 'FIBER' ? 1 : Number(a.id)-Number(b.id));
  }

  function renderCategoryCards() {
    refreshCategoryCache();
    const query = (categoryCardSearch?.value || '').trim().toLowerCase();
    const roots = getRootCategories();
    const filtered = roots.filter(root => {
      const children = allCategories.filter(item => Number(item.parentId) === Number(root.id) && ['active','pending'].includes(item.status));
      const haystack = `${root.name} ${root.code} ${root.description || ''} ${children.map(item=>item.name).join(' ')}`.toLowerCase();
      return !query || haystack.includes(query);
    });
    categoryCardsGrid.innerHTML = filtered.map(root => {
      const children = allCategories.filter(item => Number(item.parentId) === Number(root.id) && ['active','pending'].includes(item.status))
        .sort((a,b)=>a.name.localeCompare(b.name));
      const count = records.filter(record => recordBelongsToRoot(record,root) && !record.archived).length;
      const icon = /^[a-z0-9-]+$/i.test(root.icon || '') ? root.icon : 'folder2';
      const chips = children.length
        ? `<div class="file-category-subcats">${children.slice(0,4).map(item=>`<span class="file-category-chip">${esc(item.name)}${item.status==='pending'?' · Pending':''}</span>`).join('')}${children.length>4?`<span class="file-category-chip">+${children.length-4}</span>`:''}</div>`
        : `<div class="file-category-subcats"><span class="file-category-chip">Main category</span></div>`;
      return `<div class="col-12 col-md-6 col-xl-4 category-card-col">
        <button type="button" class="file-category-card" data-main-code="${esc(root.code)}" aria-label="View all ${esc(root.name)} files">
          <div class="file-category-card-top"><span class="file-category-icon"><i class="bi bi-${icon}"></i></span><div><div class="file-category-title">${esc(root.name)}</div><p class="file-category-description">${esc(root.description || 'Browse files classified under this category.')}</p></div></div>
          <div class="file-category-count"><strong>${count.toLocaleString('en-IN')}</strong><span>${count===1?'file':'files'} · including sub-categories</span></div>
          <div class="file-category-footer">${chips}<span class="file-category-open">View files <i class="bi bi-arrow-right-short"></i></span></div>
        </button>
      </div>`;
    }).join('');
    categoryOverviewEmpty.classList.toggle('d-none', filtered.length > 0);
    el('categoryOverviewSummary').textContent = `${filtered.length} of ${roots.length} main categories · File counts include records filed under child categories.`;
  }

  function populateSubcategoryFilter(root) {
    const previous = categoryFilter.value;
    const children = allCategories.filter(item => Number(item.parentId) === Number(root.id))
      .sort((a,b)=>a.name.localeCompare(b.name));
    const options = [new Option(`All ${root.name} files`, '')];
    children.forEach(item => {
      const suffix = item.status === 'pending' ? ' (Pending approval)' : item.status === 'rejected' ? ' (Rejected)' : item.status === 'inactive' ? ' (Inactive)' : '';
      options.push(new Option(`${item.name}${suffix}`, item.name));
    });
    categoryFilter.replaceChildren(...options);
    if (children.some(item => item.name === previous)) categoryFilter.value = previous;
  }

  function showCategoryFiles(root, updateUrl=true) {
    if (!root || root.parentId) return;
    selectedMainCategory = root;
    fileCategoryOverview.classList.add('d-none');
    fileRecordsSection.classList.remove('d-none');
    el('pageTitle').textContent = `${root.name} Files`;
    el('pageSubtitle').textContent = `View, search and manage all ${root.name} files, including files saved under its sub-categories.`;
    el('selectedCategoryBreadcrumb').textContent = root.name;
    el('selectedCategoryHeading').textContent = `${root.name} Files`;
    el('selectedCategoryDescription').textContent = `All files assigned to ${root.name} and its sub-categories. Use search and filters to narrow the list.`;
    populateSubcategoryFilter(root);
    searchInput.value = '';
    el('globalSearch').value = '';
    typeFilter.value = '';
    statusFilter.value = '';
    showArchived.checked = false;
    if (el('fromDateFilter')) el('fromDateFilter').value = '';
    if (el('toDateFilter')) el('toDateFilter').value = '';
    sortOrder.value = 'date-desc';
    activeSort = {key:'date',dir:'desc'};
    selected.clear();
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.search = '';
      url.searchParams.set('main', root.code);
      window.history.pushState({}, '', url);
    }
    renderRows();
  }

  function showCategoryOverview(updateUrl=true) {
    selectedMainCategory = null;
    fileRecordsSection.classList.add('d-none');
    fileCategoryOverview.classList.remove('d-none');
    el('pageTitle').textContent = 'File Data';
    el('pageSubtitle').textContent = 'Browse uploaded research files by main category. Select a category to view and filter its files.';
    renderCategoryCards();
    if (updateUrl) window.history.pushState({}, '', window.location.pathname);
  }
  function showUploadedToast() {
    const params = new URLSearchParams(window.location.search);
    const uploadedId = params.get('uploaded');
    if (!uploadedId) return;
    const record = records.find(item => item.id === uploadedId);
    const count = Number(params.get('count')) || 1;
    if (record) {
      searchInput.value = '';
      categoryFilter.value = '';
      typeFilter.value = '';
      statusFilter.value = '';
      showArchived.checked = false;
      activeSort = {key:'date', dir:'desc'};
      sortOrder.value = 'date-desc';
      renderRows();
      toast(`${count} file(s) saved successfully. ${record.name} is now in File Data.`);
    } else {
      toast(`${count} file(s) saved to this browser. Refresh the file list if needed.`);
    }
    window.history.replaceState({}, document.title, selectedMainCategory ? `${window.location.pathname}?main=${encodeURIComponent(selectedMainCategory.code)}` : window.location.pathname);
  }

  async function persistUploadedRecord(record) {
    if (!record?.isUpload || !window.MRFileRepository) return;
    try {
      await window.MRFileRepository.updateRecord(record);
    } catch (error) {
      console.warn('Could not persist this record change in browser storage.', error);
      toast('The view was updated, but the browser could not save that change.');
    }
  }

  async function loadSavedUploads() {
    refreshCategoryCache();
    try {
      const saved = await window.MRFileRepository?.listRecords() || [];
      const seen = new Set(sampleRecords.map(record => record.id));
      const uploads = saved.filter(record => record && record.id && !seen.has(record.id))
        .map(record => normalizeCategoryRecord({
          ...record,
          isUpload:true,
          archived:Boolean(record.archived),
          versions:Array.isArray(record.versions)&&record.versions.length ? record.versions : [{
            version:'v1.0',date:record.date,user:record.uploader||'MR Division User',
            note:'Browser-saved upload',size:formatSize(Number(record.sizeBytes)||0)
          }]
        }));
      records = [...uploads,...sampleRecords.map(record=>normalizeCategoryRecord(record))];
    } catch (error) {
      console.warn('Saved browser uploads could not be loaded.',error);
      records = sampleRecords.map(record=>normalizeCategoryRecord(record));
      toast('Saved browser uploads could not be loaded. Check browser storage permissions.');
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || 'download';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }

  async function downloadRecord(record) {
    if (!record?.isUpload || !window.MRFileRepository) {
      toast(`“${record?.name || 'This sample file'}” is illustrative and has no original file attached.`);
      return;
    }
    try {
      const blob = await window.MRFileRepository.getFileBlob(record.id);
      if (!blob) {
        toast(`Original file data for “${record.name}” was not found in browser storage.`);
        return;
      }
      downloadBlob(blob, record.name);
      toast(`Download prepared for ${record.name}.`);
    } catch (error) {
      console.error('File download failed.', error);
      toast('The original file could not be retrieved from browser storage.');
    }
  }

  function filteredRecords() {
    const q = searchInput.value.trim().toLowerCase();
    const cat = categoryFilter.value;
    const type = typeFilter.value;
    const status = statusFilter.value;
    const fromDate = el('fromDateFilter')?.value || '';
    const toDate = el('toDateFilter')?.value || '';
    let list = records.filter(r => {
      if (selectedMainCategory && !recordBelongsToRoot(r, selectedMainCategory)) return false;
      if (r.archived && !showArchived.checked) return false;
      if (cat && r.category !== cat && r.subCategory !== cat) return false;
      if (fromDate && String(r.date || '') < fromDate) return false;
      if (toDate && String(r.date || '') > toDate) return false;
      if (type && r.type !== type) return false;
      if (status && r.status !== status && !(status === 'Archived' && r.archived)) return false;
      if (status === 'Archived' && !r.archived) return false;
      if (status && status !== 'Archived' && r.archived) return false;
      if (q) {
        const haystack = [r.name,r.fileId,r.category,r.mainCategory,r.subCategory,r.type,r.uploader,r.status,r.source,r.description,r.keywords].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    const key = activeSort.key, dir = activeSort.dir === 'asc' ? 1 : -1;
    list.sort((a,b) => {
      let av=a[key], bv=b[key];
      if (key === 'date') { av = Date.parse(a.date); bv = Date.parse(b.date); }
      if (key === 'sizeBytes') { av = a.sizeBytes; bv = b.sizeBytes; }
      if (typeof av === 'string') return av.localeCompare(bv,undefined,{sensitivity:'base'}) * dir;
      return (av-bv) * dir;
    });
    return list;
  }

  function actionButton(action, icon, label, extra='') {
    return `<button type="button" class="action-btn ${extra}" data-action="${action}" aria-label="${esc(label)}" title="${esc(label)}"><i class="bi bi-${icon}"></i></button>`;
  }

  function renderRows() {
    const list = filteredRecords();
    tableBody.innerHTML = '';
    list.forEach(r => {
      const tr = document.createElement('tr');
      tr.dataset.recordId = r.id;
      const archiveAction = r.archived
        ? actionButton('restore','arrow-counterclockwise','Restore record')
        : actionButton('archive','archive','Archive record','danger');
      tr.innerHTML = `
        <td class="ps-4"><input class="form-check-input record-check row-check" type="checkbox" data-select-id="${esc(r.id)}" aria-label="Select ${esc(r.name)}" ${selected.has(r.id)?'checked':''}></td>
        <td><div class="d-flex align-items-center gap-3 file-record"><div class="file-type ${typeClass(r.type)}">${esc(r.type)}</div><div class="min-w-0"><div class="file-name">${esc(r.name)}${r.archived?' <span class="badge text-bg-secondary ms-1">Archived</span>':''}</div><div class="file-meta">${esc(r.source)}</div></div></div></td>
        <td class="text-nowrap"><span class="fw-semibold">${esc(r.fileId)}</span></td>
        <td><div>${esc(categoryPath(r))}</div>${isCategoryApprovalPending(r)?'<span class="badge text-bg-warning mt-1">Category pending approval</span>':''}</td>
        <td class="text-nowrap"><div class="fw-semibold">${esc(r.type)}</div><div class="file-meta">${formatSize(r.sizeBytes)}</div></td>
        <td class="text-nowrap">${formatDate(r.date)}</td>
        <td class="text-nowrap">${esc(r.uploader)}</td>
        <td><span class="status-pill ${r.archived?'status-muted':statusClass(r.status)}">${esc(r.archived?'Archived':r.status)}</span></td>
        <td class="pe-4"><div class="action-buttons">${actionButton('preview','eye','Preview details')}${actionButton('versions','clock-history','Version history')}${actionButton('download','download','Download file')}${archiveAction}</div></td>`;
      tableBody.appendChild(tr);
    });
    emptyTable.classList.toggle('d-none', list.length > 0);
    table.classList.toggle('d-none', list.length === 0);
    const scopedCount = records.filter(r => (!selectedMainCategory || recordBelongsToRoot(r, selectedMainCategory)) && (showArchived.checked || !r.archived)).length;
    recordCount.textContent = `Showing ${list.length} of ${scopedCount} visible ${selectedMainCategory ? `${selectedMainCategory.name} ` : ''}records`;
    selectAll.checked = list.length > 0 && list.every(r=>selected.has(r.id));
    selectAll.indeterminate = list.some(r=>selected.has(r.id)) && !selectAll.checked;
    updateBulkBar();
  }

  function updateBulkBar() {
    selectedCount.textContent = selected.size;
    bulkBar.classList.toggle('visible', selected.size > 0);
  }

  function renderPreview(r) {
    el('filePreviewTitle').textContent = r.name;
    el('filePreviewSubtitle').textContent = `${r.fileId} · Metadata preview`;
    const icon = r.type === 'PDF' ? 'file-earmark-pdf' : ['XLSX','CSV'].includes(r.type) ? 'file-earmark-spreadsheet' : ['DOCX'].includes(r.type) ? 'file-earmark-word' : 'file-earmark-image';
    el('filePreviewBody').innerHTML = `
      ${isCategoryApprovalPending(r) ? '<div class="alert alert-warning small py-2"><i class="bi bi-clock-history me-1"></i>This file is tagged to a sub-category awaiting admin approval.</div>' : ''}
      <div class="d-flex gap-3 align-items-center mb-4"><div class="file-detail-icon"><i class="bi bi-${icon} fs-3"></i></div><div><div class="h6 fw-bold mb-1">${esc(r.name)}</div><div class="small text-secondary">${esc(r.type)} · ${formatSize(r.sizeBytes)} · Updated ${formatDate(r.date)}</div><div class="mt-2"><span class="status-pill ${r.archived?'status-muted':statusClass(r.status)}">${esc(r.archived?'Archived':r.status)}</span></div></div></div>
      <div class="preview-placeholder mb-3" id="originalFilePreview"><div><i class="bi bi-file-earmark-text"></i><strong class="d-block text-dark mb-1">Metadata preview</strong><span class="small">${r.isUpload ? "Loading original-file preview…" : "The original file is not attached to this illustrative sample record."}</span></div></div>
      <div class="row g-2">
        <div class="col-sm-6"><div class="detail-cell"><div class="detail-label">File ID</div><div class="detail-value">${esc(r.fileId)}</div></div></div>
        <div class="col-sm-6"><div class="detail-cell"><div class="detail-label">Category</div><div class="detail-value">${esc(categoryPath(r))}</div></div></div>
        <div class="col-sm-6"><div class="detail-cell"><div class="detail-label">Uploaded by</div><div class="detail-value">${esc(r.uploader)}</div></div></div>
        <div class="col-sm-6"><div class="detail-cell"><div class="detail-label">Last updated</div><div class="detail-value">${formatDate(r.date)}</div></div></div>
        <div class="col-sm-6"><div class="detail-cell"><div class="detail-label">Source</div><div class="detail-value">${esc(r.source)}</div></div></div>
        <div class="col-sm-6"><div class="detail-cell"><div class="detail-label">Versions recorded</div><div class="detail-value">${r.versions.length}</div></div></div>
        <div class="col-12"><div class="detail-cell"><div class="detail-label">Description</div><div class="detail-value fw-normal">${esc(r.description)}</div></div></div>
        <div class="col-12"><div class="detail-cell"><div class="detail-label">Search keywords</div><div class="detail-value fw-normal">${esc(r.keywords)}</div></div></div>
      </div>`;
    el('previewDownloadButton').dataset.recordId = r.id;
    previewModal.show();

    const previewHost = el('originalFilePreview');
    if (!previewHost) return;
    if (!r.isUpload || !window.MRFileRepository) {
      previewHost.innerHTML = '<div><i class="bi bi-file-earmark-text"></i><strong class="d-block text-dark mb-1">Sample metadata preview</strong><span class="small">This is an illustrative record; no original file is attached.</span></div>';
      return;
    }

    window.MRFileRepository.getFileBlob(r.id).then(blob => {
      // The user may have opened another record before this async read finished.
      if (!previewHost.isConnected || el('previewDownloadButton').dataset.recordId !== r.id) return;
      if (!blob) {
        previewHost.innerHTML = '<div><i class="bi bi-exclamation-circle"></i><strong class="d-block text-dark mb-1">Original file unavailable</strong><span class="small">Try the Download action or check browser storage.</span></div>';
        return;
      }
      const mime = blob.type || r.mimeType || '';
      if (mime.startsWith('image/')) {
        const url = URL.createObjectURL(blob);
        previewHost.innerHTML = `<div class="w-100 text-center"><img src="${url}" alt="${esc(r.name)}" style="max-width:100%;max-height:360px;object-fit:contain;border-radius:8px"><div class="small text-secondary mt-2">${esc(r.name)} · original image stored in this browser</div></div>`;
      } else if (mime === 'application/pdf' || /\.pdf$/i.test(r.name)) {
        const url = URL.createObjectURL(blob);
        previewHost.innerHTML = `<div class="w-100"><iframe title="Preview ${esc(r.name)}" src="${url}" style="width:100%;height:360px;border:0;border-radius:8px;background:#fff"></iframe><div class="small text-secondary mt-2">${esc(r.name)} · PDF preview in browser</div></div>`;
      } else {
        previewHost.innerHTML = `<div><i class="bi bi-file-earmark-check"></i><strong class="d-block text-dark mb-1">Original file saved</strong><span class="small">${esc(r.name)} is stored in this browser. Use <strong>Download file</strong> to open it in the appropriate application.</span></div>`;
      }
    }).catch(error => {
      console.warn('Could not render original-file preview.', error);
      if (previewHost.isConnected) {
        previewHost.innerHTML = '<div><i class="bi bi-exclamation-circle"></i><strong class="d-block text-dark mb-1">Preview unavailable</strong><span class="small">Use Download file to retrieve the original file.</span></div>';
      }
    });
  }

  function renderVersions(r) {
    el('versionHistoryTitle').textContent = 'Version history';
    el('versionHistorySubtitle').textContent = `${r.name} · ${r.fileId}`;
    el('versionHistoryBody').innerHTML = r.versions.map((v, index) => `
      <div class="version-item"><div class="version-dot"><i class="bi bi-clock-history"></i></div><div class="flex-grow-1"><div class="d-flex flex-wrap align-items-center gap-2 mb-1"><strong class="small">${esc(v.version)}</strong>${index===0?'<span class="version-tag">Current sample version</span>':''}</div><div class="small">${esc(v.note)}</div><div class="text-secondary mt-1" style="font-size:11px">${formatDate(v.date)} · ${esc(v.user)} · ${esc(v.size)}</div></div><button class="btn btn-sm btn-light border" data-version-demo="${esc(v.version)}" type="button">Details</button></div>`).join('');
    versionModal.show();
  }

  function beginArchive(r) {
    pendingArchiveId = r.id;
    const isRestore = !!r.archived;
    el('archiveModalTitle').textContent = isRestore ? 'Restore record?' : 'Archive record?';
    el('archiveModalText').textContent = isRestore
      ? `Restore “${r.name}” from the archived sample records?`
      : `Archive “${r.name}” from the active sample records?`;
    el('confirmArchiveButton').className = isRestore ? 'btn btn-primary' : 'btn btn-danger';
    el('confirmArchiveButton').innerHTML = isRestore ? '<i class="bi bi-arrow-counterclockwise me-1"></i>Restore' : '<i class="bi bi-archive me-1"></i>Archive';
    archiveModal.show();
  }

  function exportCsv(list, filename='mr-data-bank-records.csv') {
    const headers = ['File ID','File name','Category','Type','Size bytes','Last updated','Uploaded by','Status','Archived','Source','Description','Keywords'];
    const rows = list.map(r => [r.fileId,r.name,r.category,r.type,r.sizeBytes,r.date,r.uploader,r.status,r.archived?'Yes':'No',r.source,r.description,r.keywords]);
    const escapeCell = value => `"${String(value ?? '').replace(/"/g,'""')}"`;
    const csv = [headers,...rows].map(row => row.map(escapeCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast(`Exported ${list.length} metadata record(s) to CSV. CSV contains metadata, not original file contents.`);
  }

  tableBody.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const row = button.closest('tr');
    const r = records.find(item => item.id === row?.dataset.recordId);
    if (!r) return;
    const action = button.dataset.action;
    if (action === 'preview') renderPreview(r);
    else if (action === 'versions') renderVersions(r);
    else if (action === 'download') downloadRecord(r);
    else if (action === 'archive' || action === 'restore') beginArchive(r);
  });

  tableBody.addEventListener('change', event => {
    const checkbox = event.target.closest('.row-check');
    if (!checkbox) return;
    checkbox.checked ? selected.add(checkbox.dataset.selectId) : selected.delete(checkbox.dataset.selectId);
    updateBulkBar();
    const list = filteredRecords();
    selectAll.checked = list.length > 0 && list.every(r => selected.has(r.id));
    selectAll.indeterminate = list.some(r => selected.has(r.id)) && !selectAll.checked;
  });

  [searchInput,categoryFilter,typeFilter,statusFilter,showArchived,sortOrder,el('fromDateFilter'),el('toDateFilter')].filter(Boolean).forEach(node => {
    node.addEventListener('input',renderRows);
    node.addEventListener('change',renderRows);
  });

  el('globalSearch').addEventListener('input', () => {
    if (selectedMainCategory) {
      searchInput.value = el('globalSearch').value;
      renderRows();
    } else {
      categoryCardSearch.value = el('globalSearch').value;
      renderCategoryCards();
    }
  });
  searchInput.addEventListener('input', () => {
    if (el('globalSearch').value !== searchInput.value) el('globalSearch').value = searchInput.value;
  });
  categoryCardSearch.addEventListener('input', renderCategoryCards);
  categoryCardsGrid.addEventListener('click', event => {
    const card = event.target.closest('[data-main-code]');
    if (!card) return;
    refreshCategoryCache();
    const root = allCategories.find(item=>!item.parentId&&item.code===card.dataset.mainCode);
    if (root) showCategoryFiles(root,true);
  });
  el('backToCategoriesButton').addEventListener('click',()=>showCategoryOverview(true));
  window.addEventListener('popstate',()=>{
    const main = new URLSearchParams(window.location.search).get('main');
    if (main) {
      refreshCategoryCache();
      const root = allCategories.find(item=>!item.parentId&&(item.code===main||item.name===main));
      if (root) { showCategoryFiles(root,false); return; }
    }
    showCategoryOverview(false);
  });

  sortOrder.addEventListener('change', () => {
    const [key,dir] = sortOrder.value.split('-');
    activeSort = {key: key === 'size' ? 'sizeBytes' : key, dir};
    renderRows();
  });
  document.querySelectorAll('[data-sort]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.sort === 'name' ? 'name' : button.dataset.sort === 'fileId' ? 'fileId' : button.dataset.sort === 'category' ? 'category' : button.dataset.sort;
    if (activeSort.key === key) activeSort.dir = activeSort.dir === 'asc' ? 'desc' : 'asc';
    else activeSort = {key,dir:key==='date'?'desc':'asc'};
    if (key === 'name') sortOrder.value = activeSort.dir === 'asc' ? 'name-asc' : 'name-desc';
    else if (key === 'date') sortOrder.value = activeSort.dir === 'asc' ? 'date-asc' : 'date-desc';
    else if (key === 'sizeBytes') sortOrder.value = activeSort.dir === 'asc' ? 'size-asc' : 'size-desc';
    renderRows();
  }));

  selectAll.addEventListener('change', () => {
    const list = filteredRecords();
    list.forEach(r => selectAll.checked ? selected.add(r.id) : selected.delete(r.id));
    renderRows();
  });
  el('clearSelectionButton').addEventListener('click', () => { selected.clear(); renderRows(); });
  el('bulkExportButton').addEventListener('click', () => exportCsv(records.filter(r=>selected.has(r.id)),'mr-data-bank-selected-records.csv'));
  el('exportCsvButton').addEventListener('click', () => exportCsv(selectedMainCategory ? filteredRecords() : records.filter(r => showArchived.checked || !r.archived)));
  el('bulkArchiveButton').addEventListener('click', () => {
    const active = records.filter(r=>selected.has(r.id) && !r.archived);
    if (!active.length) { toast('No active selected records to archive.'); return; }
    active.forEach(r => {
      r.archived = true;
      persistUploadedRecord(r);
    });
    selected.clear();
    renderRows();
    toast(`Archived ${active.length} record(s). Uploaded records retain this status in this browser.`);
  });
  el('confirmArchiveButton').addEventListener('click', () => {
    const r = records.find(item=>item.id===pendingArchiveId);
    if (!r) return;
    r.archived = !r.archived;
    persistUploadedRecord(r);
    selected.delete(r.id);
    archiveModal.hide();
    renderRows();
    toast(r.archived ? 'Record archived. Uploaded records retain this status in this browser.' : 'Record restored. Uploaded records retain this status in this browser.');
  });
  el('resetFiltersButton').addEventListener('click', () => {
    searchInput.value=''; el('globalSearch').value=''; categoryCardSearch.value=''; categoryFilter.value=''; typeFilter.value=''; statusFilter.value=''; showArchived.checked=false; sortOrder.value='date-desc';
    if (el('fromDateFilter')) el('fromDateFilter').value='';
    if (el('toDateFilter')) el('toDateFilter').value='';
    activeSort={key:'date',dir:'desc'};
    selected.clear(); renderRows(); toast('Filters have been reset for this category.');
  });
  el('previewDownloadButton').addEventListener('click', () => {
    const r = records.find(item => item.id === el('previewDownloadButton').dataset.recordId);
    if (r) downloadRecord(r);
  });
  el('versionHistoryBody').addEventListener('click', event => {
    const btn = event.target.closest('[data-version-demo]');
    if(btn) toast(`Version ${btn.dataset.versionDemo} is sample metadata. Version retrieval will require the backend.`);
  });

  loadSavedUploads().then(() => {
    refreshCategoryCache();
    // Records created before the taxonomy update are mapped to the current root/sub-category structure.
    records = records.map(record => normalizeCategoryRecord(record));
    renderCategoryCards();

    const requestedMain = initialMainParam;
    if (requestedMain) {
      const root = allCategories.find(item=>!item.parentId&&(item.code===requestedMain||item.name===requestedMain));
      if (root) showCategoryFiles(root,false);
      else showCategoryOverview(false);
    } else {
      showCategoryOverview(false);
    }
    showUploadedToast();
  });
})();
