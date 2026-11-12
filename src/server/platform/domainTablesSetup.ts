import { getPool, isDatabaseConnected } from './mysqlDatabase';
import { logger } from './logger';
import { generateUUIDv7, toIdBuffer } from './uuidv7';

let domainTablesInitialized = false;

/**
 * Ensures all domain-specific tables, columns, and composite indexes exist in MySQL 8.
 * Strictly separates each software section into its own dedicated database table with optimized indexes.
 */
export async function ensureDomainTablesAndIndexes(): Promise<void> {
  if (domainTablesInitialized || !isDatabaseConnected()) return;
  const p = getPool();

  try {
    // 1. Dashboard Domain Tables: dashboard_banners & dashboard_events
    await p.query(`
      CREATE TABLE IF NOT EXISTS dashboard_banners (
        id BINARY(16) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        banner_type ENUM('info', 'warning', 'urgent', 'celebration') NOT NULL DEFAULT 'info',
        action_label VARCHAR(128) NULL,
        action_tab VARCHAR(64) NULL,
        expires_at VARCHAR(64) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        priority INT NOT NULL DEFAULT 1,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_banners_active_prio (is_active, priority, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS dashboard_events (
        id BINARY(16) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        event_date VARCHAR(32) NOT NULL,
        event_time VARCHAR(32) NULL,
        category VARCHAR(64) NOT NULL DEFAULT 'conference',
        category_title VARCHAR(128) NOT NULL DEFAULT 'نشست علمی',
        description TEXT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_events_active_date (is_active, event_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed initial banner and calendar events if empty
    const [existingBanners]: any = await p.query(`SELECT COUNT(*) as cnt FROM dashboard_banners`);
    if (existingBanners && Number(existingBanners[0]?.cnt || 0) === 0) {
      await p.query(
        `INSERT INTO dashboard_banners (id, title, message, banner_type, action_label, action_tab, expires_at, is_active, priority, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 10, 1)`,
        [
          toIdBuffer(generateUUIDv7()),
          'فراخوان ثبت‌نام دوره‌های عالی فقه القضاء و داوری تخصصی',
          'ثبت‌نام نیم‌سال جدید کارگاه‌های تخصصی ویژه قضات و پژوهشگران آغاز شد. ظرفیت کارگاه‌های حضوری محدود است.',
          'celebration',
          'مشاهده دوره‌ها',
          'courses',
          '۱۴۰۵/۰۶/۳۱'
        ]
      );
    }

    const [existingEvents]: any = await p.query(`SELECT COUNT(*) as cnt FROM dashboard_events`);
    if (existingEvents && Number(existingEvents[0]?.cnt || 0) === 0) {
      const sampleEvents = [
        {
          title: 'نشست نقد و بررسی آراء وحدت رویه دیوان عالی کشور',
          date: '۱۴۰۵/۰۲/۲۵',
          time: '۱۶:۰۰ الی ۱۸:۳۰',
          category: 'ruling',
          categoryTitle: 'تالار نقد آراء',
          desc: 'بررسی ابعاد فقهی و حقوقی آراء اخیر هیئت عمومی دیوان عالی با حضور مستشاران عالی.'
        },
        {
          title: 'مهلت ارسال درخواست تسهیلات قرض‌الحسنه نوبت بهار',
          date: '۱۴۰۵/۰۲/۳۰',
          time: 'تا ساعت ۲۴:۰۰',
          category: 'welfare',
          categoryTitle: 'تسهیلات رفاهی',
          desc: 'تکمیل مدارک و ثبت درخواست وام ضروری از طریق درگاه خدمات رفاهی.'
        },
        {
          title: 'کارگاه تخصصی فقه قراردادهای نوین بانکی و رمزارزها',
          date: '۱۴۰۵/۰۳/۰۵',
          time: '۱۵:۰۰ الی ۱۹:۰۰',
          category: 'course',
          categoryTitle: 'آموزش تخصصی',
          desc: 'برگزاری به صورت ترکیبی (حضوری و برخط) همراه با صدور گواهینامه معتبر مرکز.'
        }
      ];
      for (const ev of sampleEvents) {
        await p.query(
          `INSERT INTO dashboard_events (id, title, event_date, event_time, category, category_title, description, is_active, version)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
          [toIdBuffer(generateUUIDv7()), ev.title, ev.date, ev.time, ev.category, ev.categoryTitle, ev.desc]
        );
      }
    }

    // 2. Cartable Domain Enhancements: attachments, referred_department, internal_referral_note, sla_deadline_hours
    const cartableAlters = [
      `ADD COLUMN attachments JSON NULL`,
      `ADD COLUMN referred_department VARCHAR(128) NULL`,
      `ADD COLUMN internal_referral_note TEXT NULL`,
      `ADD COLUMN sla_deadline_hours INT NOT NULL DEFAULT 48`
    ];
    for (const clause of cartableAlters) {
      try { await p.query(`ALTER TABLE cartable_requests ${clause};`); } catch {}
    }
    try { await p.query(`ALTER TABLE cartable_messages ADD COLUMN attachments JSON NULL;`); } catch {}
    try { await p.query(`CREATE INDEX idx_cartable_dept_status ON cartable_requests (referred_department, status, created_at);`); } catch {}

    // 3. Courses Domain Enhancements: sessions_count, waitlist_enabled + course_attendance, course_waitlist, course_certificates tables
    const courseAlters = [
      `ADD COLUMN sessions_count INT NOT NULL DEFAULT 4`,
      `ADD COLUMN waitlist_enabled TINYINT(1) NOT NULL DEFAULT 1`
    ];
    for (const clause of courseAlters) {
      try { await p.query(`ALTER TABLE courses ${clause};`); } catch {}
    }

    await p.query(`
      CREATE TABLE IF NOT EXISTS course_attendance (
        id BINARY(16) NOT NULL PRIMARY KEY,
        course_id BINARY(16) NOT NULL,
        user_id BINARY(16) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        session_number INT NOT NULL,
        session_title VARCHAR(128) NULL,
        status ENUM('present', 'absent', 'excused') NOT NULL DEFAULT 'present',
        recorded_by VARCHAR(128) NULL,
        version INT NOT NULL DEFAULT 1,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_course_user_session (course_id, user_id, session_number),
        INDEX idx_attendance_course_session (course_id, session_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS course_waitlist (
        id BINARY(16) NOT NULL PRIMARY KEY,
        course_id BINARY(16) NOT NULL,
        course_title VARCHAR(255) NOT NULL,
        user_id BINARY(16) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_phone VARCHAR(32) NOT NULL,
        status ENUM('waiting', 'notified', 'enrolled', 'cancelled') NOT NULL DEFAULT 'waiting',
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_waitlist_course_user (course_id, user_id),
        INDEX idx_waitlist_course_status (course_id, status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS course_certificates (
        id BINARY(16) NOT NULL PRIMARY KEY,
        certificate_number VARCHAR(64) NOT NULL UNIQUE,
        course_id BINARY(16) NOT NULL,
        course_title VARCHAR(255) NOT NULL,
        instructor VARCHAR(255) NOT NULL,
        hours INT NOT NULL DEFAULT 0,
        user_id BINARY(16) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_national_id VARCHAR(32) NULL,
        issued_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        version INT NOT NULL DEFAULT 1,
        UNIQUE KEY uq_cert_course_user (course_id, user_id),
        INDEX idx_cert_user (user_id, issued_at),
        INDEX idx_cert_number (certificate_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Judicial Rulings Domain Enhancements: highlights on judicial_rulings, is_featured on ruling_discussions
    try { await p.query(`ALTER TABLE judicial_rulings ADD COLUMN highlights JSON NULL;`); } catch {}
    try { await p.query(`ALTER TABLE ruling_discussions ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0;`); } catch {}
    try { await p.query(`CREATE INDEX idx_disc_ruling_featured ON ruling_discussions (ruling_id, is_featured, created_at);`); } catch {}

    // 5. Counseling Domain Enhancements: schedule_slots on consultants, hide_identity on counseling_requests, counseling_session_dossiers table
    try { await p.query(`ALTER TABLE consultants ADD COLUMN schedule_slots JSON NULL;`); } catch {}
    try { await p.query(`ALTER TABLE counseling_requests ADD COLUMN hide_identity TINYINT(1) NOT NULL DEFAULT 0;`); } catch {}

    await p.query(`
      CREATE TABLE IF NOT EXISTS counseling_session_dossiers (
        id BINARY(16) NOT NULL PRIMARY KEY,
        request_id BINARY(16) NOT NULL,
        applicant_id BINARY(16) NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        consultant_name VARCHAR(255) NOT NULL,
        session_number INT NOT NULL DEFAULT 1,
        session_date VARCHAR(32) NOT NULL,
        summary_notes TEXT NOT NULL,
        next_steps TEXT NULL,
        hide_applicant_identity TINYINT(1) NOT NULL DEFAULT 0,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_dossier_request (request_id, session_number),
        INDEX idx_dossier_applicant (applicant_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Welfare & Cooperative Domain Enhancements: low_stock_threshold on consumables, postal_tracking_code & shipping_status on orders
    try { await p.query(`ALTER TABLE consumables ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 5;`); } catch {}
    try { await p.query(`CREATE INDEX idx_consumables_stock ON consumables (stock, category);`); } catch {}

    const orderPostalAlters = [
      `ADD COLUMN postal_tracking_code VARCHAR(64) NULL`,
      `ADD COLUMN shipping_status VARCHAR(64) NOT NULL DEFAULT 'در حال آماده‌سازی'`
    ];
    for (const clause of orderPostalAlters) {
      try { await p.query(`ALTER TABLE consumable_orders ${clause};`); } catch {}
      try { await p.query(`ALTER TABLE product_orders ${clause};`); } catch {}
    }
    try { await p.query(`CREATE INDEX idx_consumable_orders_postal ON consumable_orders (postal_tracking_code);`); } catch {}
    try { await p.query(`CREATE INDEX idx_product_orders_postal ON product_orders (postal_tracking_code);`); } catch {}

    // 7. Alumni Privacy Policy Table (alumni_privacy_settings)
    await p.query(`
      CREATE TABLE IF NOT EXISTS alumni_privacy_settings (
        section_id VARCHAR(64) NOT NULL PRIMARY KEY,
        section_title VARCHAR(128) NOT NULL,
        reveal_name_only TINYINT(1) NOT NULL DEFAULT 0,
        version INT NOT NULL DEFAULT 1,
        updated_by VARCHAR(128) NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_privacy_reveal (reveal_name_only)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const defaultPrivacySections = [
      { id: 'alumni_directory', title: 'بانک جامع دانش‌آموختگان', reveal: 0 },
      { id: 'rulings', title: 'تالار نقد و بررسی آراء قضایی', reveal: 0 },
      { id: 'courses', title: 'دوره‌ها و کارگاه‌های آموزشی', reveal: 0 },
      { id: 'synergy', title: 'دیوار هم‌افزایی و تجارب', reveal: 0 },
      { id: 'counseling', title: 'خدمات مشاوره (پنل کارشناسان)', reveal: 0 }
    ];
    for (const sec of defaultPrivacySections) {
      await p.query(
        `INSERT IGNORE INTO alumni_privacy_settings (section_id, section_title, reveal_name_only, version)
         VALUES (?, ?, ?, 1)`,
        [sec.id, sec.title, sec.reveal]
      );
    }

    // 8. 9-Role RBAC + ABAC Policies Table & Customer Item Visibility Columns
    try {
      await p.query(`ALTER TABLE users MODIFY COLUMN role VARCHAR(64) NOT NULL DEFAULT 'alumni';`);
    } catch {}

    await p.query(`
      CREATE TABLE IF NOT EXISTS role_access_policies (
        role_id VARCHAR(64) NOT NULL PRIMARY KEY,
        role_title VARCHAR(128) NOT NULL,
        section_permissions JSON NOT NULL,
        sub_section_permissions JSON NULL,
        is_read_only TINYINT(1) NOT NULL DEFAULT 0,
        version INT NOT NULL DEFAULT 1,
        updated_by VARCHAR(128) NULL,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_role_policies_updated (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try { await p.query(`ALTER TABLE courses ADD COLUMN visible_to_customer TINYINT(1) NOT NULL DEFAULT 1;`); } catch {}
    try { await p.query(`ALTER TABLE products ADD COLUMN visible_to_customer TINYINT(1) NOT NULL DEFAULT 1;`); } catch {}
    try { await p.query(`ALTER TABLE products ADD COLUMN stock INT NOT NULL DEFAULT 20;`); } catch {}
    try { await p.query(`ALTER TABLE consumables ADD COLUMN visible_to_customer TINYINT(1) NOT NULL DEFAULT 1;`); } catch {}

    try { await p.query(`CREATE INDEX idx_courses_cust_vis ON courses (visible_to_customer, is_deleted);`); } catch {}
    try { await p.query(`CREATE INDEX idx_products_cust_vis ON products (visible_to_customer, is_deleted);`); } catch {}
    try { await p.query(`CREATE INDEX idx_products_stock ON products (stock, is_available);`); } catch {}
    try { await p.query(`CREATE INDEX idx_consumables_cust_vis ON consumables (visible_to_customer, category);`); } catch {}

    domainTablesInitialized = true;
    logger.info('All domain-specific tables and composite indexes verified and initialized in MySQL.');
  } catch (err: any) {
    logger.warn(`Domain tables setup warning: ${err?.message || err}`);
  }
}

