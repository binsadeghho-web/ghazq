import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';
import {
  INITIAL_USERS,
  INITIAL_CARTABLE_REQUESTS,
  INITIAL_COURSES,
  INITIAL_PRODUCTS,
  INITIAL_CONSULTANTS,
  INITIAL_RULINGS,
  INITIAL_WELFARE_REQUESTS,
  INITIAL_CONSUMABLES,
  INITIAL_SYNERGY_POSTS,
  DEFAULT_CREXTIO_CONFIG,
  DEFAULT_MIZAN_CONFIG
} from '../../data/mockData';

// Configuration from environment variables (or defaults provided by user)
export const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || 'remote-pishgaman.runflare.com',
  port: Number(process.env.DB_PORT || process.env.MYSQL_PORT) || 31526,
  user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || 'yeNn1HZfLMrkUa52lwHm',
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'ghzadatafgd_db',
  connectionLimit: 10, // Item 10: Pool sizing based on Little's Law for cloud micro-instance
  waitForConnections: true,
  queueLimit: 100,
  connectTimeout: 7000,
  enableKeepAlive: true,
  idleTimeout: 60000, // Item 5: Close idle connections after 60s
  timezone: 'Z',
  charset: 'utf8mb4',
  decimalNumbers: false, // Item 18: Read DECIMAL as string to prevent floating point inaccuracies
};

let pool: Pool | null = null;
let isConnected = false;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);

    // Item 4: Run on every pool connection explicitly
    pool.on('connection', (connection: any) => {
      connection.query("SET time_zone='+00:00';");
      connection.query("SET NAMES utf8mb4;");
    });
  }
  return pool;
}

export function isDatabaseConnected(): boolean {
  return isConnected;
}

/**
 * Item 5: Pool Connection Acquire with Timeout via Promise.race
 * (mysql2 does not provide native acquireTimeout option)
 */
export async function acquireConnection(timeoutMs = 3000): Promise<PoolConnection> {
  const p = getPool();
  let timer: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`مهلت دریافت اتصال از استخر پایگاه داده پس از ${timeoutMs} میلی‌ثانیه به پایان رسید (Pool Acquire Timeout).`));
    }, timeoutMs);
  });

  try {
    const conn = await Promise.race([p.getConnection(), timeoutPromise]);
    clearTimeout(timer!);
    return conn;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

/**
 * Item 5: SELECT Query with Optimizer Timeout Hint
 */
export async function selectWithTimeout<T = any>(
  query: string,
  params: any[] = [],
  timeoutMs = 3000
): Promise<T[]> {
  const p = getPool();
  // Inject MySQL 8 optimizer hint if SELECT
  const hintedQuery = query.trim().toUpperCase().startsWith('SELECT')
    ? query.replace(/^SELECT/i, `SELECT /*+ MAX_EXECUTION_TIME(${timeoutMs}) */`)
    : query;

  const [rows] = await p.query<any>(hintedQuery, params);
  return rows as T[];
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await selectWithTimeout('SELECT 1 as alive', [], 2000);
    isConnected = true;
    return true;
  } catch (err: any) {
    isConnected = false;
    return false;
  }
}

/**
 * Unit of Work: Executes callback within a transaction (Data Architecture Ref v3.0, Section 2 & 5)
 */
export async function withTx<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await acquireConnection(4000);
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Initializes database schemas and initial seeds automatically on startup.
 * The user does NOT need to run any manual SQL script.
 */
export async function initializeDatabase(): Promise<boolean> {
  logger.info(`Connecting to MySQL 8 on ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);

  try {
    const p = getPool();
    const conn = await p.getConnection();

    try {
      isConnected = true;
      logger.info('Connected successfully to MySQL 8 database on Runflare.');

      // 1. Create Tables
      await conn.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
          setting_value JSON NOT NULL,
          description VARCHAR(255) NULL,
          updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS idempotency_keys (
          user_id VARCHAR(64) NOT NULL,
          \`key\` VARCHAR(64) NOT NULL,
          request_hash CHAR(64) NOT NULL,
          response JSON NULL,
          status_code SMALLINT NULL,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (user_id, \`key\`),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS outbox (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          topic VARCHAR(100) NOT NULL,
          payload JSON NOT NULL,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          published_at DATETIME(3) NULL,
          INDEX idx_unpublished (published_at, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          timestamp DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          event_type VARCHAR(64) NOT NULL,
          actor_id VARCHAR(64) NOT NULL,
          actor_name VARCHAR(255) NOT NULL,
          actor_role VARCHAR(32) NOT NULL,
          ip VARCHAR(64) NOT NULL DEFAULT '127.0.0.1',
          details TEXT NOT NULL,
          severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
          prev_hash CHAR(64) NOT NULL,
          entry_hash CHAR(64) NOT NULL,
          sequence_num BIGINT AUTO_INCREMENT UNIQUE NOT NULL,
          INDEX idx_actor_time (actor_id, timestamp),
          INDEX idx_event_time (event_type, timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          national_id VARCHAR(10) NOT NULL UNIQUE,
          username VARCHAR(64) NULL UNIQUE,
          password_hash VARCHAR(255) NULL,
          full_name VARCHAR(255) NOT NULL,
          phone VARCHAR(15) NOT NULL,
          role ENUM('admin', 'supervisor', 'alumni') NOT NULL DEFAULT 'alumni',
          role_title VARCHAR(128) NOT NULL,
          organization VARCHAR(255) NOT NULL,
          graduation_year VARCHAR(10) NOT NULL,
          avatar_text VARCHAR(16) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          is_locked BOOLEAN NOT NULL DEFAULT FALSE,
          failed_attempts INT NOT NULL DEFAULT 0,
          lock_expires_at DATETIME(3) NULL,
          token_version INT NOT NULL DEFAULT 1,
          has_account BOOLEAN NOT NULL DEFAULT TRUE,
          judicial_grade INT NULL,
          court_branch VARCHAR(128) NULL,
          province VARCHAR(64) NULL,
          email VARCHAR(128) NULL,
          employment_status VARCHAR(64) NULL,
          current_judicial_post VARCHAR(128) NULL,
          service_years INT NULL,
          judicial_specialty VARCHAR(128) NULL,
          academic_degree VARCHAR(128) NULL,
          residential_address TEXT NULL,
          permissions JSON NULL,
          section_permissions JSON NULL,
          sessions JSON NULL,
          version INT NOT NULL DEFAULT 1,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          INDEX idx_role_status (role, is_active),
          INDEX idx_province (province)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS cartable_requests (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          tracking_number VARCHAR(32) NOT NULL UNIQUE,
          category ENUM('career', 'administrative', 'educational') NOT NULL,
          category_title VARCHAR(128) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          applicant_id VARCHAR(36) NOT NULL,
          applicant_name VARCHAR(255) NOT NULL,
          applicant_role_title VARCHAR(128) NOT NULL,
          priority ENUM('normal', 'urgent', 'instant') NOT NULL DEFAULT 'normal',
          status ENUM('pending', 'in_progress', 'need_info', 'rejected', 'completed', 'archived') NOT NULL DEFAULT 'pending',
          has_unread_supervisor BOOLEAN NOT NULL DEFAULT FALSE,
          has_unread_applicant BOOLEAN NOT NULL DEFAULT FALSE,
          version INT NOT NULL DEFAULT 1,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          INDEX idx_applicant_status (applicant_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS courses (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          instructor VARCHAR(255) NOT NULL,
          instructor_title VARCHAR(128) NULL,
          category VARCHAR(128) NULL,
          level VARCHAR(64) NOT NULL,
          hours INT NOT NULL DEFAULT 0,
          capacity INT NOT NULL DEFAULT 50,
          enrolled_count INT NOT NULL DEFAULT 0,
          schedule VARCHAR(255) NOT NULL,
          holding_format ENUM('online', 'in_person', 'hybrid') NOT NULL DEFAULT 'online',
          venue_address TEXT NULL,
          meeting_link VARCHAR(255) NULL,
          cover_image VARCHAR(512) NULL,
          price DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
          has_installments BOOLEAN NOT NULL DEFAULT FALSE,
          has_certificate BOOLEAN NOT NULL DEFAULT TRUE,
          description TEXT NOT NULL,
          topics JSON NULL,
          status ENUM('enrolling', 'ongoing', 'completed') NOT NULL DEFAULT 'enrolling',
          is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
          version INT NOT NULL DEFAULT 1,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          INDEX idx_status_del (status, is_deleted)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          subtitle VARCHAR(255) NULL,
          author_or_presenter VARCHAR(255) NOT NULL,
          format ENUM('book', 'multimedia', 'audio_series') NOT NULL DEFAULT 'book',
          format_title VARCHAR(64) NOT NULL,
          price DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
          description TEXT NOT NULL,
          pages_or_duration VARCHAR(64) NOT NULL,
          published_year VARCHAR(10) NOT NULL,
          publisher VARCHAR(128) NULL,
          cover_image VARCHAR(512) NULL,
          is_available BOOLEAN NOT NULL DEFAULT TRUE,
          badge_text VARCHAR(64) NULL,
          version INT NOT NULL DEFAULT 1,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          INDEX idx_format_avail (format, is_available)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS consultants (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          specialty VARCHAR(255) NOT NULL,
          bio TEXT NOT NULL,
          experience_years INT NOT NULL DEFAULT 0,
          availability VARCHAR(128) NOT NULL,
          avatar_url VARCHAR(512) NULL,
          counseling_type ENUM('general', 'specialized_career') NOT NULL DEFAULT 'general',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS judicial_rulings (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          court_branch VARCHAR(255) NOT NULL,
          judge_name VARCHAR(255) NOT NULL,
          ruling_date VARCHAR(32) NOT NULL,
          case_type ENUM('criminal', 'civil', 'commercial', 'family') NOT NULL,
          case_type_title VARCHAR(64) NOT NULL,
          summary TEXT NOT NULL,
          legal_principles JSON NULL,
          full_ruling_text MEDIUMTEXT NOT NULL,
          status ENUM('pending_review', 'selected') NOT NULL DEFAULT 'selected',
          submitted_by_id VARCHAR(36) NOT NULL,
          submitted_by_name VARCHAR(255) NOT NULL,
          likes_count INT NOT NULL DEFAULT 0,
          version INT NOT NULL DEFAULT 1,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS welfare_requests (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          applicant_id VARCHAR(36) NOT NULL,
          applicant_name VARCHAR(255) NOT NULL,
          type ENUM('loan', 'accommodation') NOT NULL,
          type_title VARCHAR(128) NOT NULL,
          title VARCHAR(255) NOT NULL,
          requested_value VARCHAR(128) NOT NULL,
          status ENUM('pending', 'approved', 'disbursed', 'rejected') NOT NULL DEFAULT 'pending',
          description TEXT NOT NULL,
          admin_note TEXT NULL,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS consumables (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(128) NOT NULL,
          cooperative_price DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
          market_price DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
          unit VARCHAR(32) NOT NULL,
          stock INT NOT NULL DEFAULT 0,
          description TEXT NOT NULL,
          version INT NOT NULL DEFAULT 1,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS synergy_posts (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          author_id VARCHAR(36) NOT NULL,
          author_pseudonym VARCHAR(255) NOT NULL,
          is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          province_or_city VARCHAR(64) NOT NULL,
          category VARCHAR(64) NOT NULL,
          category_title VARCHAR(128) NOT NULL,
          is_empathy BOOLEAN NOT NULL DEFAULT FALSE,
          urgency ENUM('عادی', 'فوری') NOT NULL DEFAULT 'عادی',
          status ENUM('open', 'resolved') NOT NULL DEFAULT 'open',
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS experiences (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          author_id VARCHAR(36) NOT NULL,
          author_title VARCHAR(255) NOT NULL,
          category VARCHAR(64) NOT NULL,
          title VARCHAR(255) NOT NULL,
          summary TEXT NOT NULL,
          lessons_learned JSON NULL,
          likes_count INT NOT NULL DEFAULT 0,
          liked_by JSON NULL,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // 2. Seed Default Settings if not exists
      const [settingsRows] = await conn.query<any[]>(
        'SELECT setting_key FROM system_settings WHERE setting_key = ?',
        ['crextio_dashboard_config']
      );

      if (settingsRows.length === 0) {
        await conn.query(
          'INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
          [
            'crextio_dashboard_config',
            JSON.stringify(DEFAULT_CREXTIO_CONFIG),
            'تنظیمات پیش‌فرض ویترین‌ها و چیدمان داشبورد تم دوم'
          ]
        );
        logger.info('Seeded default crextio_dashboard_config to MySQL.');
      }

      // 3. Seed Default Users if empty
      const [userRows] = await conn.query<any[]>('SELECT count(*) as count FROM users');
      if (userRows[0].count === 0) {
        for (const u of INITIAL_USERS) {
          await conn.query(
            `INSERT IGNORE INTO users (
              id, national_id, username, full_name, phone, role, role_title, 
              organization, graduation_year, avatar_text, is_active, is_locked, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              u.id, u.nationalId, u.username || u.nationalId, u.fullName, u.phone,
              u.role, u.roleTitle, u.organization, u.graduationYear, u.avatarText,
              u.isActive ? 1 : 0, u.isLocked ? 1 : 0
            ]
          );
        }
        logger.info(`Seeded ${INITIAL_USERS.length} default users to MySQL.`);
      }

      // 4. Seed Default Courses if empty
      const [courseRows] = await conn.query<any[]>('SELECT count(*) as count FROM courses');
      if (courseRows[0].count === 0) {
        for (const c of INITIAL_COURSES) {
          await conn.query(
            `INSERT IGNORE INTO courses (
              id, title, instructor, level, hours, schedule, description, price, status, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              c.id, c.title, c.instructor, c.level, c.hours,
              c.schedule, c.description, c.price, c.status
            ]
          );
        }
        logger.info(`Seeded ${INITIAL_COURSES.length} default courses to MySQL.`);
      }

      // 5. Seed Default Products if empty
      const [prodRows] = await conn.query<any[]>('SELECT count(*) as count FROM products');
      if (prodRows[0].count === 0) {
        for (const p of INITIAL_PRODUCTS) {
          await conn.query(
            `INSERT IGNORE INTO products (
              id, title, author_or_presenter, format, format_title, price,
              description, pages_or_duration, published_year, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              p.id, p.title, p.authorOrPresenter, p.format, p.formatTitle,
              p.price, p.description, p.pagesOrDuration, p.publishedYear
            ]
          );
        }
        logger.info(`Seeded ${INITIAL_PRODUCTS.length} default products to MySQL.`);
      }

      // 6. Seed Default Consultants if empty
      const [consRows] = await conn.query<any[]>('SELECT count(*) as count FROM consultants');
      if (consRows[0].count === 0) {
        for (const c of INITIAL_CONSULTANTS) {
          await conn.query(
            `INSERT IGNORE INTO consultants (
              id, name, title, specialty, bio, experience_years, availability,
              avatar_url, counseling_type, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              c.id, c.name, c.title, c.specialty, c.bio, c.experienceYears,
              c.availability, c.avatarUrl || null, c.counselingType || 'general',
              c.isActive !== false ? 1 : 0
            ]
          );
        }
        logger.info(`Seeded ${INITIAL_CONSULTANTS.length} default consultants to MySQL.`);
      }

      // 7. Seed Default Synergy Posts if empty
      const [synRows] = await conn.query<any[]>('SELECT count(*) as count FROM synergy_posts');
      if (synRows[0].count === 0) {
        for (const s of INITIAL_SYNERGY_POSTS) {
          await conn.query(
            `INSERT IGNORE INTO synergy_posts (
              id, author_id, author_pseudonym, is_anonymous, title, content,
              province_or_city, category, category_title, is_empathy, urgency, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              s.id, s.authorId, s.authorPseudonym, s.isAnonymous ? 1 : 0,
              s.title, s.content, s.provinceOrCity, s.category,
              s.categoryTitle, s.isEmpathy ? 1 : 0, s.urgency, s.status
            ]
          );
        }
        logger.info(`Seeded ${INITIAL_SYNERGY_POSTS.length} default synergy posts to MySQL.`);
      }

      logger.info('MySQL 8 enterprise schema & seed verification completed successfully.');
      return true;
    } finally {
      conn.release();
    }
  } catch (err: any) {
    isConnected = false;
    logger.warn(`MySQL connection notice: ${err.message}.`);
    logger.info('System will use hybrid persistence engine and retry MySQL connection.');
    return false;
  }
}

/**
 * Persists a system setting (such as showcase configs) to MySQL system_settings table.
 */
export async function saveSystemSetting<T>(key: string, value: T, description?: string): Promise<boolean> {
  if (!isConnected) return false;
  try {
    const p = getPool();
    await p.query(
      `INSERT INTO system_settings (setting_key, setting_value, description)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP(3)`,
      [key, JSON.stringify(value), description || null]
    );
    return true;
  } catch (err: any) {
    logger.warn(`Failed to save setting ${key} to MySQL: ${err.message}`);
    return false;
  }
}

export interface SystemSettingRecord<T> {
  key: string;
  value: T;
  version: number;
  lastModifiedBy: string | null;
  updatedAt: string;
}

/**
 * Retrieves setting with version and lastModified metadata directly from MySQL
 */
export async function getSystemSettingRecord<T>(key: string): Promise<SystemSettingRecord<T> | null> {
  if (!isConnected) return null;
  try {
    const p = getPool();
    const [rows] = await p.query<any[]>(
      'SELECT setting_key, setting_value, version, last_modified_by, updated_at FROM system_settings WHERE setting_key = ?',
      [key]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    const value = typeof row.setting_value === 'string' ? JSON.parse(row.setting_value) : row.setting_value;
    return {
      key: row.setting_key,
      value,
      version: Number(row.version || 1),
      lastModifiedBy: row.last_modified_by,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    };
  } catch (err: any) {
    logger.warn(`Failed to read setting record ${key} from MySQL: ${err.message}`);
    return null;
  }
}

/**
 * Item 1: Optimistic Update directly in MySQL:
 * UPDATE system_settings SET setting_value=?, version=version+1 WHERE setting_key=? AND version=?
 * If affectedRows === 0, returns conflict: true (triggering HTTP 409).
 */
export async function updateSystemSettingOptimistic<T>(
  key: string,
  value: T,
  baseVersion: number,
  lastModifiedBy: string
): Promise<{ success: boolean; conflict: boolean; newVersion: number }> {
  if (!isConnected) {
    return { success: false, conflict: false, newVersion: baseVersion + 1 };
  }
  try {
    const p = getPool();
    const [result] = await p.query<any>(
      `UPDATE system_settings 
       SET setting_value = ?, version = version + 1, last_modified_by = ?, updated_at = CURRENT_TIMESTAMP(3)
       WHERE setting_key = ? AND version = ?`,
      [JSON.stringify(value), lastModifiedBy, key, baseVersion]
    );

    if (result.affectedRows === 0) {
      return { success: false, conflict: true, newVersion: baseVersion };
    }

    return { success: true, conflict: false, newVersion: baseVersion + 1 };
  } catch (err: any) {
    logger.warn(`Optimistic update error for ${key}: ${err.message}`);
    return { success: false, conflict: false, newVersion: baseVersion + 1 };
  }
}
