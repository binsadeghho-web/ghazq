import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { dbConfig } from '../src/server/platform/mysqlDatabase';
import { AuthService } from '../src/server/modules/auth/authModule';
import { userRepository } from '../src/server/modules/user/userRepository';

async function benchmark() {
  console.log('⏱️ Starting 10-iteration login speed benchmark test...');

  let pool: mysql.Pool | null = null;
  try {
    pool = mysql.createPool({ ...dbConfig, connectTimeout: 1500 });
    const conn = await pool.getConnection();
    console.log(`✅ Connected to MySQL database (${dbConfig.host})`);
    conn.release();
  } catch {
    console.log(`ℹ️ MySQL remote host (${dbConfig.host}) not directly reachable from sandbox environment; running benchmark test in repository fallback mode.`);
  }

  const authService = new AuthService();

  // Ensure SADEGH user exists for testing
  const passwordHash = bcrypt.hashSync('8411', 10);
  let existing = await userRepository.findByNationalIdOrUsername('SADEGH');
  if (!existing) {
    existing = await userRepository.createUser({
      id: 'usr_sadegh_test',
      nationalId: 'SADEGH',
      username: 'SADEGH',
      passwordHash,
      fullName: 'صادق (مدیر ارشد سامانه)',
      phone: '09121111111',
      role: 'admin',
      roleTitle: 'مدیر ارشد سامانه',
      organization: 'مرکز مدیریت و دانش‌آموختگان',
      graduationYear: '۱۳۸۸',
      mustChangePassword: true,
    }) as any;
  }

  const latencies: number[] = [];

  for (let i = 1; i <= 10; i++) {
    const start = performance.now();
    await authService.login('SADEGH', '8411', `127.0.0.${i}`, `BenchmarkClient/${i}`);
    const duration = performance.now() - start;
    latencies.push(duration);
    console.log(`  Iteration ${i.toString().padStart(2, '0')}: ${duration.toFixed(2)} ms`);
  }

  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / latencies.length;
  
  // P95 = 95th percentile (index 9 in 10 sorted elements)
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1];

  console.log('\n📊 Login Speed Benchmark Results:');
  console.log(`  - Total Iterations: ${latencies.length}`);
  console.log(`  - Average Latency: ${avg.toFixed(2)} ms`);
  console.log(`  - Min Latency:     ${latencies[0].toFixed(2)} ms`);
  console.log(`  - Max Latency:     ${latencies[latencies.length - 1].toFixed(2)} ms`);
  console.log(`  - P95 Latency:     ${p95.toFixed(2)} ms`);

  if (p95 < 700) {
    console.log(`✅ SUCCESS: P95 latency (${p95.toFixed(2)} ms) is well below the target threshold of 700 ms!`);
  } else {
    console.log(`⚠️ WARNING: P95 latency (${p95.toFixed(2)} ms) exceeded 700 ms target.`);
  }

  if (pool) {
    try { await pool.end(); } catch {}
  }
  process.exit(0);
}

benchmark();
