import { getPool, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { logger } from '../../platform/logger';
import { AppError } from '../../platform/errors';
import { toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';

/**
 * Item 7: Dedicated WallOwnershipRepository
 * Stores post ownership separately from public synergy_posts content table.
 * Strictly used ONLY for:
 * 1) "My Posts and Conversations" (user viewing their own submissions)
 * 2) Admin audited investigation (with audit log recorded)
 * NEVER joined with public content tables outside this repository.
 */

export class WallOwnershipRepository {
  /**
   * Records ownership link between post_id and user_id in MySQL
   */
  async recordOwnership(postId: string, userId: string): Promise<void> {
    ensureDatabaseConnection();
    try {
      const p = getPool();
      await p.query(
        `INSERT IGNORE INTO wall_ownership (post_id, user_id) VALUES (?, ?)`,
        [toIdBuffer(postId), toIdBuffer(userId)]
      );
    } catch (err: any) {
      logger.error(`Failed to insert wall_ownership to MySQL: ${err.message}`);
      throw AppError.serviceUnavailable('امکان ثبت مالکیت پست در پایگاه داده وجود ندارد.');
    }
  }

  /**
   * Finds post IDs owned by a specific user (for "My Posts")
   */
  async findPostIdsByUserId(userId: string): Promise<string[]> {
    ensureDatabaseConnection();
    try {
      const p = getPool();
      const uBuf = toIdBuffer(userId);
      const [rows] = await p.query<any[]>(
        `SELECT post_id FROM wall_ownership WHERE user_id = ? OR user_id = ? ORDER BY created_at DESC`,
        [uBuf, userId]
      );
      return (rows || []).map(r => fromIdBuffer(r.post_id));
    } catch (err: any) {
      logger.error(`Failed to query wall_ownership from MySQL: ${err.message}`);
      throw AppError.serviceUnavailable('امکان خواندن شناسه پست‌های کاربر وجود ندارد.');
    }
  }

  /**
   * Finds the owner of a post strictly for admin security auditing
   */
  async findOwnerByPostId(postId: string): Promise<string | null> {
    ensureDatabaseConnection();
    try {
      const p = getPool();
      const pBuf = toIdBuffer(postId);
      const [rows] = await p.query<any[]>(
        `SELECT user_id FROM wall_ownership WHERE post_id = ? OR post_id = ? LIMIT 1`,
        [pBuf, postId]
      );
      if (rows && rows.length > 0) return fromIdBuffer(rows[0].user_id);
      return null;
    } catch (err: any) {
      logger.error(`Failed to query owner from wall_ownership: ${err.message}`);
      throw AppError.serviceUnavailable('امکان استعلام مالک پست وجود ندارد.');
    }
  }
}

export const wallOwnershipRepo = new WallOwnershipRepository();
