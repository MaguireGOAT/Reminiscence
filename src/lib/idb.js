const DB_NAME = "reminiscence-db";
const DB_VERSION = 2;

let dbPromise;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const store of ["library", "plans", "logs", "meta", "media"]) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: "id" });
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

function tx(db, store, mode = "readonly") {
  return db.transaction(store, mode).objectStore(store);
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGetAll(store) {
  const db = await openDb();
  return requestToPromise(tx(db, store).getAll());
}

export async function idbGet(store, key) {
  const db = await openDb();
  return requestToPromise(tx(db, store).get(key));
}

export async function idbPut(store, value) {
  const db = await openDb();
  return requestToPromise(tx(db, store, "readwrite").put(value));
}

export async function idbDelete(store, key) {
  const db = await openDb();
  return requestToPromise(tx(db, store, "readwrite").delete(key));
}

export async function idbClear(store) {
  const db = await openDb();
  return requestToPromise(tx(db, store, "readwrite").clear());
}
