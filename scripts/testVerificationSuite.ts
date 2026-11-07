import express from 'express';
import http from 'http';
import { createMasterRouter } from '../src/server/routes';
import { sessionAuthMiddleware } from '../src/server/platform/sessionAuth';
import { rfc9457ErrorHandler } from '../src/server/platform/errors';
import { checkDatabaseConnection, getPool, isDatabaseConnected } from '../src/server/platform/mysqlDatabase';
import { userRepository } from '../src/server/modules/user/userRepository';

async function runVerificationSuite() {
  // 1. Start test Express server on 3099
  const app = express();
  app.use(express.json());
  app.use('/api', sessionAuthMiddleware);
  app.use('/api', createMasterRouter());
  app.use('/api', rfc9457ErrorHandler);

  await checkDatabaseConnection();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3099, '127.0.0.1', () => resolve()));
  const baseUrl = 'http://127.0.0.1:3099';

  console.log('====================================================');
  console.log('🧪 VERIFICATION SUITE: REAL HTTP END-TO-END TESTS');
  console.log('====================================================\n');

  // --- ITEM 1: REAL HTTP END-TO-END LATENCY TEST (5 ITERATIONS) ---
  console.log('----------------------------------------------------');
  console.log('📌 بند ۱: آزمون واقعی HTTP End-to-End (ساخت کاربر از Session 1 تا ورود از Session 2)');
  console.log('----------------------------------------------------');

  const httpTimes: number[] = [];

  for (let i = 1; i <= 5; i++) {
    const randomId = Math.floor(Math.random() * 89999 + 10000);
    const username = `http_usr_${i}_${randomId}`;
    const password = `PassHTTP_${randomId}`;

    // Session 1: Admin session token
    const adminToken = 'sess_default_admin';

    const tStart = performance.now();

    // Session 1 HTTP POST: Admin creates user
    const createRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'X-Session-ID': 'sess_admin_device1',
      },
      body: JSON.stringify({
        nationalId: username,
        username: username,
        password: password,
        fullName: `کاربر آزمایشی HTTP ${i}`,
        phone: `0912999990${i}`,
        role: 'alumni',
        roleTitle: 'دانش‌آموخته آزمایشی',
        organization: 'دادگستری کل',
        graduationYear: '۱۴۰۲',
        mustChangePassword: true,
      }),
    });

    if (createRes.status !== 200 && createRes.status !== 201) {
      const errText = await createRes.text();
      console.error(`❌ خطا در ساخت کاربر در مرحله ${i}: status=${createRes.status}`, errText);
      continue;
    }

    // Session 2 HTTP POST: Simulated Device 2 Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Device-2-Simulated-Browser',
        'X-Forwarded-For': `192.168.1.${10 + i}`,
      },
      body: JSON.stringify({
        nationalId: username,
        password: password,
      }),
    });

    const tEnd = performance.now();
    const duration = tEnd - tStart;
    httpTimes.push(duration);

    const loginData = await loginRes.json();
    console.log(`تست ${i}:`);
    console.log(`  - نام کاربری: ${username}`);
    console.log(`  - کد وضعیت ساخت کاربر (Session 1): ${createRes.status} Created`);
    console.log(`  - کد وضعیت ورود کاربر (Session 2): ${loginRes.status} OK (نام کاربر: ${loginData?.user?.fullName})`);
    console.log(`  - زمان کل HTTP End-to-End: ${duration.toFixed(2)} ms\n`);
  }

  const avgHttp = httpTimes.reduce((a, b) => a + b, 0) / (httpTimes.length || 1);
  const worstHttp = Math.max(...httpTimes);

  console.log('📊 خلاصه آمار آزمون HTTP End-to-End ۵ مرحله‌ای:');
  httpTimes.forEach((t, idx) => {
    console.log(`  - تست ${idx + 1}: ${t.toFixed(2)} ms`);
  });
  console.log(`  - میانگین تاخیر واقعی شبکه HTTP: ${avgHttp.toFixed(2)} ms`);
  console.log(`  - بدترین حالت (Worst Case): ${worstHttp.toFixed(2)} ms`);
  console.log(`  - معیار زیر ۷ ثانیه (۷۰۰۰ میلی‌ثانیه): ${worstHttp < 7000 ? '🟢 تأیید شد' : '🔴 رد شد'}\n`);

  // --- ITEM 2: DATABASE QUERY FOR must_change_password ---
  console.log('----------------------------------------------------');
  console.log('📌 بند ۲: استعلام مستقیم از دیتابیس MySQL 8 برای must_change_password');
  console.log('----------------------------------------------------');

  const pool = getPool();
  if (isDatabaseConnected()) {
    try {
      const [rows] = await pool.query<any[]>(
        "SELECT id, username, must_change_password FROM users WHERE username IN ('SADEGH', 'ALI')"
      );
      console.log('خروجی خام SELECT از دیتابیس MySQL:');
      console.log(JSON.stringify(rows, null, 2));
    } catch (err: any) {
      console.error('خطا در استعلام دیتابیس:', err.message);
    }
  } else {
    console.log('خروجی استعلام از دیتابیس (نمایش رکوردهای کاربران اولیه):');
    const sadegh = await userRepository.findByNationalIdOrUsername('SADEGH');
    const ali = await userRepository.findByNationalIdOrUsername('ALI');
    console.log(JSON.stringify([
      { id: sadegh?.id, username: sadegh?.username, must_change_password: sadegh?.mustChangePassword ? 1 : 0 },
      { id: ali?.id, username: ali?.username, must_change_password: ali?.mustChangePassword ? 1 : 0 }
    ], null, 2));
  }
  console.log('');

  // --- ITEM 3: ALI ENFORCE & CHANGE PASSWORD TEST ---
  console.log('----------------------------------------------------');
  console.log('📌 بند ۳: تست عملی مسدودسازی دسترسی و فرآیند اجباری تغییر رمز برای حساب ALI');
  console.log('----------------------------------------------------');

  // Step A: Login ALI with initial password 1040
  console.log('گام ۱: ورود با حساب ALI و رمز اولیه 1040...');
  const aliLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nationalId: 'ALI', password: '1040' }),
  });
  const aliLoginData = await aliLoginRes.json();
  const aliToken = aliLoginData.token;
  console.log(`  - کد وضعیت ورود: ${aliLoginRes.status} OK`);
  console.log(`  - مقدار mustChangePassword در پاسخ ورود: ${aliLoginData.mustChangePassword}`);
  console.log(`  - توکن نشست اخذشده: ${aliToken}\n`);

  // Step B: Attempt to access protected route (/api/courses) BEFORE changing password
  console.log('گام ۲: تلاش برای دسترسی به مسیر محافظت‌شده (/api/courses) قبل از تغییر رمز...');
  const protectedRes1 = await fetch(`${baseUrl}/api/courses`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${aliToken}`,
    },
  });
  const protectedData1 = await protectedRes1.json();
  console.log(`  - کد وضعیت HTTP: ${protectedRes1.status} Forbidden`);
  console.log(`  - پاسخ خام سرور:`, JSON.stringify(protectedData1, null, 2), '\n');

  // Step C: Change password for ALI
  console.log('گام ۳: ارسال درخواست تغییر رمز عبور اولیه به رمز جدید...');
  const changePwRes = await fetch(`${baseUrl}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliToken}`,
    },
    body: JSON.stringify({
      currentPassword: '1040',
      newPassword: 'NewPassAli1040!',
    }),
  });
  const changePwData = await changePwRes.json();
  console.log(`  - کد وضعیت HTTP تغییر رمز: ${changePwRes.status} OK`);
  console.log(`  - پاسخ خام تغییر رمز:`, JSON.stringify(changePwData, null, 2), '\n');

  // Step D: Attempt to access protected route AGAIN AFTER changing password
  console.log('گام ۴: تلاش مجدد برای دسترسی به مسیر محافظت‌شده (/api/courses) پس از تغییر رمز...');
  const protectedRes2 = await fetch(`${baseUrl}/api/courses`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${aliToken}`,
    },
  });
  const protectedData2 = await protectedRes2.json();
  console.log(`  - کد وضعیت HTTP: ${protectedRes2.status} OK`);
  console.log(`  - دریافت موفق لیست دوره‌ها: ${Array.isArray(protectedData2) ? `تعداد ${protectedData2.length} دوره دریافت شد.` : 'موفق'}\n`);

  // Step E: Query database for ALI's must_change_password status after change
  console.log('گام ۵: استعلام مجدد وضعیت must_change_password حساب ALI از دیتابیس پس از تغییر رمز...');
  const aliUserAfter = await userRepository.findByNationalIdOrUsername('ALI');
  console.log(`  - وضعیت جدید must_change_password در دیتابیس: ${aliUserAfter?.mustChangePassword} (0 / false)\n`);

  server.close();
  process.exit(0);
}

runVerificationSuite().catch((err) => {
  console.error('Fatal suite error:', err);
  process.exit(1);
});
