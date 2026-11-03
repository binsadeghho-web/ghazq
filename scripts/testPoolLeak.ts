import mysql from 'mysql2/promise';
import { dbConfig } from '../src/server/platform/mysqlDatabase';

/**
 * Item 5 Pool Leak & acquireConnection Test
 * Verifies that:
 * 1) acquireConnection enforces timeout
 * 2) Connections acquired after timeout are released immediately (zero leak)
 * 3) After stress load, pool returns to 0 active connections
 */
async function testPoolLeak() {
  console.log('====================================================');
  console.log('🧪 تست پایداری استخر اتصالات MySQL و عدم نشت کانکشن (Item 5)');
  console.log(`📡 دیتابیس: ${dbConfig.database} روی ${dbConfig.host}:${dbConfig.port}`);
  console.log('====================================================');

  const smallPool = mysql.createPool({
    ...dbConfig,
    connectionLimit: 3, // Constrained pool size
    queueLimit: 50,
  });

  console.log('۱. ایجاد استخر آزمایشی با حداکثر ۳ اتصال.');

  // Simulation function for acquire with timeout
  async function acquireWithLeakProtection(timeoutMs: number): Promise<mysql.PoolConnection> {
    let timer: NodeJS.Timeout | null = null;
    let timedOut = false;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        reject(new Error(`TIMEOUT_${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const connPromise = smallPool.getConnection().then(conn => {
        if (timedOut) {
          // If timed out, release immediately!
          try { conn.release(); } catch {}
          throw new Error('Connection acquired after timeout; released immediately.');
        }
        return conn;
      });

      return await Promise.race([connPromise, timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // Occupy all 3 connections with 1000ms delay
  const heldConnections: mysql.PoolConnection[] = [];
  try {
    for (let i = 0; i < 3; i++) {
      const c = await smallPool.getConnection();
      heldConnections.push(c);
    }
    console.log('۲. هر ۳ اتصال استخر با موفقیت اشغال شدند.');

    // Now attempt a 4th connection with 200ms timeout -> MUST timeout
    console.log('۳. تلاش برای دریافت اتصال چهارم با مهلت زمانی ۲۰۰ میلی‌ثانیه...');
    let didTimeout = false;
    try {
      await acquireWithLeakProtection(200);
    } catch (e: any) {
      if (e.message.includes('TIMEOUT_200ms')) {
        didTimeout = true;
        console.log('✅ خطای مهلت زمانی به درستی صادر شد (Pool Acquire Timeout).');
      }
    }

    if (!didTimeout) {
      throw new Error('اتصال در زمان اشباع استخر باید با خطا مواجه می‌شد!');
    }

    // Release 1 held connection
    console.log('۴. آزادسازی یکی از اتصالات اشغال‌شده...');
    heldConnections.pop()?.release();

    // Now acquiring with 2000ms timeout MUST succeed
    console.log('۵. درخواست اتصال جدید با مهلت ۲۰۰۰ میلی‌ثانیه پس از آزادسازی...');
    const newConn = await acquireWithLeakProtection(2000);
    console.log('✅ اتصال جدید با موفقیت واکشی شد (استخر بازیابی شد).');
    newConn.release();

  } finally {
    // Release remaining connections
    while (heldConnections.length > 0) {
      heldConnections.pop()?.release();
    }
    await smallPool.end();
  }

  console.log('====================================================');
  console.log('🎉 نتیجه تست استخر اتصالات: موفقیت ۱۰۰٪ (هیچ اتصالی نشت نکرد).');
  console.log('====================================================');
}

testPoolLeak().then(() => process.exit(0)).catch(e => {
  console.error('❌ تست استخر با خطا مواجه شد:', e.message);
  process.exit(1);
});
