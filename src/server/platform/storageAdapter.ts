import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import { generateUUIDv7 } from './uuidv7';
import { AppError } from './errors';

/**
 * StorageAdapter for Persistent Disk Uploads (Item 12)
 * - UPLOAD_DIR resolved dynamically from environment variable
 * - Feature flag FEATURE_UPLOAD_ENABLED (defaults to false until production deployment verified)
 * - Safe UUIDv7 filename generation & path traversal prevention
 */

export interface IStorageAdapter {
  isUploadEnabled(): boolean;
  getUploadDir(): string;
  saveUpload(originalName: string, buffer: Buffer): Promise<{ filename: string; filePath: string; url: string }>;
  deleteUpload(filename: string): Promise<boolean>;
}

export class StorageAdapter implements IStorageAdapter {
  private readonly uploadDir: string;
  private readonly isEnabled: boolean;

  constructor() {
    // 1. Resolve directory dynamically from environment variables
    const baseStorage = process.env.STORAGE_PATH || (fs.existsSync('/MYDISK') ? '/MYDISK' : path.join(process.cwd(), 'storage'));
    this.uploadDir = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(baseStorage, 'uploads');

    // 2. Feature flag: defaults to false until explicit activation
    this.isEnabled = process.env.FEATURE_UPLOAD_ENABLED === 'true';

    // Auto-create directory with safe permissions
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true, mode: 0o755 });
      }
    } catch (err: any) {
      logger.warn(`Notice creating uploadDir (${this.uploadDir}): ${err?.message}`);
    }

    logger.info(`StorageAdapter initialized. UPLOAD_DIR: ${this.uploadDir} | FEATURE_UPLOAD_ENABLED: ${this.isEnabled}`);
  }

  isUploadEnabled(): boolean {
    return this.isEnabled;
  }

  getUploadDir(): string {
    return this.uploadDir;
  }

  async saveUpload(originalName: string, buffer: Buffer): Promise<{ filename: string; filePath: string; url: string }> {
    // Item 12: Feature flag guard
    if (!this.isEnabled) {
      throw AppError.forbidden(
        'قابلیت آپلود فایل موقتاً تا تکمیل تست استقرار روی هاست ابری غیرفعال است (FEATURE_UPLOAD_ENABLED=false).'
      );
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
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.uploadDir, safeFilename);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }
}

export const storageAdapter = new StorageAdapter();
