/* CodeMentor — tiny promise wrapper around IndexedDB (all data stays on this device) */
(function () {
  'use strict';
  const CM = (window.CM = window.CM || {});
  const DB_NAME = 'codementor';
  const DB_VERSION = 1;
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) { reject(new Error('IndexedDB is not available in this browser.')); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        const make = (name, indexes, unique) => {
          if (db.objectStoreNames.contains(name)) return;
          const s = db.createObjectStore(name, { keyPath: 'id' });
          (indexes || []).forEach((i) => s.createIndex(i, i, { unique: !!(unique && unique.indexOf(i) >= 0) }));
        };
        make('users', ['username'], ['username']);
        make('devices', ['userId']);
        make('sessions', ['userId']);
        make('conversations', ['userId']);
        make('messages', ['convId', 'userId']);
        make('snippets', ['userId']);
        make('events', ['userId']);
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => { db.close(); location.reload(); };
        resolve(db);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('Database is open in another tab with an older version. Close other CodeMentor tabs and reload.'));
    });
    return dbPromise;
  }

  function run(store, mode, fn) {
    return open().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const s = tx.objectStore(store);
      let result;
      const r = fn(s);
      if (r && typeof r === 'object' && 'onsuccess' in r) r.onsuccess = () => { result = r.result; };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    }));
  }

  CM.db = {
    open,
    get: (store, id) => run(store, 'readonly', (s) => s.get(id)),
    put: (store, obj) => run(store, 'readwrite', (s) => s.put(obj)).then(() => obj),
    del: (store, id) => run(store, 'readwrite', (s) => s.delete(id)),
    all: (store) => run(store, 'readonly', (s) => s.getAll()),
    byIndex: (store, index, value) => run(store, 'readonly', (s) => s.index(index).getAll(value)),
    one: (store, index, value) => run(store, 'readonly', (s) => s.index(index).get(value)),
    clear: (store) => run(store, 'readwrite', (s) => s.clear()),
    putMany: (store, list) => open().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const s = tx.objectStore(store);
      list.forEach((o) => s.put(o));
      tx.oncomplete = () => resolve(list);
      tx.onerror = () => reject(tx.error);
    })),
    delByIndex: (store, index, value) => open().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).index(index).openCursor(IDBKeyRange.only(value));
      req.onsuccess = () => { const c = req.result; if (c) { c.delete(); c.continue(); } };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }))
  };
})();
