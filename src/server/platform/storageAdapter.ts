import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import { generateUUIDv7 } from './uuidv7';
import { AppError } from './errors';

/**
 * StorageAdapter for Persistent Disk Uploads (Item 12 & Runflare Zero-Build-Hanging Guard)
 * - UPLOAD_DIR resolved purely as path string at import time (NO fs I/O during import or build)
 * - Folder creation and health check performed ONLY at runtime during server startup with 5s timeout
 * - Graceful degradation: in case of timeout or missing mount, upload is disabled with warning, NEVER hangs build or startup
 */

export interface IStorageAdapter {
  isUploadEnabled(): boolean;
  getUploadDir(): string;
  saveUpload(originalName: string, buffer: Buffer): Promise<{ filename: string; filePath: string; url: string }>;
  deleteUpload(filename: string): Promise<boolean>;
  initialize(timeoutMs?: number): Promise<boolean>;
}

export class StorageAdapter implements IStorageAdapter {
  private readonly uploadDir: string;
  private readonly isFeatureFlagActive: boolean;
  private isReady: boolean = false;
  private isInitializing: boolean = false;

  constructor() {
    // Pure string path resolution — ZERO filesystem calls at import or build time
    const baseStorage = process.env.STORAGE_PATH && process.env.STORAGE_PATH.trim() !== ''
      ? path.resolve(process.env.STORAGE_PATH.trim())
      : path.resolve(process.cwd(), 'storage');

    this.uploadDir = process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim() !== ''
      ? path.resolve(process.env.UPLOAD_DIR.trim())
      : path.join(baseStorage, 'uploads');

    // Feature flag guard
    this.isFeatureFlagActive = process.env.FEATURE_UPLOAD_ENABLED === 'true';
  }

  /**
   * Initializes upload directory asynchronously with strict timeout safeguard.
   * MUST only be called after server is listening, never at module import time.
   */
  async initialize(timeoutMs = 5000): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isInitializing) return false;
    this.isInitializing = true;

    return new Promise<boolean>((resolve) => {
      let settled = false;

      // Timeout watchdog
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.isInitializing = false;
          this.isReady = false;
          logger.warn(`StorageAdapter init timed out after ${timeoutMs}ms for ${this.uploadDir}. Uploads disabled.`);
          resolve(false);
        }
      }, timeoutMs);

      (async () => {
        try {
          // Asynchronous directory creation
          await fs.promises.mkdir(this.uploadDir, { recursive: true, mode: 0o755 });

          // Test write permissions
          const probeFile = path.join(this.uploadDir, `.probe_${Date.now()}.tmp`);
          await fs.promises.writeFile(probeFile, 'ok');
          await fs.promises.unlink(probeFile);

          this.isReady = true;
          this.isInitializing = false;
          logger.info(`StorageAdapter initialized successfully. UPLOAD_DIR: ${this.uploadDir}`);

          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(true);
          }
        } catch (err: any) {
          this.isReady = false;
          this.isInitializing = false;
          logger.warn(`StorageAdapter failed to bind uploadDir (${this.uploadDir}): ${err?.message || err}. Uploads temporarily disabled.`);
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

  async saveUpload(originalName: string, buffer: Buffer): Promise<{ filename: string; filePath: string; url: string }> {
    if (!this.isFeatureFlagActive) {
      throw AppError.forbidden(
        'قابلیت آپلود فایل موقتاً تا فعال‌سازی پروداکشن غیرفعال است (FEATURE_UPLOAD_ENABLED=false).'
      );
    }

    if (!this.isReady) {
      // Lazy attempt to initialize once
      const ok = await this.initialize(2000);
      if (!ok) {
        throw AppError.badRequest('فضای ذخیره‌سازی دیسک موقتاً در دسترس نیست. لطفاً بعداً تلاش فرمایید.');
      }
    }

    // Sanitize extension and generate UUIDv7 filename
    const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '') || '.bin';
    const safeFilename = `${generateUUIDv7()}${ext}`;
    const filePath = path.join(this.uploadDir, safeFilename);

    // Prevent directory traversal
    if (!filePath.startsWith(this.uploadDir)) {
      throw AppError.badRequest('نام فایل نامعتبر است.');
    }

    await fs.promises.writeFile(filePath, buffer);
    logger.info(`File successfully uploaded and stored: ${safeFilename}`);

    return {
      filename: safeFilename,
      filePath,
      url: `/uploads/${safeFilename}`,
    };
  }

  async deleteUpload(filename: string): Promise<boolean> {
    try {
      const safeFilename = path.basename(filename);
      const filePath = path.join(this.uploadDir, safeFilename);
      await fs.promises.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const storageAdapter = new StorageAdapter();
