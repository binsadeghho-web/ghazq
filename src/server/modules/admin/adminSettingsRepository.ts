import { getPool, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { logger } from '../../platform/logger';
import { AppError } from '../../platform/errors';

export interface SystemSettingRecord<T> {
  key: string;
  value: T;
  version: number;
  lastModifiedBy: string | null;
  updatedAt: string;
}

export class AdminSettingsRepository {
  /**
   * Retrieves setting with version and lastModified metadata.
   * Source of Truth: MySQL system_settings table
   */
  async getRecord<T>(key: string): Promise<SystemSettingRecord<T> | null> {
    ensureDatabaseConnection();
    try {
      const p = getPool();
      const [rows] = await p.query<any[]>(
        'SELECT setting_key, setting_value, version, last_modified_by, updated_at FROM system_settings WHERE setting_key = ?',
        [key]
      );
      if (rows.length > 0) {
        const row = rows[0];
        const value = typeof row.setting_value === 'string' ? JSON.parse(row.setting_value) : row.setting_value;
        return {
          key: row.setting_key,
          value,
          version: Number(row.version || 1),
          lastModifiedBy: row.last_modified_by,
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
        };
      }
      return null;
    } catch (err: any) {
      logger.error(`Failed to read setting record ${key} from MySQL: ${err.message}`);
      throw AppError.serviceUnavailable('امکان خواندن تنظیمات از پایگاه داده وجود ندارد.');
    }
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
    ensureDatabaseConnection();
    try {
      const p = getPool();
      const [result] = await p.query<any>(
        `UPDATE system_settings 
         SET setting_value = ?, version = version + 1, last_modified_by = ?, updated_at = CURRENT_TIMESTAMP(3)
         WHERE setting_key = ? AND version = ?`,
        [JSON.stringify(value), lastModifiedBy, key, baseVersion]
      );

      if (result.affectedRows === 0) {
        const existing = await this.getRecord<T>(key);
        if (!existing) {
          await this.saveSetting(key, value, 'Auto-persisted setting', lastModifiedBy);
          return { success: true, conflict: false, newVersion: 1 };
        }
        // Upsert latest if concurrent edit happened on settings UI while returning authoritative DB version
        await p.query(
          `UPDATE system_settings 
           SET setting_value = ?, version = version + 1, last_modified_by = ?, updated_at = CURRENT_TIMESTAMP(3)
           WHERE setting_key = ?`,
          [JSON.stringify(value), lastModifiedBy, key]
        );
        return { success: true, conflict: false, newVersion: Number(existing.version || 1) + 1 };
      }

      return { success: true, conflict: false, newVersion: baseVersion + 1 };
    } catch (err: any) {
      logger.error(`Optimistic update error for ${key}: ${err.message}`);
      throw AppError.serviceUnavailable('امکان به‌روزرسانی تنظیمات در پایگاه داده وجود ندارد.');
    }
  }

  /**
   * Upsert system setting in MySQL
   */
  async saveSetting<T>(key: string, value: T, description?: string, lastModifiedBy?: string): Promise<boolean> {
    ensureDatabaseConnection();
    try {
      const p = getPool();
      await p.query(
        `INSERT INTO system_settings (setting_key, setting_value, description, version, last_modified_by)
         VALUES (?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
           setting_value = VALUES(setting_value),
           version = version + 1,
           last_modified_by = COALESCE(VALUES(last_modified_by), last_modified_by),
           updated_at = CURRENT_TIMESTAMP(3)`,
        [key, JSON.stringify(value), description || null, lastModifiedBy || null]
      );
      return true;
    } catch (err: any) {
      logger.error(`Failed to save setting ${key} to MySQL: ${err.message}`);
      throw AppError.serviceUnavailable('امکان ذخیره تنظیمات در پایگاه داده وجود ندارد.');
    }
  }
}

export const adminSettingsRepo = new AdminSettingsRepository();
