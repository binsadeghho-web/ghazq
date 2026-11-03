import { getPool, isDatabaseConnected } from '../../platform/mysqlDatabase';
import { logger } from '../../platform/logger';

/**
 * Item 7: Dedicated WallOwnershipRepository
 * Stores post ownership separately from public synergy_posts content table.
 * Strictly used ONLY for:
 * 1) "My Posts and Conversations" (user viewing their own submissions)
 * 2) Admin audited investigation (with audit log recorded)
 * NEVER joined with public content tables outside this repository.
 */

// In-memory fallback tracking for dev/test when MySQL is disconnected
const inMemoryOwnership = new Map<string, string>(); // postId -> userId

export class WallOwnershipRepository {
  /**
   * Records ownership link between post_id and user_id
   */
  async recordOwnership(postId: string, userId: string): Promise<void> {
    inMemoryOwnership.set(postId, userId);

    if (isDatabaseConnected()) {
      try {
        const p = getPool();
        // BINARY(16) UUID conversion
        await p.query(
          `INSERT IGNORE INTO wall_ownership (post_id, user_id) 
           VALUES (UNHEX(REPLACE(?, '-', '')), UNHEX(REPLACE(?, '-', '')))`,
          [postId, userId]
        );
      } catch (err: any) {
        logger.warn(`Failed to insert wall_ownership to MySQL: ${err.message}`);
      }
    }
  }

  /**
   * Finds post IDs owned by a specific user (for "My Posts")
   */
  async findPostIdsByUserId(userId: string): Promise<string[]> {
    if (isDatabaseConnected()) {
      try {
        const p = getPool();
        const [rows] = await p.query<any[]>(
          `SELECT LOWER(CONCAT(
            SUBSTR(HEX(post_id), 1, 8), '-',
            SUBSTR(HEX(post_id), 9, 4), '-',
            SUBSTR(HEX(post_id), 13, 4), '-',
            SUBSTR(HEX(post_id), 17, 4), '-',
            SUBSTR(HEX(post_id), 21, 12)
          )) AS post_id
          FROM wall_ownership 
          WHERE user_id = UNHEX(REPLACE(?, '-', ''))
          ORDER BY created_at DESC`,
          [userId]
        );
        return rows.map(r => r.post_id);
      } catch (err: any) {
        logger.warn(`Failed to query wall_ownership from MySQL: ${err.message}`);
      }
    }

    // In-memory lookup
    const postIds: string[] = [];
    for (const [pId, uId] of inMemoryOwnership.entries()) {
      if (uId === userId) postIds.push(pId);
    }
    return postIds;
  }

  /**
   * Finds the owner of a post strictly for admin security auditing
   */
  async findOwnerByPostId(postId: string): Promise<string | null> {
    if (isDatabaseConnected()) {
      try {
        const p = getPool();
        const [rows] = await p.query<any[]>(
          `SELECT LOWER(CONCAT(
            SUBSTR(HEX(user_id), 1, 8), '-',
            SUBSTR(HEX(user_id), 9, 4), '-',
            SUBSTR(HEX(user_id), 13, 4), '-',
            SUBSTR(HEX(user_id), 17, 4), '-',
            SUBSTR(HEX(user_id), 21, 12)
          )) AS user_id
          FROM wall_ownership 
          WHERE post_id = UNHEX(REPLACE(?, '-', ''))
          LIMIT 1`,
          [postId]
        );
        if (rows.length > 0) return rows[0].user_id;
      } catch (err: any) {
        logger.warn(`Failed to query owner from wall_ownership: ${err.message}`);
      }
    }

    return inMemoryOwnership.get(postId) || null;
  }
}

export const wallOwnershipRepo = new WallOwnershipRepository();
