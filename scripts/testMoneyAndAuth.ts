import { Money } from '../src/utils/money';
import { normalizeDigits, normalizePersianText, normalizePayload } from '../src/server/platform/persianNormalizer';
import { ALLOWED_DRAFT_KEYS, isDraftKeyAllowed } from '../src/utils/draftStorage';
import { generateTotpSecret, verifyTotpOrBackupCode } from '../src/server/modules/auth/totpService';

function runUnitTests() {
  console.log('====================================================');
  console.log('🧪 اجرای آزمون‌های واحد و صحه‌گذاری محاسبات مالی، فارسی‌سازی و امنیت');
  console.log('====================================================');

  // ۱. تست Money و DECIMAL
  console.log('۱. آزمون موتور مالی و پارس مقادیر اعشاری DECIMAL (Item 8):');
  const t1 = Money.parseDecimalRials('2500000.0000');
  if (t1 !== 2500000n) throw new Error(`تست ناموفق: انتظار 2500000n ولی ${t1} دریافت شد`);
  console.log('   ✅ رشته "2500000.0000" با موفقیت به 2500000n پارس شد.');

  const t2 = Money.parseDecimalRials('1850000.00');
  if (t2 !== 1850000n) throw new Error(`تست ناموفق: انتظار 1850000n ولی ${t2} دریافت شد`);
  console.log('   ✅ رشته "1850000.00" با موفقیت به 1850000n پارس شد.');

  let rejectedNonZeroFraction = false;
  try {
    Money.parseDecimalRials('2500000.50');
  } catch (err: any) {
    rejectedNonZeroFraction = true;
    console.log(`   ✅ رشته "2500000.50" با خطا به درستی رد شد: ${err.message}`);
  }
  if (!rejectedNonZeroFraction) throw new Error('اعشار ناصفر باید خطا می‌داد!');

  const orderTotal = Money.calculateOrderTotal([
    { unitPriceRials: '2500000.0000', quantity: 2 },
    { unitPriceRials: '1500000.00', quantity: 3 },
  ]);
  if (orderTotal !== '9500000') throw new Error(`محاسبه مجموع ناموفق: ${orderTotal}`);
  console.log(`   ✅ مجموع سفارش (2x2.5M + 3x1.5M) بدون خطای اعشاری = ${Money.formatRials(orderTotal)} ریال.`);

  // ۲. تست نرمال‌سازی فارسی (Item 9)
  console.log('----------------------------------------------------');
  console.log('۲. آزمون نرمال‌سازی ارقام و کاراکترهای فارسی (Item 9):');
  const normalizedDigits = normalizeDigits('۰۹۱۲۳۴۵۶۷۸۹');
  if (normalizedDigits !== '09123456789') throw new Error('نرمال‌سازی ارقام ناموفق');
  console.log(`   ✅ تبدیل ارقام فارسی "۰۹۱۲۳۴۵۶۷۸۹" به لاتین: ${normalizedDigits}`);

  const normalizedText = normalizePersianText('دادگاه تجديد نظر  و پيگيري حكم');
  if (!normalizedText.includes('تجدید') || !normalizedText.includes('پیگیری') || !normalizedText.includes('حکم')) {
    throw new Error('نرمال‌سازی متن ناموفق');
  }
  console.log(`   ✅ تبدیل ي/ك عربی به فارسی: "${normalizedText}"`);

  // تست عدم دستکاری فیلدهای امنیتی (password, token, otp)
  const payloadWithPass = {
    username: 'کاربر  ۱',
    password: 'P@ssword_ي_۱۲۳',
    token: 'token_ي_۴۵۶',
    phone: '۰۹۱۲۳۴۵۶۷۸۹',
  };
  const normalizedPayload = normalizePayload(payloadWithPass);
  if (normalizedPayload.password !== 'P@ssword_ي_۱۲۳') {
    throw new Error('رمز عبور نباید تغییر می‌کرد!');
  }
  if (normalizedPayload.token !== 'token_ي_۴۵۶') {
    throw new Error('توکن نباید تغییر می‌کرد!');
  }
  if (normalizedPayload.phone !== '09123456789') {
    throw new Error('شماره تلفن باید ارقامش لاتین می‌شد!');
  }
  console.log('   ✅ حفظ ۱۰۰٪ یکپارچگی رمز عبور و توکن و استثنا شدن از نرمال‌سازی تایید شد.');

  // ۳. تست لیست سفید پیش‌نویس IndexedDB (Item 10)
  console.log('----------------------------------------------------');
  console.log('۳. آزمون لیست سفید پیش‌نویس‌های مجاز IndexedDB (Item 10):');
  if (!isDraftKeyAllowed('research-proposal')) throw new Error('کلید مجاز رد شد!');
  if (!isDraftKeyAllowed('article-draft')) throw new Error('کلید مجاز رد شد!');
  if (isDraftKeyAllowed('counseling-request')) throw new Error('کلید غیرمجاز قبول شد!');
  if (isDraftKeyAllowed('financial-loan-form')) throw new Error('کلید غیرمجاز قبول شد!');
  console.log('   ✅ کلیدهای مجاز (research-proposal، article-draft) تایید و کلیدهای حساس (مشاوره، مالی) به درستی مسدود شدند.');

  // ۴. تست TOTP و کدهای بازیابی ۱۰ گانه (Item 4)
  console.log('----------------------------------------------------');
  console.log('۴. آزمون احراز هویت دومرحله‌ای TOTP و ۱۰ کد بازیابی یکبارمصرف (Item 4):');
  const setup = generateTotpSecret('0012345678');
  if (setup.backupCodes.length !== 10) throw new Error('باید دقیقاً ۱۰ کد بازیابی تولید شود');
  if (setup.hashedBackupCodes.length !== 10) throw new Error('باید ۱۰ هش تولید شود');
  console.log(`   ✅ تولید ۱۰ کد بازیابی اضطراری با هش SHA-256 تایید شد.`);

  // تست اعتبارسنجی با یکی از کدهای بازیابی
  const firstCode = setup.backupCodes[0];
  const testVerify = verifyTotpOrBackupCode(firstCode, setup.secret, setup.hashedBackupCodes);
  if (!testVerify.valid || !testVerify.usedBackupCodeHash) {
    throw new Error('کد بازیابی باید معتبر شناخته می‌شد');
  }
  console.log(`   ✅ کد بازیابی [${firstCode}] با موفقیت اعتبارسنجی و هش جهت ابطال شناسایی شد.`);

  const invalidCodeVerify = verifyTotpOrBackupCode('WRONGCOD', setup.secret, setup.hashedBackupCodes);
  if (invalidCodeVerify.valid) throw new Error('کد اشتباه نباید قبول می‌شد');
  console.log('   ✅ کد اشتباه با موفقیت رد شد.');

  console.log('====================================================');
  console.log('🎉 کلیه آزمون‌های واحد با موفقیت ۱۰۰٪ پاس شدند.');
  console.log('====================================================');
}

runUnitTests();
