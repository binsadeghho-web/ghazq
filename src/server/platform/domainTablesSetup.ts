import { getPool, isDatabaseConnected } from './mysqlDatabase';
import { logger } from './logger';
import { generateUUIDv7, toIdBuffer } from './uuidv7';
import bcrypt from 'bcryptjs';

let domainTablesInitialized = false;
let setupPromise: Promise<void> | null = null;

/**
 * Ensures all domain-specific tables, columns, and composite indexes exist in MySQL 8.
 * Strictly separates each software section into its own dedicated database table with optimized indexes.
 */
export async function ensureDomainTablesAndIndexes(): Promise<void> {
  if (domainTablesInitialized || !isDatabaseConnected()) return;
  if (setupPromise) return setupPromise;
  setupPromise = runDomainTablesSetup().finally(() => {
    setupPromise = null;
  });
  return setupPromise;
}

async function runDomainTablesSetup(): Promise<void> {
  if (domainTablesInitialized || !isDatabaseConnected()) return;
  const p = getPool();

  try {
    // Fast-path: check if the newest tables and columns already exist in this schema (~150ms vs ~25s of sequential DDL)
    try {
      const [schemaCheck]: any = await p.query(
        `SELECT
           (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (
             'welfare_fund_memberships', 'welfare_fund_payments', 'welfare_installment_partners', 'welfare_installment_requests',
             'counseling_workshop_registrations', 'dashboard_banners', 'dashboard_events', 'alumni_privacy_settings', 'research_messages',
             'ops_error_logs', 'ops_security_alerts', 'ops_blocked_ips', 'audit_logs'
           )) AS tbl_cnt,
           (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'consumables' AND column_name = 'allowed_delivery_methods') AS col1,
           (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'consumable_orders' AND column_name = 'delivery_method') AS col2,
           (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'welfare_requests' AND column_name = 'metadata') AS col3,
           (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'research_mentorships' AND column_name = 'attachments') AS col4,
           (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'counseling_requests' AND column_name = 'attachments') AS col5,
           (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'welfare_installment_requests' AND column_name = 'attachments') AS col6`
      );
      const row = schemaCheck?.[0];
      if (
        row &&
        Number(row.tbl_cnt) >= 13 &&
        Number(row.col1) >= 1 &&
        Number(row.col2) >= 1 &&
        Number(row.col3) >= 1 &&
        Number(row.col4) >= 1 &&
        Number(row.col5) >= 1 &&
        Number(row.col6) >= 1
      ) {
        const [pCnt]: any = await p.query(`SELECT COUNT(*) AS cnt FROM welfare_installment_partners`);
        if (pCnt && Number(pCnt[0]?.cnt || 0) > 0) {
          domainTablesInitialized = true;
          return;
        }
      }
    } catch {
      // Proceed to full DDL setup if fast-check fails
    }

    // 0. Critical Auth & Identity Columns First (users.center_code, auth_rate_limits, user_sessions)
    try { await p.query(`ALTER TABLE users ADD COLUMN center_code VARCHAR(64) NULL UNIQUE;`); } catch {}
    await p.query(`
      CREATE TABLE IF NOT EXISTS auth_rate_limits (
        limit_key VARCHAR(160) PRIMARY KEY,
        hits INT NOT NULL DEFAULT 1,
        reset_at BIGINT NOT NULL,
        INDEX idx_rate_reset (reset_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    const sessionAlters = [
      `ADD COLUMN device_name VARCHAR(100) NULL`,
      `ADD COLUMN last_active_at DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3)`,
      `MODIFY COLUMN refresh_token_hash CHAR(64) NULL`,
      `MODIFY COLUMN expires_at DATETIME(3) NULL`,
    ];
    for (const clause of sessionAlters) {
      try { await p.query(`ALTER TABLE user_sessions ${clause};`); } catch {}
    }

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

    // 2. Cartable Domain Enhancements: dynamic category, assigned_official_role, attachments, referred_department, internal_referral_note, sla_deadline_hours
    try { await p.query(`ALTER TABLE cartable_requests MODIFY COLUMN category VARCHAR(64) NOT NULL DEFAULT 'general';`); } catch {}
    const cartableAlters = [
      `ADD COLUMN attachments JSON NULL`,
      `ADD COLUMN referred_department VARCHAR(128) NULL`,
      `ADD COLUMN assigned_official_role VARCHAR(64) NULL`,
      `ADD COLUMN internal_referral_note TEXT NULL`,
      `ADD COLUMN sla_deadline_hours INT NOT NULL DEFAULT 48`
    ];
    for (const clause of cartableAlters) {
      try { await p.query(`ALTER TABLE cartable_requests ${clause};`); } catch {}
    }
    try { await p.query(`ALTER TABLE cartable_messages ADD COLUMN attachments JSON NULL;`); } catch {}
    try { await p.query(`CREATE INDEX idx_cartable_dept_status ON cartable_requests (referred_department, status, created_at);`); } catch {}
    try { await p.query(`CREATE INDEX idx_cartable_assigned_role ON cartable_requests (assigned_official_role, status, created_at);`); } catch {}

    // 3. Courses Domain Enhancements (Reforms 39-45 + Multi-type Discounts + Per-course Certificates)
    const courseAlters = [
      `ADD COLUMN sessions_count INT NOT NULL DEFAULT 4`,
      `ADD COLUMN waitlist_enabled TINYINT(1) NOT NULL DEFAULT 1`,
      `ADD COLUMN instructor_title VARCHAR(255) NULL`,
      `ADD COLUMN instructor_resume TEXT NULL`,
      `ADD COLUMN instructor_avatar_url VARCHAR(512) NULL`,
      `ADD COLUMN category VARCHAR(128) NULL`,
      `ADD COLUMN level VARCHAR(128) NULL`,
      `ADD COLUMN hours INT NOT NULL DEFAULT 0`,
      `ADD COLUMN start_date VARCHAR(64) NULL`,
      `ADD COLUMN holding_time VARCHAR(128) NULL`,
      `ADD COLUMN schedule VARCHAR(255) NULL`,
      `ADD COLUMN end_date VARCHAR(64) NULL`,
      `ADD COLUMN holding_format ENUM('online', 'in_person', 'hybrid') NOT NULL DEFAULT 'online'`,
      `ADD COLUMN venue_address VARCHAR(512) NULL`,
      `ADD COLUMN meeting_link VARCHAR(512) NULL`,
      `ADD COLUMN meeting_access_guide TEXT NULL`,
      `ADD COLUMN cover_image VARCHAR(512) NULL`,
      `ADD COLUMN allowed_payment_method VARCHAR(32) NOT NULL DEFAULT 'both'`,
      `ADD COLUMN archive_access VARCHAR(32) NOT NULL DEFAULT 'enrolled_only'`,
      `ADD COLUMN archive_resources JSON NULL`,
      `ADD COLUMN prerequisites TEXT NULL`,
      `ADD COLUMN necessity TEXT NULL`,
      `ADD COLUMN description TEXT NULL`,
      `ADD COLUMN manager_notes TEXT NULL`,
      `ADD COLUMN target_audiences JSON NULL`,
      `ADD COLUMN custom_tags JSON NULL`,
      `ADD COLUMN custom_fields JSON NULL`,
      `ADD COLUMN hidden_fields JSON NULL`,
      `ADD COLUMN has_installments TINYINT(1) NOT NULL DEFAULT 0`,
      `ADD COLUMN installment_details VARCHAR(512) NULL`,
      `ADD COLUMN installment_plan JSON NULL`,
      `ADD COLUMN has_certificate TINYINT(1) NOT NULL DEFAULT 1`,
      `ADD COLUMN certificate_details VARCHAR(512) NULL`,
      `ADD COLUMN post_enrollment_banner VARCHAR(512) NULL`,
      `ADD COLUMN post_enrollment_message TEXT NULL`,
      `ADD COLUMN welcome_box_font_size VARCHAR(16) NULL`,
      `ADD COLUMN welcome_box_bg_color VARCHAR(16) NULL`,
      `ADD COLUMN reminder_date VARCHAR(64) NULL`,
      `ADD COLUMN reminder_schedule VARCHAR(255) NULL`,
      `ADD COLUMN offline_download_url VARCHAR(512) NULL`,
      `ADD COLUMN offline_download_guide TEXT NULL`,
      `ADD COLUMN offline_download_files JSON NULL`,
      `ADD COLUMN instructors JSON NULL`,
      `ADD COLUMN sessions JSON NULL`,
      `ADD COLUMN course_scope ENUM('specialized', 'counseling_workshop') NOT NULL DEFAULT 'specialized'`,
      `ADD COLUMN deleted_at DATETIME(3) NULL`,
      `ADD COLUMN deleted_by VARCHAR(255) NULL`
    ];
    for (const clause of courseAlters) {
      try { await p.query(`ALTER TABLE courses ${clause};`); } catch {}
    }
    try { await p.query(`CREATE INDEX idx_courses_scope_deleted ON courses (course_scope, deleted_at, created_at);`); } catch {}

    const enrollmentAlters = [
      `ADD COLUMN payment_plan_type ENUM('full', 'installment') NOT NULL DEFAULT 'full'`,
      `ADD COLUMN discount_code VARCHAR(64) NULL`,
      `ADD COLUMN discount_amount BIGINT NOT NULL DEFAULT 0`,
      `ADD COLUMN original_amount BIGINT NOT NULL DEFAULT 0`,
      `ADD COLUMN final_total_amount BIGINT NOT NULL DEFAULT 0`,
      `ADD COLUMN receipt_bank_name VARCHAR(128) NULL`,
      `ADD COLUMN receipt_date VARCHAR(64) NULL`,
      `ADD COLUMN reviewed_by VARCHAR(255) NULL`,
      `ADD COLUMN reviewed_at DATETIME(3) NULL`,
      `ADD COLUMN class_status VARCHAR(32) NOT NULL DEFAULT 'active'`,
      `ADD COLUMN removed_at DATETIME(3) NULL`,
      `ADD COLUMN removed_by VARCHAR(128) NULL`,
      `ADD COLUMN removal_reason VARCHAR(512) NULL`
    ];
    for (const clause of enrollmentAlters) {
      try { await p.query(`ALTER TABLE course_enrollments ${clause};`); } catch {}
    }

    await p.query(`
      CREATE TABLE IF NOT EXISTS course_attendance (
        id BINARY(16) NOT NULL PRIMARY KEY,
        course_id BINARY(16) NOT NULL,
        user_id BINARY(16) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        session_number INT NOT NULL,
        session_title VARCHAR(128) NULL,
        status ENUM('present', 'absent', 'excused', 'late') NOT NULL DEFAULT 'present',
        note VARCHAR(512) NULL,
        session_id VARCHAR(64) NULL,
        recorded_by VARCHAR(128) NULL,
        version INT NOT NULL DEFAULT 1,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_course_user_session (course_id, user_id, session_number),
        INDEX idx_attendance_course_session (course_id, session_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    try { await p.query(`ALTER TABLE course_attendance MODIFY COLUMN status ENUM('present', 'absent', 'excused', 'late') NOT NULL DEFAULT 'present';`); } catch {}
    try { await p.query(`ALTER TABLE course_attendance ADD COLUMN note VARCHAR(512) NULL;`); } catch {}
    try { await p.query(`ALTER TABLE course_attendance ADD COLUMN session_id VARCHAR(64) NULL;`); } catch {}

    await p.query(`
      CREATE TABLE IF NOT EXISTS course_instructors (
        id BINARY(16) NOT NULL PRIMARY KEY,
        course_id BINARY(16) NOT NULL,
        instructor_key VARCHAR(64) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        full_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NULL,
        role_label VARCHAR(128) NULL,
        avatar_url VARCHAR(512) NULL,
        resume TEXT NULL,
        is_primary TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_course_instructors_course (course_id, sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS course_sessions (
        id BINARY(16) NOT NULL PRIMARY KEY,
        course_id BINARY(16) NOT NULL,
        session_key VARCHAR(64) NOT NULL,
        session_number INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        presenter_mode ENUM('course_instructor', 'custom_presenter', 'unspecified', 'panel') NOT NULL DEFAULT 'course_instructor',
        presenter_instructor_key VARCHAR(64) NULL,
        presenter_name VARCHAR(255) NULL,
        presenter_title VARCHAR(255) NULL,
        session_date VARCHAR(128) NULL,
        start_time VARCHAR(128) NULL,
        duration_minutes INT NULL,
        holding_type VARCHAR(32) NULL,
        meeting_link VARCHAR(512) NULL,
        description TEXT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_course_session_num (course_id, session_number),
        INDEX idx_course_sessions_course (course_id, session_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS course_files (
        id BINARY(16) NOT NULL PRIMARY KEY,
        course_id BINARY(16) NOT NULL,
        file_key VARCHAR(64) NOT NULL,
        session_number INT NULL,
        title VARCHAR(255) NOT NULL,
        url VARCHAR(512) NOT NULL,
        filename VARCHAR(255) NULL,
        file_size BIGINT NULL,
        size_label VARCHAR(64) NULL,
        format VARCHAR(32) NULL,
        source_type ENUM('upload', 'disk', 'external') NOT NULL DEFAULT 'upload',
        description VARCHAR(512) NULL,
        uploaded_by VARCHAR(255) NULL,
        deleted_at DATETIME(3) NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_course_files_course (course_id, deleted_at, created_at)
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
        certificate_file_url VARCHAR(512) NULL,
        certificate_file_name VARCHAR(255) NULL,
        uploaded_by_name VARCHAR(255) NULL,
        grade_text VARCHAR(255) NULL,
        issued_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        deleted_at DATETIME(3) NULL,
        version INT NOT NULL DEFAULT 1,
        UNIQUE KEY uq_cert_course_user (course_id, user_id),
        INDEX idx_cert_user (user_id, issued_at),
        INDEX idx_cert_number (certificate_number),
        INDEX idx_cert_course_del (course_id, deleted_at, issued_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const certAlters = [
      `ADD COLUMN certificate_file_url VARCHAR(512) NULL`,
      `ADD COLUMN certificate_file_name VARCHAR(255) NULL`,
      `ADD COLUMN uploaded_by_name VARCHAR(255) NULL`,
      `ADD COLUMN grade_text VARCHAR(255) NULL`,
      `ADD COLUMN deleted_at DATETIME(3) NULL`
    ];
    for (const clause of certAlters) {
      try { await p.query(`ALTER TABLE course_certificates ${clause};`); } catch {}
    }

    await p.query(`
      CREATE TABLE IF NOT EXISTS course_installments (
        id BINARY(16) NOT NULL PRIMARY KEY,
        enrollment_id BINARY(16) NOT NULL,
        course_id BINARY(16) NOT NULL,
        course_title VARCHAR(255) NOT NULL,
        user_id BINARY(16) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_phone VARCHAR(32) NULL,
        user_national_id VARCHAR(32) NULL,
        installment_number INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount BIGINT NOT NULL DEFAULT 0,
        due_date_iso VARCHAR(32) NOT NULL,
        due_date_jalali VARCHAR(32) NOT NULL,
        status ENUM('pending', 'awaiting_verification', 'paid', 'rejected', 'overdue') NOT NULL DEFAULT 'pending',
        payment_method ENUM('online_gateway', 'bank_receipt') NULL,
        tracking_code VARCHAR(128) NULL,
        receipt_file_url VARCHAR(512) NULL,
        receipt_bank_name VARCHAR(128) NULL,
        receipt_date VARCHAR(64) NULL,
        paid_at DATETIME(3) NULL,
        reviewed_by VARCHAR(255) NULL,
        reviewed_at DATETIME(3) NULL,
        admin_note TEXT NULL,
        deleted_at DATETIME(3) NULL,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_enr_inst_num (enrollment_id, installment_number),
        INDEX idx_inst_user_status_due (user_id, deleted_at, status, due_date_iso),
        INDEX idx_inst_course_status (course_id, deleted_at, status, due_date_iso),
        INDEX idx_inst_enrollment (enrollment_id, installment_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS course_discount_codes (
        id BINARY(16) NOT NULL PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        discount_category ENUM('percentage', 'fixed_amount', 'single_course', 'multi_course', 'all_courses', 'audience_specific', 'user_specific', 'early_bird') NOT NULL DEFAULT 'percentage',
        value_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
        discount_value BIGINT NOT NULL DEFAULT 0,
        max_discount_amount BIGINT NULL,
        min_purchase_amount BIGINT NOT NULL DEFAULT 0,
        course_id BINARY(16) NULL,
        course_ids JSON NULL,
        target_audiences JSON NULL,
        allowed_national_ids JSON NULL,
        max_uses INT NULL,
        per_user_limit INT NOT NULL DEFAULT 1,
        used_count INT NOT NULL DEFAULT 0,
        starts_at DATETIME(3) NULL,
        expires_at DATETIME(3) NULL,
        starts_at_jalali VARCHAR(32) NULL,
        expires_at_jalali VARCHAR(32) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_by_name VARCHAR(255) NULL,
        scope ENUM('specialized', 'counseling_workshop') NOT NULL DEFAULT 'specialized',
        deleted_at DATETIME(3) NULL,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_disc_active_del (deleted_at, is_active, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    try { await p.query(`ALTER TABLE course_discount_codes ADD COLUMN scope ENUM('specialized', 'counseling_workshop') NOT NULL DEFAULT 'specialized';`); } catch {}
    try { await p.query(`CREATE INDEX idx_cdiscounts_scope_del ON course_discount_codes (scope, deleted_at, is_active);`); } catch {}

    await p.query(`
      CREATE TABLE IF NOT EXISTS course_discount_usages (
        id BINARY(16) NOT NULL PRIMARY KEY,
        discount_id BINARY(16) NOT NULL,
        code VARCHAR(64) NOT NULL,
        course_id BINARY(16) NOT NULL,
        course_title VARCHAR(255) NOT NULL,
        enrollment_id BINARY(16) NULL,
        user_id BINARY(16) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_national_id VARCHAR(32) NULL,
        user_phone VARCHAR(32) NULL,
        original_amount BIGINT NOT NULL DEFAULT 0,
        discount_amount BIGINT NOT NULL DEFAULT 0,
        final_amount BIGINT NOT NULL DEFAULT 0,
        used_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_disc_usage_code (discount_id, used_at),
        INDEX idx_disc_usage_user (user_id, discount_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Judicial Rulings Domain Enhancements (Reforms 11–22): keywords, attachments, admin_tags, public_labels,
    // is_system_pick, is_visible_to_alumni, comments_enabled, display_order, dislikes, review audit, soft-delete discussions
    const rulingAlters = [
      `ADD COLUMN liked_by JSON NULL`,
      `ADD COLUMN highlights JSON NULL`,
      `ADD COLUMN keywords JSON NULL`,
      `ADD COLUMN attachments JSON NULL`,
      `ADD COLUMN admin_tags JSON NULL`,
      `ADD COLUMN public_labels JSON NULL`,
      `ADD COLUMN is_system_pick TINYINT(1) NOT NULL DEFAULT 0`,
      `ADD COLUMN is_visible_to_alumni TINYINT(1) NOT NULL DEFAULT 1`,
      `ADD COLUMN comments_enabled TINYINT(1) NOT NULL DEFAULT 1`,
      `ADD COLUMN display_order INT NOT NULL DEFAULT 0`,
      `ADD COLUMN dislikes_count INT NOT NULL DEFAULT 0`,
      `ADD COLUMN disliked_by JSON NULL`,
      `ADD COLUMN internal_review_note TEXT NULL`,
      `ADD COLUMN reviewed_at DATETIME(3) NULL`,
      `ADD COLUMN reviewed_by_name VARCHAR(255) NULL`,
      `ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ];
    for (const clause of rulingAlters) {
      try { await p.query(`ALTER TABLE judicial_rulings ${clause};`); } catch {}
    }
    // Note: Keep legacy approved ('selected') rows visible unless explicitly toggled; newly submitted pending rulings default to hidden
    try { await p.query(`ALTER TABLE judicial_rulings MODIFY COLUMN is_visible_to_alumni TINYINT(1) NOT NULL DEFAULT 0;`); } catch {}
    try { await p.query(`ALTER TABLE judicial_rulings MODIFY COLUMN status ENUM('pending_review', 'selected') NOT NULL DEFAULT 'pending_review';`); } catch {}
    try { await p.query(`CREATE INDEX idx_rulings_vis_status_order ON judicial_rulings (is_visible_to_alumni, status, display_order, created_at);`); } catch {}
    try { await p.query(`CREATE INDEX idx_rulings_pick ON judicial_rulings (is_system_pick, is_visible_to_alumni);`); } catch {}

    const discAlters = [
      `ADD COLUMN author_id BINARY(16) NULL`,
      `ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0`,
      `ADD COLUMN edited_at DATETIME(3) NULL`,
      `ADD COLUMN deleted_at DATETIME(3) NULL`
    ];
    for (const clause of discAlters) {
      try { await p.query(`ALTER TABLE ruling_discussions ${clause};`); } catch {}
    }
    try { await p.query(`CREATE INDEX idx_disc_ruling_featured ON ruling_discussions (ruling_id, is_featured, created_at);`); } catch {}
    try { await p.query(`CREATE INDEX idx_disc_ruling_del_created ON ruling_discussions (ruling_id, deleted_at, created_at);`); } catch {}

    // 5. Counseling Domain Enhancements (Reforms 45-54 + زمینه‌های مشاوره + تست‌های روان‌شناسی + نرخ‌نامه)
    try { await p.query(`ALTER TABLE consultants ADD COLUMN schedule_slots JSON NULL;`); } catch {}
    const consultantAlters = [
      `ADD COLUMN academic_rank VARCHAR(255) NULL`,
      `ADD COLUMN resume_details JSON NULL`,
      `ADD COLUMN specialties JSON NULL`,
      `ADD COLUMN fee BIGINT NOT NULL DEFAULT 0`,
      `ADD COLUMN subsidy_notice VARCHAR(512) NULL`,
      `ADD COLUMN counseling_type ENUM('general', 'specialized_career') NOT NULL DEFAULT 'general'`,
      `ADD COLUMN deleted_at DATETIME(3) NULL DEFAULT NULL`,
      `ADD COLUMN version INT NOT NULL DEFAULT 1`,
    ];
    for (const clause of consultantAlters) {
      try { await p.query(`ALTER TABLE consultants ${clause};`); } catch {}
    }
    try { await p.query(`CREATE INDEX idx_consultants_type_active_del ON consultants (deleted_at, is_active, counseling_type, name);`); } catch {}

    const counselingReqAlters = [
      `ADD COLUMN hide_identity TINYINT(1) NOT NULL DEFAULT 0`,
      `ADD COLUMN counseling_type ENUM('general', 'specialized_career') NOT NULL DEFAULT 'general'`,
      `ADD COLUMN selected_field_id VARCHAR(64) NULL`,
      `ADD COLUMN selected_field_title VARCHAR(255) NULL`,
      `ADD COLUMN form_responses JSON NULL`,
      `ADD COLUMN preferred_consultant_id BINARY(16) NULL`,
      `ADD COLUMN preferred_consultant_name VARCHAR(255) NULL`,
      `ADD COLUMN user_phone VARCHAR(32) NULL`,
      `ADD COLUMN user_national_id VARCHAR(32) NULL`,
      `ADD COLUMN user_role_title VARCHAR(128) NULL`,
      `ADD COLUMN venue_details VARCHAR(512) NULL`,
      `ADD COLUMN fee BIGINT NOT NULL DEFAULT 0`,
      `ADD COLUMN subsidy_notice VARCHAR(512) NULL`,
      `ADD COLUMN payment_status VARCHAR(32) NULL DEFAULT 'free'`,
      `ADD COLUMN reviewed_by VARCHAR(128) NULL`,
      `ADD COLUMN reviewed_at DATETIME(3) NULL`,
      `ADD COLUMN deleted_at DATETIME(3) NULL DEFAULT NULL`,
      `ADD COLUMN version INT NOT NULL DEFAULT 1`,
      `ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`,
    ];
    for (const clause of counselingReqAlters) {
      try { await p.query(`ALTER TABLE counseling_requests ${clause};`); } catch {}
    }
    try { await p.query(`ALTER TABLE counseling_requests MODIFY COLUMN category VARCHAR(64) NOT NULL DEFAULT 'individual';`); } catch {}
    try { await p.query(`ALTER TABLE counseling_requests MODIFY COLUMN category_title VARCHAR(255) NOT NULL DEFAULT 'مشاوره';`); } catch {}
    try { await p.query(`ALTER TABLE counseling_requests MODIFY COLUMN meeting_mode VARCHAR(64) NOT NULL DEFAULT 'حضوری';`); } catch {}
    try { await p.query(`ALTER TABLE counseling_requests MODIFY COLUMN status VARCHAR(64) NOT NULL DEFAULT 'pending';`); } catch {}
    try { await p.query(`CREATE INDEX idx_counseling_req_type_status ON counseling_requests (deleted_at, counseling_type, status, created_at);`); } catch {}
    try { await p.query(`CREATE INDEX idx_counseling_req_app_type ON counseling_requests (applicant_id, counseling_type, deleted_at, created_at);`); } catch {}

    // Counseling Fields (زمینه‌های مشاوره) - strictly separated by counseling_type
    await p.query(`
      CREATE TABLE IF NOT EXISTS counseling_fields (
        id BINARY(16) NOT NULL PRIMARY KEY,
        counseling_type ENUM('general', 'specialized_career') NOT NULL,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255) NULL,
        description TEXT NOT NULL,
        icon_name VARCHAR(64) NULL DEFAULT 'sparkles',
        accent_color VARCHAR(32) NULL DEFAULT 'emerald',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        display_order INT NOT NULL DEFAULT 1,
        deleted_at DATETIME(3) NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_cfields_type_active (deleted_at, counseling_type, is_active, display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [existingFieldsCount]: any = await p.query(`SELECT COUNT(*) as cnt FROM counseling_fields WHERE deleted_at IS NULL`);
    if (Number(existingFieldsCount?.[0]?.cnt || 0) === 0) {
      const defaultFields = [
        // Specialized Career & Academic Counseling Fields
        {
          type: 'specialized_career',
          title: 'هدایت مسیر شغلی و ارتقای حرفه‌ای قضات و وکلا',
          subtitle: 'برنامه‌ریزی شغلی، شعب تخصصی و انتقال تجربه',
          description: 'مشاوره فردی در خصوص انتخاب رسته تخصصی قضایی، مدیریت شعب پُرپرونده، مهارت‌های وکالت تخصصی و داوری تجاری.',
          icon: 'briefcase',
          accent: 'indigo',
          order: 1,
        },
        {
          type: 'specialized_career',
          title: 'مسیر علمی، پژوهشی و آمادگی مصاحبه‌های تخصصی',
          subtitle: 'دکتری، سطح ۴ حوزه و هیئت علمی',
          description: 'تدوین نقشه راه ادامه تحصیل در مقاطع تکمیلی فقه و حقوق، انتخاب گرایش پژوهشی و آمادگی ارائه علمی.',
          icon: 'graduation',
          accent: 'emerald',
          order: 2,
        },
        {
          type: 'specialized_career',
          title: 'کارآفرینی حقوقی، داوری و تأسیس دفاتر تخصصی',
          subtitle: 'ساختاردهی تیم و خدمات حقوقی نوین',
          description: 'مشاوره راه‌اندازی کلینیک‌های حقوقی، نهادهای داوری سازمانی و استفاده از ابزارهای هوشمند حقوقی.',
          icon: 'scale',
          accent: 'amber',
          order: 3,
        },
        // General Psychology Counseling Fields (6 exact categories, no descriptions)
        { type: 'general', title: 'خانواده', subtitle: '', description: '', icon: 'heart', accent: 'emerald', order: 1 },
        { type: 'general', title: 'ازدواج و زوج درمانی', subtitle: '', description: '', icon: 'sparkles', accent: 'rose', order: 2 },
        { type: 'general', title: 'کودک و نوجوان', subtitle: '', description: '', icon: 'heart', accent: 'teal', order: 3 },
        { type: 'general', title: 'تحصیلی', subtitle: '', description: '', icon: 'graduation', accent: 'indigo', order: 4 },
        { type: 'general', title: 'استعداد سنجی', subtitle: '', description: '', icon: 'compass', accent: 'amber', order: 5 },
        { type: 'general', title: 'درمانی', subtitle: '', description: '', icon: 'brain', accent: 'emerald', order: 6 },
      ];
      for (const f of defaultFields) {
        await p.query(
          `INSERT INTO counseling_fields (id, counseling_type, title, subtitle, description, icon_name, accent_color, is_active, display_order, version)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 1)`,
          [toIdBuffer(generateUUIDv7()), f.type, f.title, f.subtitle || null, f.description || '', f.icon, f.accent, f.order]
        );
      }
    } else {
      // Non-destructive one-time upgrade: if general fields are still strictly the 3 legacy starter placeholders, replace them with the 6 exact fields
      const [genRows]: any = await p.query(
        `SELECT title FROM counseling_fields WHERE counseling_type = 'general' AND deleted_at IS NULL`
      );
      const legacyStarterTitles = new Set([
        'روان‌شناسی فردی و مدیریت فرسودگی شغلی',
        'مشاوره خانواده، زوج‌درمانی و تربیت فرزند',
        'مشاوره پیش از ازدواج و شناخت شخصیت',
      ]);
      if (
        Array.isArray(genRows) &&
        genRows.length === 3 &&
        genRows.every((r: any) => legacyStarterTitles.has(String(r.title || '').trim()))
      ) {
        await p.query(
          `UPDATE counseling_fields SET deleted_at = NOW(3), is_active = 0 WHERE counseling_type = 'general' AND deleted_at IS NULL`
        );
        const sixGeneralFields = [
          { title: 'خانواده', icon: 'heart', accent: 'emerald', order: 1 },
          { title: 'ازدواج و زوج درمانی', icon: 'sparkles', accent: 'rose', order: 2 },
          { title: 'کودک و نوجوان', icon: 'heart', accent: 'teal', order: 3 },
          { title: 'تحصیلی', icon: 'graduation', accent: 'indigo', order: 4 },
          { title: 'استعداد سنجی', icon: 'compass', accent: 'amber', order: 5 },
          { title: 'درمانی', icon: 'brain', accent: 'emerald', order: 6 },
        ];
        for (const f of sixGeneralFields) {
          await p.query(
            `INSERT INTO counseling_fields (id, counseling_type, title, subtitle, description, icon_name, accent_color, is_active, display_order, version)
             VALUES (?, 'general', ?, NULL, '', ?, ?, 1, ?, 1)`,
            [toIdBuffer(generateUUIDv7()), f.title, f.icon, f.accent, f.order]
          );
        }
      }
    }

    // Ensure at least starter specialized_career & general consultants exist in MySQL
    const [specConsCnt]: any = await p.query(`SELECT COUNT(*) as cnt FROM consultants WHERE counseling_type = 'specialized_career' AND deleted_at IS NULL`);
    if (Number(specConsCnt?.[0]?.cnt || 0) === 0) {
      await p.query(
        `INSERT INTO consultants (id, name, title, specialty, academic_rank, resume_details, bio, experience_years, availability, counseling_type, is_active, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'specialized_career', 1, 1)`,
        [
          toIdBuffer(generateUUIDv7()),
          'دکتر سیدمحمدحسین طباطبایی',
          'مشاور ارشد هدایت شغلی و مسیر علمی',
          'فقه القضاء، برنامه‌ریزی دکتری و داوری تجاری',
          'دانشیار فقه و حقوق و مدیر گروه آموزشی',
          JSON.stringify(['دکتری حقوق خصوصی دانشگاه تهران', 'سطح ۴ فقه و اصول حوزه علمیه قم', '۱۶ سال سابقه راهبری شغلی و پژوهشی دانش‌آموختگان']),
          'راهبری گام‌به‌گام مسیر حرفه‌ای، انتخاب گرایش تحصیلی و ورود به عرصه‌های تخصصی حقوقی و داوری.',
          16,
          'یکشنبه‌ها و سه‌شنبه‌ها ۱۶ الی ۱۹',
        ]
      );
    }

    const [genConsCnt]: any = await p.query(`SELECT COUNT(*) as cnt FROM consultants WHERE counseling_type = 'general' AND deleted_at IS NULL`);
    if (Number(genConsCnt?.[0]?.cnt || 0) === 0) {
      await p.query(
        `INSERT INTO consultants (id, name, title, specialty, academic_rank, resume_details, bio, experience_years, availability, counseling_type, is_active, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'general', 1, 1)`,
        [
          toIdBuffer(generateUUIDv7()),
          'دکتر مریم السادات حسینی',
          'روان‌شناس بالینی و مشاور خانواده مرکز',
          'روان‌درمانی فردی، خانواده و پیش از ازدواج',
          'دکتری تخصصی روان‌شناسی بالینی (پروانه نظام روان‌شناسی)',
          JSON.stringify(['دکتری تخصصی روان‌شناسی بالینی', 'عضو سازمان نظام روان‌شناسی و مشاوره', 'مشاور تخصصی مرکز دانش‌آموختگان با رویکرد اسلامی-بالینی']),
          'ارائه جلسات مشاوره محرمانه در حوزه‌های سلامت روان، خانواده و تفسیر آزمون‌های شخصیت.',
          12,
          'شنبه‌ها و دوشنبه‌ها ۱۴ الی ۱۸',
        ]
      );
    }

    // Counseling Tariffs (نرخ‌نامه مشاوره عمومی)
    await p.query(`
      CREATE TABLE IF NOT EXISTS counseling_tariffs (
        id BINARY(16) NOT NULL PRIMARY KEY,
        service_title VARCHAR(255) NOT NULL,
        session_duration_minutes INT NOT NULL DEFAULT 45,
        meeting_mode VARCHAR(32) NOT NULL DEFAULT 'همه روش‌ها',
        standard_fee BIGINT NOT NULL DEFAULT 0,
        alumni_subsidized_fee BIGINT NOT NULL DEFAULT 0,
        notes TEXT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        display_order INT NOT NULL DEFAULT 1,
        deleted_at DATETIME(3) NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_ctariffs_active_del (deleted_at, is_active, display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [tariffsCnt]: any = await p.query(`SELECT COUNT(*) as cnt FROM counseling_tariffs WHERE deleted_at IS NULL`);
    if (Number(tariffsCnt?.[0]?.cnt || 0) === 0) {
      const defaultTariffs = [
        { title: 'جلسه مشاوره فردی و مدیریت استرس (۴۵ دقیقه)', duration: 45, mode: 'حضوری', std: 6500000, sub: 2500000, notes: 'با یارانه ۶۰ درصدی ویژه اعضای مرکز دانش‌آموختگان', order: 1 },
        { title: 'جلسه مشاوره خانواده و زوج‌درمانی (۶۰ دقیقه)', duration: 60, mode: 'همه روش‌ها', std: 8500000, sub: 3200000, notes: 'شامل ارزیابی اولیه و پیگیری تکمیلی', order: 2 },
        { title: 'جلسه مشاوره برخط تصویری امن (۴۵ دقیقه)', duration: 45, mode: 'برخط', std: 5500000, sub: 2000000, notes: 'مناسب همکاران مستقر در سایر استان‌ها', order: 3 },
      ];
      for (const t of defaultTariffs) {
        await p.query(
          `INSERT INTO counseling_tariffs (id, service_title, session_duration_minutes, meeting_mode, standard_fee, alumni_subsidized_fee, notes, is_active, display_order, version)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 1)`,
          [toIdBuffer(generateUUIDv7()), t.title, t.duration, t.mode, t.std, t.sub, t.notes, t.order]
        );
      }
    }

    // Psychological Tests, Per-User Assignments & Results (بخش تست‌های روان‌شناختی)
    await p.query(`
      CREATE TABLE IF NOT EXISTS psychological_tests (
        id BINARY(16) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(128) NOT NULL DEFAULT 'شخصیت‌شناسی',
        description TEXT NOT NULL,
        estimated_minutes INT NOT NULL DEFAULT 15,
        instructions TEXT NULL,
        questions JSON NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        deleted_at DATETIME(3) NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_ptests_active_del (deleted_at, is_active, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS psychological_test_assignments (
        id BINARY(16) NOT NULL PRIMARY KEY,
        test_id BINARY(16) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_national_id VARCHAR(32) NULL,
        assigned_by_id VARCHAR(64) NULL,
        assigned_by_name VARCHAR(255) NOT NULL,
        request_id VARCHAR(64) NULL,
        status ENUM('unlocked', 'in_progress', 'completed', 'reviewed') NOT NULL DEFAULT 'unlocked',
        admin_note TEXT NULL,
        deleted_at DATETIME(3) NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1,
        assigned_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        completed_at DATETIME(3) NULL,
        INDEX idx_ptest_assign_user (user_id, deleted_at, status, assigned_at),
        INDEX idx_ptest_assign_test (test_id, deleted_at, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS psychological_test_results (
        id BINARY(16) NOT NULL PRIMARY KEY,
        assignment_id BINARY(16) NOT NULL UNIQUE,
        test_id BINARY(16) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        answers JSON NOT NULL,
        raw_score INT NULL,
        score_summary TEXT NOT NULL,
        psychologist_notes TEXT NULL,
        reviewed_by_name VARCHAR(255) NULL,
        reviewed_at DATETIME(3) NULL,
        deleted_at DATETIME(3) NULL DEFAULT NULL,
        version INT NOT NULL DEFAULT 1,
        submitted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_ptest_res_user (user_id, deleted_at, submitted_at),
        INDEX idx_ptest_res_test (test_id, deleted_at, submitted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [testsCnt]: any = await p.query(`SELECT COUNT(*) as cnt FROM psychological_tests WHERE deleted_at IS NULL`);
    if (Number(testsCnt?.[0]?.cnt || 0) === 0) {
      await p.query(
        `INSERT INTO psychological_tests (id, title, category, description, estimated_minutes, instructions, questions, is_active, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
        [
          toIdBuffer(generateUUIDv7()),
          'آزمون ارزیابی فرسودگی شغلی و تاب‌آوری روانی',
          'سلامت شغلی',
          'سنجش میزان فشار کاری، تعادل هیجانی و نیاز به استراحت یا مداخله حمایتی برای همکاران مرکز.',
          10,
          'لطفاً بر اساس احساس خود در دو هفته اخیر، نزدیک‌ترین گزینه به وضعیت واقعی خود را انتخاب نمایید.',
          JSON.stringify([
            { id: 'q1', prompt: 'در پایان روز کاری تا چه اندازه احساس خستگی عاطفی یا کاهش انرژی دارید؟', type: 'single_choice', options: ['به ندرت', 'گاهی اوقات', 'بیشتر روزها', 'تقریباً همیشه'], required: true },
            { id: 'q2', prompt: 'کیفیت خواب شبانه و آرامش ذهنی شما در هفته گذشته چگونه بوده است؟', type: 'single_choice', options: ['بسیار مطلوب', 'نسبتاً خوب', 'نامنظم', 'مختل و نگران‌کننده'], required: true },
            { id: 'q3', prompt: 'توضیح یا دغدغه خاصی که مایلید روان‌شناس پیش از جلسه بداند بنویسید:', type: 'text', options: [], required: false },
          ]),
        ]
      );
      await p.query(
        `INSERT INTO psychological_tests (id, title, category, description, estimated_minutes, instructions, questions, is_active, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
        [
          toIdBuffer(generateUUIDv7()),
          'پرسشنامه کیفیت ارتباط خانوادگی و سبک حل تعارض',
          'خانواده و ازدواج',
          'ارزیابی الگوهای گفت‌وگو، مدیریت اختلافات و انتظارات متقابل پیش از جلسات مشاوره خانواده.',
          12,
          'به سوالات با صداقت کامل پاسخ دهید. نتایج صرفاً در پرونده محرمانه روان‌شناس مرکز قابل رویت است.',
          JSON.stringify([
            { id: 'qf1', prompt: 'هنگام بروز اختلاف نظر در خانه، واکنش غالب شما چیست؟', type: 'single_choice', options: ['گفت‌وگوی آرام و مستقیم', 'سکوت موقت برای آرام شدن', 'بحث طولانی', 'کناره‌گیری کامل'], required: true },
            { id: 'qf2', prompt: 'میزان رضایت کلی خود از زمان اختصاص‌یافته به خانواده را از ۱ تا ۵ ارزیابی کنید:', type: 'scale', options: ['۱', '۲', '۳', '۴', '۵'], required: true },
          ]),
        ]
      );
    }

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

    // Ensure users.center_code & auth_rate_limits exist and seed accounts have valid bcrypt password hashes
    try { await p.query(`ALTER TABLE users ADD COLUMN center_code VARCHAR(64) NULL UNIQUE;`); } catch {}
    await p.query(`
      CREATE TABLE IF NOT EXISTS auth_rate_limits (
        limit_key VARCHAR(160) PRIMARY KEY,
        hits INT NOT NULL DEFAULT 1,
        reset_at BIGINT NOT NULL,
        INDEX idx_rate_reset (reset_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    try {
      const [seedRows]: any = await p.query(
        `SELECT id, national_id, password_hash FROM users WHERE national_id IN ('SADEGH', 'ALI') AND deleted_at IS NULL`
      );
      for (const sr of seedRows || []) {
        const hashStr = String(sr.password_hash || '');
        if (!hashStr.startsWith('$2a$') && !hashStr.startsWith('$2b$') && !hashStr.startsWith('$2y$')) {
          const defaultPlain = sr.national_id === 'SADEGH' ? '8411' : '1040';
          const hashed = bcrypt.hashSync(defaultPlain, 10);
          await p.query(`UPDATE users SET password_hash = ? WHERE national_id = ?`, [hashed, sr.national_id]);
        }
      }
    } catch {}

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

    // 9. Books, Multimedia & Audio Store (Reforms 23-30): Dual-format pricing, delivery options, gallery, soft delete & rich orders
    const productAlters = [
      `ADD COLUMN short_description TEXT NULL`,
      `ADD COLUMN subject_index VARCHAR(128) NULL`,
      `ADD COLUMN isbn VARCHAR(64) NULL`,
      `ADD COLUMN gallery_images JSON NULL`,
      `ADD COLUMN supports_digital TINYINT(1) NOT NULL DEFAULT 1`,
      `ADD COLUMN digital_price DECIMAL(19,4) NULL`,
      `ADD COLUMN digital_format_label VARCHAR(128) NULL`,
      `ADD COLUMN supports_physical TINYINT(1) NOT NULL DEFAULT 1`,
      `ADD COLUMN physical_price DECIMAL(19,4) NULL`,
      `ADD COLUMN physical_format_label VARCHAR(128) NULL`,
      `ADD COLUMN delivery_options JSON NULL`,
      `ADD COLUMN allowed_payment_method VARCHAR(32) NOT NULL DEFAULT 'both'`,
      `ADD COLUMN download_link VARCHAR(512) NULL`,
      `ADD COLUMN shipping_mode VARCHAR(32) NOT NULL DEFAULT 'both'`,
      `ADD COLUMN shipping_cost_type VARCHAR(32) NOT NULL DEFAULT 'free'`,
      `ADD COLUMN shipping_fixed_fee DECIMAL(19,4) NOT NULL DEFAULT 0.0000`,
      `ADD COLUMN pickup_address_notice VARCHAR(512) NULL`,
      `ADD COLUMN display_order INT NOT NULL DEFAULT 0`,
      `ADD COLUMN stock INT NOT NULL DEFAULT 20`,
      `MODIFY COLUMN format VARCHAR(64) NOT NULL DEFAULT 'book'`,
      `ADD COLUMN presenters JSON NULL`,
      `ADD COLUMN media_sessions JSON NULL`,
      `ADD COLUMN show_in_showcase TINYINT(1) NOT NULL DEFAULT 1`,
      `ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0`,
      `ADD COLUMN deleted_at DATETIME(3) NULL`,
      `ADD COLUMN deleted_by VARCHAR(128) NULL`,
      `ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`,
    ];
    for (const clause of productAlters) {
      try { await p.query(`ALTER TABLE products ${clause};`); } catch {}
    }
    try { await p.query(`CREATE INDEX idx_products_del_order ON products (is_deleted, is_available, display_order);`); } catch {}
    try { await p.query(`CREATE INDEX idx_products_fmt_del ON products (format, is_deleted, display_order);`); } catch {}
    try { await p.query(`CREATE INDEX idx_products_showcase ON products (show_in_showcase, is_available, is_deleted, display_order);`); } catch {}

    const productOrderAlters = [
      `MODIFY COLUMN product_format VARCHAR(64) NOT NULL DEFAULT 'book'`,
      `ADD COLUMN product_format VARCHAR(64) NOT NULL DEFAULT 'book'`,
      `ADD COLUMN purchase_format VARCHAR(32) NOT NULL DEFAULT 'digital'`,
      `ADD COLUMN delivery_method VARCHAR(32) NOT NULL DEFAULT 'digital_instant'`,
      `ADD COLUMN base_amount DECIMAL(19,4) NOT NULL DEFAULT 0.0000`,
      `ADD COLUMN shipping_fee DECIMAL(19,4) NOT NULL DEFAULT 0.0000`,
      `ADD COLUMN payment_method VARCHAR(32) NOT NULL DEFAULT 'online_gateway'`,
      `ADD COLUMN gateway_id VARCHAR(64) NULL`,
      `ADD COLUMN gateway_name VARCHAR(128) NULL`,
      `ADD COLUMN receipt_file_url VARCHAR(512) NULL`,
      `ADD COLUMN receipt_bank_name VARCHAR(128) NULL`,
      `ADD COLUMN shipping_address TEXT NULL`,
      `ADD COLUMN shipping_notice VARCHAR(512) NULL`,
      `ADD COLUMN user_national_id VARCHAR(64) NULL`,
      `ADD COLUMN user_role_title VARCHAR(128) NULL`,
      `ADD COLUMN admin_note TEXT NULL`,
      `ADD COLUMN reviewed_by VARCHAR(128) NULL`,
      `ADD COLUMN reviewed_at DATETIME(3) NULL`,
      `ADD COLUMN deleted_at DATETIME(3) NULL`,
    ];
    for (const clause of productOrderAlters) {
      try { await p.query(`ALTER TABLE product_orders ${clause};`); } catch {}
    }
    try { await p.query(`CREATE INDEX idx_porders_user_del ON product_orders (user_id, deleted_at, ordered_at);`); } catch {}
    try { await p.query(`CREATE INDEX idx_porders_status_del ON product_orders (payment_status, deleted_at, ordered_at);`); } catch {}

    // 10. Research Mentorship & Article Guidance (Reforms 31-38): wizard fields, soft delete, two-way research_messages
    try { await p.query(`ALTER TABLE research_mentorships MODIFY COLUMN status VARCHAR(64) NOT NULL DEFAULT 'pending';`); } catch {}
    const researchAlters = [
      `ADD COLUMN research_category VARCHAR(32) NOT NULL DEFAULT 'thesis'`,
      `ADD COLUMN service_scope VARCHAR(32) NOT NULL DEFAULT 'full_pack'`,
      `ADD COLUMN selected_partial_topics JSON NULL`,
      `ADD COLUMN delivery_mode VARCHAR(32) NOT NULL DEFAULT 'in_person'`,
      `ADD COLUMN accommodation_requested TINYINT(1) NOT NULL DEFAULT 0`,
      `ADD COLUMN accommodation_city VARCHAR(64) NULL`,
      `ADD COLUMN brief_summary TEXT NULL`,
      `ADD COLUMN target_institution VARCHAR(255) NULL`,
      `ADD COLUMN admin_note TEXT NULL`,
      `ADD COLUMN reviewed_by VARCHAR(128) NULL`,
      `ADD COLUMN reviewed_at DATETIME(3) NULL`,
      `ADD COLUMN deleted_at DATETIME(3) NULL`,
      `ADD COLUMN deleted_by VARCHAR(128) NULL`,
    ];
    for (const clause of researchAlters) {
      try { await p.query(`ALTER TABLE research_mentorships ${clause};`); } catch {}
    }
    try { await p.query(`CREATE INDEX idx_research_del_status ON research_mentorships (deleted_at, status, created_at);`); } catch {}
    try { await p.query(`CREATE INDEX idx_research_app_del ON research_mentorships (applicant_id, deleted_at, created_at);`); } catch {}

    await p.query(`
      CREATE TABLE IF NOT EXISTS research_messages (
        id BINARY(16) NOT NULL PRIMARY KEY,
        request_id BINARY(16) NOT NULL,
        sender_id BINARY(16) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_role VARCHAR(64) NOT NULL DEFAULT 'alumni',
        is_official TINYINT(1) NOT NULL DEFAULT 0,
        message TEXT NOT NULL,
        deleted_at DATETIME(3) NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_res_msg_req_created (request_id, deleted_at, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. External Psychological Test Links (Reform 67) & Workshop Registrations (Reform 66)
    const pTestAssignmentAlters = [
      `MODIFY COLUMN test_id BINARY(16) NULL`,
      `ADD COLUMN external_test_url VARCHAR(1024) NULL`,
      `ADD COLUMN external_test_title VARCHAR(255) NULL`,
      `ADD COLUMN is_visible_to_user TINYINT(1) NOT NULL DEFAULT 1`,
    ];
    for (const clause of pTestAssignmentAlters) {
      try { await p.query(`ALTER TABLE psychological_test_assignments ${clause};`); } catch {}
    }

    await p.query(`
      CREATE TABLE IF NOT EXISTS counseling_workshop_registrations (
        id BINARY(16) NOT NULL PRIMARY KEY,
        workshop_id VARCHAR(96) NOT NULL,
        workshop_title VARCHAR(255) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_phone VARCHAR(32) NULL,
        notes TEXT NULL,
        deleted_at DATETIME(3) NULL DEFAULT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_workshop_user (workshop_id, user_id),
        INDEX idx_cws_reg_ws (workshop_id, deleted_at, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 12. 5-Module Welfare & Facilities Suite Enhancements & Tables
    await p.query(`
      CREATE TABLE IF NOT EXISTS welfare_requests (
        id BINARY(16) NOT NULL PRIMARY KEY,
        type VARCHAR(64) NOT NULL DEFAULT 'loan',
        type_title VARCHAR(128) NOT NULL DEFAULT 'تسهیلات',
        applicant_id BINARY(16) NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        requested_value VARCHAR(255) NOT NULL,
        description TEXT NULL,
        rules_acknowledged TINYINT(1) NOT NULL DEFAULT 1,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        admin_note TEXT NULL,
        metadata JSON NULL,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_welfare_req_app (applicant_id, created_at),
        INDEX idx_welfare_req_type_status (type, status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS consumables (
        id BINARY(16) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        price DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
        market_price DECIMAL(19,4) NULL,
        unit VARCHAR(64) NOT NULL DEFAULT 'عدد',
        stock INT NOT NULL DEFAULT 0,
        low_stock_threshold INT NOT NULL DEFAULT 5,
        category VARCHAR(128) NOT NULL DEFAULT 'عمومی',
        image_url VARCHAR(512) NULL,
        description TEXT NULL,
        visible_to_customer TINYINT(1) NOT NULL DEFAULT 1,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        show_as_sold_out_in_showcase TINYINT(1) NOT NULL DEFAULT 0,
        allowed_delivery_methods JSON NULL,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const consumableAlters2 = [
      `ADD COLUMN market_price DECIMAL(19,4) NULL`,
      `ADD COLUMN unit VARCHAR(64) NOT NULL DEFAULT 'عدد'`,
      `ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1`,
      `ADD COLUMN show_as_sold_out_in_showcase TINYINT(1) NOT NULL DEFAULT 0`,
      `ADD COLUMN allowed_delivery_methods JSON NULL`,
    ];
    for (const clause of consumableAlters2) {
      try { await p.query(`ALTER TABLE consumables ${clause};`); } catch {}
    }
    try { await p.query(`ALTER TABLE consumable_orders ADD COLUMN delivery_method VARCHAR(32) NOT NULL DEFAULT 'post';`); } catch {}
    const welfareReqAlters = [
      `MODIFY COLUMN type VARCHAR(64) NOT NULL DEFAULT 'loan'`,
      `ADD COLUMN admin_note TEXT NULL`,
      `ADD COLUMN metadata JSON NULL`,
    ];
    for (const clause of welfareReqAlters) {
      try { await p.query(`ALTER TABLE welfare_requests ${clause};`); } catch {}
    }
    try { await p.query(`CREATE INDEX idx_welfare_req_type_status ON welfare_requests (type, status, created_at);`); } catch {}

    await p.query(`
      CREATE TABLE IF NOT EXISTS welfare_fund_memberships (
        id BINARY(16) NOT NULL PRIMARY KEY,
        user_id BINARY(16) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_phone VARCHAR(32) NULL,
        user_national_id VARCHAR(64) NULL,
        monthly_fee_amount BIGINT NOT NULL DEFAULT 0,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        admin_note TEXT NULL,
        reviewed_by VARCHAR(128) NULL,
        reviewed_at DATETIME(3) NULL,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        UNIQUE KEY uq_fund_member_user (user_id),
        INDEX idx_fund_member_status (status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS welfare_fund_payments (
        id BINARY(16) NOT NULL PRIMARY KEY,
        membership_id BINARY(16) NOT NULL,
        user_id BINARY(16) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        amount BIGINT NOT NULL DEFAULT 0,
        period_label VARCHAR(128) NOT NULL,
        payment_method VARCHAR(64) NOT NULL DEFAULT 'online_gateway',
        tracking_code VARCHAR(64) NOT NULL,
        receipt_url VARCHAR(512) NULL,
        status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
        admin_note TEXT NULL,
        reviewed_by VARCHAR(128) NULL,
        reviewed_at DATETIME(3) NULL,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_fund_pay_user (user_id, created_at),
        INDEX idx_fund_pay_status (status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS welfare_installment_partners (
        id BINARY(16) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tagline VARCHAR(255) NULL,
        description TEXT NULL,
        max_credit_limit BIGINT NOT NULL DEFAULT 0,
        credit_limit_display VARCHAR(128) NOT NULL,
        installment_terms TEXT NOT NULL,
        duration_months INT NOT NULL DEFAULT 12,
        logo_url VARCHAR(512) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        display_order INT NOT NULL DEFAULT 1,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_inst_partner_active (is_active, display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS welfare_installment_requests (
        id BINARY(16) NOT NULL PRIMARY KEY,
        partner_id BINARY(16) NOT NULL,
        partner_name VARCHAR(255) NOT NULL,
        applicant_id BINARY(16) NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        applicant_phone VARCHAR(32) NULL,
        requested_amount BIGINT NOT NULL DEFAULT 0,
        months INT NOT NULL DEFAULT 12,
        description TEXT NULL,
        status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
        admin_note TEXT NULL,
        reviewed_by VARCHAR(128) NULL,
        reviewed_at DATETIME(3) NULL,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_inst_req_app (applicant_id, created_at),
        INDEX idx_inst_req_status (status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [existingPartners]: any = await p.query(`SELECT COUNT(*) as cnt FROM welfare_installment_partners`);
    if (existingPartners && Number(existingPartners[0]?.cnt || 0) === 0) {
      const seedPartners = [
        {
          name: 'سرای ایرانی',
          tagline: 'فروشگاه بزرگ لوازم خانگی، فرش و کالای خواب',
          description:
            'تامین کلیه اقلام جهیزیه، لوازم خانگی برقی و صوتی تصویری، فرش و سرویس چوب با تخفیف توافقی ویژه اعضای مجتمع فقه و حقوق اسلامی.',
          maxCreditLimit: 200000000,
          creditLimitDisplay: 'تا سقف ۲۰۰,۰۰۰,۰۰۰ تومان',
          installmentTerms:
            'اقساط ۱۲ الی ۲۴ ماهه بدون پیش‌پرداخت اولیه · معرفی‌نامه رسمی مجتمع + چک صیادی یا کسر از حقوق',
          durationMonths: 24,
          displayOrder: 1,
        },
        {
          name: 'آمال',
          tagline: 'تجهیزات دیجیتال، اداری و اقلام خانگی منتخب',
          description:
            'خرید اقساطی لپ‌تاپ، تلفن همراه، تجهیزات اداری و لوازم منتخب منزل با نرخ ترجیحی کارگروه رفاه و تحویل فوری از شعب منتخب.',
          maxCreditLimit: 120000000,
          creditLimitDisplay: 'تا سقف ۱۲۰,۰۰۰,۰۰۰ تومان',
          installmentTerms:
            'اقساط ۶ الی ۱۸ ماهه با کارمزد ترجیحی تفاهم‌نامه مجتمع · صدور معرفی‌نامه الکترونیکی ظرف ۴۸ ساعت',
          durationMonths: 18,
          displayOrder: 2,
        },
      ];
      for (const sp of seedPartners) {
        await p.query(
          `INSERT INTO welfare_installment_partners (
            id, name, tagline, description, max_credit_limit, credit_limit_display, installment_terms, duration_months, is_active, display_order, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1)`,
          [
            toIdBuffer(generateUUIDv7()),
            sp.name,
            sp.tagline,
            sp.description,
            sp.maxCreditLimit,
            sp.creditLimitDisplay,
            sp.installmentTerms,
            sp.durationMonths,
            sp.displayOrder,
          ]
        );
      }
    }

    // 13. Attachments support for Research, Counseling, and Welfare Installments
    try { await p.query(`ALTER TABLE research_mentorships ADD COLUMN attachments JSON NULL;`); } catch {}
    try { await p.query(`ALTER TABLE counseling_requests ADD COLUMN attachments JSON NULL;`); } catch {}
    try { await p.query(`ALTER TABLE welfare_installment_requests ADD COLUMN attachments JSON NULL;`); } catch {}

    // 14. Persistent Audit Logs & OPS Tables (replacing RAM-only storage)
    await p.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id BINARY(16) NOT NULL PRIMARY KEY,
        timestamp DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        event_type VARCHAR(64) NOT NULL,
        actor_id VARCHAR(64) NOT NULL,
        actor_name VARCHAR(255) NOT NULL,
        actor_role VARCHAR(32) NOT NULL,
        ip VARCHAR(64) NOT NULL DEFAULT '127.0.0.1',
        details TEXT NOT NULL,
        severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
        prev_hash CHAR(64) NOT NULL,
        entry_hash CHAR(64) NOT NULL,
        sequence_num BIGINT AUTO_INCREMENT UNIQUE NOT NULL,
        INDEX idx_actor_time (actor_id, timestamp),
        INDEX idx_event_time (event_type, timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS ops_error_logs (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        level ENUM('error', 'critical', 'warning') NOT NULL DEFAULT 'error',
        source VARCHAR(128) NOT NULL,
        message TEXT NOT NULL,
        stack TEXT NULL,
        is_resolved TINYINT(1) NOT NULL DEFAULT 0,
        created_at_label VARCHAR(128) NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_ops_err_resolved (is_resolved, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS ops_security_alerts (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        type VARCHAR(64) NOT NULL,
        severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
        user_id VARCHAR(64) NULL,
        user_name VARCHAR(255) NOT NULL,
        status ENUM('unreviewed', 'reviewed', 'dismissed') NOT NULL DEFAULT 'unreviewed',
        details JSON NULL,
        is_special_monitoring TINYINT(1) NOT NULL DEFAULT 0,
        created_at_label VARCHAR(128) NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_ops_alerts_status (status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS ops_blocked_ips (
        ip VARCHAR(64) NOT NULL PRIMARY KEY,
        reason TEXT NOT NULL,
        blocked_by VARCHAR(255) NOT NULL,
        blocked_until VARCHAR(128) NOT NULL,
        created_at_label VARCHAR(128) NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    domainTablesInitialized = true;
    logger.info('All domain-specific tables and composite indexes verified and initialized in MySQL.');
  } catch (err: any) {
    logger.warn(`Domain tables setup warning: ${err?.message || err}`);
  }
}

