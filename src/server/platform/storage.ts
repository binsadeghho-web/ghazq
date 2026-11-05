import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import { generateUUIDv7 } from './uuidv7';

/**
 * Storage Service for Persistent Volume Mounts (e.g., Runflare /MYDISK)
 * Compliant with Data Architecture v3.0:
 * - Persistent data never kept in volatile container RAM or ephemeral container layer.
 * - Auto-initializes dedicated subdirectories: uploads, backups, audit.
 * - Path traversal prevention & safe UUID-based filenames.
 */

export interface StorageConfig {
  rootPath: string;
  uploadsDir: string;
  profilePictureDir: string;
  backupsDir: string;
  auditDir: string;
  tempDir: string;
  isMounted: boolean;
}

function resolveStorageRoot(): string {
  // 1. Explicit environment variable
  if (process.env.STORAGE_PATH && process.env.STORAGE_PATH.trim() !== '') {
    return path.resolve(process.env.STORAGE_PATH.trim());
  }

  // 2. Runflare mounted persistent volume (/MYDISK)
  if (fs.existsSync('/MYDISK')) {
    return '/MYDISK';
  }

  // 3. Fallback for local dev/preview
  return path.resolve(process.cwd(), 'storage');
}

const rootPath = resolveStorageRoot();

export const storageConfig: StorageConfig = {
  rootPath,
  uploadsDir: path.join(rootPath, 'uploads'),
  profilePictureDir: path.join(rootPath, 'uploads', 'PROFILE_PICTURE'),
  backupsDir: path.join(rootPath, 'backups'),
  auditDir: path.join(rootPath, 'audit'),
  tempDir: path.join(rootPath, 'temp'),
  isMounted: fs.existsSync(rootPath),
};

/**
 * Ensures all required storage directories exist with appropriate permissions.
 */
export function initStorageDirectories(): void {
  const dirs = [
    storageConfig.rootPath,
    storageConfig.uploadsDir,
    path.join(storageConfig.uploadsDir, 'PROFILE_PICTURE'),
    path.join(storageConfig.rootPath, 'PROFILE_PICTURE'),
    storageConfig.backupsDir,
    storageConfig.auditDir,
    storageConfig.tempDir,
  ];

  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
        logger.info(`📁 پوشه اختصاصی ذخیره‌سازی ایجاد شد: ${dir}`);
      }
    } catch (err: any) {
      logger.warn(`هشدار در ایجاد پوشه ذخیره‌سازی (${dir}): ${err?.message || err}`);
    }
  }

  logger.info(`💾 سیستم ذخیره‌سازی فایل‌های ماندگار راه‌اندازی شد. مسیر ریشه: ${storageConfig.rootPath}`);
}

/**
 * Generates a secure, path-traversal-safe file path within the specified directory.
 */
export function generateSafeFilePath(subDir: 'uploads' | 'backups' | 'audit' | 'temp', originalFilename: string): { filename: string; fullPath: string } {
  const ext = path.extname(originalFilename).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const safeBaseName = `${generateUUIDv7()}${ext}`;
  const targetDir = storageConfig[subDir === 'uploads' ? 'uploadsDir' : subDir === 'backups' ? 'backupsDir' : subDir === 'audit' ? 'auditDir' : 'tempDir'];
  const fullPath = path.join(targetDir, safeBaseName);

  return {
    filename: safeBaseName,
    fullPath,
  };
}

/**
 * Returns disk usage statistics for health checks and dashboard metrics.
 */
export function getStorageHealth(): { status: 'healthy' | 'degraded'; rootPath: string; isMounted: boolean; accessibleDirs: string[] } {
  const accessibleDirs: string[] = [];
  const testDirs = [storageConfig.uploadsDir, storageConfig.backupsDir, storageConfig.auditDir];

  for (const d of testDirs) {
    try {
      if (fs.existsSync(d)) {
        accessibleDirs.push(path.basename(d));
      }
    } catch {
      // Ignored for health probe
    }
  }

  const isHealthy = accessibleDirs.length === testDirs.length;

  return {
    status: isHealthy ? 'healthy' : 'degraded',
    rootPath: storageConfig.rootPath,
    isMounted: storageConfig.isMounted,
    accessibleDirs,
  };
}
