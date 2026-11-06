import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import { generateUUIDv7 } from './uuidv7';

/**
 * Storage Service for Persistent Volume Mounts (e.g., Runflare /MYDISK)
 * Compliant with Zero-Build-Impact Architecture:
 * - NO synchronous disk I/O, exists checks, or mkdir in top-level module scope or during imports.
 * - Directory initialization is strictly asynchronous and deferred until after HTTP server starts.
 * - Guaranteed 5-second timeout safeguard to prevent hanging if volume mount is slow or unavailable.
 */

export interface StorageConfig {
  rootPath: string;
  uploadsDir: string;
  profilePictureDir: string;
  backupsDir: string;
  auditDir: string;
  tempDir: string;
  isMounted: boolean;
  isInitialized: boolean;
}

// Pure path resolution without any disk I/O or existsSync calls
function resolveStorageRoot(): string {
  if (process.env.STORAGE_PATH && process.env.STORAGE_PATH.trim() !== '') {
    return path.resolve(process.env.STORAGE_PATH.trim());
  }
  if (process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim() !== '') {
    return path.dirname(path.resolve(process.env.UPLOAD_DIR.trim()));
  }
  // Default path without probing filesystem at import time
  return path.resolve(process.cwd(), 'storage');
}

const rootPath = resolveStorageRoot();

export const storageConfig: StorageConfig = {
  rootPath,
  uploadsDir: process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(rootPath, 'uploads'),
  profilePictureDir: path.join(rootPath, 'uploads', 'PROFILE_PICTURE'),
  backupsDir: path.join(rootPath, 'backups'),
  auditDir: path.join(rootPath, 'audit'),
  tempDir: path.join(rootPath, 'temp'),
  isMounted: false,
  isInitialized: false,
};

/**
 * Ensures all required storage directories exist with appropriate permissions.
 * STRICT RUNTIME ONLY: Called asynchronously after server.listen, with 5s timeout.
 */
export async function initStorageDirectories(timeoutMs = 5000): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let resolved = false;

    // Timeout watchdog: ensure we never hang the process
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        storageConfig.isMounted = false;
        logger.warn(`Storage initialization timed out after ${timeoutMs}ms. Running with storage disabled/fallback.`);
        resolve(false);
      }
    }, timeoutMs);

    // Execute asynchronously in background
    (async () => {
      try {
        const dirs = [
          storageConfig.rootPath,
          storageConfig.uploadsDir,
          storageConfig.profilePictureDir,
          storageConfig.backupsDir,
          storageConfig.auditDir,
          storageConfig.tempDir,
        ];

        for (const dir of dirs) {
          try {
            await fs.promises.mkdir(dir, { recursive: true, mode: 0o755 });
          } catch (dirErr: any) {
            // EEXIST is fine, other errors log warning without halting
            if (dirErr.code !== 'EEXIST') {
              logger.warn(`Warning creating storage dir (${dir}): ${dirErr?.message || dirErr}`);
            }
          }
        }

        // Quick write probe to verify write permission
        const testFile = path.join(storageConfig.tempDir, `.probe_${Date.now()}.tmp`);
        try {
          await fs.promises.writeFile(testFile, 'probe');
          await fs.promises.unlink(testFile);
          storageConfig.isMounted = true;
          storageConfig.isInitialized = true;
          logger.info(`💾 سیستم ذخیره‌سازی فایل‌های ماندگار با موفقیت متصل شد. مسیر ریشه: ${storageConfig.rootPath}`);
        } catch (probeErr: any) {
          storageConfig.isMounted = false;
          logger.warn(`مسیر دیسک در دسترس برای نوشتن نیست (${storageConfig.rootPath}): ${probeErr?.message}`);
        }

        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(storageConfig.isMounted);
        }
      } catch (err: any) {
        logger.warn(`Storage initialization failed gracefully: ${err?.message || err}`);
        storageConfig.isMounted = false;
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(false);
        }
      }
    })();
  });
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
  return {
    status: storageConfig.isMounted ? 'healthy' : 'degraded',
    rootPath: storageConfig.rootPath,
    isMounted: storageConfig.isMounted,
    accessibleDirs: storageConfig.isMounted ? ['uploads', 'backups', 'audit'] : [],
  };
}
