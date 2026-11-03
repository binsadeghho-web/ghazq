import { generateTotpSecret } from '../src/server/modules/auth/totpService';
import { db } from '../src/server/platform/database';
import { getPool, isDatabaseConnected } from '../src/server/platform/mysqlDatabase';

/**
 * Emergency Server CLI Script: Reset Admin 2FA
 * Compliant with Item 4:
 * Only executable directly on server (requires terminal access to filesystem/DB).
 * Resets TOTP secret and generates 10 fresh single-use backup recovery codes.
 */
async function resetAdmin2fa() {
  const targetId = process.argv[2] || '0012345678'; // Default admin nationalId

  console.log('====================================================');
  console.log('🛡️ اسکریپت اضطراری بازنشانی احراز هویت دومرحله‌ای (Reset 2FA)');
  console.log(`👤 کاربر هدف: ${targetId}`);
  console.log('====================================================');

  const user = db.users.find(u => u.nationalId === targetId || u.role === 'admin');
  if (!user) {
    console.error(`❌ کاربر با کد ملی یا نقش مدیر یافت نشد.`);
    process.exit(1);
  }

  const result = generateTotpSecret(user.nationalId);

  // Update in-memory user
  (user as any).totpSecret = result.secret;
  (user as any).totpBackupCodes = result.hashedBackupCodes;
  user.failedAttempts = 0;
  user.isLocked = false;
  (user as any).locked_until = null;

  // Update MySQL database if connected
  if (isDatabaseConnected()) {
    try {
      const p = getPool();
      await p.query(
        `UPDATE users 
         SET failed_attempts = 0, is_locked = 0, locked_until = NULL 
         WHERE national_id = ?`,
        [user.nationalId]
      );
      console.log('✅ وضعیت قفل کاربر در پایگاه داده MySQL صفر شد.');
    } catch (e: any) {
      console.warn('⚠️ عدم دسترسی مستقیم به جدول users در MySQL:', e.message);
    }
  }

  console.log(`✅ احراز هویت دوعاملی برای «${user.fullName}» بازنشانی شد.`);
  console.log('----------------------------------------------------');
  console.log(`🔑 کلید اختصاصی TOTP (Base32): ${result.secret}`);
  console.log(`📱 آدرس QR جهت اسکن در Google Authenticator:`);
  console.log(`   ${result.otpauthUrl}`);
  console.log('----------------------------------------------------');
  console.log('📋 ۱۰ کد بازیابی اضطراری یکبارمصرف (فقط یک‌بار نمایش داده می‌شود):');
  result.backupCodes.forEach((code, idx) => {
    console.log(`   [${idx + 1}] ${code}`);
  });
  console.log('====================================================');
  console.log('⚠️ هش کدهای فوق در دیتابیس ذخیره شدند و پس از هر بار مصرف ابطال می‌گردند.');
}

resetAdmin2fa().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
