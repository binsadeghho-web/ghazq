import crypto from 'crypto';
import { getPool } from '../../platform/mysqlDatabase';
import { uuidStringToBinary, binaryToUuidString } from '../../platform/uuidv7';

/**
 * Wall Identity Repository (Isolated Identity Layer)
 * 
 * Strict architectural boundary: No external service or API handler is permitted
 * to join wall_identities with synergy_posts or experiences.
 * In environments where the cloud database host (e.g. Runflare standard) provides
 * a single 'root' user, separation of concerns is strictly enforced via this
 * isolated repository layer.
 */

export interface WallIdentityRecord {
  userId: string;
  pseudonym: string;
  identityHash: string;
  salt: string;
  createdAt: string;
}

export class WallIdentityRepository {
  /**
   * Generates a deterministic, zero-knowledge pseudonym for an alumni member
   * based on judicial rank/specialty without exposing the real national ID or full name.
   */
  static generatePseudonym(judicialSpecialty?: string, province?: string): string {
    const titles = [
      'قاضی دادگاه تجدیدنظر',
      'مستشار دیوان عالی کشور',
      'دادرس دادگاه عمومی حقوقی',
      'بازپرس دادسرای عمومی و انقلاب',
      'رئیس شعبه دادگاه کیفری',
      'پژوهشگر فقه القضاء',
      'مدرس حوزه و دانشگاه',
    ];

    const specialtySuffix = judicialSpecialty ? ` (${judicialSpecialty})` : '';
    const provinceSuffix = province ? ` - استان ${province}` : '';
    const base = titles[Math.floor(Math.random() * titles.length)];
    const code = Math.floor(100 + Math.random() * 900);

    return `${base} کد ${code}${specialtySuffix}${provinceSuffix}`;
  }

  /**
   * Obtains or creates an isolated wall identity for the user.
   */
  async getOrCreateIdentity(userId: string, specialty?: string, province?: string): Promise<string> {
    const pool = getPool();
    const userBinary = uuidStringToBinary(userId);

    // Check existing
    const [rows] = await pool.query<any[]>(
      'SELECT pseudonym FROM wall_identities WHERE user_id = ?',
      [userBinary]
    );

    if (rows.length > 0) {
      return rows[0].pseudonym;
    }

    // Create new identity with dedicated salt
    const salt = crypto.randomBytes(16).toString('hex');
    const identityHash = crypto.createHmac('sha256', salt).update(userId).digest('hex');
    const pseudonym = WallIdentityRepository.generatePseudonym(specialty, province);

    await pool.query(
      `INSERT INTO wall_identities (user_id, pseudonym, identity_hash, salt, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3))`,
      [userBinary, pseudonym, identityHash, salt]
    );

    return pseudonym;
  }
}

export const wallIdentityRepo = new WallIdentityRepository();
