(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const CATEGORY_STORAGE_KEY = window.MRCategoryCatalogue?.storageKey || 'mrd-category-catalogue-v1';
  const state = { range: 7, uploads: [], categories: [] };
  const formatNumber = value => new Intl.NumberFormat('en-IN').format(Number(value) || 0);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const showToast = message => {
    const text = $('demoToastBody'), toast = $('demoToast');
    if (text) text.textContent = message;
    if (text && toast && window.bootstrap?.Toast) window.bootstrap.Toast.getOrCreateInstance(toast, {delay: 3200}).show();
  };
  const toDate = value => {
    if (!value) return null;
    const parsed = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const startOfDay = value => new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const dateLabel = value => value.toLocaleDateString('en-IN', {day:'2-digit', month:'short'});
  const fullDateLabel = value => value.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
  const sizeLabel = bytes => {
    const value = Math.max(0, Number(bytes) || 0);
    if (!value) return '0 B';
    const units = ['B','KB','MB','GB','TB'];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  };
  const normalizeStatus = record => {
    if (record?.archived) return {label:'Archived', css:'muted'};
    if (record?.categoryApprovalStatus === 'pending') return {label:'Classification pending', css:'pending'};
    const status = String(record?.status || 'Saved');
    if (/verified|approved|active|saved/i.test(status)) return {label:status, css:'success'};
    if (/pending|review/i.test(status)) return {label:status, css:'review'};
    return {label:status, css:'muted'};
  };
  const recordDate = record => toDate(record?.date || record?.uploadedAt || record?.createdAt || record?.timestamp);

  function getCategoryRootName(record) {
    const raw = String(record?.mainCategory || '').trim();
    const category = String(record?.category || record?.subCategory || '').trim();
    if (raw) {
      const main = state.categories.find(item => String(item.name).toLowerCase() === raw.toLowerCase() || String(item.code).toLowerCase() === raw.toLowerCase());
      if (main && !main.parentId) return main.name;
      if (main) {
        let current = main, guard = new Set();
        while (current?.parentId && !guard.has(Number(current.id))) {
          guard.add(Number(current.id));
          const parent = state.categories.find(item => Number(item.id) === Number(current.parentId));
          if (!parent) break;
          current = parent;
        }
        return current?.name || raw;
      }
      return raw;
    }
    const item = state.categories.find(row => String(row.name).toLowerCase() === category.toLowerCase() || String(row.code).toLowerCase() === category.toLowerCase());
    if (!item) return category || 'Uncategorised';
    let current = item, guard = new Set();
    while (current?.parentId && !guard.has(Number(current.id))) {
      guard.add(Number(current.id));
      const parent = state.categories.find(row => Number(row.id) === Number(current.parentId));
      if (!parent) break;
      current = parent;
    }
    return current?.name || item.name || 'Uncategorised';
  }

  async function fetchState() {
    try {
      state.uploads = window.MRFileRepository?.listRecords ? await window.MRFileRepository.listRecords() : [];
    } catch (error) {
      state.uploads = [];
      console.warn('Could not read local upload records.', error);
    }
    try {
      state.categories = window.MRCategoryCatalogue?.getAll ? window.MRCategoryCatalogue.getAll() : JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || '[]');
      if (!Array.isArray(state.categories)) state.categories = [];
    } catch (error) {
      state.categories = [];
      console.warn('Could not read local categories.', error);
    }
    state.uploads = state.uploads.filter(record => record && typeof record === 'object');
    return state;
  }

  function renderMetrics() {
    const activeCategories = state.categories.filter(category => category.status === 'active').length;
    const pendingCategories = state.categories.filter(category => category.status === 'pending').length;
    const pendingFiles = state.uploads.filter(record => !record.archived && (record.categoryApprovalStatus === 'pending' || /pending|review/i.test(String(record.status || '')))).length;
    const pending = pendingCategories + pendingFiles;
    const totalBytes = state.uploads.reduce((sum, record) => sum + Math.max(0, Number(record.sizeBytes) || 0), 0);
    const values = {uploads:formatNumber(state.uploads.length), categories:formatNumber(activeCategories), pending:formatNumber(pending), storage:sizeLabel(totalBytes)};
    document.querySelectorAll('[data-metric]').forEach(node => {
      const key = node.dataset.metric;
      if (key in values) node.textContent = values[key];
    });
    const pendingNote = document.querySelector('[data-metric="pending"]')?.closest('.stat-top')?.querySelector('.text-warning');
    if (pendingNote) pendingNote.textContent = pending ? 'Requires attention' : 'No pending reviews';
    const uploadNote = document.querySelector('[data-metric="uploads"]')?.closest('.stat-top')?.querySelector('.stat-note');
    if (uploadNote) uploadNote.textContent = `${formatNumber(state.uploads.filter(record => !record.archived).length)} active · ${formatNumber(state.uploads.filter(record => record.archived).length)} archived`;
  }

  function makeTrendSvg(range) {
    const today = startOfDay(new Date());
    const firstDay = new Date(today);
    firstDay.setDate(firstDay.getDate() - range + 1);
    const days = Array.from({length:range}, (_, index) => {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() + index);
      return {date, count:0};
    });
    const map = new Map(days.map(day => [day.date.getTime(), day]));
    state.uploads.forEach(record => {
      const date = recordDate(record);
      if (!date) return;
      const key = startOfDay(date).getTime();
      if (map.has(key)) map.get(key).count += 1;
    });
    const total = days.reduce((sum, day) => sum + day.count, 0);
    const chart = $('uploadTrendChart');
    if (!chart) return;
    const width = 720, height = 205, left = 35, right = 13, top = 16, bottom = 31;
    const innerW = width - left - right, innerH = height - top - bottom;
    const peak = Math.max(3, ...days.map(day => day.count));
    const x = index => left + (days.length <= 1 ? 0 : index * innerW / (days.length - 1));
    const y = value => top + innerH - (value / peak) * innerH;
    const coords = days.map((day, index) => ({x:x(index), y:y(day.count), ...day}));
    const linePath = coords.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
    const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${top + innerH} L ${coords[0].x.toFixed(2)} ${top + innerH} Z`;
    const gridValues = [0, Math.ceil(peak / 2), peak].filter((value, index, array) => array.indexOf(value) === index);
    const grid = gridValues.map(value => `<line x1="${left}" y1="${y(value)}" x2="${width-right}" y2="${y(value)}" stroke="#eaf0f6" stroke-dasharray="3 5"/><text x="${left-10}" y="${y(value)+4}" text-anchor="end" font-size="10" fill="#8b98aa">${value}</text>`).join('');
    const step = range <= 7 ? 1 : (range <= 30 ? 5 : 15);
    const labels = coords.map((point, index) => {
      if (index % step !== 0 && index !== coords.length - 1) return '';
      return `<text x="${point.x}" y="${height-8}" text-anchor="middle" font-size="10" fill="#8492a4">${escapeHtml(dateLabel(point.date))}</text>`;
    }).join('');
    const circles = coords.map(point => `<circle cx="${point.x}" cy="${point.y}" r="3.4" fill="#fff" stroke="#2867b2" stroke-width="2"><title>${escapeHtml(fullDateLabel(point.date))}: ${point.count} upload${point.count === 1 ? '' : 's'}</title></circle>`).join('');
    chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${range}-day upload activity. ${total} uploads within this period."><defs><linearGradient id="dashboardTrendArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4f8fdc" stop-opacity=".23"/><stop offset="100%" stop-color="#4f8fdc" stop-opacity=".015"/></linearGradient></defs>${grid}<path d="${areaPath}" fill="url(#dashboardTrendArea)"/><path d="${linePath}" fill="none" stroke="#2867b2" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>${circles}${labels}</svg>`;
    const totalNode = $('trendPeriodTotal'), labelNode = $('trendPeriodLabel'), subtitle = $('uploadTrendSubtitle');
    if (totalNode) totalNode.textContent = formatNumber(total);
    if (labelNode) labelNode.textContent = `Uploads in the last ${range} days`;
    if (subtitle) subtitle.textContent = `Uploads saved between ${dateLabel(firstDay)} and ${dateLabel(today)}`;
    if (!state.uploads.length) {
      chart.insertAdjacentHTML('beforeend', '<div class="dashboard-chart-empty-overlay">Your upload activity will appear here after you add files.</div>');
    } else if (total === 0) {
      chart.insertAdjacentHTML('beforeend', `<div class="dashboard-chart-empty-overlay">No uploads recorded in the last ${range} days.</div>`);
    }
  }

  function renderCategoryBreakdown() {
    const target = $('dashboardCategoryBreakdown');
    if (!target) return;
    const counts = new Map();
    state.uploads.filter(record => !record.archived).forEach(record => {
      const name = getCategoryRootName(record) || 'Uncategorised';
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    const items = [...counts.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6);
    const countNode = $('dashboardCategoryCount');
    if (countNode) countNode.textContent = `${counts.size} categor${counts.size === 1 ? 'y' : 'ies'} represented`;
    if (!items.length) {
      target.innerHTML = '<div class="dashboard-category-empty"><i class="bi bi-bar-chart-line"></i><strong class="text-secondary">No category activity yet</strong><span class="mt-1">Save files to see the most-used categories.</span><a href="upload-files.html" class="btn btn-soft btn-sm mt-3">Upload a file</a></div>';
      return;
    }
    const max = Math.max(...items.map(item => item[1]), 1);
    target.innerHTML = items.map(([name, count]) => {
      const percent = Math.max(5, count / max * 100);
      return `<div class="dashboard-category-row"><div class="dashboard-category-meta"><span class="dashboard-category-name">${escapeHtml(name)}</span><span class="dashboard-category-count">${formatNumber(count)}</span></div><div class="dashboard-category-track" role="progressbar" aria-label="${escapeHtml(name)} uploads" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${count}"><div class="dashboard-category-fill" style="width:${percent.toFixed(1)}%"></div></div></div>`;
    }).join('');
  }

  function iconAndClass(type) {
    const extension = String(type || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const known = {xlsx:['file-earmark-spreadsheet','type-xlsx'],xls:['file-earmark-spreadsheet','type-xlsx'],csv:['filetype-csv','type-csv'],docx:['file-earmark-word','type-docx'],doc:['file-earmark-word','type-docx'],jpg:['file-earmark-image',''],jpeg:['file-earmark-image',''],png:['file-earmark-image',''],pdf:['file-earmark-pdf','']};
    const [icon, css] = known[extension] || ['file-earmark',''];
    return {icon, css, label:extension ? extension.toUpperCase().slice(0,5) : 'FILE'};
  }

  function renderRepositoryStatus() {
    const pendingCategories = state.categories.filter(category => category.status === 'pending').length;
    const awaitingReview = state.uploads.filter(record => !record.archived && (record.categoryApprovalStatus === 'pending' || /pending|review/i.test(String(record.status || '')))).length;
    const archived = state.uploads.filter(record => Boolean(record.archived)).length;
    const unclassified = state.uploads.filter(record => !String(record.mainCategory || record.category || '').trim() && !record.archived).length;
    const values = {
      dashboardPendingCategoryCount: pendingCategories,
      dashboardFilesAwaitingReview: awaitingReview,
      dashboardArchivedUploads: archived,
      dashboardUnclassifiedUploads: unclassified
    };
    Object.entries(values).forEach(([id, value]) => { const node = $(id); if (node) node.textContent = formatNumber(value); });
    const lastRefresh = $('dashboardLastRefresh');
    if (lastRefresh) lastRefresh.textContent = `Updated ${new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}`;
  }

  function renderRecentUploads() {
    const body = $('dashboardRecentUploads'), empty = $('dashboardNoUploads');
    if (!body) return;
    const uploads = [...state.uploads].sort((a,b) => (recordDate(b)?.getTime() || 0) - (recordDate(a)?.getTime() || 0)).slice(0, 6);
    if (empty) empty.classList.toggle('d-none', uploads.length > 0);
    body.closest('table')?.classList.toggle('d-none', uploads.length === 0);
    if (!uploads.length) { body.innerHTML = ''; return; }
    body.innerHTML = uploads.map(record => {
      const fileType = iconAndClass(record.type || String(record.name || '').split('.').pop());
      const fileId = record.fileId || record.id || 'Local upload';
      const category = getCategoryRootName(record) || record.category || 'Uncategorised';
      const status = normalizeStatus(record);
      const date = recordDate(record);
      return `<tr data-searchable="${escapeHtml([record.name,fileId,category,record.subCategory,record.status,record.uploader].join(' '))}"><td><div class="dashboard-recent-file"><div class="file-type ${fileType.css}"><i class="bi bi-${fileType.icon}" aria-hidden="true"></i></div><div><div class="dashboard-recent-file-name">${escapeHtml(record.name || 'Untitled file')}</div><div class="dashboard-recent-file-id">${escapeHtml(fileId)} · ${escapeHtml(sizeLabel(record.sizeBytes))}</div></div></div></td><td>${escapeHtml(category)}</td><td>${date ? escapeHtml(fullDateLabel(date)) : '—'}</td><td><span class="dashboard-status-pill dashboard-status-${status.css}">${escapeHtml(status.label)}</span></td></tr>`;
    }).join('');
  }

  function csvCell(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }
  function exportUploads() {
    if (!state.uploads.length) {
      showToast('There are no browser-saved uploads to export yet. Upload a file first.');
      return;
    }
    const headers = ['File ID','File Name','Main Category','Sub-category','File Type','Size (Bytes)','Date Added','Uploaded By','Status','Category Approval','Archived'];
    const rows = state.uploads.map(record => [record.fileId || record.id || '', record.name || '', getCategoryRootName(record), record.subCategory || '', record.type || '', Number(record.sizeBytes) || 0, recordDate(record) ? fullDateLabel(recordDate(record)) : '', record.uploader || '', record.status || 'Saved', record.categoryApprovalStatus || '', record.archived ? 'Yes' : 'No']);
    const csv = '\ufeff' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `MR_Data_Bank_Uploads_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    showToast(`Exported ${formatNumber(rows.length)} browser-saved upload record(s).`);
  }

  async function refreshDashboard(showMessage = false) {
    const refresh = $('refreshDashboardBtn');
    if (refresh) { refresh.disabled = true; refresh.classList.add('dashboard-refreshing'); }
    await fetchState();
    renderMetrics();
    makeTrendSvg(state.range);
    renderCategoryBreakdown();
    renderRepositoryStatus();
    renderRecentUploads();
    if (refresh) { refresh.disabled = false; refresh.classList.remove('dashboard-refreshing'); }
    if (showMessage) showToast('Dashboard insights refreshed from this browser’s saved data.');
  }

  document.querySelectorAll('[data-trend-range]').forEach(button => button.addEventListener('click', () => {
    state.range = Number(button.dataset.trendRange) || 7;
    document.querySelectorAll('[data-trend-range]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    makeTrendSvg(state.range);
  }));
  $('refreshDashboardBtn')?.addEventListener('click', () => refreshDashboard(true));
  $('exportDashboardBtn')?.addEventListener('click', exportUploads);
  window.addEventListener('storage', event => {
    if (!event.key || event.key === CATEGORY_STORAGE_KEY || event.key === 'mrd-upload-records-v1') refreshDashboard();
  });
  window.addEventListener('focus', () => refreshDashboard());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDashboard(); });
  refreshDashboard();
})();
