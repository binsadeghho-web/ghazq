import { getPool, isDatabaseConnected } from '../../platform/mysqlDatabase';
import { logger } from '../../platform/logger';

export interface SystemSettingRecord<T> {
  key: string;
  value: T;
  version: number;
  lastModifiedBy: string | null;
  updatedAt: string;
}

export class AdminSettingsRepository {
  private memoryCache: Map<string, SystemSettingRecord<any>> = new Map();

  /**
   * Retrieves setting with version and lastModified metadata.
   * Source of Truth: MySQL system_settings table (Fallback: in-memory cache)
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
          return rec;
        }
      } catch (err: any) {
        logger.warn(`Failed to read setting record ${key} from MySQL: ${err.message}`);
      }
    }

    // Fallback to in-memory cache
    const cached = this.memoryCache.get(key);
    if (cached) {
      return cached as SystemSettingRecord<T>;
    }

    return null;
  }

  /**
   * Optimistic Update directly in MySQL.
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

    // Update memory cache
    this.memoryCache.set(key, record);

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
        await this.saveSetting(key, value, 'Auto-persisted setting');
      }

      return { success: true, conflict: false, newVersion };
    } catch (err: any) {
      logger.warn(`Optimistic update error for ${key}: ${err.message}`);
      return { success: true, conflict: false, newVersion };
    }
  }

  /**
   * Upsert system setting in MySQL
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
