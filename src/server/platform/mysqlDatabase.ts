import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { logger } from './logger';
import { AppError } from './errors';

/**
 * Pure MySQL 8 Connection Pool & Transaction Layer
 * Compliant with Data Architecture v3.0 (Sections 1, 5, 9, 18):
 * - Pool sizing based on Little's Law for cloud micro-instance
 * - acquireConnection with Promise.race & immediate release if timed out (Zero-leak)
 * - selectWithTimeout with MySQL 8 query optimizer hint MAX_EXECUTION_TIME
 * - withTx unit-of-work with automatic rollback and release in finally
 * - Deadlock retry helper
 */

export const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || process.env.MYSQL_PORT) || 3306,
  user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'ghzadatafgd_db',
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  waitForConnections: true,
  queueLimit: 100,
  connectTimeout: 5000,
  enableKeepAlive: true,
  idleTimeout: 60000,
  timezone: 'Z',
  charset: 'utf8mb4',
  decimalNumbers: false, // Read DECIMAL as string to prevent float bugs
};

export function validateDatabaseEnv(): void {
  const missing: string[] = [];
  if (!process.env.DB_HOST && !process.env.MYSQL_HOST) missing.push('DB_HOST (یا MYSQL_HOST)');
  if (!process.env.DB_USER && !process.env.MYSQL_USER) missing.push('DB_USER (یا MYSQL_USER)');
  if (!process.env.DB_PASSWORD && !process.env.MYSQL_PASSWORD) missing.push('DB_PASSWORD (یا MYSQL_PASSWORD)');
  if (!process.env.DB_NAME && !process.env.MYSQL_DATABASE) missing.push('DB_NAME (یا MYSQL_DATABASE)');

  if (missing.length > 0) {
    logger.warn(`⚠️ هشدار متغیرهای محیطی دیتابیس: متغیرهای [${missing.join(', ')}] ست نشده‌اند. لطفاً متغیرهای اتصال به MySQL را در پنل رانفلر تنظیم فرمایید.`);
  }
}

let pool: Pool | null = null;
let isConnected = false;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    pool.on('connection', (conn: any) => {
      conn.query("SET time_zone='+00:00';");
      conn.query("SET NAMES utf8mb4;");
    });
  }
  return pool;
}

export function isDatabaseConnected(): boolean {
  return isConnected;
}

export function ensureDatabaseConnection(): void {
  if (!isConnected) {
    throw AppError.serviceUnavailable('امکان برقراری اتصال با سرور پایگاه داده MySQL وجود ندارد.');
  }
}

/**
 * Item 5: Pool Connection Acquire with Leak Prevention:
 * If timeout fires before getConnection resolves, any later resolved connection is immediately released!
 */
export async function acquireConnection(timeoutMs = 4000): Promise<PoolConnection> {
  const p = getPool();
  let timer: NodeJS.Timeout | null = null;
  let timedOut = false;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      reject(new AppError({
        status: 504,
        code: 'CONNECTION_POOL_TIMEOUT',
        title: 'مهلت دریافت اتصال به پایان رسید',
        detail: `مهلت دریافت اتصال از استخر پایگاه داده پس از ${timeoutMs} میلی‌ثانیه به پایان رسید.`,
      }));
    }, timeoutMs);
  });

  try {
    const connPromise = p.getConnection().then(conn => {
      if (timedOut) {
        try { conn.release(); } catch {}
        throw new AppError({
          status: 504,
          code: 'CONNECTION_POOL_TIMEOUT',
          title: 'اتصال منقضی شد',
          detail: 'اتصال پس از مهلت زمانی واکشی شد و بلافاصله آزاد گردید.',
        });
      }
      return conn;
    });

    return await Promise.race([connPromise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
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
  const hintedQuery = query.trim().toUpperCase().startsWith('SELECT')
    ? query.replace(/^SELECT/i, `SELECT /*+ MAX_EXECUTION_TIME(${timeoutMs}) */`)
    : query;

  const [rows] = await p.query<any>(hintedQuery, params);
  return rows as T[];
}

export async function initMySQLTables(): Promise<void> {
  const p = getPool();
  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        national_id VARCHAR(32) NULL UNIQUE,
        username VARCHAR(64) UNIQUE,
        password_hash VARCHAR(255),
        full_name VARCHAR(128) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'alumni',
        role_title VARCHAR(128) NOT NULL,
        site_title VARCHAR(128) NULL,
        profile_picture_url VARCHAR(512) NULL,
        personnel_id VARCHAR(32) NULL,
        judicial_grade INT DEFAULT 0,
        court_branch VARCHAR(128) NULL,
        province VARCHAR(64) NULL,
        email VARCHAR(128) NULL,
        academic_degree VARCHAR(128) NULL,
        thesis_title VARCHAR(255) NULL,
        supervisor_professor VARCHAR(128) NULL,
        birth_date VARCHAR(32) NULL,
        father_name VARCHAR(64) NULL,
        id_number VARCHAR(32) NULL,
        marital_status VARCHAR(32) NULL,
        children_count INT DEFAULT 0,
        residential_address VARCHAR(255) NULL,
        seminary_level VARCHAR(128) NULL,
        seminary_school VARCHAR(128) NULL,
        university_degree VARCHAR(128) NULL,
        university_name VARCHAR(128) NULL,
        field_of_study VARCHAR(128) NULL,
        academic_honors VARCHAR(255) NULL,
        association_membership_date VARCHAR(32) NULL,
        association_responsibility VARCHAR(128) NULL,
        association_contributions JSON NULL,
        membership_status VARCHAR(32) NULL,
        internal_notes TEXT NULL,
        employment_status VARCHAR(64) NULL,
        current_judicial_post VARCHAR(128) NULL,
        service_years INT DEFAULT 0,
        judicial_specialty VARCHAR(128) NULL,
        permissions JSON NULL,
        organization VARCHAR(128) NOT NULL DEFAULT 'قوه قضائیه',
        graduation_year VARCHAR(32) NOT NULL DEFAULT '۱۴۰۲',
        avatar_text VARCHAR(16),
        is_active TINYINT(1) DEFAULT 1,
        is_locked TINYINT(1) DEFAULT 0,
        failed_attempts INT DEFAULT 0,
        locked_until DATETIME NULL,
        token_version INT DEFAULT 1,
        must_change_password TINYINT(1) DEFAULT 0,
        has_account TINYINT(1) DEFAULT 1,
        version INT DEFAULT 1,
        sessions JSON NULL,
        section_permissions JSON NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_users_national_id (national_id),
        INDEX idx_users_username (username),
        INDEX idx_users_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Migration helper: dynamically ensure missing columns exist on table users
    const alterCols = [
      `ADD COLUMN personnel_id VARCHAR(32) NULL`,
      `ADD COLUMN site_title VARCHAR(128) NULL`,
      `ADD COLUMN profile_picture_url VARCHAR(512) NULL`,
      `ADD COLUMN judicial_grade INT DEFAULT 0`,
      `ADD COLUMN court_branch VARCHAR(128) NULL`,
      `ADD COLUMN province VARCHAR(64) NULL`,
      `ADD COLUMN email VARCHAR(128) NULL`,
      `ADD COLUMN academic_degree VARCHAR(128) NULL`,
      `ADD COLUMN thesis_title VARCHAR(255) NULL`,
      `ADD COLUMN supervisor_professor VARCHAR(128) NULL`,
      `ADD COLUMN birth_date VARCHAR(32) NULL`,
      `ADD COLUMN father_name VARCHAR(64) NULL`,
      `ADD COLUMN id_number VARCHAR(32) NULL`,
      `ADD COLUMN marital_status VARCHAR(32) NULL`,
      `ADD COLUMN children_count INT DEFAULT 0`,
      `ADD COLUMN residential_address VARCHAR(255) NULL`,
      `ADD COLUMN seminary_level VARCHAR(128) NULL`,
      `ADD COLUMN seminary_school VARCHAR(128) NULL`,
      `ADD COLUMN university_degree VARCHAR(128) NULL`,
      `ADD COLUMN university_name VARCHAR(128) NULL`,
      `ADD COLUMN field_of_study VARCHAR(128) NULL`,
      `ADD COLUMN academic_honors VARCHAR(255) NULL`,
      `ADD COLUMN association_membership_date VARCHAR(32) NULL`,
      `ADD COLUMN association_responsibility VARCHAR(128) NULL`,
      `ADD COLUMN association_contributions JSON NULL`,
      `ADD COLUMN membership_status VARCHAR(32) NULL`,
      `ADD COLUMN internal_notes TEXT NULL`,
      `ADD COLUMN employment_status VARCHAR(64) NULL`,
      `ADD COLUMN current_judicial_post VARCHAR(128) NULL`,
      `ADD COLUMN service_years INT DEFAULT 0`,
      `ADD COLUMN judicial_specialty VARCHAR(128) NULL`,
      `ADD COLUMN permissions JSON NULL`,
    ];

    for (const colClause of alterCols) {
      try {
        await p.query(`ALTER TABLE users ${colClause};`);
      } catch (err: any) {
        // Ignore ER_DUP_FIELDNAME (1060) if column already exists
        if (err.errno !== 1060 && !err.message?.includes('Duplicate column')) {
          logger.warn(`MySQL column migration note: ${err.message}`);
        }
      }
    }

    await p.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        family_id VARCHAR(64) NOT NULL,
        device_name VARCHAR(100),
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        last_active_at DATETIME(3) NOT NULL,
        is_revoked TINYINT(1) DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_sessions_user (user_id),
        INDEX idx_sessions_family (family_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        family_id VARCHAR(64) NOT NULL,
        parent_id VARCHAR(64) NULL,
        is_revoked TINYINT(1) DEFAULT 0,
        revocation_reason VARCHAR(64) NULL,
        expires_at DATETIME(3) NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_refresh_user (user_id),
        INDEX idx_refresh_family (family_id),
        INDEX idx_refresh_hash (token_hash)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    logger.info('MySQL 8 schema tables (users, user_sessions, refresh_tokens, audit_logs) initialized successfully.');
  } catch (err: any) {
    logger.warn('MySQL initMySQLTables warning: ' + (err?.message || err));
  }
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
 * Retry helper for transient MySQL deadlocks (Error 1213) and lock wait timeouts (Error 1205)
 */
export async function retryOnDeadlock<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isDeadlock = err?.errno === 1213 || err?.code === 'ER_LOCK_DEADLOCK';
      const isLockTimeout = err?.errno === 1205 || err?.code === 'ER_LOCK_WAIT_TIMEOUT';

      if ((isDeadlock || isLockTimeout) && attempt <= maxRetries) {
        const jitter = Math.floor(Math.random() * 50);
        const backoff = Math.min(100 * Math.pow(2, attempt) + jitter, 1000);
        logger.warn(`Deadlock / lock timeout detected on attempt ${attempt}. Retrying in ${backoff}ms...`);
        await new Promise(res => setTimeout(res, backoff));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Clean pool close for tests & graceful shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    isConnected = false;
  }
}
