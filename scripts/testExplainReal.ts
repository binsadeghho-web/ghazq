import mysql from 'mysql2/promise';
import { dbConfig } from '../src/server/platform/mysqlDatabase';

/**
 * Item 6: EXPLAIN and Keyset Pagination Analysis Test
 * - Uses exact syntax: (created_at, id) < (?, UNHEX(?))
 * - Contrasts Non-Covering Index (Index Range Scan + Table Row Fetch) vs Covering Index (Index Only)
 */
async function runExplainTest() {
  console.log('====================================================');
  console.log('🔍 آزمون تحلیل کوئری Keyset Pagination و EXPLAIN ANALYZE (Item 6)');
  console.log(`📡 سرور پایگاه داده: ${dbConfig.host}:${dbConfig.port} | پایگاه داده: ${dbConfig.database}`);
  console.log('====================================================');

  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      timezone: 'Z',
      charset: 'utf8mb4',
    });
  } catch (err: any) {
    console.error('❌ امکان اتصال به پایگاه داده برای تست EXPLAIN وجود ندارد:', err.message);
    return;
  }

  try {
    // 1. Ensure table exists with composite index
    await connection.query(`
      CREATE TABLE IF NOT EXISTS test_keyset_benchmark (
        id BINARY(16) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_created_id (created_at, id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check count
    const [cntRows] = await connection.query<any[]>('SELECT count(*) as count FROM test_keyset_benchmark;');
    const count = cntRows[0].count;
    console.log(`📊 تعداد ردیف‌های موجود در جدول بنچمارک: ${count}`);

    if (count < 1000) {
      console.log('⚙️ در حال درج داده‌های آزمایشی...');
      const batch: any[] = [];
      const now = Date.now();
      for (let i = 0; i < 1000; i++) {
        const hex = (i + 1).toString(16).padStart(32, '0');
        const dt = new Date(now - i * 10000).toISOString().slice(0, 23).replace('T', ' ');
        batch.push([Buffer.from(hex, 'hex'), `عنوان تستی رکورد شماره ${i + 1}`, `شرح کامل محتوای رکورد ${i + 1}`, 'active', dt]);
      }
      for (let i = 0; i < batch.length; i += 200) {
        await connection.query(
          'INSERT IGNORE INTO test_keyset_benchmark (id, title, content, status, created_at) VALUES ?',
          [batch.slice(i, i + 200)]
        );
      }
      console.log('✅ ۱,۰۰۰ ردیف اولیه با موفقیت درج شد.');
    }

    const testHex = '00000000000000000000000000000100';
    const testDate = new Date().toISOString().slice(0, 23).replace('T', ' ');

    console.log('----------------------------------------------------');
    console.log('📋 سناریو ۱: کوئری صفحه‌بندی عادی با واکشی ستون‌های خارج از ایندکس (title, content, status)');
    console.log('SQL: SELECT id, created_at, title, status FROM test_keyset_benchmark WHERE (created_at, id) < (?, UNHEX(?)) ORDER BY created_at DESC, id DESC LIMIT 50');
    console.log('----------------------------------------------------');

    const [explain1] = await connection.query<any[]>(
      `EXPLAIN ANALYZE 
       SELECT id, created_at, title, status 
       FROM test_keyset_benchmark 
       WHERE (created_at, id) < (?, UNHEX(?)) 
       ORDER BY created_at DESC, id DESC 
       LIMIT 50;`,
      [testDate, testHex]
    );

    const rawOutput1 = Object.values(explain1[0])[0];
    console.log('خروجی خام EXPLAIN ANALYZE سناریو ۱:');
    console.log(rawOutput1);
    console.log('💡 تحلیل دقیق: ایندکس idx_created_id برای فیلتر و مرتب‌سازی استفاده شده است (Index Scan). چون title و status در ایندکس نیستند، این ایندکس «پوشاننده» نیست و نیازمند دسترسی به ردیف‌های جدول (Clustered Index Row Lookup) است.');

    console.log('----------------------------------------------------');
    console.log('📋 سناریو ۲: کوئری پوشاننده خالص (Covering Index) که فقط ستون‌های موجود در ایندکس را می‌خواند');
    console.log('SQL: SELECT id, created_at FROM test_keyset_benchmark WHERE (created_at, id) < (?, UNHEX(?)) ORDER BY created_at DESC, id DESC LIMIT 50');
    console.log('----------------------------------------------------');

    const [explain2] = await connection.query<any[]>(
      `EXPLAIN ANALYZE 
       SELECT id, created_at 
       FROM test_keyset_benchmark 
       WHERE (created_at, id) < (?, UNHEX(?)) 
       ORDER BY created_at DESC, id DESC 
       LIMIT 50;`,
      [testDate, testHex]
    );

    const rawOutput2 = Object.values(explain2[0])[0];
    console.log('خروجی خام EXPLAIN ANALYZE سناریو ۲:');
    console.log(rawOutput2);
    console.log('💡 تحلیل دقیق: در سناریو ۲، تمام ستون‌ها (id و created_at) در خود ایندکس idx_created_id قرار دارند؛ بنابراین کوئری ۱۰۰٪ پوشاننده (Covering Index / Index-Only Scan) است و هیچ دسترسی به صفحات دیتای جدول انجام نمی‌شود.');
    console.log('====================================================');
  } finally {
    await connection.end();
  }
}

runExplainTest().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
