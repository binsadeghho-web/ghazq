import { normalizeDigits, normalizePersianText, normalizePayload } from '../src/server/platform/persianNormalizer';
import { checkThreeTierRateLimit, rateLimitIpUser } from '../src/server/modules/auth/authModule';
import { Money } from '../src/utils/money';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 اجرای تست خودکار نرمال‌سازی فارسی و ریت‌لیمیت سه‌لایه (Items 4, 10, 11)');
  console.log('====================================================');

  // Test 1: Persian & Arabic digit normalization
  const persianNationalId = '۰۱۲۳۴۵۶۷۸۹';
  const arabicPhone = '٠٩١٢٣٤٥٦٧٨٩';
  const normalizedNatId = normalizeDigits(persianNationalId);
  const normalizedPhone = normalizeDigits(arabicPhone);

  console.log(`۱. تبدیل کد ملی فارسی (${persianNationalId}) به لاتین: ${normalizedNatId}`);
  console.log(`۲. تبدیل شماره موبایل عربی (${arabicPhone}) به لاتین: ${normalizedPhone}`);
  if (normalizedNatId !== '0123456789' || normalizedPhone !== '09123456789') {
    throw new Error('خطا در تبدیل ارقام فارسی و عربی');
  }
  console.log('✅ تست تبدیل ارقام: موفق\n');

  // Test 2: Persian character normalization (ي -> ی, ك -> ک)
  const arabicText = 'مركز آموزش قضايي دادگستري كل كشور';
  const cleanPersian = normalizePersianText(arabicText);
  console.log(`۳. متن قبل از پاکسازی: ${arabicText}`);
  console.log(`۴. متن پس از نرمال‌سازی: ${cleanPersian}`);
  if (cleanPersian.includes('ي') || cleanPersian.includes('ك')) {
    throw new Error('خطا در نرمال‌سازی حروف ی و ک');
  }
  console.log('✅ تست نرمال‌سازی حروف: موفق\n');

  // Test 3: Money computations in exact integer Rials (Item 10)
  const coursePriceTomans = '2500000'; // 2.5 million Tomans
  const rials = Money.tomansToRials(coursePriceTomans);
  const orderTotal = Money.calculateOrderTotal([
    { unitPriceRials: rials.toString(), quantity: 3 }
  ]);
  const formattedRials = Money.formatRials(orderTotal);
  console.log(`۵. تبدیل ${coursePriceTomans} تومان به ریال: ${rials} ریال`);
  console.log(`۶. محاسبه ۳ عدد دوره در قالب عدد صحیح ریال: ${formattedRials} ریال (بدون باگ Float)`);
  if (orderTotal !== '75000000') {
    throw new Error('خطای محاسباتی در جمع مالی');
  }
  console.log('✅ تست محاسبات مالی ریالی: موفق\n');

  // Test 4: 3-Tier Rate Limiter
  console.log('۷. ارزیابی ریت‌لیمیت سه‌لایه (IP + Username: حداکثر ۵ تلاش در ۱۵ دقیقه):');
  const testIp = '192.168.1.100';
  const testUser = 'user_rate_test_01';

  rateLimitIpUser.delete(`${testIp}:${testUser}`);
  let caughtRateLimit = false;

  for (let i = 1; i <= 6; i++) {
    try {
      checkThreeTierRateLimit(testIp, testUser);
      console.log(`   درخواست شماره ${i}: مجاز`);
    } catch (err: any) {
      if (err.statusCode === 429 || err.code === 'RATE_LIMIT_IP_USER_EXCEEDED') {
        caughtRateLimit = true;
        console.log(`   درخواست شماره ${i}: ⛔ با موفقیت مسدود شد (خطای 429 - ${err.code})`);
      } else {
        throw err;
      }
    }
  }

  if (!caughtRateLimit) {
    throw new Error('ریت‌لیمیت سه‌لایه موفق به مهار درخواست ششم نشد.');
  }
  console.log('✅ تست ریت‌لیمیت سه‌لایه: موفق\n');

  console.log('====================================================');
  console.log('🎉 کلیه آزمون‌های نرمال‌سازی، مالی و ریت‌لیمیت با موفقیت تأیید شدند.');
  console.log('====================================================\n');
}

runTestSuite().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
