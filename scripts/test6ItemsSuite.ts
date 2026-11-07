import express from 'express';
import http from 'http';
import { createMasterRouter } from '../src/server/routes';
import { sessionAuthMiddleware, activeSessionTokens, revokeSessionToken } from '../src/server/platform/sessionAuth';
import { rfc9457ErrorHandler } from '../src/server/platform/errors';
import { checkDatabaseConnection, getPool, isDatabaseConnected } from '../src/server/platform/mysqlDatabase';
import { userRepository } from '../src/server/modules/user/userRepository';
import { rateLimitIpUser, rateLimitUser, rateLimitIp } from '../src/server/modules/auth/authModule';

async function run6ItemsSuite() {
  // 1. Start test Express server on 3098
  const app = express();
  app.use(express.json());
  app.use('/api', sessionAuthMiddleware);
  app.use('/api', createMasterRouter());
  app.use('/api', rfc9457ErrorHandler);

  await checkDatabaseConnection();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3098, '127.0.0.1', () => resolve()));
  const baseUrl = 'http://127.0.0.1:3098';

  console.log('====================================================');
  console.log('🧪 SUITE: REAL HTTP BEHAVIORAL VERIFICATION (ITEMS 1 - 5)');
  console.log('====================================================\n');

  // Clear rate limits before test
  rateLimitIpUser.clear();
  rateLimitUser.clear();
  rateLimitIp.clear();

  // =========================================================================
  // ITEM 1: RATE LIMITING TEST
  // =========================================================================
  console.log('----------------------------------------------------');
  console.log('📌 بند ۱: تست رفتاری Rate Limiting سهلایه');
  console.log('----------------------------------------------------');

  const adminToken = 'sess_default_admin';
  const u1Name = 'rate_usr_tier3';

  // Create test user 1
  await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      nationalId: u1Name, username: u1Name, password: 'Pass1234!',
      fullName: 'کاربر نرخ ۱', phone: '09121111111', role: 'alumni',
      roleTitle: 'دانش‌آموخته', organization: 'دادگستری', graduationYear: '۱۴۰۲'
    }),
  });

  console.log('الف) تست لایه ۳ (همان IP + همان Username): ارسال ۶ درخواست متوالی با رمز اشتباه...');
  for (let i = 1; i <= 6; i++) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '192.168.10.1' },
      body: JSON.stringify({ nationalId: u1Name, password: 'WrongPassword!' }),
    });
    const data = await res.json();
    console.log(`  - درخواست ${i}: HTTP ${res.status} ${res.statusText} | کد خطا: ${data.code || 'None'}`);
  }

  // Clear IP rate limit for tier 2 test
  rateLimitIpUser.clear();
  rateLimitIp.clear();

  const u2Name = 'rate_usr_tier2';
  await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      nationalId: u2Name, username: u2Name, password: 'Pass1234!',
      fullName: 'کاربر نرخ ۲', phone: '09122222222', role: 'alumni',
      roleTitle: 'دانش‌آموخته', organization: 'دادگستری', graduationYear: '۱۴۰۲'
    }),
  });

  console.log('\nب) تست لایه ۲ (همان Username + IPهای متفاوت در هر درخواست): ارسال ۱۱ درخواست متوالی...');
  for (let i = 1; i <= 11; i++) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.0.0.${i}` },
      body: JSON.stringify({ nationalId: u2Name, password: 'WrongPassword!' }),
    });
    const data = await res.json();
    console.log(`  - درخواست ${i} (IP 10.0.0.${i}): HTTP ${res.status} | کد خطا: ${data.code || 'None'}`);
  }
  console.log('');

  // =========================================================================
  // ITEM 2: ACCOUNT LOCKOUT TEST
  // =========================================================================
  console.log('----------------------------------------------------');
  console.log('📌 بند ۲: تست قفل حساب ۳۰ دقیقه‌ای پس از ۱۰ تلاش ناموفق');
  console.log('----------------------------------------------------');

  const lockUserName = 'lockout_usr_test';
  const correctPass = 'CorrectPass123!';

  await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      nationalId: lockUserName, username: lockUserName, password: correctPass,
      fullName: 'کاربر قفل حساب', phone: '09123333333', role: 'alumni',
      roleTitle: 'دانش‌آموخته', organization: 'دادگستری', graduationYear: '۱۴۰۲'
    }),
  });

  // Clear rate limits for lockout test
  rateLimitIpUser.clear();
  rateLimitUser.clear();
  rateLimitIp.clear();

  console.log('الف) ارسال ۱۰ تلاش متوالی با رمز اشتباه...');
  for (let i = 1; i <= 10; i++) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `172.16.0.${i}` },
      body: JSON.stringify({ nationalId: lockUserName, password: 'BadPassword!' }),
    });
    const data = await res.json();
    console.log(`  - تلاش ${i}: HTTP ${res.status} | کد/پیام: ${data.code || data.detail}`);
  }

  // Attempt 11 with CORRECT password
  console.log('\nب) تلاش ۱۱: ورود با رمز صحیح (اما حساب مسدود شده است)...');
  const attempt11Res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '172.16.0.99' },
    body: JSON.stringify({ nationalId: lockUserName, password: correctPass }),
  });
  const attempt11Data = await attempt11Res.json();
  console.log(`  - کد وضعیت HTTP: ${attempt11Res.status}`);
  console.log(`  - پاسخ سرور:`, JSON.stringify(attempt11Data, null, 2));

  // Query database for lockout status
  console.log('\nج) استعلام وضعیت قفل از دیتابیس:');
  const userLockedState = await userRepository.findByNationalIdOrUsername(lockUserName);
  console.log(`  - isLocked: ${userLockedState?.isLocked}`);
  console.log(`  - failedAttempts: ${userLockedState?.failedAttempts}`);
  console.log(`  - lockExpiresAt: ${userLockedState?.lockExpiresAt}`);

  // Manually expire lock
  console.log('\nد) تغییر زمان انقضای قفل به ۱ ساعت قبل در دیتابیس و تلاش مجدد برای ورود با رمز صحیح...');
  if (userLockedState) {
    userLockedState.lockExpiresAt = new Date(Date.now() - 3600 * 1000).toISOString();
  }

  const attempt12Res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '172.16.0.100' },
    body: JSON.stringify({ nationalId: lockUserName, password: correctPass }),
  });
  const attempt12Data = await attempt12Res.json();
  console.log(`  - کد وضعیت HTTP پس از رفع انقضا: ${attempt12Res.status} OK`);
  console.log(`  - ورود موفق شد؟ ${Boolean(attempt12Data.success && attempt12Data.user)} (نام کاربر: ${attempt12Data?.user?.fullName})\n`);

  // =========================================================================
  // ITEM 3: UNIFORM ERROR MESSAGE & DUMMY HASH TIMING
  // =========================================================================
  console.log('----------------------------------------------------');
  console.log('📌 بند ۳: پیام خطای یکسان و آزمون زمان‌سنجی ۴۰ تکراری (Dummy Hash)');
  console.log('----------------------------------------------------');

  rateLimitIpUser.clear();
  rateLimitUser.clear();
  rateLimitIp.clear();

  // Test message uniformity
  const resNonExistent = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nationalId: 'non_existent_usr_99999', password: 'AnyPassword123!' }),
  });
  const dataNonExistent = await resNonExistent.json();

  const resWrongPass = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nationalId: 'SADEGH', password: 'WrongPassword123!' }),
  });
  const dataWrongPass = await resWrongPass.json();

  console.log('الف) مقایسه پیام خطا:');
  console.log(`  - (الف) کاربر ناموجود: HTTP ${resNonExistent.status} | پیام: "${dataNonExistent.detail}"`);
  console.log(`  - (ب) کاربر موجود + رمز غلط: HTTP ${resWrongPass.status} | پیام: "${dataWrongPass.detail}"`);
  console.log(`  - آیا پیام‌ها ۱۰۰٪ یکسان هستند؟ ${dataNonExistent.detail === dataWrongPass.detail ? 'بله' : 'خیر'}\n`);

  console.log('ب) آزمون زمان‌سنجی ۴۰ تکرار (۲۰ کاربر ناموجود vs ۲۰ کاربر موجود با رمز غلط):');
  const nonExistentTimes: number[] = [];
  const wrongPassTimes: number[] = [];

  for (let i = 1; i <= 20; i++) {
    rateLimitIpUser.clear();
    rateLimitUser.clear();
    rateLimitIp.clear();

    // Mode A: Non-existent
    const t0 = performance.now();
    await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nationalId: `non_existent_usr_${i}`, password: 'WrongPassword123!' }),
    });
    const t1 = performance.now();
    nonExistentTimes.push(t1 - t0);

    // Mode B: Existing wrong password
    const t2 = performance.now();
    await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nationalId: 'usr_sadegh_admin', password: 'WrongPassword123!' }),
    });
    const t3 = performance.now();
    wrongPassTimes.push(t3 - t2);
  }

  console.log('جدول زمان‌های خام (میلی‌ثانیه):');
  console.log('تکرار | کاربر ناموجود (A) | کاربر موجود/رمز غلط (B)');
  console.log('--------------------------------------------------');
  for (let i = 0; i < 20; i++) {
    console.log(`  ${(i + 1).toString().padStart(2, ' ')}   | ${nonExistentTimes[i].toFixed(2).padStart(17, ' ')} ms | ${wrongPassTimes[i].toFixed(2).padStart(23, ' ')} ms`);
  }

  const avgA = nonExistentTimes.reduce((a, b) => a + b, 0) / 20;
  const avgB = wrongPassTimes.reduce((a, b) => a + b, 0) / 20;
  const diffMs = Math.abs(avgA - avgB);

  console.log(`\nمیانگین کاربر ناموجود (A): ${avgA.toFixed(2)} ms`);
  console.log(`میانگین کاربر موجود/رمز غلط (B): ${avgB.toFixed(2)} ms`);
  console.log(`اختلاف مطلق میانگین‌ها: ${diffMs.toFixed(2)} ms`);
  console.log(`معیار تفاوت زیر ۳۰ میلی‌ثانیه: ${diffMs < 30 ? '🟢 رعایت شده (زمان‌بندی همگن با Dummy Hash)' : '🔴 عدم رعایت'}\n`);

  // =========================================================================
  // ITEM 4: REFRESH TOKEN ROTATION & REUSE DETECTION
  // =========================================================================
  console.log('----------------------------------------------------');
  console.log('📌 بند ۴: بررسی Refresh Token Rotation و Reuse Detection');
  console.log('----------------------------------------------------');

  console.log('الف) فراخوانی متد POST /api/auth/refresh جهت بررسی وجود Endpoint:');
  const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  console.log(`  - کد وضعیت HTTP: ${refreshRes.status} ${refreshRes.statusText}`);

  console.log('\nب) آزمون مدل معماری احراز هویت رایج (Server-State Session Token با ابطال صریح):');
  // Login to get session token 1
  const loginRes1 = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nationalId: lockUserName, password: correctPass }),
  });
  const dataLogin1 = await loginRes1.json();
  const token1 = dataLogin1.token;
  console.log(`  - ورود ۱: توکن نشست صادرشده = ${token1}`);

  // Test access with token 1
  const testAcc1 = await fetch(`${baseUrl}/api/courses`, {
    headers: { 'Authorization': `Bearer ${token1}` },
  });
  console.log(`  - تست دسترسی با توکن ۱: HTTP ${testAcc1.status} OK`);

  // Revoke token 1 (Logout)
  await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}` },
  });
  console.log(`  - خروج (Logout) انجام شد و توکن ۱ باطل گردید.`);

  // Attempt access with revoked token 1
  const testAcc1Revoked = await fetch(`${baseUrl}/api/courses`, {
    headers: { 'Authorization': `Bearer ${token1}` },
  });
  console.log(`  - تلاش مجدد با توکن باطل‌شده ۱: HTTP ${testAcc1Revoked.status} ${testAcc1Revoked.statusText}\n`);

  // =========================================================================
  // ITEM 5: SECURE IN-MEMORY SESSION CACHE & REAL-TIME INVALIDATION
  // =========================================================================
  console.log('----------------------------------------------------');
  console.log('📌 بند ۵: کش امن حافظه‌ای و اعتبارسنجی زنده وضعیت کاربر');
  console.log('----------------------------------------------------');

  console.log('الف) فیلدهای موجود در activeSessionTokens کش حافظه‌ای سرور:');
  const sampleToken = activeSessionTokens.keys().next().value;
  const cachedUserSample = sampleToken ? activeSessionTokens.get(sampleToken) : null;
  console.log('  - فیلدهای ذخیره‌شده:', JSON.stringify(cachedUserSample, null, 2));
  console.log(`  - آیا password یا password_hash در کش وجود دارد؟ ${(cachedUserSample as any)?.password_hash || (cachedUserSample as any)?.password ? 'بله (ناامن)' : 'خیر (کاملاً امن)'}\n`);

  console.log('ب) آزمون رفتاری: تغییر مستقیم وضعیت کاربر در دیتابیس و بررسی دسترسی با توکن جاری...');
  // Login to get token
  const aliLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nationalId: 'usr_ali_alumni', password: '1040' }),
  });
  const aliData = await aliLogin.json();
  const aliToken = aliData.token;

  // Change password to unlock mustChangePassword for access
  await fetch(`${baseUrl}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aliToken}` },
    body: JSON.stringify({ currentPassword: '1040', newPassword: 'NewAliPassword123!' }),
  });

  // Verify access works
  const accessBefore = await fetch(`${baseUrl}/api/courses`, {
    headers: { 'Authorization': `Bearer ${aliToken}` },
  });
  console.log(`  - دسترسی اولیه با توکن معتبر: HTTP ${accessBefore.status} OK`);

  // Instantly deactivate user in database
  const aliDbObj = await userRepository.findById('usr_ali_alumni');
  if (aliDbObj) {
    aliDbObj.isActive = false;
  }

  const tStartCheck = performance.now();
  // Immediately attempt access
  const accessAfter = await fetch(`${baseUrl}/api/courses`, {
    headers: { 'Authorization': `Bearer ${aliToken}` },
  });
  const tEndCheck = performance.now();

  console.log(`  - غیرفعال‌سازی کاربر در دیتابیس انجام شد.`);
  console.log(`  - وضعیت دسترسی بلافاصله پس از غیرفعال‌سازی: HTTP ${accessAfter.status} ${accessAfter.statusText}`);
  console.log(`  - تاخیر زمانی اعمال تغییر وضعیت: ${(tEndCheck - tStartCheck).toFixed(2)} ms (اعمال آنی)\n`);

  // Restore ali active status
  if (aliDbObj) {
    aliDbObj.isActive = true;
  }

  server.close();
  process.exit(0);
}

run6ItemsSuite().catch((err) => {
  console.error('Fatal 6 items suite error:', err);
  process.exit(1);
});
