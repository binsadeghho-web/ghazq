import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import { generateUUIDv7 } from './uuidv7';

/**
 * Categorized Persistent Disk Storage Service
 * Compliant with Zero-Build-Impact Architecture:
 * - Pure path resolution during module import (NO fs I/O or existsSync at build time).
 * - Async folder initialization strictly deferred until after server startup.
 * - Non-blocking 5-second watchdog safeguard with category-level failure tolerance.
 */

export type UploadCategory = 'avatar' | 'product' | 'course' | 'consultation' | 'research' | 'verdict' | 'misc';

export interface StorageConfig {
  rootPath: string;
  uploadsDir: string;
  categories: Record<UploadCategory, { path: string; isPrivate: boolean; folderName: string }>;
  backupsDir: string;
  auditDir: string;
  tempDir: string;
  isMounted: boolean;
  isInitialized: boolean;
}

function resolveStorageRoot(): string {
  if (process.env.STORAGE_PATH && process.env.STORAGE_PATH.trim() !== '') {
    return path.resolve(process.env.STORAGE_PATH.trim());
  }
  if (process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim() !== '') {
    return path.dirname(path.resolve(process.env.UPLOAD_DIR.trim()));
  }
  return path.resolve(process.cwd(), 'storage');
}

const rootPath = resolveStorageRoot();
const uploadsDir = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(rootPath, 'uploads');

export const storageConfig: StorageConfig = {
  rootPath,
  uploadsDir,
  categories: {
    avatar: { path: path.join(uploadsDir, 'avatars'), isPrivate: false, folderName: 'avatars' },
    product: { path: path.join(uploadsDir, 'products'), isPrivate: false, folderName: 'products' },
    course: { path: path.join(uploadsDir, 'courses'), isPrivate: false, folderName: 'courses' },
    consultation: { path: path.join(uploadsDir, 'consultations'), isPrivate: true, folderName: 'consultations' },
    research: { path: path.join(uploadsDir, 'research'), isPrivate: true, folderName: 'research' },
    verdict: { path: path.join(uploadsDir, 'verdicts'), isPrivate: false, folderName: 'verdicts' },
    misc: { path: path.join(uploadsDir, 'misc'), isPrivate: false, folderName: 'misc' },
  },
  backupsDir: path.join(rootPath, 'backups'),
  auditDir: path.join(rootPath, 'audit'),
  tempDir: path.join(rootPath, 'temp'),
  isMounted: false,
  isInitialized: false,
};

/**
 * Asynchronously initializes all required storage directories after server listen.
 */
export async function initStorageDirectories(timeoutMs = 5000): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        storageConfig.isMounted = false;
        logger.warn(`Storage initialization timed out after ${timeoutMs}ms. System running in fallback mode.`);
        resolve(false);
      }
    }, timeoutMs);

    (async () => {
      try {
        const dirsToCreate = [
          storageConfig.rootPath,
          storageConfig.uploadsDir,
          storageConfig.categories.avatar.path,
          storageConfig.categories.product.path,
          storageConfig.categories.course.path,
          storageConfig.categories.consultation.path,
          storageConfig.categories.research.path,
          storageConfig.categories.verdict.path,
          storageConfig.categories.misc.path,
          // Legacy backwards compatibility folder
          path.join(storageConfig.uploadsDir, 'PROFILE_PICTURE'),
          storageConfig.backupsDir,
          storageConfig.auditDir,
          storageConfig.tempDir,
        ];

        let successCount = 0;
        for (const dir of dirsToCreate) {
          try {
            await fs.promises.mkdir(dir, { recursive: true, mode: 0o755 });
            successCount++;
          } catch (dirErr: any) {
            if (dirErr.code !== 'EEXIST') {
              logger.warn(`هشدار در ایجاد پوشه (${dir}): ${dirErr?.message || dirErr}`);
            } else {
              successCount++;
            }
          }
        }

        // Test write probe
        const testFile = path.join(storageConfig.tempDir, `.probe_${Date.now()}.tmp`);
        try {
          await fs.promises.writeFile(testFile, 'probe');
          await fs.promises.unlink(testFile);
          storageConfig.isMounted = true;
          storageConfig.isInitialized = true;
          logger.info(`💾 سیستم ذخیره‌سازی پوشه‌های طبقه‌بندی‌شده (/MYDISK/uploads/...) با موفقیت راه‌اندازی شد.`);
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
        logger.warn(`خطا در مقداردهی اولیه پوشه‌های ذخیره‌سازی: ${err?.message || err}`);
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
 * Generates a safe UUIDv7 file path for a specific category.
 */
export function generateSafeCategoryFilePath(
  category: UploadCategory,
  originalFilename: string
): { filename: string; fullPath: string; url: string; isPrivate: boolean } {
  const catConfig = storageConfig.categories[category] || storageConfig.categories.misc;
  const ext = path.extname(originalFilename).toLowerCase().replace(/[^a-z0-9.]/g, '') || '.bin';
  const safeFilename = `${category}_${generateUUIDv7()}${ext}`;
  const fullPath = path.join(catConfig.path, safeFilename);

  const url = catConfig.isPrivate
    ? `/api/storage/private/${catConfig.folderName}/${safeFilename}`
    : `/uploads/${catConfig.folderName}/${safeFilename}`;

  return {
    filename: safeFilename,
    fullPath,
    url,
    isPrivate: catConfig.isPrivate,
  };
}

/**
 * Returns health & directory metrics.
 */
export function getStorageHealth(): { status: 'healthy' | 'degraded'; rootPath: string; isMounted: boolean; accessibleDirs: string[] } {
  return {
    status: storageConfig.isMounted ? 'healthy' : 'degraded',
    rootPath: storageConfig.rootPath,
    isMounted: storageConfig.isMounted,
    accessibleDirs: storageConfig.isMounted ? Object.keys(storageConfig.categories) : [],
  };
}
