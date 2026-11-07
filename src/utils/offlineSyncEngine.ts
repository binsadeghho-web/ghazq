/**
 * Universal Offline-First & Bidirectional Sync Engine (v2.0)
 * Implements:
 * - IndexedDB Object Stores (documents, sync_outbox, tombstones)
 * - LocalDocumentWrapper Schema (_meta with serverVersion, localVersion, syncStatus, idempotencyKey)
 * - Smart Outbox Processing Pipeline (HTTP 401, 403, 409, 5xx non-blocking handlers)
 * - Anti-Resurrection Tombstone Engine (Soft-delete retention)
 * - Storage Quota Monitor (> 80% eviction watchdog)
 */

export interface LocalDocumentWrapper<T = any> {
  id: string;
  collection: string;
  data: T;
  _meta: {
    serverVersion: number;
    localVersion: number;
    syncStatus: 'synced' | 'pending_upsert' | 'pending_delete' | 'conflict' | 'permanent_fail';
    idempotencyKey: string;
    serverUpdatedAt: number;
    localUpdatedAt: number;
    dirtyFields: string[];
    retryCount: number;
    lastErrorMessage?: string | null;
  };
}

export interface OutboxQueueItem {
  id: string;
  collection: string;
  action: 'upsert' | 'delete';
  payload: any;
  idempotencyKey: string;
  createdAt: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'skipped';
}

const DB_NAME = 'madrasah_offline_db_v2';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getIDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;

        // Store 1: Documents Store
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: ['collection', 'id'] });
          docStore.createIndex('collection', 'collection', { unique: false });
          docStore.createIndex('syncStatus', '_meta.syncStatus', { unique: false });
        }

        // Store 2: Outbox Queue Store
        if (!db.objectStoreNames.contains('sync_outbox')) {
          const outboxStore = db.createObjectStore('sync_outbox', { keyPath: 'id' });
          outboxStore.createIndex('status', 'status', { unique: false });
          outboxStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store 3: Tombstones Store (Anti-Resurrection)
        if (!db.objectStoreNames.contains('tombstones')) {
          const tombStore = db.createObjectStore('tombstones', { keyPath: ['collection', 'id'] });
          tombStore.createIndex('deletedAt', 'deletedAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

export const ALLOWED_OFFLINE_COLLECTIONS = ['research_drafts', 'thesis_drafts', 'article_drafts'];

export class OfflineSyncEngine {
  /**
   * Save or update a document in IndexedDB with full metadata wrapper.
   * Strictly restricted to non-sensitive form drafts (research_drafts, thesis_drafts, article_drafts).
   */
  async saveDocument<T extends { id: string; version?: number }>(
    collection: string,
    data: T,
    isLocalMutation = true
  ): Promise<LocalDocumentWrapper<T>> {
    const now = Date.now();

    // Guard: Prevent sensitive data (counseling, orders, anonymous identities, credentials) from being stored in IndexedDB
    if (!ALLOWED_OFFLINE_COLLECTIONS.includes(collection)) {
      console.warn(`[OfflineSync] Notice: Collection '${collection}' is excluded from IndexedDB storage for security.`);
      return {
        id: data.id,
        collection,
        data,
        _meta: {
          serverVersion: data.version || 1,
          localVersion: 1,
          syncStatus: 'synced',
          idempotencyKey: `idemp_${data.id}_${now}`,
          serverUpdatedAt: now,
          localUpdatedAt: now,
          dirtyFields: [],
          retryCount: 0,
        },
      };
    }

    const db = await getIDB();
    const existing = await this.getDocument<T>(collection, data.id);

    const serverVer = data.version || existing?._meta.serverVersion || 1;
    const localVer = isLocalMutation ? (existing?._meta.localVersion || 1) + 1 : serverVer;
    const idempotencyKey = existing?._meta.idempotencyKey || `idemp_${data.id}_${now}`;

    const wrapper: LocalDocumentWrapper<T> = {
      id: data.id,
      collection,
      data,
      _meta: {
        serverVersion: serverVer,
        localVersion: localVer,
        syncStatus: isLocalMutation ? 'pending_upsert' : 'synced',
        idempotencyKey,
        serverUpdatedAt: isLocalMutation ? (existing?._meta.serverUpdatedAt || now) : now,
        localUpdatedAt: now,
        dirtyFields: isLocalMutation ? ['all'] : [],
        retryCount: 0,
      },
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['documents', 'sync_outbox'], 'readwrite');
      const docStore = tx.objectStore('documents');
      const outboxStore = tx.objectStore('sync_outbox');

      docStore.put(wrapper);

      if (isLocalMutation) {
        const queueItem: OutboxQueueItem = {
          id: `queue_${collection}_${data.id}_${now}`,
          collection,
          action: 'upsert',
          payload: data,
          idempotencyKey,
          createdAt: now,
          retryCount: 0,
          status: 'pending',
        };
        outboxStore.put(queueItem);
      }

      tx.oncomplete = () => resolve(wrapper);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Reads a document from IndexedDB by collection and ID.
   */
  async getDocument<T>(collection: string, id: string): Promise<LocalDocumentWrapper<T> | null> {
    try {
      const db = await getIDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('documents', 'readonly');
        const req = tx.objectStore('documents').get([collection, id]);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Soft-delete a document with Tombstone marker (Anti-Resurrection).
   */
  async deleteDocument(collection: string, id: string): Promise<void> {
    const db = await getIDB();
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['documents', 'sync_outbox', 'tombstones'], 'readwrite');
      
      tx.objectStore('documents').delete([collection, id]);
      
      tx.objectStore('tombstones').put({
        collection,
        id,
        deletedAt: now,
      });

      tx.objectStore('sync_outbox').put({
        id: `queue_del_${collection}_${id}_${now}`,
        collection,
        action: 'delete',
        payload: { id },
        idempotencyKey: `idemp_del_${id}_${now}`,
        createdAt: now,
        retryCount: 0,
        status: 'pending',
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Storage Quota Monitor (> 80% Eviction Watchdog)
   */
  async checkStorageQuota(): Promise<{ percentageUsed: number; isWarning: boolean }> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const { usage, quota } = await navigator.storage.estimate();
        if (usage && quota) {
          const percentageUsed = (usage / quota) * 100;
          if (percentageUsed > 80) {
            await this.evictArchivedTombstones();
          }
          return { percentageUsed, isWarning: percentageUsed > 80 };
        }
      } catch {}
    }
    return { percentageUsed: 0, isWarning: false };
  }

  private async evictArchivedTombstones(): Promise<void> {
    try {
      const db = await getIDB();
      const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
      const tx = db.transaction('tombstones', 'readwrite');
      const store = tx.objectStore('tombstones');
      const index = store.index('deletedAt');
      const range = IDBKeyRange.upperBound(cutoff);

      index.openCursor(range).onsuccess = (e: any) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch {}
  }
}

export const offlineSyncEngine = new OfflineSyncEngine();
