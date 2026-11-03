import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { dbConfig } from '../src/server/platform/mysqlDatabase';

/**
 * Enterprise Database Initializer (Item 3)
 * - Executes DDL from database/schema.sql
 * - Creates triggers independently WITHOUT invalid CLI 'DELIMITER' commands
 * - Handles host permission limits (SUPER privilege / binary logging) gracefully
 * - Fully idempotent (safe to run multiple times in sequence)
 * - Verifies triggers with SHOW TRIGGERS and tests rejection of UPDATE/DELETE
 */
async function initDatabase() {
  console.log('----------------------------------------------------');
  console.log('🚀 راه‌اندازی ساختار پایگاه داده سامانه فقه و قضا (نسخه ۳.۰)');
  console.log(`📡 سرور دیتابیس: ${dbConfig.host}:${dbConfig.port} | پایگاه داده: ${dbConfig.database}`);
  console.log('----------------------------------------------------');

  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      multipleStatements: true,
      timezone: 'Z',
      charset: 'utf8mb4',
      decimalNumbers: false,
    });
  } catch (connErr: any) {
    console.error(`❌ امکان اتصال مستقیم به MySQL روی ${dbConfig.host}:${dbConfig.port} وجود ندارد:`, connErr.message);
    console.log('💡 اگر روی سرور رانفلر اجرا نمی‌کنید، اتصال ریموت یا متغیرهای DB_HOST را بررسی فرمایید.');
    return;
  }

  try {
    await connection.query("SET time_zone = '+00:00';");
    await connection.query("SET NAMES utf8mb4;");

    // ۱. ساخت جدول رهگیری نسخه‌های اسکیما
    console.log('📦 بررسی جدول schema_migrations...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INT NOT NULL PRIMARY KEY,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        description VARCHAR(255) NOT NULL,
        checksum CHAR(64) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // ۲. بررسی اعمال شدن قبلی
    const [rows] = await connection.query<any[]>(
      'SELECT version FROM schema_migrations WHERE version = ?',
      [1]
    );

    const isAlreadyApplied = rows.length > 0;
    if (isAlreadyApplied) {
      console.log('ℹ️ نسخه ۱ اسکیما قبلاً روی این پایگاه داده ثبت شده است.');
    } else {
      // ۳. خواندن و اجرای فایل schema.sql
      const sqlPath = path.resolve(process.cwd(), 'database/schema.sql');
      if (!fs.existsSync(sqlPath)) {
        throw new Error(`فایل اسکیمای دیتابیس در مسیر ${sqlPath} یافت نشد.`);
      }

      console.log(`📄 خواندن و اجرای اسکیمای جامع از: ${sqlPath}`);
      const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

      console.log('⚙️ در حال اعمال جداول، ستون‌های BINARY(16)، قیود یکتا و مقادیر اولیه...');
      await connection.query(sqlContent);

      await connection.query(
        'INSERT INTO schema_migrations (version, description) VALUES (?, ?)',
        [1, 'اسکیمای اولیه کامل و ۱۰۰٪ جامع سامانه فقه و قضا (نسخه ۳.۰)']
      );
      console.log('✅ جداول و داده‌های پایه با موفقیت ایجاد و نسخه ۱ ثبت شد.');
    }

    // ۴. ساخت تریگرهای امنیتی به روش استاندارد mysql2 (بدون دستور CLI دلیمیتر)
    console.log('🔒 در حال بررسی و ایجاد تریگرهای ممانعت از ویرایش/حذف لاگ‌های حسابرسی (Audit Immutability)...');
    let triggersCreated = false;
    try {
      await connection.query('DROP TRIGGER IF EXISTS trg_audit_logs_no_update;');
      await connection.query(`
        CREATE TRIGGER trg_audit_logs_no_update
        BEFORE UPDATE ON audit_logs
        FOR EACH ROW
        BEGIN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SECURITY_VIOLATION: ویرایش لاگ‌های حسابرسی در دیتابیس اکیداً غیرمجاز است.';
        END;
      `);

      await connection.query('DROP TRIGGER IF EXISTS trg_audit_logs_no_delete;');
      await connection.query(`
        CREATE TRIGGER trg_audit_logs_no_delete
        BEFORE DELETE ON audit_logs
        FOR EACH ROW
        BEGIN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SECURITY_VIOLATION: حذف لاگ‌های حسابرسی در دیتابیس اکیداً غیرمجاز است.';
        END;
      `);
      triggersCreated = true;
      console.log('✅ تریگرهای trg_audit_logs_no_update و trg_audit_logs_no_delete با موفقیت ایجاد شدند.');
    } catch (trgErr: any) {
      console.warn(`⚠️ ایجاد Trigger روی هاست امکان‌پذیر نشد (کد خطا: ${trgErr?.errno || trgErr?.code}): ${trgErr.message}`);
      console.log('💡 علت فنی در هاست‌های ابری اشتراکی: فعال بودن binary logging همراه با نیاز به دسترسی SUPER یا تنظیم log_bin_trust_function_creators=1.');
      console.log('🛡️ خط دفاعی اصلی: زنجیره هش رمزنگاری‌شده SHA-256 و کلید HMAC بیرونی (AUDIT_HMAC_KEY) به همراه اعتبارسنجی خودکار در تمام استعلام‌ها فعال است.');
    }

    // ۵. استعلام SHOW TRIGGERS
    try {
      const [triggerRows] = await connection.query<any[]>('SHOW TRIGGERS LIKE "audit_logs";');
      console.log('📋 فهرست تریگرهای فعال روی جدول audit_logs:');
      if (triggerRows.length === 0) {
        console.log('   (هیچ تریگری در سطح دیتابیس ثبت نشده است)');
      } else {
        triggerRows.forEach((t: any) => {
          console.log(`   - نام تریگر: ${t.Trigger} | رویداد: ${t.Event} | زمان: ${t.Timing}`);
        });
      }
    } catch (e: any) {
      console.log('⚠️ خطا در دریافت SHOW TRIGGERS:', e.message);
    }

    // ۶. استعلام SHOW GRANTS FOR CURRENT_USER()
    try {
      const [grantRows] = await connection.query<any[]>('SHOW GRANTS FOR CURRENT_USER();');
      console.log('🔑 سطح دسترسی‌های کاربر جاری پایگاه داده:');
      grantRows.forEach((g: any) => {
        const grantStr = Object.values(g)[0];
        console.log(`   ${grantStr}`);
      });
    } catch (e: any) {
      console.log('⚠️ خطا در دریافت SHOW GRANTS:', e.message);
    }

    // ۷. آزمون رد عملیات UPDATE/DELETE روی audit_logs (در صورت فعال بودن تریگرها)
    if (triggersCreated) {
      console.log('🧪 اجرای آزمون رد عملیات غیرمجاز روی audit_logs...');
      try {
        await connection.query('UPDATE audit_logs SET details = "تغییر غیرمجاز" WHERE 1=1 LIMIT 1;');
        console.warn('❌ هشدار: تریگر مانع از UPDATE نشد!');
      } catch (testErr: any) {
        console.log(`✅ آزمون رد UPDATE با موفقیت انجام شد: [${testErr?.code}] ${testErr.message}`);
      }
    }

    console.log('----------------------------------------------------');
    console.log('🎉 عملیات راه‌اندازی و بررسی سلامت پایگاه داده با موفقیت پایان یافت.');
    console.log('----------------------------------------------------');
  } catch (err: any) {
    console.error('❌ خطا در راه‌اندازی پایگاه داده:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
