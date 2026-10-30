import crypto from 'crypto';
import { logger } from './logger';

export interface OutboxMessage {
  id: string;
  topic: string;
  payload: unknown;
  createdAt: string;
  publishedAt: string | null;
}

export type OutboxSubscriber = (message: OutboxMessage) => Promise<void> | void;

function generateUUIDv7(): string {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0');
  const randomBytes = crypto.randomBytes(10).toString('hex');
  
  const part1 = timeHex.slice(0, 8);
  const part2 = timeHex.slice(8, 12);
  const part3 = '7' + randomBytes.slice(0, 3);
  const part4 = ((parseInt(randomBytes.slice(3, 4), 16) & 0x3) | 0x8).toString(16) + randomBytes.slice(4, 7);
  const part5 = randomBytes.slice(7, 19);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

export class TransactionalOutbox {
  private subscribers: Map<string, OutboxSubscriber[]> = new Map();
  private messages: OutboxMessage[] = [];
  private pollInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor() {
    this.startWorker();
  }

  /**
   * Adds an event to the outbox queue inside a transaction
   */
  public enqueue(topic: string, payload: Record<string, unknown>): OutboxMessage {
    const entry: OutboxMessage = {
      id: generateUUIDv7(),
      topic,
      payload,
      createdAt: new Date().toISOString(),
      publishedAt: null,
    };

    this.messages.push(entry);
    return entry;
  }

  /**
   * Subscribes a listener to a specific topic or '*'
   */
  public subscribe(topic: string, subscriber: OutboxSubscriber): () => void {
    const list = this.subscribers.get(topic) || [];
    list.push(subscriber);
    this.subscribers.set(topic, list);

    return () => {
      const current = this.subscribers.get(topic) || [];
      this.subscribers.set(topic, current.filter(s => s !== subscriber));
    };
  }

  /**
   * Background outbox poller worker (simulates SELECT ... FOR UPDATE SKIP LOCKED)
   */
  public async processUnpublished(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    try {
      const unpublished = this.messages.filter(item => item.publishedAt === null).slice(0, 50);
      if (unpublished.length === 0) return 0;

      for (const item of unpublished) {
        const listeners = [
          ...(this.subscribers.get(item.topic) || []),
          ...(this.subscribers.get('*') || []),
        ];

        for (const listener of listeners) {
          try {
            await listener(item);
          } catch (err: any) {
            logger.error(`Error in outbox subscriber for topic [${item.topic}]: ${err.message}`, {
              error: { name: err.name, message: err.message, stack: err.stack },
            });
          }
        }

        item.publishedAt = new Date().toISOString();
      }

      return unpublished.length;
    } finally {
      this.isProcessing = false;
    }
  }

  private startWorker(): void {
    this.pollInterval = setInterval(() => {
      this.processUnpublished().catch(err => {
        logger.error(`Outbox worker error: ${err.message}`);
      });
    }, 1000);
  }

  public stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

export const outbox = new TransactionalOutbox();
