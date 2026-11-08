import fs from 'fs';
import path from 'path';
import { User } from '../../../types';
import { INITIAL_USERS } from '../../../data/mockData';
import { logger } from '../../platform/logger';
import { storageConfig } from '../../platform/storage';

export type StoredUser = User & { password_hash?: string; version: number };

/**
 * Dedicated User Persistence Engine
 * Complies with Section 3, 5, 8 & User Guidelines:
 * - Isolated file store in storage/data/users/
 * - In-memory O(1) indexed maps for nationalId, username, and ID
 * - Safe atomic disk writes
 */
class UserDiskStorageEngine {
  private usersDir: string;
  private usersFilePath: string;
  private cache: Map<string, StoredUser> = new Map();
  private nationalIdIndex: Map<string, string> = new Map();
  private usernameIndex: Map<string, string> = new Map();
  private isLoaded = false;

  constructor() {
    this.usersDir = path.join(storageConfig.rootPath, 'data', 'users');
    this.usersFilePath = path.join(this.usersDir, 'users_registry.json');
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isLoaded) return;
    this.isLoaded = true;

    try {
      await fs.promises.mkdir(this.usersDir, { recursive: true, mode: 0o755 });
      
      if (fs.existsSync(this.usersFilePath)) {
        const raw = await fs.promises.readFile(this.usersFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const u of parsed) {
            this.indexUser(u);
          }
          logger.info(`💾 بارگذاری ${this.cache.size} کاربر از ذخیره‌ساز پایدار دیسک.`);
          return;
        }
      }

      // Seed initial users on first run
      for (const u of INITIAL_USERS) {
        const stored: StoredUser = {
          ...u,
          version: (u as any).version || 1,
          password_hash: (u as any).password_hash || (u as any).password || u.phone,
        };
        this.indexUser(stored);
      }
      await this.flushToDisk();
      logger.info(`💾 مقداردهی اولیه ${this.cache.size} کاربر در ذخیره‌ساز پایدار دیسک.`);
    } catch (err: any) {
      logger.warn(`خطا در مقداردهی اولیه پایگاه داده کاربران روی دیسک: ${err?.message || err}`);
      // Fallback: seed in memory
      for (const u of INITIAL_USERS) {
        this.indexUser({
          ...u,
          version: 1,
          password_hash: (u as any).password_hash || u.phone,
        });
      }
    }
  }

  private indexUser(user: StoredUser): void {
    this.cache.set(user.id, user);
    if (user.nationalId) {
      this.nationalIdIndex.set(user.nationalId.trim().toLowerCase(), user.id);
    }
    if (user.username) {
      this.usernameIndex.set(user.username.trim().toLowerCase(), user.id);
    }
  }

  private deindexUser(user: StoredUser): void {
    this.cache.delete(user.id);
    if (user.nationalId) {
      this.nationalIdIndex.delete(user.nationalId.trim().toLowerCase());
    }
    if (user.username) {
      this.usernameIndex.delete(user.username.trim().toLowerCase());
    }
  }

  private async flushToDisk(): Promise<void> {
    try {
      await fs.promises.mkdir(this.usersDir, { recursive: true, mode: 0o755 });
      const list = Array.from(this.cache.values());
      const tempPath = `${this.usersFilePath}.tmp_${Date.now()}`;
      await fs.promises.writeFile(tempPath, JSON.stringify(list, null, 2), 'utf-8');
      await fs.promises.rename(tempPath, this.usersFilePath);
    } catch (err: any) {
      logger.warn(`خطا در ذخیره کاربران بر روی دیسک: ${err?.message || err}`);
    }
  }

  async getAllUsers(): Promise<StoredUser[]> {
    await this.ensureInitialized();
    return Array.from(this.cache.values());
  }

  async findById(id: string): Promise<StoredUser | undefined> {
    await this.ensureInitialized();
    return this.cache.get(id);
  }

  async findByIdentifier(identifier: string): Promise<StoredUser | undefined> {
    await this.ensureInitialized();
    const clean = (identifier || '').trim().toLowerCase();
    
    // Check by national ID index
    const idFromNat = this.nationalIdIndex.get(clean);
    if (idFromNat) return this.cache.get(idFromNat);

    // Check by username index
    const idFromUsername = this.usernameIndex.get(clean);
    if (idFromUsername) return this.cache.get(idFromUsername);

    // Direct ID lookup
    return this.cache.get(identifier);
  }

  async saveUser(user: StoredUser): Promise<void> {
    await this.ensureInitialized();
    const existing = this.cache.get(user.id);
    if (existing) {
      this.deindexUser(existing);
    }
    this.indexUser(user);
    await this.flushToDisk();
  }

  async deleteUser(id: string): Promise<void> {
    await this.ensureInitialized();
    const existing = this.cache.get(id);
    if (existing) {
      this.deindexUser(existing);
      await this.flushToDisk();
    }
  }
}

export const userDiskStorage = new UserDiskStorageEngine();
