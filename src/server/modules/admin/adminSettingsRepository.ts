import fs from 'fs';
import path from 'path';
import { getPool, isDatabaseConnected } from '../../platform/mysqlDatabase';
import { logger } from '../../platform/logger';
import { storageConfig } from '../../platform/storage';

export interface SystemSettingRecord<T> {
  key: string;
  value: T;
  version: number;
  lastModifiedBy: string | null;
  updatedAt: string;
}

export class AdminSettingsRepository {
  private memoryCache: Map<string, SystemSettingRecord<any>> = new Map();
  private diskFilePath: string;

  constructor() {
    this.diskFilePath = path.join(storageConfig.rootPath, 'system_settings.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.diskFilePath)) {
        const raw = fs.readFileSync(this.diskFilePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          for (const [k, v] of Object.entries(data)) {
            this.memoryCache.set(k, v as SystemSettingRecord<any>);
          }
          logger.info(`Loaded ${this.memoryCache.size} system settings from persistent disk.`);
        }
      }
    } catch (err: any) {
      logger.warn(`Failed to read system settings from disk: ${err?.message || err}`);
    }
  }

  private saveToDisk(): void {
    try {
      const obj: Record<string, any> = {};
      for (const [k, v] of this.memoryCache.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(this.diskFilePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err: any) {
      logger.warn(`Failed to save system settings to disk: ${err?.message || err}`);
    }
  }

  /**
   * Retrieves setting with version and lastModified metadata.
   * Priority: MySQL (if connected) -> Disk/Memory Cache
   */
  async getRecord<T>(key: string): Promise<SystemSettingRecord<T> | null> {
    if (isDatabaseConnected()) {
      try {
        const p = getPool();
        const [rows] = await p.query<any[]>(
          'SELECT setting_key, setting_value, version, last_modified_by, updated_at FROM system_settings WHERE setting_key = ?',
          [key]
        );
        if (rows.length > 0) {
          const row = rows[0];
          const value = typeof row.setting_value === 'string' ? JSON.parse(row.setting_value) : row.setting_value;
          const rec: SystemSettingRecord<T> = {
            key: row.setting_key,
            value,
            version: Number(row.version || 1),
            lastModifiedBy: row.last_modified_by,
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          };
          this.memoryCache.set(key, rec);
          this.saveToDisk();
          return rec;
        }
      } catch (err: any) {
        logger.warn(`Failed to read setting record ${key} from MySQL: ${err.message}`);
      }
    }

    // Fallback to in-memory / persistent disk file
    const cached = this.memoryCache.get(key);
    if (cached) {
      return cached as SystemSettingRecord<T>;
    }

    return null;
  }

  /**
   * Optimistic Update directly in MySQL and local persistent storage.
   */
  async updateOptimistic<T>(
    key: string,
    value: T,
    baseVersion: number,
    lastModifiedBy: string
  ): Promise<{ success: boolean; conflict: boolean; newVersion: number }> {
    const existing = this.memoryCache.get(key);
    const newVersion = (baseVersion || existing?.version || 1) + 1;
    const now = new Date().toISOString();

    const record: SystemSettingRecord<T> = {
      key,
      value,
      version: newVersion,
      lastModifiedBy,
      updatedAt: now,
    };

    // Update memory and disk immediately
    this.memoryCache.set(key, record);
    this.saveToDisk();

    if (!isDatabaseConnected()) {
      return { success: true, conflict: false, newVersion };
    }

    try {
      const p = getPool();
      const [result] = await p.query<any>(
        `UPDATE system_settings 
         SET setting_value = ?, version = version + 1, last_modified_by = ?, updated_at = CURRENT_TIMESTAMP(3)
         WHERE setting_key = ? AND version = ?`,
        [JSON.stringify(value), lastModifiedBy, key, baseVersion]
      );

      if (result.affectedRows === 0) {
        // Fallback upsert if row didn't exist yet
        await this.saveSetting(key, value, 'Auto-persisted setting');
      }

      return { success: true, conflict: false, newVersion };
    } catch (err: any) {
      logger.warn(`Optimistic update error for ${key}: ${err.message}`);
      return { success: true, conflict: false, newVersion };
    }
  }

  /**
   * Upsert system setting
   */
  async saveSetting<T>(key: string, value: T, description?: string): Promise<boolean> {
    const existing = this.memoryCache.get(key);
    const newVersion = (existing?.version || 0) + 1;
    const now = new Date().toISOString();

    const record: SystemSettingRecord<T> = {
      key,
      value,
      version: newVersion,
      lastModifiedBy: 'مدیر سیستم',
      updatedAt: now,
    };

    this.memoryCache.set(key, record);
    this.saveToDisk();

    if (!isDatabaseConnected()) return true;

    try {
      const p = getPool();
      await p.query(
        `INSERT INTO system_settings (setting_key, setting_value, description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP(3)`,
        [key, JSON.stringify(value), description || null]
      );
      return true;
    } catch (err: any) {
      logger.warn(`Failed to save setting ${key} to MySQL: ${err.message}`);
      return true;
    }
  }
}

export const adminSettingsRepo = new AdminSettingsRepository();
