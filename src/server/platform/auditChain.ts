import crypto from 'crypto';
import { AuditLog, UserRole } from '../../types';
import { INITIAL_AUDIT_LOGS } from '../../data/mockData';
import { getPool, isDatabaseConnected } from './mysqlDatabase';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from './uuidv7';
import { logger } from './logger';

export interface TamperEvidentAuditEntry extends AuditLog {
  prevHash: string;
  currentHash: string;
  sequenceNumber: number;
}

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export class TamperEvidentAuditService {
  private chain: TamperEvidentAuditEntry[] = [];
  private dbHydrated = false;
  private writeQueue: Promise<void> = Promise.resolve();

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

  private computeHash(prevHash: string, entry: {
    id: string;
    timestamp: string;
    eventType: string;
    actorId: string;
    actorRole: string;
    ip: string;
    details: string;
    severity: string;
  }): string {
    const canonical = this.canonicalSerialize(entry);
    return crypto
      .createHash('sha256')
      .update(`${prevHash}:${canonical}`)
      .digest('hex');
  }

  private initializeFromSeed(): void {
    let lastHash = GENESIS_HASH;
    let seq = 1;

    for (const log of INITIAL_AUDIT_LOGS) {
      const currentHash = this.computeHash(lastHash, {
        id: log.id,
        timestamp: log.timestamp,
        eventType: log.eventType,
        actorId: log.actorId,
        actorRole: log.actorRole,
        ip: log.ip,
        details: log.details,
        severity: log.severity,
      });

      this.chain.push({
        ...log,
        prevHash: lastHash,
        currentHash,
        sequenceNumber: seq++,
      });

      lastHash = currentHash;
    }
  }

  private mapDbRow(row: any, seqFallback: number): TamperEvidentAuditEntry {
    return {
      id: Buffer.isBuffer(row.id) ? fromIdBuffer(row.id) : String(row.id),
      timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
      eventType: row.event_type as AuditLog['eventType'],
      actorId: String(row.actor_id || ''),
      actorName: String(row.actor_name || ''),
      actorRole: (row.actor_role || 'alumni') as UserRole,
      ip: String(row.ip || '127.0.0.1'),
      details: String(row.details || ''),
      severity: (row.severity || 'info') as 'info' | 'warning' | 'critical',
      prevHash: String(row.prev_hash || GENESIS_HASH),
      currentHash: String(row.entry_hash || ''),
      sequenceNumber: Number(row.sequence_num || seqFallback),
    };
  }

  private async hydrateFromDbIfNeeded(): Promise<void> {
    if (!isDatabaseConnected() || this.dbHydrated) return;
    try {
      const p = getPool();
      const [rows]: any = await p.query(
        `SELECT * FROM audit_logs ORDER BY sequence_num DESC LIMIT 500`
      );
      if (Array.isArray(rows) && rows.length > 0) {
        this.chain = rows.map((r: any, idx: number) => this.mapDbRow(r, rows.length - idx));
      } else {
        // Seed initial genesis entries into MySQL once
        const chronological = [...this.chain];
        let prev = GENESIS_HASH;
        for (const item of chronological) {
          const uuid = generateUUIDv7();
          const ts = new Date().toISOString().slice(0, 23).replace('T', ' ');
          const tsIso = new Date(ts.replace(' ', 'T') + 'Z').toISOString();
          const hash = this.computeHash(prev, {
            id: uuid,
            timestamp: tsIso,
            eventType: item.eventType,
            actorId: item.actorId,
            actorRole: item.actorRole,
            ip: item.ip,
            details: item.details,
            severity: item.severity || 'info',
          });
          await p.query(
            `INSERT INTO audit_logs (id, timestamp, event_type, actor_id, actor_name, actor_role, ip, details, severity, prev_hash, entry_hash)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              toIdBuffer(uuid),
              ts,
              item.eventType,
              item.actorId,
              item.actorName,
              item.actorRole,
              item.ip,
              item.details,
              item.severity || 'info',
              prev,
              hash,
            ]
          );
          prev = hash;
        }
        const [reloaded]: any = await p.query(`SELECT * FROM audit_logs ORDER BY sequence_num DESC LIMIT 500`);
        if (Array.isArray(reloaded) && reloaded.length > 0) {
          this.chain = reloaded.map((r: any, idx: number) => this.mapDbRow(r, reloaded.length - idx));
        }
      }
      this.dbHydrated = true;
    } catch (err: any) {
      logger.warn(`AuditChain hydration notice: ${err?.message || err}`);
    }
  }

  /**
   * Append-only tamper-evident audit record persisted to MySQL `audit_logs`
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
    beforeState?: Record<string, any>;
  }): TamperEvidentAuditEntry {
    const lastHash = this.chain.length > 0 ? this.chain[0].currentHash : GENESIS_HASH;
    const seq = this.chain.length + 1;
    const id = generateUUIDv7();
    const nowDate = entry.timestamp ? new Date(entry.timestamp) : new Date();
    const safeDate = isNaN(nowDate.getTime()) ? new Date() : nowDate;
    const timestamp = safeDate.toISOString();
    const mysqlTimestamp = timestamp.slice(0, 23).replace('T', ' ');
    const severity = entry.severity || 'info';

    const currentHash = this.computeHash(lastHash, {
      id,
      timestamp,
      eventType: entry.eventType,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      ip: entry.ip,
      details: entry.details,
      severity,
    });

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
    if (this.chain.length > 1000) this.chain.pop();

    // Persist asynchronously in ordered queue to MySQL `audit_logs`
    this.writeQueue = this.writeQueue
      .then(async () => {
        if (!isDatabaseConnected()) return;
        await this.hydrateFromDbIfNeeded();
        const p = getPool();
        const [latestRows]: any = await p.query(
          `SELECT entry_hash FROM audit_logs ORDER BY sequence_num DESC LIMIT 1`
        );
        const dbPrevHash = Array.isArray(latestRows) && latestRows.length > 0
          ? String(latestRows[0].entry_hash)
          : GENESIS_HASH;
        const dbHash = this.computeHash(dbPrevHash, {
          id,
          timestamp,
          eventType: entry.eventType,
          actorId: entry.actorId,
          actorRole: entry.actorRole,
          ip: entry.ip,
          details: entry.details,
          severity,
        });
        await p.query(
          `INSERT INTO audit_logs (id, timestamp, event_type, actor_id, actor_name, actor_role, ip, details, severity, prev_hash, entry_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            toIdBuffer(id),
            mysqlTimestamp,
            entry.eventType,
            entry.actorId,
            entry.actorName,
            entry.actorRole,
            entry.ip || '127.0.0.1',
            entry.details,
            severity,
            dbPrevHash,
            dbHash,
          ]
        );
      })
      .catch(err => {
        logger.warn(`AuditChain MySQL persist notice: ${err?.message || err}`);
      });

    return chainedEntry;
  }

  public append(entry: Parameters<TamperEvidentAuditService['appendEntry']>[0]): TamperEvidentAuditEntry {
    return this.appendEntry(entry);
  }

  public async getEntriesAsync(): Promise<TamperEvidentAuditEntry[]> {
    if (isDatabaseConnected()) {
      await this.writeQueue;
      await this.hydrateFromDbIfNeeded();
      try {
        const p = getPool();
        const [rows]: any = await p.query(`SELECT * FROM audit_logs ORDER BY sequence_num DESC LIMIT 500`);
        if (Array.isArray(rows)) {
          this.chain = rows.map((r: any, idx: number) => this.mapDbRow(r, rows.length - idx));
        }
      } catch (err: any) {
        logger.warn(`AuditChain DB read notice: ${err?.message || err}`);
      }
    }
    return [...this.chain];
  }

  public async verifyIntegrityAsync(): Promise<{
    isValid: boolean;
    totalRecords: number;
    checkedCount: number;
    brokenAt?: number;
    headHash?: string;
    message: string;
  }> {
    await this.getEntriesAsync();
    return this.verifyIntegrity();
  }

  public verifyIntegrity(): { isValid: boolean; totalRecords: number; checkedCount: number; brokenAt?: number; headHash?: string; message: string } {
    if (this.chain.length === 0) {
      return { isValid: true, totalRecords: 0, checkedCount: 0, message: 'زنجیره وقایع خالی است.' };
    }

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

      const recalculatedHash = this.computeHash(expectedPrev, {
        id: entry.id,
        timestamp: entry.timestamp,
        eventType: entry.eventType,
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        ip: entry.ip,
        details: entry.details,
        severity: entry.severity,
      });

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
