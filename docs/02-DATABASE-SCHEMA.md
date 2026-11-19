# ۲. مستندات پایگاه داده MySQL 8 و مهاجرت‌ها (Database Schema)

پایگاه داده سامانه **MySQL 8 (موتور InnoDB)** با کاراکترست `utf8mb4` و Collation `utf8mb4_unicode_ci` و منطقه زمانی `UTC (+00:00)` است.

---

## ۱. الگوی اتصال و قوانین کار با MySQL

پیکربندی در `src/server/platform/mysqlDatabase.ts` انجام شده است:
- متغیرهای محیطی: `DB_HOST` (یا `MYSQL_HOST`)، `DB_PORT` (یا `MYSQL_PORT`)، `DB_USER`، `DB_PASSWORD`، `DB_NAME`، `DB_CONNECTION_LIMIT` (پیش‌فرض `10`)، `DB_MAX_IDLE` (پیش‌فرض `10`).
- **`decimalNumbers: false`**: تمام ستون‌های `DECIMAL(19,4)` به‌صورت رشته خوانده می‌شوند تا در محاسبات مالی هیچ خطای ممیز شناور (Floating-point) رخ ندهد.
- **کلیدهای اصلی (`BINARY(16)`):**
  - همه شناسه‌های جدول‌ها به صورت `BINARY(16)` با الگوریتم **UUIDv7** ساخته و ذخیره می‌شوند (`toIdBuffer(id)` هنگام نوشتن و `fromIdBuffer(row.id)` هنگام خواندن).
  - در کوئری‌های `WHERE` برای سازگاری با رکوردهای قدیمی متنی، معمولاً شرط `(id = ? OR id = ?)` با `[toIdBuffer(id), id]` استفاده می‌شود.
- **حذف نرم (Soft Delete):** جداول مهم به جای `DELETE` فیزیکی دارای ستون `deleted_at DATETIME(3) NULL` هستند و کوئری‌های عادی شرط `deleted_at IS NULL` را اعمال می‌کنند.
- **قفل خوش‌بینانه (OCC):** اکثر جداول ستون `version INT NOT NULL DEFAULT 1` دارند و در هر `UPDATE` مقدار `version = version + 1` و شرط `AND version = ?` چک می‌شود.

---

## ۲. راه‌اندازی و تکامل اسکیما (دو منبع مکمل)

1. **`database/schema.sql` (اجرا توسط `npm run db:init` از طریق `scripts/initDb.ts`)**:
   - جداول هسته و زیرساختی + تریگرهای عدم تغییر و حذف جدول `audit_logs` (`trg_audit_logs_no_update`, `trg_audit_logs_no_delete`).
   - اگر هاست ابری اجازه ساخت Trigger ندهد (`SUPER` / binary logging)، اسکریپت `initDb.ts` خطا را مدیریت می‌کند و زنجیره HMAC-SHA256 به‌عنوان خط دفاعی اصلی فعال می‌ماند.
2. **`src/server/platform/domainTablesSetup.ts` (`ensureDomainTablesAndIndexes()`)**:
   - تمام جداول جدید و `ALTER TABLE`های تکمیلی (افزودن ستون‌ها و ایندکس‌های ترکیبی) را به‌صورت Idempotent تضمین می‌کند.
   - مدیران همچنین می‌توانند از بخش عملیات/تنظیمات مسیر `POST /api/admin/run-migration` را اجرا کنند.

---

## ۳. فهرست کامل جداول پایگاه داده به تفکیک دامنه

### الف) زیرساخت پلتفرم، احراز هویت و امنیت
| نام جدول | کاربرد و ستون‌های کلیدی |
| :--- | :--- |
| `schema_migrations` | ثبت نسخه‌های اسکیمای اعمال‌شده (`version`, `applied_at`, `description`). |
| `users` | اطلاعات هویتی، شغلی، علمی و حساب کاربری کاربران (`id`, `national_id`, `center_code`, `username`, `password_hash`, `role`, `is_active`, `is_locked`, `failed_attempts`, `locked_until`, `token_version`, `must_change_password`, `section_permissions`, `deleted_at`, `version`). |
| `user_sessions` | نشست‌های فعال کاربران (`id`, `user_id`, `family_id`, `device_name`, `ip_address`, `user_agent`, `is_revoked`, `last_active_at`, `expires_at`). |
| `refresh_tokens` | توکن‌های رفرش برای چرخش و تشخیص استفاده مجدد (`token_hash`, `family_id`, `parent_id`, `is_revoked`, `revocation_reason`, `expires_at`). |
| `auth_rate_limits` | محدودیت نرخ تلاش‌های ورود (`limit_key`, `hits`, `reset_at`). |
| `role_permissions` و `role_access_policies` | ماتریس دسترسی ۱۱ نقش سامانه و زیربخش‌های رفاهی (`section_permissions`, `sub_section_permissions`). |
| `system_settings` | تنظیمات JSON کلیدی سامانه (تم‌ها، کانفیگ ویترین‌ها، فرم‌ساز پژوهش، فرم‌ساز مشاوره عمومی/تخصصی، پیکربندی آراء، قوانین وام، تنظیمات کارتابل و فروشگاه و ...). |
| `alumni_privacy_settings` | تنظیمات محرمانگی و دسترسی اطلاعات دانش‌آموختگان به تفکیک بخش. |
| `idempotency_keys` | کلیدهای یکتای عملیات (`user_id`, `key`, `request_hash`, `response`, `status_code`). |
| `outbox` | صف پیام‌های رویداد دامنه (`id`, `topic`, `payload`, `created_at`, `published_at`). |
| `audit_logs` | زنجیره حسابرسی تغییرناپذیر (`sequence_num`, `event_type`, `actor_id`, `details`, `severity`, `prev_hash`, `entry_hash`). |

### ب) داشبورد و کارتابل اداری
| نام جدول | کاربرد و ستون‌های کلیدی |
| :--- | :--- |
| `dashboard_banners` | بنرهای اعلانات صفحه اول (`title`, `message`, `banner_type`, `action_tab`, `is_active`, `priority`). |
| `dashboard_events` | رویدادهای تقویم آموزشی/رفاهی داشبورد (`title`, `event_date`, `category`, `is_active`). |
| `cartable_requests` | درخواست‌های کارتابل (`tracking_number`, `category`, `applicant_id`, `priority`, `status`, `attachments`, `referred_department`, `assigned_official_role`, `sla_deadline_hours`, `version`). |
| `cartable_messages` | تاریخچه گفتگوها و پیوست‌های هر پرونده کارتابل (`request_id`, `sender_id`, `text`, `attachments`). |

### ج) دوره‌های آموزشی، اقساط، تخفیف‌ها و گواهی‌ها
| نام جدول | کاربرد و ستون‌های کلیدی |
| :--- | :--- |
| `courses` | اطلاعات کامل دوره‌ها (ظرفیت، شیوه برگزاری `online`/`in_person`/`hybrid`، پیش‌نیازها، فیلدهای سفارشی، طرح اقساط، یادآورها، فایل‌های آفلاین، `deleted_at`). |
| `course_enrollments` | ثبت‌نام کاربران، نوع پرداخت (`full`/`installment`)، کد تخفیف استفاده‌شده، مبلغ اصلی/تخفیف/نهایی و وضعیت تایید فیش. |
| `course_installments` | اقساط تک‌تک ثبت‌نام‌ها (`enrollment_id`, `installment_number`, `amount`, `due_date_iso`, `due_date_jalali`, `status`, `payment_method`, `receipt_file_url`). |
| `course_discount_codes` | انواع کدهای تخفیف (`percentage`, `fixed_amount`, `single_course`, `multi_course`, `all_courses`, `audience_specific`, `user_specific`, `early_bird`)، سقف و بازه زمانی و محدودیت کدملی. |
| `course_discount_usages` | لاگ دقیق استفاده‌کنندگان از کدهای تخفیف برای ممیزی مدیر (`discount_id`, `course_id`, `user_id`, `original_amount`, `discount_amount`, `final_amount`). |
| `course_attendance` | حضور و غیاب جلسه‌ای (`course_id`, `user_id`, `session_number`, `status`: `present`/`absent`/`excused`). |
| `course_waitlist` | صف انتظار دوره‌های تکمیل‌ظرفیت (`course_id`, `user_id`, `status`). |
| `course_certificates` | گواهی‌های صادرشده و فایل بارگذاری‌شده در پوشه مجزای هر دوره (`certificate_number`, `course_id`, `user_id`, `certificate_file_url`, `grade_text`). |

### د) فروشگاه آثار و خدمات رفاهی
| نام جدول | کاربرد و ستون‌های کلیدی |
| :--- | :--- |
| `products` | آثار علمی، کتاب‌ها و بسته‌های آموزشی فروشگاه (`title`, `price`, `stock`, `category`, `attachments`, `display_order`). |
| `product_orders` | سفارش‌های خرید و تصویر فیش واریزی (`product_id`, `user_id`, `quantity`, `total_price`, `status`, `receipt_file_url`). |
| `welfare_requests` | درخواست‌های وام قرض‌الحسنه و اسکان زیارتی (`type`, `applicant_id`, `amount`, `status`, `tracking_code`). |
| `consumables` | کالاهای تعاونی مصرف (`title`, `price`, `stock`, `quota_per_user`). |
| `consumable_orders` | سفارش‌های تعاونی و کد رهگیری مرسوله پستی (`postal_tracking_code`, `postal_carrier`). |
| `product_proposals` | پیشنهادات محصول یا بسته جدید از سوی اعضا. |

### هـ) مشاوره عمومی (روان‌شناسان) و مشاوره تخصصی (شغلی/تحصیلی)
> **نکته:** تنظیمات پرتال و ساختار فرم‌ساز پویا (`wizardSteps`) برای این دو بخش با کلیدهای مجزا (`general_counseling_portal_config` و `specialized_counseling_portal_config`) در جدول `system_settings` ذخیره می‌شوند.

| نام جدول | کاربرد و ستون‌های کلیدی |
| :--- | :--- |
| `consultants` | مشاوران مرکز با تفکیک `counseling_type` (`general` یا `specialized_career`)، رزومه (`resume_details`)، رتبه علمی (`academic_rank`)، بازه‌های زمانی (`schedule_slots`) و تعرفه. |
| `counseling_requests` | درخواست‌های ثبت‌شده از طریق ویزارد با تفکیک `counseling_type`، زمینه انتخابی (`selected_field_id`, `selected_field_title`)، پاسخ‌های پویا (`form_responses` JSON)، وضعیت نوبت، محرمانه‌سازی هویت (`hide_identity`) و `version`. |
| `counseling_fields` | «زمینه‌های مشاوره» قابل ویرایش توسط ادمین برای هر دو بخش به تفکیک `counseling_type`. |
| `counseling_tariffs` | نرخ‌نامه خدمات روان‌شناختی مرکز (`service_title`, `session_duration_minutes`, `meeting_mode`, `standard_fee`, `alumni_subsidized_fee`). |
| `counseling_session_dossiers` | پرونده جلسات مشاوره و یادداشت‌های پیگیری برای مشاهده سوابق مشاوره (`hide_applicant_identity`). |
| `psychological_tests` | بانک تست‌های روان‌شناختی قابل تعریف و ویرایش (`title`, `category`, `questions` JSON). |
| `psychological_test_assignments` | باز کردن تست مشخص برای دانش‌آموخته مشخص توسط روان‌شناس/ادمین (`test_id`, `user_id`, `status`: `unlocked`/`completed`/`reviewed`). |
| `psychological_test_results` | پاسخ‌ها، نمره و تحلیل روان‌شناس روی تست تکمیل‌شده (`assignment_id`, `answers` JSON, `score_summary`, `psychologist_notes`). |

### و) پژوهش، تالار آراء قضایی و دیوار هم‌افزایی
| نام جدول | کاربرد و ستون‌های کلیدی |
| :--- | :--- |
| `research_mentorships` | پرونده‌های راهبری پژوهش و مقاله (`topic`, `applicant_id`, `status`, `progress_percent`, `form_responses`, `mentor_id`). |
| `research_messages` | مکاتبات و فایل‌های میان پژوهشگر و راهبر علمی. |
| `judicial_rulings` | آراء قضایی (`case_number`, `court_branch`, `ruling_text`, `status`: `pending_review`/`selected`, `is_visible_to_alumni`, `is_system_pick`, `admin_tags`, `public_labels`, `highlights`, `likes_count`, `dislikes_count`). |
| `ruling_discussions` | نقدها و مباحثات زیر آراء (`ruling_id`, `author_id`, `text`, `is_featured`, `deleted_at`). |
| `synergy_posts` و `synergy_responses` | پست‌های دیوار هم‌افزایی و همدلی و پاسخ‌های تخصصی آن‌ها (`category`, `is_resolved`). |
| `wall_identities` و `wall_ownership` | نگهداری هویت/مالکیت پست‌های ناشناس در دیوار هم‌افزایی با رعایت محرمانگی. |
| `experiences` و `private_messages` | ثبت تجارب قضایی/پژوهشی و پیام‌رسان خصوصی هم‌افزایی. |
