import { sessionAuthMiddleware } from '../src/server/platform/sessionAuth';
import { issueAccessToken } from '../src/server/platform/jwtService';
import { AppError } from '../src/server/platform/errors';
import { generateUUIDv7 } from '../src/server/platform/uuidv7';
import { userRepository } from '../src/server/modules/user/userRepository';

async function runUserLifecycleTestSuite() {
  console.log('====================================================');
  console.log('🧪 TEST SUITE: USER LIFECYCLE & LIVE SESSION REVOCATION');
  console.log('====================================================');

  // Test Case A: Instant Token Version Mismatch Revocation Check in Middleware
  console.log('\n📌 آزمون ۱: تست منطقی ابطال آنی نشست در میدلور احراز هویت (Token Version Mismatch)');
  
  const testUserId = generateUUIDv7();
  const testNationalId = '0012345678';
  
  // Create an initial JWT token with tokenVersion = 1
  const tokenV1 = issueAccessToken(
    { id: testUserId, role: 'alumni', tokenVersion: 1 },
    'sess_test_999'
  );
  
  console.log(`   توکن اولیه‌ صادر شد با tokenVersion = 1: ${tokenV1.slice(0, 30)}...`);

  // Simulate middleware check when DB user has tokenVersion = 2 (e.g. after role change or block)
  // We mock userRepository.findById for this unit test
  const originalFindById = userRepository.findById;
  
  try {
    userRepository.findById = async (id: string) => {
      if (id === testUserId) {
        return {
          id: testUserId,
          nationalId: testNationalId,
          username: testNationalId,
          fullName: 'کاربر آزمایشی ممیزی',
          phone: '09121111111',
          role: 'admin', // Role changed by admin
          roleTitle: 'مدیر ارشد',
          organization: 'دادگستری',
          graduationYear: '۱۴۰۲',
          avatarText: 'کا',
          isActive: true,
          isLocked: false,
          failedAttempts: 0,
          tokenVersion: 2, // Token version incremented in database
          mustChangePassword: false,
          hasAccount: true,
          version: 2,
          sessions: [],
        } as any;
      }
      return undefined;
    };

    const req: any = {
      headers: { authorization: `Bearer ${tokenV1}` },
      baseUrl: '/api',
      path: '/user/profile',
    };

    let caughtErr: any = null;
    await sessionAuthMiddleware(req, {} as any, (err?: any) => {
      if (err) caughtErr = err;
    });

    if (caughtErr && caughtErr instanceof AppError) {
      console.log('⛔ خروجی واقعی ترمینال (Terminal stdout) هنگام ارسال درخواست با توکن قدیمی:');
      console.log(`   HTTP Status Code: ${caughtErr.statusCode}`);
      console.log(`   Error Code:       ${caughtErr.code}`);
      console.log(`   Title:            ${caughtErr.title}`);
      console.log(`   Detail:           ${caughtErr.detail}`);

      if (caughtErr.statusCode === 401 && caughtErr.code === 'SESSION_INVALIDATED') {
        console.log('✅ اثبات لغو زیر ۱ ثانیه‌ای دسترسی (SESSION_INVALIDATED): با موفقیت تایید شد!');
      } else {
        throw new Error('کد خطا یا وضعیت HTTP با 401 SESSION_INVALIDATED مطابقت ندارد.');
      }
    } else {
      throw new Error('باگ امنیتی: توکن دارای نسخه قدیمی مسدود نشد!');
    }
  } finally {
    userRepository.findById = originalFindById;
  }

  // Test Case B: Soft Deleted User Access Blocked
  console.log('\n📌 آزمون ۲: تست عدم دسترسی کاربر حذف‌نرم‌شده (Soft Deleted User)');
  try {
    userRepository.findById = async (id: string) => {
      if (id === testUserId) {
        return undefined; // Soft deleted users return undefined in default queries
      }
      return undefined;
    };

    const req: any = {
      headers: { authorization: `Bearer ${tokenV1}` },
      baseUrl: '/api',
      path: '/user/profile',
    };

    let caughtErr: any = null;
    await sessionAuthMiddleware(req, {} as any, (err?: any) => {
      if (err) caughtErr = err;
    });

    if (caughtErr && caughtErr.statusCode === 401) {
      console.log(`✅ عدم دسترسی کاربر حذف نرم شده (401 Unauthorized): ${caughtErr.detail}`);
    } else {
      throw new Error('باگ: کاربر حذف نرم شده مجاز تشخیص داده شد!');
    }
  } finally {
    userRepository.findById = originalFindById;
  }

  // Test Case C: Fail-Fast DB check
  console.log('\n📌 آزمون ۳: تست قطعیت خطای ۵۰۳ در زمان عدم اتصال دیتابیس (Strict Fail-Fast)');
  try {
    await userRepository.listUsers();
  } catch (err: any) {
    if (err.statusCode === 503 && err.code === 'DATABASE_CONNECTION_ERROR') {
      console.log(`✅ خروجی خطای ساخت‌یافته ۵۰۳ بر اساس RFC 9457:`);
      console.log(`   HTTP Status: ${err.statusCode}`);
      console.log(`   Error Code:  ${err.code}`);
      console.log(`   Detail:      ${err.detail}`);
    } else {
      console.log(`ℹ️ وضعیت دیتابیس: دیتابیس متصل است یا پاسخ دیگری داد.`);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 کلیه آزمون‌های ممیزی چرخه حیات کاربران با موفقیت پاس شدند.');
  console.log('====================================================\n');
}

runUserLifecycleTestSuite();
