(() => {
  'use strict';

  const STORAGE_KEY = 'mrd-category-catalogue-v1';
  const SECTORS = [
    'Production', 'Domestic Market', 'International Trade', 'Fiber', 'Fibre & Material',
    'Handloom & Handicrafts', 'Research & Statistics', 'Quality & Certification',
    'Schemes & Policy', 'Industry Directory', 'Other'
  ];

  const seedCategories = [
    {id:1,code:'PROD',name:'Production',parentId:null,sector:'Production',description:'Production statistics, capacity, output and manufacturing trends.',icon:'bar-chart-line',status:'active',usageCount:246},
    {id:2,code:'COTTON',name:'Cotton',parentId:20,sector:'Fiber',description:'Cotton production, consumption, stocks and related research.',icon:'folder2',status:'active',usageCount:178},
    {id:3,code:'SILK',name:'Silk',parentId:20,sector:'Fiber',description:'Silk production, sericulture, processing and market information.',icon:'folder2',status:'active',usageCount:92},
    {id:4,code:'MMF',name:'Man-made Fibre (MMF)',parentId:20,sector:'Fiber',description:'MMF and filament yarn production, capacity and industry data.',icon:'folder2',status:'active',usageCount:81},
    {id:5,code:'TRADE',name:'International Trade',parentId:null,sector:'International Trade',description:'Export, import, trade policy and international market intelligence.',icon:'globe2',status:'active',usageCount:325},
    {id:6,code:'TRADE-EXP',name:'Exports',parentId:5,sector:'International Trade',description:'Textile and apparel export values, destinations and product segments.',icon:'globe2',status:'active',usageCount:211},
    {id:7,code:'TRADE-IMP',name:'Imports',parentId:5,sector:'International Trade',description:'Textile and apparel import values, origins and product segments.',icon:'globe2',status:'active',usageCount:114},
    {id:8,code:'HANDLOOM',name:'Handloom & Handicrafts',parentId:null,sector:'Handloom & Handicrafts',description:'Handloom clusters, artisans, products, schemes and market studies.',icon:'grid',status:'active',usageCount:198},
    {id:9,code:'BANDHA',name:'Sambalpuri Bandha',parentId:8,sector:'Handloom & Handicrafts',description:'Research and reference material concerning Sambalpuri Bandha textiles.',icon:'bookmark',status:'active',usageCount:42},
    {id:10,code:'QUALITY',name:'Quality & Certification',parentId:null,sector:'Quality & Certification',description:'Testing, standards, certification, marks and quality assurance.',icon:'shield-check',status:'active',usageCount:148},
    {id:11,code:'GI-MARKS',name:'GI / Textile Marks',parentId:10,sector:'Quality & Certification',description:'Geographical Indication and approved textile mark records.',icon:'shield-check',status:'active',usageCount:57},
    {id:12,code:'RESEARCH',name:'Research & Statistics',parentId:null,sector:'Research & Statistics',description:'Surveys, analytical reports, datasets, briefs and statistical publications.',icon:'file-earmark-text',status:'active',usageCount:302},
    {id:13,code:'MPR',name:'Monthly Purchase Returns',parentId:12,sector:'Research & Statistics',description:'MPR/DPR forms, consolidated returns and related analysis.',icon:'file-earmark-text',status:'active',usageCount:75},
    {id:14,code:'SCHEMES',name:'Schemes & Policy',parentId:null,sector:'Schemes & Policy',description:'Government schemes, policy notes, guidelines and implementation records.',icon:'bookmark',status:'active',usageCount:131},
    {id:15,code:'IHB',name:'India Handloom Brand',parentId:14,sector:'Schemes & Policy',description:'India Handloom Brand applications, evaluations and reference materials.',icon:'bookmark',status:'active',usageCount:64},
    {id:16,code:'LEGACY',name:'Legacy / To Review',parentId:null,sector:'Other',description:'Temporary classification for imported files awaiting review.',icon:'tags',status:'inactive',usageCount:0}
  ,
    {id:17,code:'WOOL',name:'Wool',parentId:20,sector:'Fiber',description:'Wool production, processing, fibre use and related market research.',icon:'folder2',status:'active',usageCount:0},
    {id:18,code:'APPAREL',name:'Apparel',parentId:null,sector:'Domestic Market',description:'Apparel industry, domestic market and value-chain research.',icon:'grid',status:'active',usageCount:0},
    {id:19,code:'RESEARCH-REPORTS',name:'Research & Reports',parentId:12,sector:'Research & Statistics',description:'Research reports, technical notes, sector briefs and analytical publications.',icon:'file-earmark-text',status:'active',usageCount:0},
    {id:20,code:'FIBER',name:'Fiber',parentId:null,sector:'Fiber',description:'Research files covering cotton, silk, man-made fibre and wool.',icon:'layers',status:'active',usageCount:0}
  ];

  const $ = (id) => document.getElementById(id);
  const tableBody = $('categoriesTableBody');
  const form = $('categoryForm');
  const modalElement = $('categoryModal');
  const categoryModal = window.bootstrap?.Modal.getOrCreateInstance(modalElement);
  let categories = loadCategories();

  function loadCategories() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.warn('Category catalogue could not be loaded from browser storage.', error);
    }
    return seedCategories.map(item => ({...item}));
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      notify('Could not save changes in this browser. Check local storage settings.');
      console.warn(error);
    }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[ch]));
  }

  function notify(message) {
    const body = $('demoToastBody');
    const toast = $('demoToast');
    if (body) body.textContent = message;
    if (toast && window.bootstrap?.Toast) bootstrap.Toast.getOrCreateInstance(toast, {delay:3200}).show();
    else window.alert(message);
  }

  function categoryById(id) {
    return categories.find(item => Number(item.id) === Number(id));
  }

  function parentName(item) {
    if (!item.parentId) return '— Top-level —';
    const parent = categoryById(item.parentId);
    return parent ? parent.name : '— Parent unavailable —';
  }

  function filteredCategories() {
    const query = ($('categorySearch').value || '').trim().toLowerCase();
    const status = $('categoryStatusFilter').value;
    const sector = $('categorySectorFilter').value;
    return categories.filter(item => {
      const searchable = `${item.name} ${item.code} ${item.description} ${item.sector} ${parentName(item)}`.toLowerCase();
      return (!query || searchable.includes(query))
        && (status === 'all' || item.status === status)
        && (sector === 'all' || item.sector === sector);
    }).sort((a,b) => {
      const parentCmp = Number(a.parentId || a.id) - Number(b.parentId || b.id);
      if (parentCmp) return parentCmp;
      if (!a.parentId && b.parentId) return -1;
      if (a.parentId && !b.parentId) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  function refreshSectorFilters() {
    const currentFilter = $('categorySectorFilter').value || 'all';
    const currentForm = $('categorySector').value;
    $('categorySectorFilter').innerHTML = '<option value="all">All research areas</option>' +
      SECTORS.map(sector => `<option value="${escapeHtml(sector)}">${escapeHtml(sector)}</option>`).join('');
    $('categorySectorFilter').value = SECTORS.includes(currentFilter) ? currentFilter : 'all';

    $('categorySector').innerHTML = '<option value="">Select research area</option>' +
      SECTORS.map(sector => `<option value="${escapeHtml(sector)}">${escapeHtml(sector)}</option>`).join('');
    if (SECTORS.includes(currentForm)) $('categorySector').value = currentForm;
  }

  function refreshParentOptions(selectedId = null) {
    const parentSelect = $('categoryParent');
    const current = parentSelect.value;
    const roots = categories.filter(item => !item.parentId && Number(item.id) !== Number(selectedId));
    parentSelect.innerHTML = '<option value="">None — top-level category</option>' +
      roots.map(item => `<option value="${Number(item.id)}">${escapeHtml(item.name)} (${escapeHtml(item.code)})</option>`).join('');
    if (current && roots.some(item => Number(item.id) === Number(current))) parentSelect.value = current;
  }

  function updateMetrics() {
    $('metricTotal').textContent = categories.length.toLocaleString('en-IN');
    $('metricActive').textContent = categories.filter(item => item.status === 'active').length.toLocaleString('en-IN');
    const pendingCount = categories.filter(item => item.status === 'pending').length;
    const notice = $('pendingCategoriesNotice');
    notice?.classList.toggle('d-none', pendingCount === 0);
    if ($('pendingCategoriesHeading')) $('pendingCategoriesHeading').textContent = `${pendingCount} pending category request${pendingCount === 1 ? '' : 's'} need review`;
    if ($('pendingCategoriesDescription')) $('pendingCategoriesDescription').textContent = pendingCount
      ? 'User-created sub-categories stay unavailable for general uploads until an admin approves them.'
      : 'No pending category requests.';
    $('metricParents').textContent = categories.filter(item => !item.parentId).length.toLocaleString('en-IN');
    const usage = categories.reduce((sum, item) => sum + (Number(item.usageCount) || 0), 0);
    $('metricUsage').textContent = usage.toLocaleString('en-IN');
  }

  function render() {
    const list = filteredCategories();
    if (!list.length) {
      tableBody.innerHTML = `<tr><td colspan="7" class="category-empty"><i class="bi bi-search"></i><strong>No categories found</strong><div class="small mt-1">Try changing your search or filters.</div></td></tr>`;
    } else {
      tableBody.innerHTML = list.map(item => {
        const hasUsage = Number(item.usageCount) > 0;
        const status = item.status || 'active';
        const isActive = status === 'active';
        const isPending = status === 'pending';
        const statusLabel = status === 'pending' ? 'Pending approval' : status === 'rejected' ? 'Rejected' : isActive ? 'Active' : 'Inactive';
        const statusClass = isPending ? 'is-pending' : status === 'rejected' ? 'is-rejected' : isActive ? 'is-active' : 'is-inactive';
        const icon = /^[a-z0-9-]+$/i.test(item.icon || '') ? item.icon : 'tags';
        const actions = isPending
          ? `<button class="category-action-btn category-request-action" type="button" data-action="approve" data-id="${Number(item.id)}" title="Approve category request"><i class="bi bi-check2-circle"></i>Approve</button>
             <button class="category-action-btn category-request-action" type="button" data-action="reject" data-id="${Number(item.id)}" title="Reject category request"><i class="bi bi-x-circle"></i>Reject</button>`
          : `<button class="category-action-btn" type="button" data-action="toggle" data-id="${Number(item.id)}" title="${isActive?'Deactivate':'Activate'} category" aria-label="${isActive?'Deactivate':'Activate'} ${escapeHtml(item.name)}"><i class="bi bi-${isActive?'pause-circle':'play-circle'}"></i></button>`;
        return `<tr data-searchable="${escapeHtml(`${item.name} ${item.code} ${item.description} ${item.sector} ${parentName(item)} ${statusLabel}`)}">
          <td><div class="category-name-wrap"><span class="category-icon-box"><i class="bi bi-${icon}"></i></span><div><div class="category-name">${escapeHtml(item.name)}</div><div class="category-description" title="${escapeHtml(item.description)}">${escapeHtml(item.description)}</div>${isPending ? `<div class="small text-warning-emphasis mt-1"><i class="bi bi-clock-history me-1"></i>Requested ${escapeHtml((item.requestedAt || '').slice(0,10) || 'recently')}</div>` : ''}</div></div></td>
          <td><span class="category-code">${escapeHtml(item.code)}</span></td>
          <td><span class="category-parent">${item.parentId ? '<i class="bi bi-arrow-return-right category-child-mark"></i>' : ''}${escapeHtml(parentName(item))}</span></td>
          <td>${escapeHtml(item.sector)}</td>
          <td><span class="category-usage">${(Number(item.usageCount)||0).toLocaleString('en-IN')}</span></td>
          <td><span class="category-status ${statusClass} category-status-label">${statusLabel}</span></td>
          <td><div class="category-actions">
            <button class="category-action-btn" type="button" data-action="edit" data-id="${Number(item.id)}" title="Edit category" aria-label="Edit ${escapeHtml(item.name)}"><i class="bi bi-pencil"></i></button>
            ${actions}
            <button class="category-action-btn" type="button" data-action="delete" data-id="${Number(item.id)}" title="${hasUsage?'Cannot delete: linked records exist':'Delete category'}" aria-label="Delete ${escapeHtml(item.name)}" ${hasUsage?'disabled':''}><i class="bi bi-trash3"></i></button>
          </div></td>
        </tr>`;
      }).join('');
    }
    $('categoryResultCount').textContent = `Showing ${list.length} of ${categories.length} categories`;
    updateMetrics();
  }

  function openNewCategory() {
    form.reset();
    form.classList.remove('was-validated');
    $('categoryId').value = '';
    $('categoryModalTitle').textContent = 'Add category';
    $('saveCategoryBtn').innerHTML = '<i class="bi bi-check2 me-1"></i>Save category';
    $('categoryUsageWarning').classList.add('d-none');
    $('descriptionCounter').textContent = '0 / 300';
    refreshSectorFilters();
    refreshParentOptions();
    $('categoryStatus').value = 'active';
    categoryModal?.show();
    setTimeout(() => $('categoryName').focus(), 200);
  }

  function openEditCategory(id) {
    const item = categoryById(id);
    if (!item) return;
    form.reset();
    form.classList.remove('was-validated');
    $('categoryId').value = item.id;
    $('categoryName').value = item.name;
    $('categoryCode').value = item.code;
    $('categoryDescription').value = item.description;
    $('categoryIcon').value = item.icon || 'tags';
    $('categoryStatus').value = item.status;
    $('categoryModalTitle').textContent = 'Edit category';
    $('saveCategoryBtn').innerHTML = '<i class="bi bi-check2 me-1"></i>Save changes';
    $('categoryUsageWarning').classList.toggle('d-none', !(Number(item.usageCount) > 0));
    $('descriptionCounter').textContent = `${item.description.length} / 300`;
    refreshSectorFilters();
    refreshParentOptions(item.id);
    $('categoryParent').value = item.parentId || '';
    $('categorySector').value = item.sector;
    categoryModal?.show();
    setTimeout(() => $('categoryName').focus(), 200);
  }

  function saveCategory(event) {
    event.preventDefault();
    const codeField = $('categoryCode');
    const name = $('categoryName').value.trim();
    const code = codeField.value.trim().toUpperCase();
    const parentId = $('categoryParent').value ? Number($('categoryParent').value) : null;
    const sector = $('categorySector').value;
    const description = $('categoryDescription').value.trim();
    const editingId = $('categoryId').value ? Number($('categoryId').value) : null;

    $('categoryName').value = name;
    codeField.value = code;
    $('categoryDescription').value = description;

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      form.querySelector(':invalid')?.focus();
      return;
    }
    const duplicateCode = categories.some(item => item.code.toUpperCase() === code && Number(item.id) !== Number(editingId));
    const duplicateName = categories.some(item => item.name.trim().toLowerCase() === name.toLowerCase() && Number(item.id) !== Number(editingId));
    if (duplicateCode) {
      codeField.setCustomValidity('A category with this code already exists.');
      form.classList.add('was-validated');
      codeField.reportValidity();
      codeField.setCustomValidity('');
      notify(`The code "${code}" is already in use. Choose a unique code.`);
      return;
    }
    if (duplicateName) {
      $('categoryName').setCustomValidity('A category with this name already exists.');
      form.classList.add('was-validated');
      $('categoryName').reportValidity();
      $('categoryName').setCustomValidity('');
      notify(`The name "${name}" is already in use. Choose a unique name.`);
      return;
    }
    if (parentId && parentId === editingId) {
      notify('A category cannot be its own parent.');
      return;
    }
    if (parentId && !categoryById(parentId)) {
      notify('The selected parent category was not found. Refresh and try again.');
      return;
    }

    const original = editingId ? categoryById(editingId) : null;
    const item = {
      id: editingId || Math.max(0, ...categories.map(row => Number(row.id)||0)) + 1,
      code, name, parentId, sector, description,
      icon: $('categoryIcon').value,
      status: $('categoryStatus').value,
      usageCount: original ? Number(original.usageCount)||0 : 0
    };

    // Guard against a child being assigned as a parent indirectly.
    if (parentId) {
      const parent = categoryById(parentId);
      if (parent?.parentId) {
        notify('Choose a top-level parent category. The demo supports one sub-category level.');
        return;
      }
    }

    if (original) categories = categories.map(row => Number(row.id) === editingId ? item : row);
    else categories.push(item);

    persist();
    refreshParentOptions();
    render();
    categoryModal?.hide();
    notify(original ? 'Category updated in this browser demo.' : 'Category added to this browser demo.');
  }

  function toggleCategory(id) {
    const item = categoryById(id);
    if (!item) return;
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    const childCount = categories.filter(row => Number(row.parentId) === Number(item.id) && row.status === 'active').length;
    if (nextStatus === 'inactive' && Number(item.usageCount) > 0) {
      const okay = window.confirm(`"${item.name}" has ${item.usageCount} illustrative linked file(s). Deactivating it may affect future classification. Continue?`);
      if (!okay) return;
    } else if (nextStatus === 'inactive' && childCount > 0) {
      const okay = window.confirm(`"${item.name}" has ${childCount} active sub-category/sub-categories. Continue deactivation?`);
      if (!okay) return;
    }
    item.status = nextStatus;
    persist();
    render();
    notify(`${item.name} marked ${nextStatus} in this browser demo.`);
  }


  function approveCategory(id) {
    const item = categoryById(id);
    if (!item || item.status !== 'pending') return;
    if (!window.confirm(`Approve "${item.name}" under "${parentName(item)}"? It will become available for upload classification in this browser.`)) return;
    item.status = 'active';
    item.approvalStatus = 'approved';
    item.approvedAt = new Date().toISOString();
    item.approvedBy = 'Admin (frontend demo)';
    persist();
    window.MRCategoryCatalogue?.refreshSelects(categories);
    render();
    notify(`"${item.name}" approved. It is now available for new uploads in this browser.`);
  }

  function rejectCategory(id) {
    const item = categoryById(id);
    if (!item || item.status !== 'pending') return;
    const usage = Number(item.usageCount) || 0;
    const message = usage > 0
      ? `"${item.name}" has ${usage} linked record(s). Rejecting will mark the category as rejected/inactive for new uploads, but existing files will remain tagged to it. Continue?`
      : `Reject the new sub-category request "${item.name}"? The request will remain in the catalogue as Rejected for the audit trail.`;
    if (!window.confirm(message)) return;
    item.status = 'rejected';
    item.approvalStatus = 'rejected';
    item.rejectedAt = new Date().toISOString();
    item.rejectedBy = 'Admin (frontend demo)';
    persist();
    window.MRCategoryCatalogue?.refreshSelects(categories);
    render();
    notify(`"${item.name}" was rejected. Existing file records, if any, were retained.`);
  }

  function deleteCategory(id) {
    const item = categoryById(id);
    if (!item) return;
    const usage = Number(item.usageCount) || 0;
    const children = categories.filter(row => Number(row.parentId) === Number(item.id));
    if (usage > 0) {
      notify(`Cannot delete "${item.name}" because it has ${usage} illustrative linked file(s). Reclassify those records first.`);
      return;
    }
    if (children.length) {
      notify(`Cannot delete "${item.name}" because it has ${children.length} sub-category/sub-categories. Reassign or remove them first.`);
      return;
    }
    if (!window.confirm(`Delete the unused category "${item.name}"? This only changes the catalogue saved in this browser.`)) return;
    categories = categories.filter(row => Number(row.id) !== Number(id));
    persist();
    refreshParentOptions();
    render();
    notify('Category deleted from this browser demo.');
  }

  function exportCsv() {
    const rows = filteredCategories();
    const headers = ['ID','Code','Name','Parent Category','Research Area','Description','Status','Illustrative Linked Files'];
    const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = [headers.map(csvCell).join(',')].concat(rows.map(item => [
      item.id, item.code, item.name, parentName(item), item.sector, item.description, item.status, item.usageCount || 0
    ].map(csvCell).join(',')));
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `MR_Data_Bank_Categories_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    notify(`Exported ${rows.length} category record(s) as CSV.`);
  }

  $('addCategoryBtn').addEventListener('click', openNewCategory);
  $('categoryForm').addEventListener('submit', saveCategory);
  $('categorySearch').addEventListener('input', render);
  $('categoryStatusFilter').addEventListener('change', render);
  $('categorySectorFilter').addEventListener('change', render);
  $('resetCategoryFilters').addEventListener('click', () => {
    $('categorySearch').value = '';
    $('categoryStatusFilter').value = 'all';
    $('categorySectorFilter').value = 'all';
    render();
  });
  $('exportCategoriesBtn').addEventListener('click', exportCsv);
  $('reviewPendingCategoriesBtn')?.addEventListener('click', () => {
    $('categoryStatusFilter').value = 'pending';
    render();
    $('categorySearch').focus();
  });
  $('categoryCode').addEventListener('input', event => { event.target.value = event.target.value.toUpperCase(); });
  $('categoryDescription').addEventListener('input', () => { $('descriptionCounter').textContent = `${$('categoryDescription').value.length} / 300`; });
  tableBody.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = Number(button.dataset.id);
    if (button.dataset.action === 'edit') openEditCategory(id);
    if (button.dataset.action === 'toggle') toggleCategory(id);
    if (button.dataset.action === 'approve') approveCategory(id);
    if (button.dataset.action === 'reject') rejectCategory(id);
    if (button.dataset.action === 'delete') deleteCategory(id);
  });

  refreshSectorFilters();
  refreshParentOptions();
  render();
})();
