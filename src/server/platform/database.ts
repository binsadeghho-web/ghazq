import crypto from 'crypto';
import {
  User,
  CartableRequest,
  Course,
  CourseEnrollment,
  Product,
  Consultant,
  CounselingRequest,
  ResearchMentorship,
  JudicialRuling,
  WelfareRequest,
  ConsumableItem,
  ConsumableOrder,
  SynergyPost,
  MemberProductProposal,
  SystemSecurityConfig,
} from '../../types';
import {
  INITIAL_USERS,
  INITIAL_CARTABLE_REQUESTS,
  INITIAL_COURSES,
  INITIAL_COURSE_ENROLLMENTS,
  INITIAL_PRODUCTS,
  INITIAL_CONSULTANTS,
  INITIAL_COUNSELING_REQUESTS,
  INITIAL_RESEARCH_MENTORSHIPS,
  INITIAL_RULINGS,
  INITIAL_WELFARE_REQUESTS,
  INITIAL_CONSUMABLES,
  INITIAL_CONSUMABLE_ORDERS,
  INITIAL_SYNERGY_POSTS,
  INITIAL_PRODUCT_PROPOSALS,
  INITIAL_SECURITY_CONFIG,
} from '../../data/mockData';
import { AppError } from './errors';
import { auditChain } from './auditChain';
import { outbox } from './outbox';
import { logger } from './logger';

export function generateUUIDv7(): string {
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

export interface DatabaseState {
  users: (User & { version: number })[];
  cartableRequests: (CartableRequest & { version: number })[];
  courses: (Course & { version: number })[];
  courseEnrollments: (CourseEnrollment & { version: number })[];
  products: (Product & { version: number })[];
  consultants: (Consultant & { version: number })[];
  counselingRequests: (CounselingRequest & { version: number })[];
  researchMentorships: (ResearchMentorship & { version: number })[];
  rulings: (JudicialRuling & { version: number })[];
  welfareRequests: (WelfareRequest & { version: number })[];
  consumables: (ConsumableItem & { version: number })[];
  consumableOrders: (ConsumableOrder & { version: number })[];
  synergyPosts: (SynergyPost & { version: number })[];
  productProposals: (MemberProductProposal & { version: number })[];
  securityConfig: SystemSecurityConfig;
  outbox: Array<{
    id: string;
    topic: string;
    payload: unknown;
    createdAt: string;
    publishedAt: string | null;
  }>;
}

function cloneDeep<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export class InMemoryDatabaseEngine {
  private state: DatabaseState;
  private isTransactionActive = false;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): DatabaseState {
    const addVersion = <T extends { id: string }>(items: T[]): (T & { version: number })[] =>
      items.map(item => ({ ...item, version: 1 }));

    return {
      users: addVersion(cloneDeep(INITIAL_USERS)),
      cartableRequests: addVersion(cloneDeep(INITIAL_CARTABLE_REQUESTS)),
      courses: addVersion(cloneDeep(INITIAL_COURSES)),
      courseEnrollments: addVersion(cloneDeep(INITIAL_COURSE_ENROLLMENTS)),
      products: addVersion(cloneDeep(INITIAL_PRODUCTS)),
      consultants: addVersion(cloneDeep(INITIAL_CONSULTANTS)),
      counselingRequests: addVersion(cloneDeep(INITIAL_COUNSELING_REQUESTS)),
      researchMentorships: addVersion(cloneDeep(INITIAL_RESEARCH_MENTORSHIPS)),
      rulings: addVersion(cloneDeep(INITIAL_RULINGS)),
      welfareRequests: addVersion(cloneDeep(INITIAL_WELFARE_REQUESTS)),
      consumables: addVersion(cloneDeep(INITIAL_CONSUMABLES)),
      consumableOrders: addVersion(cloneDeep(INITIAL_CONSUMABLE_ORDERS)),
      synergyPosts: addVersion(cloneDeep(INITIAL_SYNERGY_POSTS)),
      productProposals: addVersion(cloneDeep(INITIAL_PRODUCT_PROPOSALS)),
      securityConfig: cloneDeep(INITIAL_SECURITY_CONFIG),
      outbox: [],
    };
  }

  // Getters for easy direct access
  get users() { return this.state.users; }
  get cartableRequests() { return this.state.cartableRequests; }
  get courses() { return this.state.courses; }
  get courseEnrollments() { return this.state.courseEnrollments; }
  get products() { return this.state.products; }
  get consultants() { return this.state.consultants; }
  get counselingRequests() { return this.state.counselingRequests; }
  get researchMentorships() { return this.state.researchMentorships; }
  get rulings() { return this.state.rulings; }
  get welfareRequests() { return this.state.welfareRequests; }
  get consumables() { return this.state.consumables; }
  get consumableOrders() { return this.state.consumableOrders; }
  get synergyPosts() { return this.state.synergyPosts; }
  get productProposals() { return this.state.productProposals; }
  get securityConfig() { return this.state.securityConfig; }
  set securityConfig(cfg: SystemSecurityConfig) { this.state.securityConfig = cfg; }
  get outbox() { return this.state.outbox; }

  checkReady(): boolean {
    return Boolean(this.state && this.state.users && this.state.users.length > 0);
  }

  seedDatabase(): void {
    this.resetToDefault();
  }

  resetToDefault(): void {
    this.state = this.getInitialState();
    logger.info('Database state reset to default seed');
  }

  getState(): Readonly<DatabaseState> {
    return this.state;
  }

  /**
   * Optimistic Concurrency Update
   */
  updateWithOptimisticLock<T extends { id: string; version: number }>(
    collection: T[],
    id: string,
    expectedVersion: number,
    updater: (current: T) => Partial<T>
  ): T {
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) {
      throw AppError.notFound(`رکورد با شناسه ${id}`);
    }

    const current = collection[index];
    if (current.version !== expectedVersion) {
      throw AppError.conflict(
        `تداخل در همزمانی داده‌ها (نسخه کنونی: ${current.version}، نسخه درخواستی: ${expectedVersion}).`
      );
    }

    const updates = updater(current);
    const updated: T = {
      ...current,
      ...updates,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    } as any;

    collection[index] = updated;
    return updated;
  }

  /**
   * Unit of Work / Transaction Runner
   */
  async withTx<T>(fn: (tx: DatabaseTransaction) => Promise<T>): Promise<T> {
    while (this.isTransactionActive) {
      await new Promise(r => setTimeout(r, 5));
    }
    this.isTransactionActive = true;

    const snapshot = cloneDeep(this.state);
    const stagedOutboxEvents: Array<{ topic: string; payload: Record<string, unknown> }> = [];
    const stagedAuditEvents: Array<Parameters<typeof auditChain.appendEntry>[0]> = [];

    const tx = new DatabaseTransaction(this.state, stagedOutboxEvents, stagedAuditEvents);

    try {
      const result = await fn(tx);

      for (const event of stagedOutboxEvents) {
        outbox.enqueue(event.topic, event.payload);
      }
      for (const log of stagedAuditEvents) {
        auditChain.appendEntry(log);
      }

      return result;
    } catch (err) {
      this.state = snapshot;
      logger.warn(`Transaction aborted and rolled back: ${(err as Error).message}`);
      throw err;
    } finally {
      this.isTransactionActive = false;
    }
  }
}

export class DatabaseTransaction {
  constructor(
    private state: DatabaseState,
    private stagedOutbox: Array<{ topic: string; payload: Record<string, unknown> }>,
    private stagedAudit: Array<Parameters<typeof auditChain.appendEntry>[0]>
  ) {}

  get users() { return this.state.users; }
  get cartableRequests() { return this.state.cartableRequests; }
  get courses() { return this.state.courses; }
  get courseEnrollments() { return this.state.courseEnrollments; }
  get products() { return this.state.products; }
  get consultants() { return this.state.consultants; }
  get counselingRequests() { return this.state.counselingRequests; }
  get researchMentorships() { return this.state.researchMentorships; }
  get rulings() { return this.state.rulings; }
  get welfareRequests() { return this.state.welfareRequests; }
  get consumables() { return this.state.consumables; }
  get consumableOrders() { return this.state.consumableOrders; }
  get synergyPosts() { return this.state.synergyPosts; }
  get productProposals() { return this.state.productProposals; }
  get securityConfig() { return this.state.securityConfig; }
  set securityConfig(cfg: SystemSecurityConfig) { this.state.securityConfig = cfg; }
  get outbox() { return this.state.outbox; }

  updateVersioned<T extends { id: string; version: number }>(
    collection: T[],
    id: string,
    expectedVersion: number,
    updater: (current: T) => Partial<T>
  ): T {
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) {
      throw AppError.notFound(`رکورد با شناسه ${id}`);
    }

    const current = collection[index];
    if (current.version !== expectedVersion) {
      throw AppError.conflict(
        `تداخل در همزمانی داده‌ها (نسخه کنونی: ${current.version}، نسخه درخواستی: ${expectedVersion}).`
      );
    }

    const updates = updater(current);
    const updated: T = {
      ...current,
      ...updates,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    } as any;

    collection[index] = updated;
    return updated;
  }

  emitOutbox(topic: string, payload: Record<string, unknown>): void {
    this.stagedOutbox.push({ topic, payload });
  }

  emitAudit(log: Parameters<typeof auditChain.appendEntry>[0]): void {
    this.stagedAudit.push(log);
  }
}

export const db = new InMemoryDatabaseEngine();
