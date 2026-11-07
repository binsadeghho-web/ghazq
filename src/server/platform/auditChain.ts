import crypto from 'crypto';
import { AuditLog, UserRole } from '../../types';
import { INITIAL_AUDIT_LOGS } from '../../data/mockData';

export interface TamperEvidentAuditEntry extends AuditLog {
  prevHash: string;
  currentHash: string;
  sequenceNumber: number;
}

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export class TamperEvidentAuditService {
  private chain: TamperEvidentAuditEntry[] = [];

  constructor() {
    this.initializeFromSeed();
  }

  private canonicalSerialize(obj: Record<string, unknown>): string {
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sortedObj[key] = obj[key];
    }
    return JSON.stringify(sortedObj);
  }

  private initializeFromSeed(): void {
    let lastHash = GENESIS_HASH;
    let seq = 1;

    for (const log of INITIAL_AUDIT_LOGS) {
      const canonical = this.canonicalSerialize({
        id: log.id,
        timestamp: log.timestamp,
        eventType: log.eventType,
        actorId: log.actorId,
        actorRole: log.actorRole,
        ip: log.ip,
        details: log.details,
        severity: log.severity,
      });

      const currentHash = crypto
        .createHash('sha256')
        .update(`${lastHash}:${canonical}`)
        .digest('hex');

      this.chain.push({
        ...log,
        prevHash: lastHash,
        currentHash,
        sequenceNumber: seq++,
      });

      lastHash = currentHash;
    }
  }

  /**
   * Append-only tamper-evident audit record (Section 10)
   */
  public appendEntry(entry: {
    eventType: AuditLog['eventType'];
    actorId: string;
    actorName: string;
    actorRole: UserRole;
    ip: string;
    details: string;
    severity?: 'info' | 'warning' | 'critical';
    timestamp?: string;
  }): TamperEvidentAuditEntry {
    const lastHash = this.chain.length > 0 ? this.chain[this.chain.length - 1].currentHash : GENESIS_HASH;
    const seq = this.chain.length + 1;
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = entry.timestamp || new Date().toISOString();
    const severity = entry.severity || 'info';

    const canonical = this.canonicalSerialize({
      id,
      timestamp,
      eventType: entry.eventType,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      ip: entry.ip,
      details: entry.details,
      severity,
    });

    const currentHash = crypto
      .createHash('sha256')
      .update(`${lastHash}:${canonical}`)
      .digest('hex');

    const chainedEntry: TamperEvidentAuditEntry = {
      id,
      timestamp,
      ...entry,
      severity,
      prevHash: lastHash,
      currentHash,
      sequenceNumber: seq,
    };

    this.chain.unshift(chainedEntry);
    return chainedEntry;
  }

  // Alias for backward compatibility
  public append(entry: Parameters<TamperEvidentAuditService['appendEntry']>[0]): TamperEvidentAuditEntry {
    return this.appendEntry(entry);
  }

  /**
   * Cryptographically verifies the entire audit log hash-chain.
   * Returns verification status and details.
   */
  public verifyIntegrity(): { isValid: boolean; totalRecords: number; checkedCount: number; brokenAt?: number; headHash?: string; message: string } {
    if (this.chain.length === 0) {
      return { isValid: true, totalRecords: 0, checkedCount: 0, message: 'زنجیره وقایع خالی است.' };
    }

    // Verify in chronological order
    const chronological = [...this.chain].reverse();
    let expectedPrev = GENESIS_HASH;

    for (let i = 0; i < chronological.length; i++) {
      const entry = chronological[i];

      if (entry.prevHash !== expectedPrev) {
        return {
          isValid: false,
          totalRecords: this.chain.length,
          checkedCount: i,
          brokenAt: entry.sequenceNumber,
          message: `انحراف امنیتی: مغایرت هش پیشین در بلوک شماره ${entry.sequenceNumber}`,
        };
      }

      const canonical = this.canonicalSerialize({
        id: entry.id,
        timestamp: entry.timestamp,
        eventType: entry.eventType,
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        ip: entry.ip,
        details: entry.details,
        severity: entry.severity,
      });

      const recalculatedHash = crypto
        .createHash('sha256')
        .update(`${expectedPrev}:${canonical}`)
        .digest('hex');

      if (recalculatedHash !== entry.currentHash) {
        return {
          isValid: false,
          totalRecords: this.chain.length,
          checkedCount: i,
          brokenAt: entry.sequenceNumber,
          message: `انحراف امنیتی: دستکاری در داده‌های بلوک شماره ${entry.sequenceNumber}`,
        };
      }

      expectedPrev = entry.currentHash;
    }

    return {
      isValid: true,
      totalRecords: this.chain.length,
      checkedCount: this.chain.length,
      headHash: this.chain[0]?.currentHash,
      message: 'زنجیره وقایع امنیتی با الگوریتم SHA-256 کامل و دست‌نخورده است.',
    };
  }

  public getAll(): TamperEvidentAuditEntry[] {
    return [...this.chain];
  }

  public getEntries(): TamperEvidentAuditEntry[] {
    return this.getAll();
  }

  public getAuditLogs(): TamperEvidentAuditEntry[] {
    return this.getAll();
  }
}

export const auditChain = new TamperEvidentAuditService();
