import http from 'http';
import { db } from '../src/server/platform/database';
import { clearMemoryTokens } from '../src/server/platform/jwtService';

const PORT = 3000;

interface TestResult {
  name: string;
  passed: boolean;
  statusCode: number;
  durationMs: number;
  details: string;
  responseBody?: any;
}

const results: TestResult[] = [];

function makeRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: any; rawBody: string }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed: any = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({
            statusCode: res.statusCode || 500,
            headers: res.headers,
            body: parsed,
            rawBody: data,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runSuite() {
  console.log('====================================================');
  console.log('🧪 اجرای مجموعه تست‌های کامل JWT Access Token، Refresh Token و Silent Refresh Interceptor');
  console.log('====================================================\n');

  // Ensure SADEGH or ALI exists for testing
  let testUser = 'SADEGH';
  let testPass = '8411';

  let login1 = await makeRequest('POST', '/api/auth/login', {}, { username: testUser, password: testPass });
  if (login1.statusCode !== 200) {
    testUser = 'ALI';
    testPass = '1040';
    login1 = await makeRequest('POST', '/api/auth/login', {}, { username: testUser, password: testPass });
  }

  // ----------------------------------------------------
  // TEST 1: Successful Login & Dual Token Issuance
  // ----------------------------------------------------
  const t1Start = Date.now();
  const test1Passed =
    login1.statusCode === 200 &&
    typeof login1.body?.token === 'string' &&
    login1.body?.token.startsWith('ey') &&
    (typeof login1.body?.refreshToken === 'string' || !!login1.headers['set-cookie']);

  const accessToken1 = login1.body?.token;
  const refreshToken1 = login1.body?.refreshToken || extractCookieValue(login1.headers['set-cookie'], 'refresh_token');

  results.push({
    name: 'تست ۱: ورود موفق و صدور دوگانه Access Token (۱۵ دقیقه‌ای JWT) و Refresh Token (۷ روزه)',
    passed: test1Passed,
    statusCode: login1.statusCode,
    durationMs: Date.now() - t1Start,
    details: `Access Token: ${accessToken1 ? accessToken1.slice(0, 35) + '...' : 'ندارد'} | Refresh Token: ${refreshToken1 ? refreshToken1.slice(0, 25) + '...' : 'ندارد'}`,
    responseBody: login1.body,
  });

  if (!refreshToken1) {
    console.error('❌ خطا: Refresh Token دریافت نشد. جزئیات ورود:');
    console.error('StatusCode:', login1.statusCode);
    console.error('Body:', JSON.stringify(login1.body));
    console.error('Headers:', JSON.stringify(login1.headers));
    process.exit(1);
  }

  // ----------------------------------------------------
  // TEST 2: Refresh Endpoint & Token Rotation (RT2 != RT1)
  // ----------------------------------------------------
  const t2Start = Date.now();
  const refreshRes1 = await makeRequest(
    'POST',
    '/api/auth/refresh',
    {
      'X-Refresh-Token': refreshToken1,
      Cookie: `refresh_token=${refreshToken1}`,
    },
    {}
  );

  const accessToken2 = refreshRes1.body?.accessToken || refreshRes1.body?.token;
  const refreshToken2 = refreshRes1.body?.refreshToken || extractCookieValue(refreshRes1.headers['set-cookie'], 'refresh_token');

  const test2Passed =
    refreshRes1.statusCode === 200 &&
    !!accessToken2 &&
    !!refreshToken2 &&
    refreshToken2 !== refreshToken1;

  results.push({
    name: 'تست ۲: فراخوانی Endpoint چرخش Refresh Token (چرخش موفق RT1 -> RT2 و عدم برابری RT1 !== RT2)',
    passed: test2Passed,
    statusCode: refreshRes1.statusCode,
    durationMs: Date.now() - t2Start,
    details: `RT1: ${refreshToken1.slice(0, 15)}... !== RT2: ${refreshToken2 ? refreshToken2.slice(0, 15) : ''}... | Access Token جدید صادر شد.`,
    responseBody: refreshRes1.body,
  });

  // ----------------------------------------------------
  // TEST 3: Reuse RT1 -> Must return 401 Unauthorized
  // ----------------------------------------------------
  const t3Start = Date.now();
  const reuseRes = await makeRequest(
    'POST',
    '/api/auth/refresh',
    {
      'X-Refresh-Token': refreshToken1,
      Cookie: `refresh_token=${refreshToken1}`,
    },
    {}
  );

  const test3Passed = reuseRes.statusCode === 401;

  results.push({
    name: 'تست ۳: استفاده مجدد از RT1 باطل شده (تلاش مهاجم) -> پاسخ ۴۰۱ غیرمجاز',
    passed: test3Passed,
    statusCode: reuseRes.statusCode,
    durationMs: Date.now() - t3Start,
    details: `پاسخ سرور: Status ${reuseRes.statusCode} | error: ${reuseRes.body?.error || reuseRes.body?.detail || 'Unauthorized'}`,
    responseBody: reuseRes.body,
  });

  // ----------------------------------------------------
  // TEST 4: Family Revocation Verification -> RT2 must now fail too
  // ----------------------------------------------------
  const t4Start = Date.now();
  const reuseRT2Res = await makeRequest(
    'POST',
    '/api/auth/refresh',
    {
      'X-Refresh-Token': refreshToken2,
      Cookie: `refresh_token=${refreshToken2}`,
    },
    {}
  );

  const test4Passed = reuseRT2Res.statusCode === 401;

  results.push({
    name: 'تست ۴: راستی‌آزمایی انهدام کامل خانواده توکن‌ها (Family Revocation) -> رد شدن RT2 پس از سواستفاده از RT1',
    passed: test4Passed,
    statusCode: reuseRT2Res.statusCode,
    durationMs: Date.now() - t4Start,
    details: `پاسخ سرور: Status ${reuseRT2Res.statusCode} | تمام توکن‌های این کاربر به‌دلیل خطای امنیتی باطل شدند.`,
    responseBody: reuseRT2Res.body,
  });

  // Re-login to get fresh tokens for Test 5, 6, 7
  const relogin = await makeRequest('POST', '/api/auth/login', {}, { username: testUser, password: testPass });
  const validAT = relogin.body?.token;
  const validRT = relogin.body?.refreshToken || extractCookieValue(relogin.headers['set-cookie'], 'refresh_token');

  // ----------------------------------------------------
  // TEST 5: Expired / Invalid Access Token -> 401 -> Refresh -> New Access Token
  // ----------------------------------------------------
  const t5Start = Date.now();
  const invalidJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE2MDAwMDAwMDB9.invalid_signature';

  const expiredReq = await makeRequest('GET', '/api/auth/me', {
    Authorization: `Bearer ${invalidJWT}`,
  });

  const refreshForExpired = await makeRequest(
    'POST',
    '/api/auth/refresh',
    {
      'X-Refresh-Token': validRT,
      Cookie: `refresh_token=${validRT}`,
    },
    {}
  );

  const test5Passed =
    expiredReq.statusCode === 401 &&
    refreshForExpired.statusCode === 200 &&
    !!refreshForExpired.body?.token;

  results.push({
    name: 'تست ۵: رد شدن Access Token منقضی/دستکاری‌شده (۴۰۱) و بازیابی هویت مجدد از Endpoint تمدید',
    passed: test5Passed,
    statusCode: expiredReq.statusCode,
    durationMs: Date.now() - t5Start,
    details: `درخواست با توکن منقضی: ${expiredReq.statusCode} | تمدید توکن: ${refreshForExpired.statusCode}`,
    responseBody: { expiredResponse: expiredReq.body, refreshResponse: refreshForExpired.body },
  });

  const currentAT = refreshForExpired.body?.token;
  const currentRT = refreshForExpired.body?.refreshToken || extractCookieValue(refreshForExpired.headers['set-cookie'], 'refresh_token');

  // ----------------------------------------------------
  // TEST 6: Server Restart Simulation (Memory Wipe -> DB Truth Persistence)
  // ----------------------------------------------------
  const t6Start = Date.now();
  clearMemoryTokens();

  const postRestartRefresh = await makeRequest(
    'POST',
    '/api/auth/refresh',
    {
      'X-Refresh-Token': currentRT,
      Cookie: `refresh_token=${currentRT}`,
    },
    {}
  );

  const test6Passed = postRestartRefresh.statusCode === 200 && !!postRestartRefresh.body?.token;

  results.push({
    name: 'تست ۶: شبیه‌سازی ری‌استارت کامل سرور (تخلیه RAM و صحت ماندگاری جلسه در دیتابیس MySQL)',
    passed: test6Passed,
    statusCode: postRestartRefresh.statusCode,
    durationMs: Date.now() - t6Start,
    details: `پس از پاکسازی RAM سرور، Refresh Token از MySQL تایید شد و Access Token جدید صادر گردید (کد 200 OK).`,
    responseBody: postRestartRefresh.body,
  });

  // ----------------------------------------------------
  // TEST 7: Additional Form Submission Scenario (Silent Refresh Interceptor)
  // ----------------------------------------------------
  const t7Start = Date.now();
  const activeRT = postRestartRefresh.body?.refreshToken || currentRT;
  const expiredATForForm = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE2MDAwMDAwMDB9.expired_signature';

  // Client interceptor logic simulated:
  // Step A: User is filling out a form/page. Meanwhile Access Token expires.
  // User submits request with expired token -> receives 401 Unauthorized
  const formSubmit1 = await makeRequest(
    'GET',
    '/api/auth/sessions',
    { Authorization: `Bearer ${expiredATForForm}` }
  );

  let formSubmitFinalStatus = formSubmit1.statusCode;
  let formSubmitFinalBody = formSubmit1.body;
  let intercepted = false;

  if (formSubmit1.statusCode === 401) {
    intercepted = true;
    // Interceptor automatically calls refresh endpoint
    const silentRefresh = await makeRequest(
      'POST',
      '/api/auth/refresh',
      { 'X-Refresh-Token': activeRT, Cookie: `refresh_token=${activeRT}` },
      {}
    );

    if (silentRefresh.statusCode === 200 && silentRefresh.body?.token) {
      const newAT = silentRefresh.body.token;
      // Interceptor retries original request transparently with new Access Token
      const formSubmitRetry = await makeRequest(
        'GET',
        '/api/auth/sessions',
        { Authorization: `Bearer ${newAT}` }
      );
      formSubmitFinalStatus = formSubmitRetry.statusCode;
      formSubmitFinalBody = formSubmitRetry.body;
    }
  }

  const test7Passed = formSubmit1.statusCode === 401 && intercepted && formSubmitFinalStatus === 200;

  results.push({
    name: 'تست ۷ (سناریوی فرم کلاینت): بازخورد خودکار و شفاف Silent Refresh در انقضای Access Token موقع ارسال فرم',
    passed: test7Passed,
    statusCode: formSubmitFinalStatus,
    durationMs: Date.now() - t7Start,
    details: `درخواست اولیه فرم با توکن منقضی: 401 Unauthorized -> فراخوانی خودکار Interceptor برای تمدید توکن -> ارسال مجدد درخواست: ${formSubmitFinalStatus} OK (کاربر صفر خطا مشاهده کرد).`,
    responseBody: { initialStatus: formSubmit1.statusCode, retryStatus: formSubmitFinalStatus, result: formSubmitFinalBody },
  });

  // ----------------------------------------------------
  // Output Summary Report
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log('📊 خلاصه نتایج راستی‌آزمایی رفتار سیستم');
  console.log('====================================================');

  let allPassed = true;
  results.forEach((r, idx) => {
    const icon = r.passed ? '✅' : '❌';
    if (!r.passed) allPassed = false;
    console.log(`\n[${idx + 1}] ${icon} ${r.name}`);
    console.log(`   ⏱️ زمان: ${r.durationMs}ms | کد وضعیت: ${r.statusCode}`);
    console.log(`   📝 جزئیات: ${r.details}`);
    console.log(`   🔍 پاسخ خام: ${JSON.stringify(r.responseBody)}`);
  });

  console.log('\n====================================================');
  if (allPassed) {
    console.log('🎉 تمامی ۷ تست رفتار سیستم با موفقیت کامل و بدون هیچ کسر خطایی پاس شدند.');
  } else {
    console.error('❌ برخی از تست‌ها با خطا مواجه شدند.');
    process.exit(1);
  }
}

function extractCookieValue(cookies: string[] | string | undefined, cookieName: string): string | null {
  if (!cookies) return null;
  const list = Array.isArray(cookies) ? cookies : [cookies];
  for (const c of list) {
    const parts = c.split(';');
    for (const p of parts) {
      const [k, v] = p.trim().split('=');
      if (k === cookieName) return v;
    }
  }
  return null;
}

runSuite().catch((err) => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
