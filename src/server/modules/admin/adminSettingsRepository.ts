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
  /**
   * Retrieves setting with version and lastModified metadata directly from MySQL system_settings table
   */
  async getRecord<T>(key: string): Promise<SystemSettingRecord<T> | null> {
    if (!isDatabaseConnected()) return null;
    try {
      const p = getPool();
      const [rows] = await p.query<any[]>(
        'SELECT setting_key, setting_value, version, last_modified_by, updated_at FROM system_settings WHERE setting_key = ?',
        [key]
      );
      if (rows.length === 0) return null;
      const row = rows[0];
      const value = typeof row.setting_value === 'string' ? JSON.parse(row.setting_value) : row.setting_value;
      return {
        key: row.setting_key,
        value,
        version: Number(row.version || 1),
        lastModifiedBy: row.last_modified_by,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      };
    } catch (err: any) {
      logger.warn(`Failed to read setting record ${key} from MySQL: ${err.message}`);
      return null;
    }
  }

  /**
   * Optimistic Update directly in MySQL:
   * UPDATE system_settings SET setting_value=?, version=version+1 WHERE setting_key=? AND version=?
   * If affectedRows === 0, returns conflict: true (triggering HTTP 409).
   */
  async updateOptimistic<T>(
    key: string,
    value: T,
    baseVersion: number,
    lastModifiedBy: string
  ): Promise<{ success: boolean; conflict: boolean; newVersion: number }> {
    if (!isDatabaseConnected()) {
      return { success: false, conflict: false, newVersion: baseVersion + 1 };
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
        return { success: false, conflict: true, newVersion: baseVersion };
      }

      return { success: true, conflict: false, newVersion: baseVersion + 1 };
    } catch (err: any) {
      logger.warn(`Optimistic update error for ${key}: ${err.message}`);
      return { success: false, conflict: false, newVersion: baseVersion + 1 };
    }
  }

  /**
   * Upsert system setting
   */
  async saveSetting<T>(key: string, value: T, description?: string): Promise<boolean> {
    if (!isDatabaseConnected()) return false;
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
      return false;
    }
  }
}

export const adminSettingsRepo = new AdminSettingsRepository();
