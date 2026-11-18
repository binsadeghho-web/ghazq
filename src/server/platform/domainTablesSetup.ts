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
      `ADD COLUMN deleted_at DATETIME(3) NULL`,
      `ADD COLUMN deleted_by VARCHAR(255) NULL`
    ];
    for (const clause of courseAlters) {
      try { await p.query(`ALTER TABLE courses ${clause};`); } catch {}
    }

    const enrollmentAlters = [
      `ADD COLUMN payment_plan_type ENUM('full', 'installment') NOT NULL DEFAULT 'full'`,
      `ADD COLUMN discount_code VARCHAR(64) NULL`,
      `ADD COLUMN discount_amount BIGINT NOT NULL DEFAULT 0`,
      `ADD COLUMN original_amount BIGINT NOT NULL DEFAULT 0`,
      `ADD COLUMN final_total_amount BIGINT NOT NULL DEFAULT 0`,
      `ADD COLUMN receipt_bank_name VARCHAR(128) NULL`,
      `ADD COLUMN receipt_date VARCHAR(64) NULL`,
      `ADD COLUMN reviewed_by VARCHAR(255) NULL`,
      `ADD COLUMN reviewed_at DATETIME(3) NULL`
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
        deleted_at DATETIME(3) NULL,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_disc_active_del (deleted_at, is_active, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

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

    const productOrderAlters = [
      `ADD COLUMN product_format VARCHAR(32) NOT NULL DEFAULT 'book'`,
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

    domainTablesInitialized = true;
    logger.info('All domain-specific tables and composite indexes verified and initialized in MySQL.');
  } catch (err: any) {
    logger.warn(`Domain tables setup warning: ${err?.message || err}`);
  }
}

