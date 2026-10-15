(() => {
  'use strict';

  const input = document.getElementById('fileInput');
  const zone = document.getElementById('uploadZone');
  const browse = document.getElementById('browseFilesButton');
  const list = document.getElementById('fileList');
  const countBadge = document.getElementById('fileCountBadge');
  const summaryCount = document.getElementById('summaryCount');
  const summarySize = document.getElementById('summarySize');
  const mainCategory = document.getElementById('mainCategory');
  const subCategory = document.getElementById('subCategory');
  const access = document.getElementById('accessLevel');
  const summaryCategory = document.getElementById('summaryCategory');
  const summaryAccess = document.getElementById('summaryAccess');
  const message = document.getElementById('validationMessage');
  const description = document.getElementById('description');
  const descriptionCount = document.getElementById('descriptionCount');
  const form = document.getElementById('uploadForm');
  const submitButton = document.getElementById('prepareUploadButton');
  const requestButton = document.getElementById('requestSubcategoryButton');
  const requestForm = document.getElementById('requestSubcategoryForm');
  const requestModalElement = document.getElementById('requestSubcategoryModal');
  const requestModal = window.bootstrap?.Modal.getOrCreateInstance(requestModalElement);
  const allowed = new Set(['pdf','xls','xlsx','csv','doc','docx','jpg','jpeg','png']);
  const PRESETS_KEY = 'mrd-upload-presets-v1';
  const LAST_SETUP_KEY = 'mrd-upload-last-setup-v1';
  const presetSelect = document.getElementById('uploadPresetSelect');
  const presetNameInput = document.getElementById('uploadPresetName');
  const presetStatus = document.getElementById('uploadPresetStatus');
  const applyPresetButton = document.getElementById('applyUploadPresetButton');
  const savePresetButton = document.getElementById('saveUploadPresetButton');
  const deletePresetButton = document.getElementById('deleteUploadPresetButton');
  let existingFileNames = new Set();
  let selectedFiles = [];
  let saving = false;
  let createdPendingCategoryId = null;
  let manualCategoryCode = false;

  function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B','KB','MB','GB','TB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  }
  function fileExtension(name) {
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
  }
  function setMessage(text, kind='secondary') {
    message.className = `small mt-3 text-${kind}`;
    message.textContent = text;
  }
  function toast(text) {
    const toastBody = document.getElementById('demoToastBody');
    const toastElement = document.getElementById('demoToast');
    if (toastBody) toastBody.textContent = text;
    if (toastElement && window.bootstrap?.Toast) bootstrap.Toast.getOrCreateInstance(toastElement, {delay:4000}).show();
  }
  function selection() {
    return {main: mainCategory.value, sub: subCategory.value, leaf: subCategory.value || mainCategory.value};
  }
  function addFiles(fileList) {
    const rejected = [];
    let duplicateInQueue = 0;
    let added = 0;
    [...fileList].forEach(file => {
      if (!allowed.has(fileExtension(file.name))) { rejected.push(file.name); return; }
      const duplicate = selectedFiles.some(item =>
        item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified
      );
      if (duplicate) { duplicateInQueue += 1; return; }
      selectedFiles.push({id:`${Date.now()}-${Math.random().toString(36).slice(2)}-${added}`,file});
      added += 1;
    });
    renderFiles();
    const notes = [];
    if (added) notes.push(`${added} file(s) added`);
    if (duplicateInQueue) notes.push(`${duplicateInQueue} duplicate selection(s) skipped`);
    if (rejected.length) notes.push(`${rejected.length} unsupported file(s) skipped: ${rejected.slice(0,2).join(', ')}${rejected.length>2?` and ${rejected.length-2} more`:''}`);
    if (notes.length) {
      const hasError = rejected.length > 0;
      const hasWarning = duplicateInQueue > 0;
      setMessage(notes.join('. ')+'.', hasError ? 'danger' : hasWarning ? 'warning' : 'success');
    } else if (selectedFiles.length) {
      setMessage('Files selected. Complete the category and metadata, then save to File Data.', 'success');
    }
  }

  function readSavedPresets() {
    try {
      const value = JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
      return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string') : [];
    } catch (_) { return []; }
  }
  function readLastSetup() {
    try {
      const value = JSON.parse(localStorage.getItem(LAST_SETUP_KEY) || 'null');
      return value && typeof value === 'object' ? value : null;
    } catch (_) { return null; }
  }
  function writePresetStatus(text, tone='secondary') {
    if (!presetStatus) return;
    presetStatus.textContent = text;
    presetStatus.className = `upload-setup-help text-${tone}`;
  }
  function renderUploadPresets() {
    if (!presetSelect) return;
    const previous = presetSelect.value;
    const options = [new Option('Choose a saved setup','')];
    const last = readLastSetup();
    if (last) {
      const detail = [last.mainCategory, last.subCategory].filter(Boolean).join(' / ');
      options.push(new Option(`Last used setup${detail ? ` — ${detail}` : ''}`,'__last_used__'));
    }
    readSavedPresets().forEach(item => {
      const detail = [item.mainCategory, item.subCategory].filter(Boolean).join(' / ');
      options.push(new Option(`${item.name}${detail ? ` — ${detail}` : ''}`,item.id));
    });
    presetSelect.replaceChildren(...options);
    if (options.some(option => option.value === previous)) presetSelect.value = previous;
    updatePresetActions();
  }
  function updatePresetActions() {
    const value = presetSelect?.value || '';
    if (applyPresetButton) applyPresetButton.disabled = !value;
    if (deletePresetButton) deletePresetButton.disabled = !value || value === '__last_used__';
  }
  function currentSetup(name='', id='') {
    return {
      id,
      name,
      mainCategory: mainCategory.value,
      subCategory: subCategory.value,
      accessLevel: access.value || 'internal',
      source: document.getElementById('source').value.trim(),
      description: description.value.trim(),
      updatedAt: new Date().toISOString()
    };
  }
  function selectedSetupIsValidForPreset() {
    const catalogue = window.MRCategoryCatalogue?.getAll() || [];
    const root = catalogue.find(item => !item.parentId && item.name === mainCategory.value && item.status === 'active');
    if (!root) return {valid:false, reason:'Choose an active main category before saving a setup.'};
    const allChildren = catalogue.filter(item => Number(item.parentId) === Number(root.id));
    const children = allChildren.filter(item => item.status === 'active');
    if (children.length) {
      const child = children.find(item => item.name === subCategory.value);
      if (!child) return {valid:false, reason:'Choose an active sub-category before saving a reusable setup.'};
    } else if (subCategory.value && !allChildren.some(item => item.name === subCategory.value && item.status === 'active')) {
      return {valid:false, reason:'Only active sub-categories can be stored in a reusable setup.'};
    }
    return {valid:true, reason:''};
  }
  function saveCurrentPreset() {
    const name = presetNameInput.value.trim();
    if (!name) {
      writePresetStatus('Enter a name for this setup first.', 'danger');
      presetNameInput.focus();
      return;
    }
    const validity = selectedSetupIsValidForPreset();
    if (!validity.valid) {
      writePresetStatus(validity.reason, 'danger');
      mainCategory.focus();
      return;
    }
    const presets = readSavedPresets();
    const existing = presets.find(item => item.name.toLowerCase() === name.toLowerCase());
    const id = existing?.id || `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
    const nextItem = currentSetup(name,id);
    const next = existing ? presets.map(item => item.id === existing.id ? nextItem : item) : [...presets,nextItem];
    const capped = next.slice(-8);
    try {
      localStorage.setItem(PRESETS_KEY,JSON.stringify(capped));
      renderUploadPresets();
      presetSelect.value = id;
      updatePresetActions();
      presetNameInput.value = '';
      writePresetStatus(existing ? `Setup “${name}” updated.` : `Setup “${name}” saved. Apply it next time to reuse these fields.`, 'success');
      toast(`Upload setup “${name}” saved in this browser.`);
    } catch (_) {
      writePresetStatus('Browser storage is full or unavailable. The setup was not saved.', 'danger');
    }
  }
  function applySelectedPreset() {
    const chosen = presetSelect.value;
    let preset = chosen === '__last_used__' ? readLastSetup() : readSavedPresets().find(item => item.id === chosen);
    if (!preset) {
      writePresetStatus('Choose an available saved setup.', 'danger');
      return;
    }
    const catalogue = window.MRCategoryCatalogue?.getAll() || [];
    const root = catalogue.find(item => !item.parentId && item.name === preset.mainCategory && item.status === 'active');
    if (!root || ![...mainCategory.options].some(option => option.value === preset.mainCategory)) {
      writePresetStatus('The main category in this setup is no longer available. Choose a current category and save the setup again.', 'danger');
      return;
    }
    mainCategory.value = preset.mainCategory;
    mainCategory.dispatchEvent(new Event('change',{bubbles:true}));
    window.MRCategoryCatalogue?.populateSubcategories(mainCategory.value,subCategory,'');
    let subMessage = '';
    if (preset.subCategory && [...subCategory.options].some(option => option.value === preset.subCategory)) {
      const child = catalogue.find(item => Number(item.parentId) === Number(root.id) && item.name === preset.subCategory && item.status === 'active');
      if (child) subCategory.value = preset.subCategory;
      else subMessage = ' Saved sub-category is pending/inactive, so select a current sub-category manually.';
    } else if (preset.subCategory) {
      subMessage = ' Saved sub-category is unavailable; choose a current sub-category manually.';
    }
    access.value = preset.accessLevel === 'restricted' ? 'restricted' : 'internal';
    document.getElementById('source').value = preset.source || '';
    description.value = preset.description || '';
    descriptionCount.textContent = String(description.value.length);
    subCategory.classList.remove('is-invalid');
    mainCategory.classList.remove('is-invalid');
    renderFiles();
    writePresetStatus(`Setup “${preset.name || 'Last used setup'}” applied.${subMessage}`,subMessage ? 'warning' : 'success');
    toast('Saved upload setup applied. Review the fields before saving.');
  }
  function deleteSelectedPreset() {
    const id = presetSelect.value;
    if (!id || id === '__last_used__') return;
    const presets = readSavedPresets();
    const item = presets.find(preset => preset.id === id);
    if (!item) return;
    try {
      localStorage.setItem(PRESETS_KEY,JSON.stringify(presets.filter(preset => preset.id !== id)));
      renderUploadPresets();
      writePresetStatus(`Setup “${item.name}” deleted from this browser.`, 'secondary');
    } catch (_) {
      writePresetStatus('The selected setup could not be deleted.', 'danger');
    }
  }
  function rememberLastSetup() {
    const preset = currentSetup('Last used setup','__last_used__');
    try {
      localStorage.setItem(LAST_SETUP_KEY,JSON.stringify(preset));
      renderUploadPresets();
    } catch (_) { /* Upload completion should not fail if remembering a preset is unavailable. */ }
  }
  function updateReadinessItem(iconId,textId,ready,text,optional=false) {
    const icon = document.getElementById(iconId);
    const label = document.getElementById(textId);
    if (icon) {
      icon.className = ready ? 'bi bi-check-circle-fill text-success' : optional ? 'bi bi-info-circle text-secondary' : 'bi bi-circle text-secondary';
    }
    if (label) label.textContent = text;
  }
  function categoryIsReady() {
    const picked = selection();
    const catalogue = window.MRCategoryCatalogue?.getAll() || [];
    const root = catalogue.find(item => !item.parentId && item.name === picked.main && item.status === 'active');
    if (!root) return false;
    const children = catalogue.filter(item => Number(item.parentId) === Number(root.id));
    const activeChildren = children.filter(item => item.status === 'active');
    if (!activeChildren.length) return !picked.sub || children.some(item => item.name === picked.sub && (item.status === 'active' || (item.status === 'pending' && Number(item.id) === Number(createdPendingCategoryId))));
    return activeChildren.some(item => item.name === picked.sub) || children.some(item => item.name === picked.sub && item.status === 'pending' && Number(item.id) === Number(createdPendingCategoryId));
  }
  function renderReadiness() {
    const hasFiles = selectedFiles.length > 0;
    const hasCategory = categoryIsReady();
    const detailValues = [document.getElementById('source').value.trim(),document.getElementById('documentDate').value,description.value.trim()];
    const hasDetails = detailValues.some(Boolean);
    updateReadinessItem('readinessFilesIcon','readinessFilesText',hasFiles,hasFiles ? `${selectedFiles.length} file(s) selected` : 'Select at least one supported file');
    updateReadinessItem('readinessCategoryIcon','readinessCategoryText',hasCategory,hasCategory ? 'Category classification is valid' : 'Choose a valid main and sub-category');
    updateReadinessItem('readinessDetailsIcon','readinessDetailsText',hasDetails,hasDetails ? 'Optional document details added' : 'Source and description are optional',true);
    const done = Number(hasFiles) + Number(hasCategory);
    const percent = Math.round(done / 2 * 100);
    const bar = document.getElementById('uploadReadinessProgressBar');
    const progress = document.getElementById('uploadReadinessProgress');
    const badge = document.getElementById('uploadReadinessBadge');
    if (bar) bar.style.width = `${percent}%`;
    if (progress) progress.setAttribute('aria-valuenow',String(percent));
    if (bar) bar.classList.toggle('readiness-complete',percent===100);
    if (badge) {
      badge.textContent = percent === 100 ? 'Ready to save' : `${done}/2 required checks`;
      badge.className = `badge ${percent===100 ? 'text-bg-success' : 'text-bg-warning'}`;
    }
  }
  function renderFiles() {
    list.innerHTML = '';
    const totalSize = selectedFiles.reduce((sum,item)=>sum+item.file.size,0);
    countBadge.textContent = `${selectedFiles.length} ${selectedFiles.length===1?'file':'files'} selected`;
    summaryCount.textContent = selectedFiles.length;
    summarySize.textContent = formatSize(totalSize);
    if (!selectedFiles.length) {
      const empty = document.createElement('div');
      empty.className = 'upload-empty';
      empty.innerHTML = '<i class="bi bi-files fs-3 d-block mb-2"></i>No files selected yet.';
      list.appendChild(empty);
    } else {
      selectedFiles.forEach(item => {
        const ext = fileExtension(item.file.name).toUpperCase();
        const row = document.createElement('div');
        row.className = 'selected-file';
        const icon = document.createElement('div');
        icon.className = `file-type ${['XLS','XLSX'].includes(ext)?'type-xlsx':ext==='CSV'?'type-csv':['DOC','DOCX'].includes(ext)?'type-docx':''}`;
        icon.textContent = ext;
        const info = document.createElement('div');
        info.className = 'flex-grow-1 min-w-0';
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = item.file.name;
        const meta = document.createElement('div');
        meta.className = 'file-meta';
        meta.textContent = `${formatSize(item.file.size)} · ${item.file.type || 'Type inferred from extension'}`;
        info.append(fileName,meta);
        if (existingFileNames.has(item.file.name.trim().toLowerCase())) {
          const possibleDuplicate = document.createElement('div');
          possibleDuplicate.className = 'duplicate-file-note';
          possibleDuplicate.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1"></i>Possible duplicate name already exists in File Data';
          info.appendChild(possibleDuplicate);
        }
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'file-remove';
        remove.setAttribute('aria-label',`Remove ${item.file.name}`);
        remove.title = 'Remove file';
        remove.innerHTML = '<i class="bi bi-x-lg"></i>';
        remove.addEventListener('click', () => {
          selectedFiles = selectedFiles.filter(entry=>entry.id!==item.id);
          renderFiles();
          setMessage('File removed from local selection.', 'secondary');
        });
        row.append(icon,info,remove);
        list.appendChild(row);
      });
    }
    const picked = selection();
    summaryCategory.textContent = picked.main ? `${picked.main}${picked.sub?` / ${picked.sub}`:''}` : 'Not selected';
    summaryAccess.textContent = access.value === 'restricted' ? 'Restricted' : 'Internal';
    renderReadiness();
  }

  function openSubcategoryRequest() {
    const catalogue = window.MRCategoryCatalogue?.getAll() || [];
    const root = catalogue.find(item => !item.parentId && item.name === mainCategory.value && item.status === 'active');
    if (!root) {
      setMessage('Select an active main category before requesting a sub-category.', 'danger');
      mainCategory.focus();
      return;
    }
    requestForm.reset();
    requestForm.classList.remove('was-validated');
    manualCategoryCode = false;
    document.getElementById('requestSubcategoryParentLabel').textContent = root.name;
    document.getElementById('newSubcategoryName').value = '';
    document.getElementById('newSubcategoryCode').value = '';
    document.getElementById('newSubcategoryDescription').value = '';
    requestModal?.show();
    setTimeout(() => document.getElementById('newSubcategoryName').focus(), 180);
  }

  function slugCategoryCode(name) {
    return String(name || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0,24);
  }

  function createSubcategoryRequest(event) {
    event.preventDefault();
    const nameInput = document.getElementById('newSubcategoryName');
    const codeInput = document.getElementById('newSubcategoryCode');
    const descriptionInput = document.getElementById('newSubcategoryDescription');
    const name = nameInput.value.trim();
    const code = codeInput.value.trim().toUpperCase();
    const descriptionText = descriptionInput.value.trim();
    const catalogue = window.MRCategoryCatalogue?.getAll() || [];
    const root = catalogue.find(item => !item.parentId && item.name === mainCategory.value && item.status === 'active');

    nameInput.value = name;
    codeInput.value = code;
    descriptionInput.value = descriptionText;
    if (!root) {
      notifyRequest('Select a valid active main category and reopen this form.');
      return;
    }
    if (!requestForm.checkValidity()) {
      requestForm.classList.add('was-validated');
      requestForm.querySelector(':invalid')?.focus();
      return;
    }
    const duplicateName = catalogue.some(item => String(item.name || '').trim().toLowerCase() === name.toLowerCase());
    const duplicateCode = catalogue.some(item => String(item.code || '').trim().toUpperCase() === code);
    if (duplicateName) {
      nameInput.setCustomValidity('This category name already exists.');
      requestForm.classList.add('was-validated');
      nameInput.reportValidity();
      nameInput.setCustomValidity('');
      notifyRequest(`"${name}" already exists in the category catalogue.`);
      return;
    }
    if (duplicateCode) {
      codeInput.setCustomValidity('This category code already exists.');
      requestForm.classList.add('was-validated');
      codeInput.reportValidity();
      codeInput.setCustomValidity('');
      notifyRequest(`Code "${code}" is already in use. Choose another code.`);
      return;
    }

    const newId = Math.max(0, ...catalogue.map(item => Number(item.id) || 0)) + 1;
    const now = new Date().toISOString();
    const requestCategory = {
      id: newId,
      code,
      name,
      parentId: root.id,
      sector: root.name,
      description: descriptionText,
      icon: 'folder2',
      status: 'pending',
      approvalStatus: 'pending',
      requestedAt: now,
      requestedBy: 'Employee (frontend demo)',
      usageCount: 0
    };
    const updated = [...catalogue, requestCategory];
    const saved = window.MRCategoryCatalogue?.save(updated);
    if (!saved) {
      notifyRequest('The category request could not be saved in this browser. Check browser storage and retry.');
      return;
    }

    createdPendingCategoryId = requestCategory.id;
    window.MRCategoryCatalogue?.populateSubcategories(mainCategory.value, subCategory, requestCategory.name);
    subCategory.value = requestCategory.name;
    subCategory.classList.remove('is-invalid');
    subCategory.setCustomValidity('');
    requestModal?.hide();
    renderFiles();
    setMessage(`New sub-category "${name}" requested under ${root.name}. It is pending admin approval; you can continue with the upload.`, 'warning');
    notifyRequest(`Category request "${name}" created. Admin approval is pending.`);
  }

  function notifyRequest(text) {
    const toastBody = document.getElementById('demoToastBody');
    const toastElement = document.getElementById('demoToast');
    if (toastBody) toastBody.textContent = text;
    if (toastElement && window.bootstrap?.Toast) bootstrap.Toast.getOrCreateInstance(toastElement, {delay:4500}).show();
    else console.info(text);
  }

  function makeRecord(item,index,batchId) {
    const file = item.file;
    const ext = fileExtension(file.name);
    const type = ext === 'jpeg' ? 'JPG' : ext.toUpperCase();
    const now = new Date();
    const stamp = now.toISOString().replace(/\D/g,'').slice(0,14);
    const randomSuffix = Math.random().toString(36).slice(2,7).toUpperCase();
    const picked = selection();
    const catalogue = window.MRCategoryCatalogue?.getAll() || [];
    const mainItem = catalogue.find(entry=>!entry.parentId&&entry.name===picked.main);
    const categoryItem = catalogue.find(entry=>entry.name===picked.leaf);
    const date = document.getElementById('documentDate').value || now.toISOString().slice(0,10);
    const source = document.getElementById('source').value.trim() || 'Market Research Division';
    const descriptionText = description.value.trim() || `Uploaded through MR Data Bank frontend demo: ${file.name}`;
    return {
      id:`upl-${batchId}-${index+1}`,
      fileId:`MRD-UPL-${stamp}-${randomSuffix}`,
      name:file.name,
      category:picked.leaf,
      categoryId:categoryItem?.id ?? null,
      categoryCode:categoryItem?.code || '',
      categoryApprovalStatus:categoryItem?.status === 'pending' ? 'pending' : 'approved',
      mainCategory:picked.main,
      mainCategoryId:mainItem?.id ?? null,
      subCategory:picked.sub || '',
      subCategoryId:picked.sub ? categoryItem?.id ?? null : null,
      type,
      mimeType:file.type || 'application/octet-stream',
      sizeBytes:file.size,
      date,
      createdAt:now.toISOString(),
      uploader:'MR Division User',
      status:'Draft',
      source,
      description:descriptionText,
      keywords:`${file.name.replace(/\.[^.]+$/,'').replace(/[_-]/g,' ')} ${picked.main} ${picked.sub} ${source}`.toLowerCase(),
      accessLevel:access.value,
      documentDate:date,
      archived:false,
      isUpload:true,
      batchId,
      versions:[{version:'v1.0',date,user:'MR Division User',note:'Initial browser upload',size:formatSize(file.size)}]
    };
  }
  function updateCategoryUsage(mainName,subName,count) {
    try {
      const key = window.MRCategoryCatalogue?.storageKey || 'mrd-category-catalogue-v1';
      const categories = JSON.parse(localStorage.getItem(key) || '[]');
      const next = categories.map(item => (item.name===mainName || (subName&&item.name===subName))
        ? {...item,usageCount:(Number(item.usageCount)||0)+count}
        : item);
      localStorage.setItem(key,JSON.stringify(next));
      window.MRCategoryCatalogue?.refreshSelects(next);
      window.MRCategoryCatalogue?.populateSubcategories(mainCategory.value,subCategory,subCategory.value);
    } catch (error) {
      console.warn('Category usage count could not be updated.',error);
    }
  }
  async function saveUpload(event) {
    event.preventDefault();
    if (saving) return;
    const picked = selection();
    const catalogue = window.MRCategoryCatalogue?.getAll() || [];
    const root = catalogue.find(item=>!item.parentId&&item.name===picked.main&&item.status==='active');
    const allChildren = root ? catalogue.filter(item=>Number(item.parentId)===Number(root.id)) : [];
    const activeChildren = allChildren.filter(item=>item.status==='active');
    const selectedChild = allChildren.find(item=>item.name===picked.sub);
    const pendingChildIsCurrentRequest = Boolean(selectedChild && selectedChild.status==='pending' &&
      Number(selectedChild.id)===Number(createdPendingCategoryId));
    const validSubcategory = Boolean(selectedChild && (selectedChild.status==='active' || pendingChildIsCurrentRequest));
    const requiresSubcategory = activeChildren.length > 0 || Boolean(picked.sub);
    mainCategory.setCustomValidity(root ? '' : 'Select an active main category.');
    subCategory.setCustomValidity(requiresSubcategory && !validSubcategory ? 'Select a valid active sub-category, or request a new one.' : '');
    mainCategory.classList.toggle('is-invalid',!root);
    subCategory.classList.toggle('is-invalid',requiresSubcategory && !validSubcategory);

    if (!selectedFiles.length) { setMessage('Please select at least one supported file.','danger'); return; }
    if (!root) { setMessage('Please select an active main category.','danger'); mainCategory.focus(); return; }
    if (requiresSubcategory && !validSubcategory) {
      setMessage('Select an active sub-category or create a new sub-category request first.','danger');
      subCategory.focus();
      return;
    }
    if (!window.MRFileRepository) { setMessage('File storage module did not load. Refresh the page and try again.','danger'); return; }

    saving = true;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Saving files…';
    try {
      const batchId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
      const items = selectedFiles.map((item,index)=>({file:item.file,record:makeRecord(item,index,batchId)}));
      const result = await window.MRFileRepository.saveUploads(items);
      rememberLastSetup();
      updateCategoryUsage(picked.main,picked.sub,items.length);
      setMessage(`${items.length} file(s) saved under ${picked.main}${picked.sub?` / ${picked.sub}`:''}. Opening File Data…`,'success');
      toast(`${items.length} file(s) saved locally. Opening the selected category.`);
      const rootItem = window.MRCategoryCatalogue?.getRoots(true).find(item=>item.name===picked.main);
      window.location.href = `data-bank.html?uploaded=${encodeURIComponent(items[0].record.id)}&count=${items.length}&storage=${encodeURIComponent(result.mode)}&main=${encodeURIComponent(rootItem?.code||picked.main)}`;
    } catch (error) {
      console.error('Upload workflow save failed.',error);
      setMessage(error?.message||'Files could not be saved. Please try again.','danger');
      toast('No upload was completed. See the message beside the form.');
    } finally {
      saving = false;
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="bi bi-clipboard-check me-2"></i>Save files &amp; open All Files';
    }
  }

  browse.addEventListener('click',()=>input.click());
  presetSelect?.addEventListener('change',updatePresetActions);
  applyPresetButton?.addEventListener('click',applySelectedPreset);
  savePresetButton?.addEventListener('click',saveCurrentPreset);
  deletePresetButton?.addEventListener('click',deleteSelectedPreset);
  zone.addEventListener('click',event=>{if(!event.target.closest('#browseFilesButton'))input.click();});
  zone.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();input.click();}});
  input.addEventListener('change',()=>{addFiles(input.files);input.value='';});
  ['dragenter','dragover'].forEach(type=>zone.addEventListener(type,event=>{event.preventDefault();event.stopPropagation();zone.classList.add('drag-over');}));
  ['dragleave','drop'].forEach(type=>zone.addEventListener(type,event=>{event.preventDefault();event.stopPropagation();zone.classList.remove('drag-over');}));
  zone.addEventListener('drop',event=>addFiles(event.dataTransfer.files));
  document.getElementById('clearFilesButton').addEventListener('click',()=>{selectedFiles=[];renderFiles();setMessage('Selection cleared.','secondary');});
  mainCategory.addEventListener('change',()=>{
    mainCategory.classList.remove('is-invalid');
    createdPendingCategoryId = null;
    window.MRCategoryCatalogue?.populateSubcategories(mainCategory.value,subCategory,'');
    subCategory.classList.remove('is-invalid');
    requestButton.disabled = !mainCategory.value;
    renderFiles();
  });
  subCategory.addEventListener('change',()=>{
    if (subCategory.value === '__create_new__') {
      window.MRCategoryCatalogue?.populateSubcategories(mainCategory.value,subCategory,'');
      openSubcategoryRequest();
      return;
    }
    subCategory.classList.remove('is-invalid');
    renderFiles();
  });
  requestButton.addEventListener('click', openSubcategoryRequest);
  requestForm.addEventListener('submit', createSubcategoryRequest);
  document.getElementById('newSubcategoryName').addEventListener('input', event => {
    if (!manualCategoryCode) document.getElementById('newSubcategoryCode').value = slugCategoryCode(event.target.value);
  });
  document.getElementById('newSubcategoryCode').addEventListener('input', event => {
    manualCategoryCode = true;
    event.target.value = event.target.value.toUpperCase();
  });
  access.addEventListener('change',renderFiles);
  document.getElementById('source').addEventListener('input',renderReadiness);
  document.getElementById('documentDate').addEventListener('change',renderReadiness);
  description.addEventListener('input',()=>{descriptionCount.textContent=description.value.length;renderReadiness();});
  document.getElementById('resetFormButton').addEventListener('click',()=>{
    selectedFiles=[];form.reset();descriptionCount.textContent='0';createdPendingCategoryId=null;
    updatePresetActions();
    window.MRCategoryCatalogue?.refreshSelects();
    requestButton.disabled = true;
    renderFiles();setMessage('Form reset. Select files to start again.','secondary');
    form.querySelectorAll('.is-invalid').forEach(element=>element.classList.remove('is-invalid'));
  });
  form.addEventListener('submit',saveUpload);
  requestButton.disabled = !mainCategory.value;
  renderUploadPresets();
  renderFiles();
  if (window.MRFileRepository?.listRecords) {
    window.MRFileRepository.listRecords().then(records => {
      existingFileNames = new Set((records || []).map(record => String(record.name || '').trim().toLowerCase()).filter(Boolean));
      renderFiles();
    }).catch(error => console.warn('Existing file names could not be checked in this browser.',error));
  }
})();
