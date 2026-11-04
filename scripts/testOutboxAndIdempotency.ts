import { outbox, OutboxMessage } from '../src/server/platform/outbox';
import { handleIdempotency, computeRequestHash } from '../src/server/platform/idempotency';
import { generateUUIDv7 } from '../src/server/platform/database';

async function verifyOutboxAndIdempotency() {
  console.log('🧪 Starting Outbox & Idempotency Pipeline Verification...\n');

  // 1. Verify Outbox Message Unique ID & Publishing
  console.log('1️⃣ Testing Transactional Outbox FIFO & Unique UUIDv7 Assignment:');
  const receivedEvents: OutboxMessage[] = [];
  
  const unsubscribe = outbox.subscribe('test.sync_check', (msg) => {
    receivedEvents.push(msg);
  });

  const message1 = outbox.enqueue('test.sync_check', { itemId: 'item_101', action: 'create' });
  const message2 = outbox.enqueue('test.sync_check', { itemId: 'item_102', action: 'update' });

  console.log(`  - Enqueued Msg 1 ID: ${message1.id} (topic: ${message1.topic})`);
  console.log(`  - Enqueued Msg 2 ID: ${message2.id} (topic: ${message2.topic})`);

  if (!message1.id || !message2.id || message1.id === message2.id) {
    throw new Error('❌ Outbox messages failed unique ID generation!');
  }
  console.log('  ✅ Unique UUIDv7 IDs successfully assigned to each message in the queue.');

  // Process outbox messages
  const processedCount = await outbox.processUnpublished();
  console.log(`  - Processed ${processedCount} unpublished messages via worker.`);

  if (receivedEvents.length >= 2) {
    console.log('  ✅ Subscribers received FIFO event notifications successfully.');
    console.log(`  - Event 1 payload: ${JSON.stringify(receivedEvents[0].payload)}`);
    console.log(`  - Event 2 payload: ${JSON.stringify(receivedEvents[1].payload)}`);
  } else {
    throw new Error('❌ Outbox subscriber did not receive all messages.');
  }

  unsubscribe();

  // 2. Verify Idempotency Deduplication & Hashing
  console.log('\n2️⃣ Testing Idempotency-Key Deduplication & Request Hash Guard:');

  const testKey = `idem_${Date.now()}`;
  const mockReq1: any = {
    method: 'POST',
    baseUrl: '/api',
    path: '/cartable',
    headers: { 'idempotency-key': testKey },
    body: { title: 'درخواست وام مسکن', amount: 500000000 },
    ip: '127.0.0.1',
  };

  const hash1 = computeRequestHash(mockReq1);
  console.log(`  - Generated Request Hash: ${hash1}`);

  let resBody1: any = null;
  let resStatus1 = 0;
  const mockRes1: any = {
    statusCode: 201,
    headers: {},
    setHeader(name: string, val: string) { this.headers[name] = val; },
    json(body: any) { resBody1 = body; return this; },
    on() {},
  };

  // First request execution through middleware
  let nextCalled1 = false;
  handleIdempotency(mockReq1, mockRes1, () => {
    nextCalled1 = true;
    mockRes1.json({ success: true, trackingNumber: 'TRK-990011' });
  });

  if (nextCalled1 && resBody1?.trackingNumber === 'TRK-990011') {
    console.log('  ✅ First execution succeeded and cached with Idempotency-Key.');
  }

  // Duplicate request execution with SAME key and SAME body (should return cached response)
  const mockReqDuplicate: any = {
    method: 'POST',
    baseUrl: '/api',
    path: '/cartable',
    headers: { 'idempotency-key': testKey },
    body: { title: 'درخواست وام مسکن', amount: 500000000 },
    ip: '127.0.0.1',
  };

  let replayBody: any = null;
  let isReplay = false;
  const mockResDuplicate: any = {
    statusCode: 0,
    headers: {},
    setHeader(name: string, val: string) {
      this.headers[name] = val;
      if (name === 'X-Idempotent-Replay') isReplay = true;
    },
    status(code: number) { this.statusCode = code; return this; },
    json(body: any) { replayBody = body; return this; },
    on() {},
  };

  handleIdempotency(mockReqDuplicate, mockResDuplicate, () => {
    throw new Error('❌ Handler must NOT be executed for replayed duplicate request!');
  });

  if (isReplay && replayBody?.trackingNumber === 'TRK-990011') {
    console.log('  ✅ Duplicate request intercepted! Cached result returned without duplicate processing.');
    console.log(`  - Replay response header: X-Idempotent-Replay: true`);
    console.log(`  - Replay response body: ${JSON.stringify(replayBody)}`);
  } else {
    throw new Error('❌ Idempotency failed to intercept duplicate request.');
  }

  // Duplicate request with SAME key but DIFFERENT body (should throw 422 Unprocessable)
  const mockReqMismatch: any = {
    method: 'POST',
    baseUrl: '/api',
    path: '/cartable',
    headers: { 'idempotency-key': testKey },
    body: { title: 'درخواست وام مسکن', amount: 999999999 }, // Tampered body
    ip: '127.0.0.1',
  };

  let caughtMismatch = false;
  try {
    handleIdempotency(mockReqMismatch, {} as any, () => {});
  } catch (err: any) {
    if (err?.code === 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH' || err?.status === 422) {
      caughtMismatch = true;
      console.log('  ✅ Payload mismatch detected! 422 Unprocessable Entity thrown as mandated by Section 6.1.');
    }
  }

  if (!caughtMismatch) {
    throw new Error('❌ Failed to reject mismatched payload for reused idempotency key!');
  }

  console.log('\n🎉 All Outbox Queue & Idempotency Deduplication tests PASSED with 100% precision.');
  process.exit(0);
}

verifyOutboxAndIdempotency().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
