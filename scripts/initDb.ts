import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { dbConfig } from '../src/server/platform/mysqlDatabase';

async function initDatabase() {
  console.log('----------------------------------------------------');
  console.log('🚀 شروع راه‌اندازی اولیه پایگاه داده سامانه فقه و قضا (نسخه ۳.۰)');
  console.log(`📡 اتصال به سرور دیتابیس: ${dbConfig.host}:${dbConfig.port} | پایگاه داده: ${dbConfig.database}`);
  console.log('----------------------------------------------------');

  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    multipleStatements: true,
    timezone: 'Z',
    charset: 'utf8mb4',
    decimalNumbers: false, // اصل ۱۸: خواندن DECIMAL به عنوان رشته، بدون باگ Float
  });

  try {
    // اعمال تنظیمات ارتباطی روی کانکشن
    await connection.query("SET time_zone = '+00:00';");
    await connection.query("SET NAMES utf8mb4;");

    // ۱. ساخت جدول رهگیری نسخه‌های مهاجرت
    console.log('📦 ایجاد جدول schema_migrations...');
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

    if (rows.length > 0) {
      console.log('⚠️ نسخه ۱ اسکیما قبلاً روی این پایگاه داده اعمال شده است.');
      console.log('برای اجرای مجدد، ابتدا پایگاه داده را خالی کنید یا مهاجرت‌های تکمیلی ثبت نمایید.');
      return;
    }

    // ۳. خواندن فایل schema.sql
    const sqlPath = path.resolve(process.cwd(), 'database/schema.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`فایل اسکیمای دیتابیس در مسیر ${sqlPath} یافت نشد.`);
    }

    console.log(`📄 خواندن فایل اسکیمای جامع از: ${sqlPath}`);
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // تفکیک دستورات SQL و اجرا در تراکنش کنترل‌شده
    console.log('⚙️ در حال اجرای ساختار جداول، ایندکس‌ها، قیود و تریگرها روی MySQL 8...');
    await connection.query(sqlContent);

    // ۴. ثبت نسخه ۱ در جدول مهاجرت
    await connection.query(
      'INSERT INTO schema_migrations (version, description) VALUES (?, ?)',
      [1, 'اسکیمای اولیه کامل و ۱۰۰٪ جامع سامانه فقه و قضا (نسخه ۳.۰)']
    );

    console.log('✅ پایگاه داده با موفقیت مقداردهی اولیه شد و نسخه ۱ در schema_migrations ثبت گردید.');
    console.log('----------------------------------------------------');
  } catch (err: any) {
    console.error('❌ خطا در راه‌اندازی اولیه پایگاه داده:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDatabase();
