import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { dbConfig } from '../src/server/platform/mysqlDatabase';

async function seed() {
  console.log('🌱 Starting idempotent MySQL user database seed script...');

  const pool = mysql.createPool(dbConfig);

  try {
    const conn = await pool.getConnection();
    console.log(`✅ Connected to MySQL database "${dbConfig.database}" on ${dbConfig.host}`);

    // Initial users definition
    const seedUsers = [
      {
        id: 'usr_sadegh_admin',
        national_id: 'SADEGH',
        username: 'SADEGH',
        password_raw: '8411',
        full_name: 'صادق (مدیر ارشد سامانه)',
        phone: '09121111111',
        role: 'admin',
        role_title: 'مدیر ارشد سامانه',
        organization: 'مرکز مدیریت و دانش‌آموختگان فقه و قضا',
        graduation_year: '۱۳۸۸',
        avatar_text: 'صا',
      },
      {
        id: 'usr_ali_alumni',
        national_id: 'ALI',
        username: 'ALI',
        password_raw: '1040',
        full_name: 'علی (دانش‌آموخته نخبه)',
        phone: '09122222222',
        role: 'alumni',
        role_title: 'دانش‌آموخته نخبه',
        organization: 'دادگستری کل استان تهران',
        graduation_year: '۱۳۹۵',
        avatar_text: 'عل',
      },
    ];

    for (const u of seedUsers) {
      const passwordHash = bcrypt.hashSync(u.password_raw, 10);

      const [existing] = await conn.query<any[]>(
        `SELECT id, version FROM users WHERE national_id = ? OR username = ? LIMIT 1`,
        [u.national_id, u.username]
      );

      if (existing && existing.length > 0) {
        console.log(`🔄 User "${u.username}" already exists. Updating password hash and enforcing must_change_password = 1...`);
        await conn.query(
          `UPDATE users 
           SET password_hash = ?, 
               role = ?, 
               role_title = ?, 
               must_change_password = 1, 
               is_active = 1, 
               is_locked = 0, 
               failed_attempts = 0, 
               locked_until = NULL, 
               version = version + 1 
           WHERE id = ?`,
          [passwordHash, u.role, u.role_title, existing[0].id]
        );
        console.log(`✅ User "${u.username}" successfully updated.`);
      } else {
        console.log(`➕ User "${u.username}" not found. Inserting new user record...`);
        await conn.query(
          `INSERT INTO users (
            id, national_id, username, password_hash, full_name, phone, role, role_title,
            organization, graduation_year, avatar_text, is_active, is_locked, failed_attempts,
            token_version, must_change_password, has_account, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 1, 1, 1, 1)`,
          [
            u.id,
            u.national_id,
            u.username,
            passwordHash,
            u.full_name,
            u.phone,
            u.role,
            u.role_title,
            u.organization,
            u.graduation_year,
            u.avatar_text,
          ]
        );
        console.log(`✅ User "${u.username}" created successfully with must_change_password = 1.`);
      }
    }

    conn.release();
    await pool.end();
    console.log('🎉 Database seeding completed successfully.');
  } catch (err) {
    console.error('❌ Error executing seedUsers script:', err);
    process.exit(1);
  }
}

seed();
