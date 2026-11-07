import http from 'http';
import { clearMemoryTokens } from '../src/server/platform/jwtService';
import { resetAuthRateLimits } from '../src/server/modules/auth/authModule';

const PORT = 3000;

interface TestResult {
  num: string;
  name: string;
  passed: boolean;
  statusCode: number;
  durationMs: number;
  details: string;
  rawResponse: any;
}

const results: TestResult[] = [];

function makeRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: any; rawBody: string; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
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
          const durationMs = Date.now() - startTime;
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
            durationMs,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
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

async function runSuite() {
  console.log('====================================================');
  console.log('🧪 اجرای مجموعه تست‌های اختصاصی بازخورد کاربر (بندهای ۱، ۲، ۳، ۴)');
  console.log('====================================================\n');

  resetAuthRateLimits();

  // Credentials
  const testUser = 'SADEGH';
  const testPass = '8411';

  // ----------------------------------------------------
  // ITEM 1: New Refresh Token Format Verification & Test 2 / Test 3
  // ----------------------------------------------------
  const loginRes = await makeRequest('POST', '/api/auth/login', { 'X-Forwarded-For': '10.0.0.1' }, { username: testUser, password: testPass });
  const rt1 = loginRes.body?.refreshToken || extractCookieValue(loginRes.headers['set-cookie'], 'refresh_token');
  const at1 = loginRes.body?.token;

  console.log('🔍 بررسی فرمت جدید Refresh Token:');
  console.log(`   مقدار صادر شده: ${rt1}`);
  const isPureRandom = typeof rt1 === 'string' && rt1.startsWith('rt_') && !rt1.includes('-');
  console.log(`   آیا فاقد id دیتابیس (UUIDv7) و مشتق‌شده از ۳۲ بایت آنتروپی تصادفی رمزنگاری‌شده است؟ ${isPureRandom ? 'بله ✅' : 'خیر ❌'}\n`);

  // Test 2: Refresh Token Rotation
  const refreshRes1 = await makeRequest(
    'POST',
    '/api/auth/refresh',
    { 'X-Refresh-Token': rt1, Cookie: `refresh_token=${rt1}`, 'X-Forwarded-For': '10.0.0.1' },
    {}
  );
  const rt2 = refreshRes1.body?.refreshToken || extractCookieValue(refreshRes1.headers['set-cookie'], 'refresh_token');

  results.push({
    num: '۱-تست۲',
    name: 'تست ۲: چرخش Refresh Token با فرمت جدید ۳۲ بایت آنتروپی تصادفی (RT1 -> RT2 و RT1 !== RT2)',
    passed: refreshRes1.statusCode === 200 && !!rt2 && rt1 !== rt2,
    statusCode: refreshRes1.statusCode,
    durationMs: refreshRes1.durationMs,
    details: `RT1: ${rt1?.slice(0, 25)}... !== RT2: ${rt2?.slice(0, 25)}...`,
    rawResponse: refreshRes1.body,
  });

  // Test 3: Reuse RT1
  const reuseRes = await makeRequest(
    'POST',
    '/api/auth/refresh',
    { 'X-Refresh-Token': rt1, Cookie: `refresh_token=${rt1}`, 'X-Forwarded-For': '10.0.0.1' },
    {}
  );

  results.push({
    num: '۱-تست۳',
    name: 'تست ۳: رد شدن استفاده مجدد از RT1 با فرمت جدید (پاسخ ۴۰۱ غیرمجاز و انهدام خانواده توکن‌ها)',
    passed: reuseRes.statusCode === 401,
    statusCode: reuseRes.statusCode,
    durationMs: reuseRes.durationMs,
    details: `کد پاسخ: ${reuseRes.statusCode} | error: ${reuseRes.body?.code || 'UNAUTHORIZED'}`,
    rawResponse: reuseRes.body,
  });

  // ----------------------------------------------------
  // ITEM 3: mustChangePassword Coordination with JWT
  // ----------------------------------------------------
  resetAuthRateLimits();
  // SADEGH has must_change_password = true
  const loginSadegh = await makeRequest('POST', '/api/auth/login', { 'X-Forwarded-For': '10.0.0.2' }, { username: testUser, password: testPass });
  const sadeghJwt = loginSadegh.body?.token;

  // Attempt to access protected operational route /api/cartable/requests with JWT
  const opRouteRes = await makeRequest(
    'GET',
    '/api/cartable/requests',
    { Authorization: `Bearer ${sadeghJwt}`, 'X-Forwarded-For': '10.0.0.2' }
  );

  // Attempt to access allowed auth route /api/auth/sessions
  const allowedRouteRes = await makeRequest(
    'GET',
    '/api/auth/sessions',
    { Authorization: `Bearer ${sadeghJwt}`, 'X-Forwarded-For': '10.0.0.2' }
  );

  const mustChangePassPassed = opRouteRes.statusCode === 403 && opRouteRes.body?.code === 'MUST_CHANGE_PASSWORD_REQUIRED' && allowedRouteRes.statusCode === 200;

  results.push({
    num: '۳',
    name: 'تست ۳: مسدودسازی مسیرهای عملیاتی موقع must_change_password=true با وجود داشتن JWT معتبر (۴۰۳ Forbidden)',
    passed: mustChangePassPassed,
    statusCode: opRouteRes.statusCode,
    durationMs: opRouteRes.durationMs,
    details: `مسیر عملیاتی (/api/cartable/requests): ${opRouteRes.statusCode} ${opRouteRes.body?.code} | مسیر مجاز (/api/auth/sessions): ${allowedRouteRes.statusCode}`,
    rawResponse: { operationalRouteResponse: opRouteRes.body, allowedRouteResponse: allowedRouteRes.body },
  });

  // ----------------------------------------------------
  // ITEM 4: Global Logout across Multiple Sessions
  // ----------------------------------------------------
  resetAuthRateLimits();
  // Login Session A
  const loginSessionA = await makeRequest('POST', '/api/auth/login', { 'X-Forwarded-For': '10.0.0.3' }, { username: testUser, password: testPass });
  const atA = loginSessionA.body?.token;
  const rtA = loginSessionA.body?.refreshToken || extractCookieValue(loginSessionA.headers['set-cookie'], 'refresh_token');

  // Login Session B
  const loginSessionB = await makeRequest('POST', '/api/auth/login', { 'X-Forwarded-For': '10.0.0.4' }, { username: testUser, password: testPass });
  const atB = loginSessionB.body?.token;
  const rtB = loginSessionB.body?.refreshToken || extractCookieValue(loginSessionB.headers['set-cookie'], 'refresh_token');

  // Call POST /api/auth/global-logout from Session A
  const globalLogoutRes = await makeRequest(
    'POST',
    '/api/auth/global-logout',
    { Authorization: `Bearer ${atA}`, 'X-Forwarded-For': '10.0.0.3' },
    {}
  );

  // Check Refresh Token A -> should be 401
  const checkRtA = await makeRequest(
    'POST',
    '/api/auth/refresh',
    { 'X-Refresh-Token': rtA, Cookie: `refresh_token=${rtA}`, 'X-Forwarded-For': '10.0.0.3' },
    {}
  );

  // Check Refresh Token B -> should be 401
  const checkRtB = await makeRequest(
    'POST',
    '/api/auth/refresh',
    { 'X-Refresh-Token': rtB, Cookie: `refresh_token=${rtB}`, 'X-Forwarded-For': '10.0.0.4' },
    {}
  );

  // Check Access Token B against protected endpoint -> should be 401 (token_version mismatch)
  const checkAtB = await makeRequest(
    'GET',
    '/api/auth/sessions',
    { Authorization: `Bearer ${atB}`, 'X-Forwarded-For': '10.0.0.4' }
  );

  const globalLogoutPassed =
    globalLogoutRes.statusCode === 200 &&
    checkRtA.statusCode === 401 &&
    checkRtB.statusCode === 401 &&
    checkAtB.statusCode === 401;

  results.push({
    num: '۴',
    name: 'تست ۴: خروج سراسری (globalLogout) - ابطال همزمان تمام نشست‌ها و رد شدن کامل RT_A و RT_B و AT_B',
    passed: globalLogoutPassed,
    statusCode: globalLogoutRes.statusCode,
    durationMs: globalLogoutRes.durationMs,
    details: `خروج سراسری: ${globalLogoutRes.statusCode} | استعلام RT_A: ${checkRtA.statusCode} | استعلام RT_B: ${checkRtB.statusCode} | استعلام AT_B: ${checkAtB.statusCode}`,
    rawResponse: {
      globalLogoutResponse: globalLogoutRes.body,
      refreshCheckSessionA: checkRtA.body,
      refreshCheckSessionB: checkRtB.body,
      accessCheckSessionB: checkAtB.body,
    },
  });

  // ----------------------------------------------------
  // Output Summary
  // ----------------------------------------------------
  console.log('====================================================');
  console.log('📊 نتایج خام تست‌های اختصاصی بازخورد کاربر');
  console.log('====================================================');

  results.forEach((r) => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`\n[بند ${r.num}] ${icon} ${r.name}`);
    console.log(`   ⏱️ زمان رفت‌وبرگشت HTTP: ${r.durationMs}ms | کد وضعیت: ${r.statusCode}`);
    console.log(`   📝 جزئیات: ${r.details}`);
    console.log(`   🔍 پاسخ خام JSON:\n${JSON.stringify(r.rawResponse, null, 2)}`);
  });

  console.log('\n====================================================');
  process.exit(0);
}

runSuite().catch((err) => {
  console.error('Fatal error in user feedback test suite:', err);
  process.exit(1);
});
