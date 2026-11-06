import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import { generateUUIDv7 } from './uuidv7';
import { AppError } from './errors';
import { storageConfig, UploadCategory, generateSafeCategoryFilePath } from './storage';

/**
 * StorageAdapter for Persistent Categorized Uploads
 * - Zero-Build-Hanging: NO fs I/O during import or build phases.
 * - Automatic Category Routing: Routes files to avatars/, products/, courses/, consultations/, research/, verdicts/, misc/.
 * - UUIDv7 filename obfuscation: Randomizes filenames to eliminate collisions and prevent PII leakage.
 * - Access control awareness: Categorizes public vs private files.
 */

export interface SavedUploadResult {
  filename: string;
  filePath: string;
  url: string;
  category: UploadCategory;
  isPrivate: boolean;
}

export interface IStorageAdapter {
  isUploadEnabled(): boolean;
  getUploadDir(): string;
  saveUpload(originalName: string, buffer: Buffer, category?: UploadCategory): Promise<SavedUploadResult>;
  saveCategorizedUpload(category: UploadCategory, originalName: string, buffer: Buffer): Promise<SavedUploadResult>;
  deleteUpload(category: UploadCategory, filename: string): Promise<boolean>;
  initialize(timeoutMs?: number): Promise<boolean>;
}

export class StorageAdapter implements IStorageAdapter {
  private readonly uploadDir: string;
  private readonly isFeatureFlagActive: boolean;
  private isReady: boolean = false;
  private isInitializing: boolean = false;

  constructor() {
    this.uploadDir = storageConfig.uploadsDir;
    // Defaults to true in production if not explicitly overridden
    this.isFeatureFlagActive = process.env.FEATURE_UPLOAD_ENABLED !== 'false';
  }

  /**
   * Asynchronously initializes categorized upload directories after server listen.
   */
  async initialize(timeoutMs = 5000): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isInitializing) return false;
    this.isInitializing = true;

    return new Promise<boolean>((resolve) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.isInitializing = false;
          this.isReady = false;
          logger.warn(`StorageAdapter init timed out after ${timeoutMs}ms. Uploads temporarily in fallback.`);
          resolve(false);
        }
      }, timeoutMs);

      (async () => {
        try {
          const catPaths = Object.values(storageConfig.categories).map(c => c.path);
          for (const p of catPaths) {
            try {
              await fs.promises.mkdir(p, { recursive: true, mode: 0o755 });
            } catch (err: any) {
              if (err.code !== 'EEXIST') {
                logger.warn(`Notice creating upload category dir (${p}): ${err?.message}`);
              }
            }
          }

          // Test write probe in temp
          const probeFile = path.join(storageConfig.tempDir, `.adapter_probe_${Date.now()}.tmp`);
          try {
            await fs.promises.writeFile(probeFile, 'ok');
            await fs.promises.unlink(probeFile);
          } catch {}

          this.isReady = true;
          this.isInitializing = false;
          logger.info(`StorageAdapter initialized categorized directories under ${this.uploadDir}`);

          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(true);
          }
        } catch (err: any) {
          this.isReady = false;
          this.isInitializing = false;
          logger.warn(`StorageAdapter category binding notice: ${err?.message || err}`);
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(false);
          }
        }
      })();
    });
  }

  isUploadEnabled(): boolean {
    return this.isFeatureFlagActive && this.isReady;
  }

  getUploadDir(): string {
    return this.uploadDir;
  }

  /**
   * Saves uploaded file into its designated category directory with UUIDv7 randomized filename.
   */
  async saveCategorizedUpload(category: UploadCategory, originalName: string, buffer: Buffer): Promise<SavedUploadResult> {
    if (!this.isReady) {
      await this.initialize(2000);
    }

    const catConfig = storageConfig.categories[category] || storageConfig.categories.misc;
    const targetDir = catConfig.path;

    // Ensure target folder exists
    try {
      await fs.promises.mkdir(targetDir, { recursive: true, mode: 0o755 });
    } catch {}

    const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '') || '.bin';
    const safeFilename = `${category}_${Date.now()}_${generateUUIDv7().slice(0, 10)}${ext}`;
    const filePath = path.join(targetDir, safeFilename);

    // Path traversal check
    if (!filePath.startsWith(targetDir)) {
      throw AppError.badRequest('نام فایل یا مسیر آپلود نامعتبر است.');
    }

    await fs.promises.writeFile(filePath, buffer);
    logger.info(`Categorized file uploaded [${category}]: ${safeFilename}`);

    const url = catConfig.isPrivate
      ? `/api/storage/private/${catConfig.folderName}/${safeFilename}`
      : `/uploads/${catConfig.folderName}/${safeFilename}`;

    return {
      filename: safeFilename,
      filePath,
      url,
      category,
      isPrivate: catConfig.isPrivate,
    };
  }

  /**
   * Backward-compatible default saveUpload method.
   */
  async saveUpload(originalName: string, buffer: Buffer, category: UploadCategory = 'misc'): Promise<SavedUploadResult> {
    return this.saveCategorizedUpload(category, originalName, buffer);
  }

  async deleteUpload(category: UploadCategory, filename: string): Promise<boolean> {
    try {
      const catConfig = storageConfig.categories[category] || storageConfig.categories.misc;
      const safeFilename = path.basename(filename);
      const filePath = path.join(catConfig.path, safeFilename);
      await fs.promises.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const storageAdapter = new StorageAdapter();
