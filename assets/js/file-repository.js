(() => {
  'use strict';

  const DB_NAME = 'MRDataBankPhase1';
  const DB_VERSION = 1;
  const STORE_NAME = 'files';
  const META_KEY = 'mrd-upload-records-v1';
  const MAX_FALLBACK_FILE_BYTES = 700 * 1024;
  const MAX_FALLBACK_TOTAL_BYTES = 2.2 * 1024 * 1024;
  let dbPromise = null;

  function publicRecord(record) {
    const output = {...record};
    delete output.fileBlob;
    delete output.fileDataUrl;
    return output;
  }

  function openDb() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB is not available in this browser context.'));
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, {keyPath: 'id'});
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
      request.onerror = () => reject(request.error || new Error('Could not open browser file storage.'));
      request.onblocked = () => reject(new Error('Browser file storage is blocked by another tab. Close old MR Data Bank tabs and try again.'));
    });
    return dbPromise;
  }

  function dataUrlFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Could not prepare the file for browser storage.'));
      reader.readAsDataURL(blob);
    });
  }

  function blobFromDataUrl(dataUrl) {
    const comma = dataUrl.indexOf(',');
    if (comma < 0) throw new Error('Stored file data is invalid.');
    const header = dataUrl.slice(0, comma);
    const mime = (header.match(/^data:([^;]+)/) || [,'application/octet-stream'])[1];
    const binary = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], {type: mime});
  }

  function readFallback() {
    try {
      const parsed = JSON.parse(localStorage.getItem(META_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  async function saveToFallback(items) {
    const existing = readFallback();
    const currentBytes = existing.reduce((sum, item) => sum + (Number(item.sizeBytes) || 0), 0);
    const newBytes = items.reduce((sum, item) => sum + item.file.size, 0);
    if (items.some(item => item.file.size > MAX_FALLBACK_FILE_BYTES) ||
        currentBytes + newBytes > MAX_FALLBACK_TOTAL_BYTES) {
      throw new Error('This browser cannot provide IndexedDB storage for these file(s). Please open the project using a local web server (for example, VS Code Live Server) and retry. The file selection has not been saved.');
    }
    const withData = [];
    for (const item of items) {
      withData.push({...item.record, storageMode: 'local-fallback', fileDataUrl: await dataUrlFromBlob(item.file)});
    }
    const next = existing.filter(old => !withData.some(item => item.id === old.id)).concat(withData);
    try {
      localStorage.setItem(META_KEY, JSON.stringify(next));
    } catch (_) {
      throw new Error('Browser storage quota was reached. Please open the project through a local web server and retry; no upload record was saved.');
    }
    return {mode: 'small-file-browser-storage', count: withData.length};
  }

  async function saveUploads(items) {
    if (!Array.isArray(items) || !items.length) throw new Error('No files were provided to save.');
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        items.forEach(item => store.put({...item.record, fileBlob: item.file, storageMode: 'indexeddb'}));
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Could not save uploaded file(s).'));
        tx.onabort = () => reject(tx.error || new Error('The browser cancelled saving uploaded file(s).'));
      });
      return {mode: 'indexeddb', count: items.length};
    } catch (indexedDbError) {
      try {
        return await saveToFallback(items);
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
  }

  async function listRecords() {
    let indexedRecords = [];
    try {
      const db = await openDb();
      indexedRecords = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error || new Error('Could not read saved file records.'));
      });
    } catch (_) {
      // Small-file fallback records are still available in localStorage.
    }
    const fallbackRecords = readFallback();
    const combined = new Map();
    indexedRecords.forEach(record => combined.set(record.id, publicRecord(record)));
    fallbackRecords.forEach(record => {
      if (!combined.has(record.id)) combined.set(record.id, publicRecord(record));
    });
    return [...combined.values()];
  }

  async function getRecord(id) {
    try {
      const db = await openDb();
      const record = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error('Could not read the file record.'));
      });
      if (record) return record;
    } catch (_) {}
    return readFallback().find(item => item.id === id) || null;
  }

  async function getFileBlob(id) {
    const record = await getRecord(id);
    if (!record) return null;
    if (record.fileBlob instanceof Blob) return record.fileBlob;
    if (record.fileDataUrl) return blobFromDataUrl(record.fileDataUrl);
    return null;
  }

  async function updateRecord(changes) {
    if (!changes || !changes.id) return false;
    let updated = false;
    try {
      const db = await openDb();
      updated = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(changes.id);
        req.onsuccess = () => {
          if (!req.result) return;
          store.put({...req.result, ...changes});
        };
        req.onerror = () => reject(req.error || new Error('Could not update the file record.'));
        tx.oncomplete = () => resolve(Boolean(req.result));
        tx.onerror = () => reject(tx.error || new Error('Could not update the file record.'));
      });
    } catch (_) {}

    const fallback = readFallback();
    const index = fallback.findIndex(item => item.id === changes.id);
    if (index >= 0) {
      fallback[index] = {...fallback[index], ...changes};
      try {
        localStorage.setItem(META_KEY, JSON.stringify(fallback));
        updated = true;
      } catch (_) {}
    }
    return updated;
  }

  window.MRFileRepository = {
    saveUploads,
    listRecords,
    getRecord,
    getFileBlob,
    updateRecord
  };
})();
