/* mediaStore.js — on-device audio blob storage (prototype).
 *
 * Audio files are large, so they go in IndexedDB (not localStorage). Keyed by
 * the summary slug. This is the local stand-in for Supabase Storage (docs/05):
 * later, putAudio/getAudio get reimplemented against the storage bucket and the
 * blob URL becomes the public file URL — the player code (store.jsx) is unchanged.
 *
 * All functions degrade safely when IndexedDB is unavailable (SSR/headless):
 * getAudio -> null (player falls back to simulated playback).
 */
const DB_NAME = 'mze_media';
const STORE = 'audio';
const VERSION = 1;

function hasIDB() {
  return typeof indexedDB !== 'undefined' && !!indexedDB;
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!hasIDB()) return reject(new Error('no-indexeddb'));
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putAudio(slug, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, slug);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAudio(slug) {
  if (!hasIDB()) return null;
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const rq = tx.objectStore(STORE).get(slug);
      rq.onsuccess = () => resolve(rq.result || null);
      rq.onerror = () => reject(rq.error);
    });
  } catch { return null; }
}

export async function deleteAudio(slug) {
  if (!hasIDB()) return;
  try {
    const db = await openDB();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(slug);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch { /* ignore */ }
}
