/**
 * IndexedDB Draft Storage for long-form user inputs (Section 7 & Item 10)
 * - Persists unsaved drafts of research proposals, ruling critiques, and lengthy academic texts.
 * - STRICT WHITELIST: Only pre-approved non-sensitive form keys are allowed.
 * - Any unapproved key (counseling, financial, synergy, auth, passwords) is rejected immediately.
 * - Automatically purges on user logout to prevent data residue on shared machines.
 */

const DB_NAME = 'fegh_ghaza_drafts_db';
const DB_VERSION = 1;
const STORE_NAME = 'form_drafts';

// Item 10: Strict Whitelist of approved non-sensitive form keys
export const ALLOWED_DRAFT_KEYS = new Set([
  'research-proposal',
  'article-draft',
  'ruling-critique-draft',
  'thesis-proposal-draft',
  'scientific-essay-draft',
]);

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in current environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function isDraftKeyAllowed(key: string): boolean {
  return ALLOWED_DRAFT_KEYS.has(key);
}

export async function saveFormDraft(key: string, data: Record<string, any>): Promise<void> {
  // Item 10: Enforce strict whitelist
  if (!ALLOWED_DRAFT_KEYS.has(key)) {
    throw new Error(`خطای امنیتی: کلید پیش‌نویس '${key}' در لیست سفید مجاز IndexedDB قرار ندارد. ذخیره‌سازی رد شد.`);
  }

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Defense in depth: sanitize any credential property if present
    const sanitized = { ...data };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.nationalId;
    delete sanitized.pin;
    delete sanitized.otp;

    store.put({
      key,
      data: sanitized,
      savedAt: new Date().toISOString(),
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save draft to IndexedDB:', err);
    throw err;
  }
}

export async function getFormDraft<T = Record<string, any>>(key: string): Promise<T | null> {
  if (!ALLOWED_DRAFT_KEYS.has(key)) {
    return null;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        resolve(request.result ? (request.result.data as T) : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearFormDraft(key: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
  } catch {
    // ignore cleanup errors
  }
}

export async function clearAllDrafts(): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {
    console.warn('Error clearing IndexedDB drafts:', err);
  }
}
