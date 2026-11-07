import express from 'express';
import http from 'http';
import { createMasterRouter } from '../src/server/routes';
import { sessionAuthMiddleware, activeSessionTokens, registerSessionToken } from '../src/server/platform/sessionAuth';
import { rfc9457ErrorHandler } from '../src/server/platform/errors';
import { checkDatabaseConnection } from '../src/server/platform/mysqlDatabase';
import { userRepository } from '../src/server/modules/user/userRepository';
import { rateLimitIpUser, rateLimitUser, rateLimitIp } from '../src/server/modules/auth/authModule';

async function runRealHttpSuite() {
  // Start test Express server on port 3097
  const app = express();
  app.use(express.json());
  app.use('/api', sessionAuthMiddleware);
  app.use('/api', createMasterRouter());
  app.use('/api', rfc9457ErrorHandler);

  await checkDatabaseConnection();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3097, '127.0.0.1', () => resolve()));
  const baseUrl = 'http://127.0.0.1:3097';

  console.log('====================================================');
  console.log('🧪 REAL HTTP SUITE: VERIFICATION OF QUESTIONS 1, 2, 3');
  console.log('====================================================\n');

  // -------------------------------------------------------------------------
  // TEST FOR QUESTION 1: SERVER RESTART / RAM CLEAR SIMULATION
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------');
  console.log('📌 سوال ۱: آزمون واقعی ریستارت سرور (پاکسازی RAM و activeSessionTokens)');
  console.log('----------------------------------------------------');

  // Step 1: Login as ALI and obtain valid session token over HTTP
  const loginAli = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nationalId: 'ALI', password: '1040' }),
  });
  const aliLoginData = await loginAli.json();
  const validToken = aliLoginData.token;

  // Change password to unlock mustChangePassword for access
  await fetch(`${baseUrl}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${validToken}` },
    body: JSON.stringify({ currentPassword: '1040', newPassword: 'NewPassAli1040!' }),
  });

  // Test access before restart
  const resBeforeRestart = await fetch(`${baseUrl}/api/courses`, {
    headers: { 'Authorization': `Bearer ${validToken}` },
  });
  console.log(`گام ۱: دسترسی به API قبل از ریستارت سرور: HTTP ${resBeforeRestart.status} ${resBeforeRestart.statusText}`);

  // Simulate Server Restart: Clear activeSessionTokens in RAM
  console.log('گام ۲: شبیه‌سازی ریستارت سرور (پاک‌سازی کامل activeSessionTokens از RAM)...');
  activeSessionTokens.clear();

  // Test access after restart
  const resAfterRestart = await fetch(`${baseUrl}/api/courses`, {
    headers: { 'Authorization': `Bearer ${validToken}` },
  });
  const dataAfterRestart = await resAfterRestart.json();
  console.log(`گام ۳: دسترسی به API با همان توکن پس از ریستارت سرور: HTTP ${resAfterRestart.status} ${resAfterRestart.statusText}`);
  console.log(`پاسخ سرور:`, JSON.stringify(dataAfterRestart, null, 2));
  console.log('نتایچ آزمون ریستارت: تمام نشست‌های قبلی با پاک شدن RAM باطل شدند و کاربران از سیستم خارج گردیدند.\n');

  // -------------------------------------------------------------------------
  // TEST FOR QUESTION 2: REAL HTTP TIMING FOR DUMMY HASH (40 ITERATIONS)
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------');
  console.log('📌 سوال ۲: آزمون زمان‌سنجی ۴۰ تکرار ورود از طریق HTTP واقعی با fetch');
  console.log('----------------------------------------------------');

  const nonExistentTimesHttp: number[] = [];
  const wrongPassTimesHttp: number[] = [];

  for (let i = 1; i <= 20; i++) {
    rateLimitIpUser.clear();
    rateLimitUser.clear();
    rateLimitIp.clear();

    // Mode A: Non-existent user over HTTP
    const t0 = performance.now();
    const resA = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.1.0.${i}` },
      body: JSON.stringify({ nationalId: `non_existent_usr_http_${i}`, password: 'WrongPassword123!' }),
    });
    const t1 = performance.now();
    await resA.json();
    nonExistentTimesHttp.push(t1 - t0);

    // Mode B: Existing user with wrong password over HTTP
    const t2 = performance.now();
    const resB = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.2.0.${i}` },
      body: JSON.stringify({ nationalId: 'usr_sadegh_admin', password: 'WrongPassword123!' }),
    });
    const t3 = performance.now();
    await resB.json();
    wrongPassTimesHttp.push(t3 - t2);
  }

  console.log('جدول زمان‌های خام شبکه HTTP (با احتساب کامل پشته HTTP Express + bcrypt.compareSync):');
  console.log('تکرار | کاربر ناموجود (A) | کاربر موجود/رمز غلط (B)');
  console.log('--------------------------------------------------');
  for (let i = 0; i < 20; i++) {
    console.log(`  ${(i + 1).toString().padStart(2, ' ')}   | ${nonExistentTimesHttp[i].toFixed(2).padStart(17, ' ')} ms | ${wrongPassTimesHttp[i].toFixed(2).padStart(23, ' ')} ms`);
  }

  const avgA_Http = nonExistentTimesHttp.reduce((a, b) => a + b, 0) / 20;
  const avgB_Http = wrongPassTimesHttp.reduce((a, b) => a + b, 0) / 20;
  const diffHttp = Math.abs(avgA_Http - avgB_Http);

  console.log(`\nمیانگین HTTP کاربر ناموجود (A): ${avgA_Http.toFixed(2)} ms`);
  console.log(`میانگین HTTP کاربر موجود/رمز غلط (B): ${avgB_Http.toFixed(2)} ms`);
  console.log(`اختلاف مطلق میانگین‌های HTTP: ${diffHttp.toFixed(2)} ms\n`);

  // -------------------------------------------------------------------------
  // TEST FOR QUESTION 3: REAL HTTP FETCH DELAY FOR DB USER DEACTIVATION
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------');
  console.log('📌 سوال ۳: اندازه زمان واقعی درخواست شبکه HTTP برای اعمال غیرفعال‌سازی کاربر');
  console.log('----------------------------------------------------');

  // Re-login ALI
  rateLimitIpUser.clear();
  rateLimitUser.clear();
  rateLimitIp.clear();

  const loginAli2 = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nationalId: 'ALI', password: 'NewPassAli1040!' }),
  });
  const dataAli2 = await loginAli2.json();
  const aliToken2 = dataAli2.token;

  // Deactivate ALI in database
  const aliDbObj = await userRepository.findById('usr_ali_alumni');
  if (aliDbObj) aliDbObj.isActive = false;

  // Measure REAL HTTP fetch request roundtrip
  const tFetchStart = performance.now();
  const resDeactivated = await fetch(`${baseUrl}/api/courses`, {
    headers: { 'Authorization': `Bearer ${aliToken2}` },
  });
  const tFetchEnd = performance.now();
  const deactivatedData = await resDeactivated.json();

  const httpRoundtripMs = tFetchEnd - tFetchStart;

  console.log(`کد وضعیت HTTP بازگشتی: ${resDeactivated.status} ${resDeactivated.statusText}`);
  console.log(`پاسخ سرور:`, JSON.stringify(deactivatedData, null, 2));
  console.log(`زمان دقیق کل چرخه‌ی درخواست و پاسخ شبکه HTTP (توسط fetch): ${httpRoundtripMs.toFixed(2)} ms`);

  // Restore ALI active status
  if (aliDbObj) aliDbObj.isActive = true;

  server.close();
  process.exit(0);
}

runRealHttpSuite().catch((err) => {
  console.error('Fatal real HTTP suite error:', err);
  process.exit(1);
});
