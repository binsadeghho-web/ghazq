/**
 * Multi-Tab Synchronization Engine (Section 8 of Sync Blueprint)
 * Broadcasts local mutations across all open browser tabs using BroadcastChannel API.
 */

export interface BroadcastPayload {
  type: 'APP_DATA_CHANGED' | 'SESSION_REVOKED' | 'THEME_CHANGED' | 'CACHE_INVALIDATED';
  collection?: string;
  action?: 'upsert' | 'delete' | 'clear';
  id?: string;
  version?: number;
  timestamp: number;
}

const CHANNEL_NAME = 'madrasah_local_sync';
let broadcastChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel unavailable
}

/**
 * Broadcasts a local data change or session update to all open tabs.
 */
export function broadcastDataChange(
  collection: string,
  action: 'upsert' | 'delete' | 'clear',
  id?: string,
  version = 1
): void {
  const payload: BroadcastPayload = {
    type: 'APP_DATA_CHANGED',
    collection,
    action,
    id,
    version,
    timestamp: Date.now(),
  };

  try {
    broadcastChannel?.postMessage(payload);
  } catch {
    // Ignore postMessage failure
  }

  // Also dispatch window CustomEvent for the local tab
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(`local_update_${collection}`, { detail: { id, action, version } })
    );
  }
}

/**
 * Broadcasts a session revocation event (e.g. global logout from another tab).
 */
export function broadcastSessionRevoked(): void {
  const payload: BroadcastPayload = {
    type: 'SESSION_REVOKED',
    timestamp: Date.now(),
  };
  try {
    broadcastChannel?.postMessage(payload);
  } catch {}
}

/**
 * Subscribes to broadcast messages from other open tabs.
 */
export function subscribeToTabBroadcast(onMessage: (payload: BroadcastPayload) => void): () => void {
  if (!broadcastChannel) {
    return () => {};
  }

  const handler = (event: MessageEvent<BroadcastPayload>) => {
    if (event.data) {
      onMessage(event.data);
    }
  };

  broadcastChannel.addEventListener('message', handler);
  return () => {
    broadcastChannel?.removeEventListener('message', handler);
  };
}
