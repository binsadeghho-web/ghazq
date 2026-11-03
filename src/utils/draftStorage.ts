/**
 * IndexedDB Draft Storage for long-form user inputs (Section 7 & Item 15)
 * - Persists unsaved drafts of research proposals, ruling critiques, and lengthy requests.
 * - Sensitive credentials (passwords, PINs, tokens) are EXCLUDED by design.
 * - Automatically purges on user logout to prevent data residue on shared machines.
 */

const DB_NAME = 'fegh_ghaza_drafts_db';
const DB_VERSION = 1;
const STORE_NAME = 'form_drafts';

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

// Item 9: Strict prohibition of sensitive domains in IndexedDB
const PROHIBITED_DRAFT_PATTERNS = [
  /counseling/i,    // مشاوره و روانشناسی
  /synergy/i,       // پست‌های هم‌افزایی و هویت ناشناس
  /anonymous/i,     // محتوای ناشناس
  /order/i,         // سفارشات و خرید
  /financial/i,     // اطلاعات مالی و حساب
  /welfare/i,       // درخواست‌های وام و تسهیلات رفاهی
  /payment/i,       // پرداخت‌ها
];

export async function saveFormDraft(key: string, data: Record<string, any>): Promise<void> {
  // Enforce policy: Only non-sensitive forms (e.g. research_proposal, article_draft) allowed
  if (PROHIBITED_DRAFT_PATTERNS.some(pattern => pattern.test(key))) {
    throw new Error(`خطای امنیتی: ذخیره‌سازی پیش‌نویس در IndexedDB برای کلید '${key}' (مشاوره، هم‌افزایی ناشناس، سفارشات و داده‌های مالی) اکیداً ممنوع است.`);
  }

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Sanitize sensitive credentials before saving
    const sanitized = { ...data };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.nationalId;
    delete sanitized.pin;

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
  }
}

export async function getFormDraft<T = Record<string, any>>(key: string): Promise<T | null> {
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
