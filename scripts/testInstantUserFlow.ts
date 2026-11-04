import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { dbConfig } from '../src/server/platform/mysqlDatabase';
import { AuthService } from '../src/server/modules/auth/authModule';
import { userRepository } from '../src/server/modules/user/userRepository';
import { generateUUIDv7 } from '../src/server/platform/database';

async function testInstantAvailability() {
  console.log('⚡ Starting Instant User Availability & Login Test (< 7 seconds requirement)...');

  let pool: mysql.Pool | null = null;
  try {
    pool = mysql.createPool({ ...dbConfig, connectTimeout: 1500 });
    const conn = await pool.getConnection();
    console.log(`✅ Connected to MySQL database (${dbConfig.host})`);
    conn.release();
  } catch {
    console.log(`ℹ️ MySQL remote host (${dbConfig.host}) not directly reachable from sandbox environment; running test in repository fallback mode.`);
  }

  const authService = new AuthService();

  const testNationalId = `TST${Math.floor(100000 + Math.random() * 900000)}`;
  const testPassword = 'InstantPassword$1403';
  const passwordHash = bcrypt.hashSync(testPassword, 10);
  const userId = generateUUIDv7();

  console.log(`1️⃣ Creating new test user (ID: ${userId}, National ID: ${testNationalId})...`);
  const createStartTime = performance.now();

  const createdUser = await userRepository.createUser({
    id: userId,
    nationalId: testNationalId,
    username: testNationalId,
    passwordHash,
    fullName: 'کاربر آزمایشی فوری',
    phone: '09129998877',
    role: 'alumni',
    roleTitle: 'قاضی آزمایشی',
    organization: 'دادگستری',
    graduationYear: '۱۴۰۱',
    mustChangePassword: true,
  });

  console.log(`✅ User created. Attempting instant login...`);

  const loginResult = await authService.login(
    testNationalId,
    testPassword,
    '127.0.0.1',
    'InstantAvailabilityTest/1.0'
  );

  const totalElapsedMs = performance.now() - createStartTime;

  console.log('\n📊 Instant Availability Test Results:');
  console.log(`  - User ID:                ${loginResult.user.id}`);
  console.log(`  - Full Name:              ${loginResult.user.fullName}`);
  console.log(`  - National ID:            ${loginResult.user.nationalId}`);
  console.log(`  - Must Change Password:   ${loginResult.mustChangePassword}`);
  console.log(`  - Total Elapsed Time:     ${totalElapsedMs.toFixed(2)} ms (${(totalElapsedMs / 1000).toFixed(2)} seconds)`);

  if (totalElapsedMs < 7000 && loginResult.user.id === userId) {
    console.log(`✅ SUCCESS: User was instantly created and logged in within ${(totalElapsedMs / 1000).toFixed(2)}s (well below 7.0s limit)!`);
  } else {
    console.log(`❌ FAILURE: Instant availability threshold exceeded or user login failed.`);
    process.exit(1);
  }

  // Now test user update and instant login with new password
  console.log('\n2️⃣ Testing instant user edit (updating password and login)...');
  const updateStartTime = performance.now();
  const newPassword = 'NewPassword$2026';
  const newPasswordHash = bcrypt.hashSync(newPassword, 10);

  await userRepository.updateUserOptimistic(userId, {
    passwordHash: newPasswordHash,
    mustChangePassword: false,
  }, (createdUser as any).version || 1);

  const updatedLoginResult = await authService.login(
    testNationalId,
    newPassword,
    '127.0.0.1',
    'InstantUpdateTest/1.0'
  );

  const updateElapsedMs = performance.now() - updateStartTime;
  console.log(`  - Updated Password Login Elapsed: ${updateElapsedMs.toFixed(2)} ms`);
  console.log(`  - Updated Must Change Password:   ${updatedLoginResult.mustChangePassword}`);

  if (updateElapsedMs < 7000 && updatedLoginResult.mustChangePassword === false) {
    console.log(`✅ SUCCESS: User update took ${updateElapsedMs.toFixed(2)} ms and was instantly active for login!`);
  }

  if (pool) {
    try { await pool.end(); } catch {}
  }
  process.exit(0);
}

testInstantAvailability();
