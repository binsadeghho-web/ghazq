-- ============================================================================
-- اسکریپت جامع پایگاه داده سامانه فقه و قضا (نسخه ۳.۰ - معماری سازمانی)
-- Database: MySQL 8 (InnoDB) - Charset: utf8mb4 - Collation: utf8mb4_unicode_ci
-- Host: remote-pishgaman.runflare.com / ghzadatabase-xmm-service
-- Database Name: ghzadatafgd_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `ghzadatafgd_db` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `ghzadatafgd_db`;

-- تنظیمات بهینه اتصال
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- ----------------------------------------------------------------------------
-- ۰. جدول رهگیری نسخه‌های مهاجرت پایگاه داده (Schema Migrations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `version` INT NOT NULL PRIMARY KEY,
  `applied_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `description` VARCHAR(255) NOT NULL,
  `checksum` CHAR(64) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۰.۱. جدول ماتریس دسترسی‌ها و کدهای مجوز نقشی (Role Permissions - اصل ۱۲)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role` VARCHAR(32) NOT NULL,
  `permission_code` VARCHAR(64) NOT NULL,
  `description` VARCHAR(255) NULL,
  `is_granted` BOOLEAN NOT NULL DEFAULT TRUE,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`role`, `permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱. جدول تنظیمات سراسری سامانه، ظاهر و ویترین‌ها (System Settings & Showcases)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `setting_value` JSON NOT NULL,
  `description` VARCHAR(255) NULL,
  `version` INT NOT NULL DEFAULT 1,
  `last_modified_by` VARCHAR(128) NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۲. جدول کلیدهای یکتای عملیات (Idempotency Keys - اصل ۶.۱ معماری داده)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `idempotency_keys` (
  `user_id` BINARY(16) NOT NULL,
  `key` VARCHAR(64) NOT NULL,
  `request_hash` CHAR(64) NOT NULL,
  `response` JSON NULL,
  `status_code` SMALLINT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`, `key`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۳. جدول پیام‌های تراکنشی رویدادها (Transactional Outbox - اصل ۶.۲ معماری داده)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `outbox` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `topic` VARCHAR(100) NOT NULL,
  `payload` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `published_at` DATETIME(3) NULL,
  INDEX `idx_unpublished` (`published_at`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۴. دفترچه ثبت وقایع امنیتی با هش زنجیره‌ای SHA-256 (Audit Logs - اصل ۱۰ معماری داده)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `event_type` VARCHAR(64) NOT NULL,
  `actor_id` VARCHAR(64) NOT NULL,
  `actor_name` VARCHAR(255) NOT NULL,
  `actor_role` VARCHAR(32) NOT NULL,
  `ip` VARCHAR(64) NOT NULL DEFAULT '127.0.0.1',
  `details` TEXT NOT NULL,
  `severity` ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
  `prev_hash` CHAR(64) NOT NULL,
  `entry_hash` CHAR(64) NOT NULL,
  `sequence_num` BIGINT AUTO_INCREMENT UNIQUE NOT NULL,
  INDEX `idx_actor_time` (`actor_id`, `timestamp`),
  INDEX `idx_event_time` (`event_type`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۵. جدول کاربران و اعضای نخبه (Users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `national_id` VARCHAR(32) NULL UNIQUE,
  `username` VARCHAR(64) NULL UNIQUE,
  `password_hash` VARCHAR(255) NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(15) NOT NULL,
  `role` ENUM('admin', 'supervisor', 'alumni') NOT NULL DEFAULT 'alumni',
  `role_title` VARCHAR(128) NOT NULL,
  `organization` VARCHAR(255) NOT NULL,
  `graduation_year` VARCHAR(10) NOT NULL,
  `avatar_text` VARCHAR(16) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_locked` BOOLEAN NOT NULL DEFAULT FALSE,
  `failed_attempts` INT NOT NULL DEFAULT 0,
  `locked_until` DATETIME(3) NULL,
  `token_version` INT NOT NULL DEFAULT 1,
  `must_change_password` BOOLEAN NOT NULL DEFAULT FALSE,
  `has_account` BOOLEAN NOT NULL DEFAULT TRUE,
  `judicial_grade` INT NULL,
  `court_branch` VARCHAR(128) NULL,
  `province` VARCHAR(64) NULL,
  `email` VARCHAR(128) NULL,
  `employment_status` VARCHAR(64) NULL,
  `current_judicial_post` VARCHAR(128) NULL,
  `service_years` INT NULL,
  `judicial_specialty` VARCHAR(128) NULL,
  `academic_degree` VARCHAR(128) NULL,
  `residential_address` TEXT NULL,
  `permissions` JSON NULL,
  `section_permissions` JSON NULL,
  `sessions` JSON NULL,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_role_status` (`role`, `is_active`),
  INDEX `idx_province` (`province`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۵.۱. جدول نشست‌های امنیتی کاربران (User Sessions - اصل ۱۰: Refresh Token Rotation & Reuse Detection)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `user_id` BINARY(16) NOT NULL,
  `family_id` VARCHAR(64) NOT NULL,
  `refresh_token_hash` CHAR(64) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` VARCHAR(512) NOT NULL,
  `is_revoked` BOOLEAN NOT NULL DEFAULT FALSE,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_user_expires` (`user_id`, `expires_at`),
  INDEX `idx_family` (`family_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۵.۲. جدول توکن‌های رفرش (Refresh Tokens - Rotation & Reuse Detection)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `user_id` BINARY(16) NOT NULL,
  `token_hash` CHAR(64) NOT NULL UNIQUE,
  `family_id` VARCHAR(64) NOT NULL,
  `parent_id` VARCHAR(64) NULL,
  `is_revoked` BOOLEAN NOT NULL DEFAULT FALSE,
  `revocation_reason` VARCHAR(64) NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_refresh_user` (`user_id`),
  INDEX `idx_refresh_family` (`family_id`),
  INDEX `idx_refresh_hash` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۶. جدول کارتابل درخواست‌های اداری و شغلی (Cartable Requests)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cartable_requests` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `tracking_number` VARCHAR(32) NOT NULL UNIQUE,
  `category` ENUM('career', 'administrative', 'educational') NOT NULL,
  `category_title` VARCHAR(128) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `applicant_id` BINARY(16) NOT NULL,
  `applicant_name` VARCHAR(255) NOT NULL,
  `applicant_role_title` VARCHAR(128) NOT NULL,
  `priority` ENUM('normal', 'urgent', 'instant') NOT NULL DEFAULT 'normal',
  `status` ENUM('pending', 'in_progress', 'need_info', 'rejected', 'completed', 'archived') NOT NULL DEFAULT 'pending',
  `has_unread_supervisor` BOOLEAN NOT NULL DEFAULT FALSE,
  `has_unread_applicant` BOOLEAN NOT NULL DEFAULT FALSE,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_applicant_status` (`applicant_id`, `status`),
  INDEX `idx_status_created` (`status`, `created_at`),
  CONSTRAINT `fk_cartable_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۷. جدول پیام‌های درون کارتابل (Cartable Messages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cartable_messages` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `request_id` BINARY(16) NOT NULL,
  `sender_id` BINARY(16) NOT NULL,
  `sender_name` VARCHAR(255) NOT NULL,
  `sender_role` VARCHAR(32) NOT NULL,
  `text` TEXT NOT NULL,
  `attachments` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_request_created` (`request_id`, `created_at`),
  CONSTRAINT `fk_message_request` FOREIGN KEY (`request_id`) REFERENCES `cartable_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۸. جدول دوره‌های آموزشی و توانمندسازی (Courses)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `courses` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `instructor` VARCHAR(255) NOT NULL,
  `instructor_title` VARCHAR(128) NULL,
  `category` VARCHAR(128) NULL,
  `level` VARCHAR(64) NOT NULL,
  `hours` INT NOT NULL DEFAULT 0,
  `capacity` INT NOT NULL DEFAULT 50,
  `enrolled_count` INT NOT NULL DEFAULT 0,
  `schedule` VARCHAR(255) NOT NULL,
  `holding_format` ENUM('online', 'in_person', 'hybrid') NOT NULL DEFAULT 'online',
  `venue_address` TEXT NULL,
  `meeting_link` VARCHAR(255) NULL,
  `cover_image` VARCHAR(512) NULL,
  `price` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
  `has_installments` BOOLEAN NOT NULL DEFAULT FALSE,
  `has_certificate` BOOLEAN NOT NULL DEFAULT TRUE,
  `description` TEXT NOT NULL,
  `topics` JSON NULL,
  `status` ENUM('enrolling', 'ongoing', 'completed') NOT NULL DEFAULT 'enrolling',
  `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_status_del` (`status`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۹. جدول ثبت‌نام دوره‌های آموزشی (Course Enrollments)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `course_enrollments` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `course_id` BINARY(16) NOT NULL,
  `course_title` VARCHAR(255) NOT NULL,
  `user_id` BINARY(16) NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `user_national_id` VARCHAR(10) NOT NULL,
  `user_phone` VARCHAR(15) NOT NULL,
  `user_role_title` VARCHAR(128) NOT NULL,
  `payment_method` ENUM('online_gateway', 'bank_receipt') NOT NULL DEFAULT 'online_gateway',
  `payment_status` ENUM('pending_review', 'confirmed', 'rejected') NOT NULL DEFAULT 'pending_review',
  `amount_paid` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
  `tracking_code` VARCHAR(64) NOT NULL,
  `receipt_file_url` VARCHAR(512) NULL,
  `admin_note` TEXT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `enrolled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY `uq_course_user` (`course_id`, `user_id`),
  CONSTRAINT `fk_enroll_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_enroll_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱۰. جدول محصولات، کتب و انتشارات (Products)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) NULL,
  `author_or_presenter` VARCHAR(255) NOT NULL,
  `format` ENUM('book', 'multimedia', 'audio_series') NOT NULL DEFAULT 'book',
  `format_title` VARCHAR(64) NOT NULL,
  `price` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
  `description` TEXT NOT NULL,
  `pages_or_duration` VARCHAR(64) NOT NULL,
  `published_year` VARCHAR(10) NOT NULL,
  `publisher` VARCHAR(128) NULL,
  `cover_image` VARCHAR(512) NULL,
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `badge_text` VARCHAR(64) NULL,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_format_avail` (`format`, `is_available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱۱. جدول سفارشات محصولات انتشارات (Product Orders)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_orders` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `product_id` BINARY(16) NOT NULL,
  `product_title` VARCHAR(255) NOT NULL,
  `user_id` BINARY(16) NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `user_phone` VARCHAR(15) NOT NULL,
  `amount_paid` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
  `payment_status` ENUM('pending_review', 'confirmed', 'rejected') NOT NULL DEFAULT 'pending_review',
  `tracking_code` VARCHAR(64) NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `ordered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_porder_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_porder_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱۲. جدول اساتید و مشاورین (Consultants)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `consultants` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `specialty` VARCHAR(255) NOT NULL,
  `bio` TEXT NOT NULL,
  `experience_years` INT NOT NULL DEFAULT 0,
  `availability` VARCHAR(128) NOT NULL,
  `avatar_url` VARCHAR(512) NULL,
  `counseling_type` ENUM('general', 'specialized_career') NOT NULL DEFAULT 'general',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱۳. جدول درخواست‌های مشاوره (Counseling Requests)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `counseling_requests` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `applicant_id` BINARY(16) NOT NULL,
  `applicant_name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `category_title` VARCHAR(128) NOT NULL,
  `counseling_type` ENUM('general', 'specialized_career') NOT NULL DEFAULT 'general',
  `preferred_consultant_id` BINARY(16) NULL,
  `preferred_consultant_name` VARCHAR(255) NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('pending', 'scheduled', 'attended', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `meeting_mode` VARCHAR(64) NOT NULL DEFAULT 'برخط (تصویری امن)',
  `scheduled_date` VARCHAR(32) NULL,
  `scheduled_time` VARCHAR(32) NULL,
  `counselor_notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_counsel_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱۴. جدول دادنامه‌ها و تالار آراء (Judicial Rulings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `judicial_rulings` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `court_branch` VARCHAR(255) NOT NULL,
  `judge_name` VARCHAR(255) NOT NULL,
  `ruling_date` VARCHAR(32) NOT NULL,
  `case_type` ENUM('criminal', 'civil', 'commercial', 'family') NOT NULL,
  `case_type_title` VARCHAR(64) NOT NULL,
  `summary` TEXT NOT NULL,
  `legal_principles` JSON NULL,
  `full_ruling_text` MEDIUMTEXT NOT NULL,
  `status` ENUM('pending_review', 'selected') NOT NULL DEFAULT 'selected',
  `submitted_by_id` BINARY(16) NOT NULL,
  `submitted_by_name` VARCHAR(255) NOT NULL,
  `likes_count` INT NOT NULL DEFAULT 0,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱۵. جدول نظرات و نقدهای تالار آراء (Ruling Discussions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ruling_discussions` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `ruling_id` BINARY(16) NOT NULL,
  `author_name` VARCHAR(255) NOT NULL,
  `author_role_title` VARCHAR(128) NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_disc_ruling` FOREIGN KEY (`ruling_id`) REFERENCES `judicial_rulings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱۶. جدول درخواست‌های تسهیلات و رفاهیات (Welfare Requests)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `welfare_requests` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `applicant_id` BINARY(16) NOT NULL,
  `applicant_name` VARCHAR(255) NOT NULL,
  `type` ENUM('loan', 'accommodation') NOT NULL,
  `type_title` VARCHAR(128) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `requested_value` VARCHAR(128) NOT NULL,
  `status` ENUM('pending', 'approved', 'disbursed', 'rejected') NOT NULL DEFAULT 'pending',
  `description` TEXT NOT NULL,
  `admin_note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_welf_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱۷. جدول اقلام مصرفی تعاونی اعضا (Consumables)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `consumables` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(128) NOT NULL,
  `cooperative_price` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
  `market_price` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
  `unit` VARCHAR(32) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `description` TEXT NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱۷.۱. جدول هویت‌های مجزای دیوار هم‌افزایی (Wall Identities - اصل ۳: ایزولاسیون هویت و عدم الحاق)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wall_identities` (
  `user_id` BINARY(16) NOT NULL PRIMARY KEY,
  `pseudonym` VARCHAR(128) NOT NULL,
  `identity_hash` CHAR(64) NOT NULL UNIQUE,
  `salt` CHAR(32) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱۸. جدول درخواست‌های شبکه هم‌افزایی (Synergy Posts - اصل ۷: فاقد هرگونه user_id یا ردپای هویتی)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `synergy_posts` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `post_token` CHAR(64) NOT NULL UNIQUE,
  `author_pseudonym` VARCHAR(255) NOT NULL,
  `is_anonymous` BOOLEAN NOT NULL DEFAULT TRUE,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `province_or_city` VARCHAR(64) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `category_title` VARCHAR(128) NOT NULL,
  `is_empathy` BOOLEAN NOT NULL DEFAULT FALSE,
  `urgency` ENUM('عادی', 'فوری') NOT NULL DEFAULT 'عادی',
  `status` ENUM('open', 'resolved') NOT NULL DEFAULT 'open',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_created_id` (`created_at`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱۹. جدول پاسخ‌های شبکه هم‌افزایی (Synergy Responses - فاقد هرگونه user_id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `synergy_responses` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `post_id` BINARY(16) NOT NULL,
  `response_token` CHAR(64) NOT NULL UNIQUE,
  `responder_pseudonym` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_private` BOOLEAN NOT NULL DEFAULT FALSE,
  `contact_shared` VARCHAR(128) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_resp_post` FOREIGN KEY (`post_id`) REFERENCES `synergy_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۱۹.۱. جدول ایزوله مالکیت پست‌های دیوار (Wall Ownership - فاقد JOIN در کوئری عمومی)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wall_ownership` (
  `post_id` BINARY(16) NOT NULL,
  `user_id` BINARY(16) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`post_id`, `user_id`),
  INDEX `idx_user_posts` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۲۰. جدول تجارب کاربردی و علمی اعضا (Experiences)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `experiences` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `author_id` BINARY(16) NOT NULL,
  `author_title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT NOT NULL,
  `lessons_learned` JSON NULL,
  `likes_count` INT NOT NULL DEFAULT 0,
  `liked_by` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ۲۱. جدول پیام‌های چت اختصاصی و ۱ به ۱ (Private Direct Messages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `private_messages` (
  `id` BINARY(16) NOT NULL PRIMARY KEY,
  `conversation_topic` VARCHAR(255) NOT NULL,
  `sender_id` BINARY(16) NOT NULL,
  `sender_pseudonym` VARCHAR(255) NOT NULL,
  `recipient_id` BINARY(16) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;

-- ============================================================================
-- بخش داده‌های اولیه و بذر سیستم (Initial Seed Data)
-- ============================================================================

-- درج کاربران اولیه
INSERT IGNORE INTO `users` (
  `id`, `national_id`, `username`, `full_name`, `phone`, `role`, `role_title`, 
  `organization`, `graduation_year`, `avatar_text`, `is_active`, `is_locked`, `must_change_password`, `version`
) VALUES 
('usr_sadegh_admin', 'SADEGH', 'SADEGH', 'صادق (مدیر ارشد سامانه)', '09121111111', 'admin', 'مدیر ارشد سامانه', 'مرکز مدیریت و دانش‌آموختگان فقه و قضا', '۱۳۸۸', 'صا', 1, 0, 1, 1),
('usr_ali_alumni', 'ALI', 'ALI', 'علی (دانش‌آموخته نخبه)', '09122222222', 'alumni', 'دانش‌آموخته نخبه', 'دادگستری کل استان تهران', '۱۳۹۵', 'عل', 1, 0, 1, 1);

-- درج تنظیمات اولیه قالب تم ۲ (شامل ویترین‌ها و چیدمان شخصی‌سازی شده)
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) 
VALUES (
  'crextio_dashboard_config',
  '{
    "showHeroBanner": true,
    "showCourseShowcase": true,
    "courseShowcaseMode": "carousel",
    "showKpiRow": true,
    "showProfileCard": true,
    "showPerformanceCard": false,
    "showPublicationsGallery": false,
    "publicationsMode": "cards",
    "showCartableSnippet": true,
    "showQuickActions": false,
    "showRulingsSnippet": false,
    "canvasTheme": "warm_ivory",
    "heroTitle": "خوش آمدید، جناب آقای دکتر میرزایی",
    "heroSubtitle": "دادگستری کل استان تهران · سمت: مستشار دادگاه تجدیدنظر استان تهران · آماده دریافت درخواست‌های الکترونیک و دوره‌های توانمندسازی قضایی",
    "showShowcaseSection": true,
    "showcaseTitle": "ویترین گزارش خدمات و دستاوردهای سامانه فقه و قضا",
    "showcaseSubtitle": "گزارش تجمیعی آمار و ارقام کلیدی ۱۰۰۰ دانش‌آموخته نخبه",
    "showcaseAlumniCount": "۱,۰۴۲",
    "showcaseCoursesCount": "۲۴",
    "showcaseRulingsCount": "۸۶۵",
    "showcaseSatisfactionRate": "۹۸.۶٪",
    "showCounselingPromo": true,
    "counselingPromoTitle": "درگاه جامع خدمات مشاوره نخبگان فقه و قضا",
    "counselingPromoSubtitle": "ارائه خدمات مشاوره تخصصی شغلی-تحصیلی قضایی و مشاوره‌های روان‌شناختی، خانواده و فردی با حفظ کامل محرمانگی",
    "dashboardSectionOrder": [
      "top_vip_row",
      "course_showcase",
      "counseling_promo",
      "welfare_showcase",
      "multimedia_showcase",
      "bento_grid",
      "books_showcase"
    ],
    "hiddenDashboardSections": {}
  }',
  'تنظیمات پیش‌فرض چیدمان، متن‌ها و ترتیبات ویترین‌های داشبورد تم دوم'
) ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP(3);

-- درج تنظیمات امنیتی
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
VALUES (
  'security_config',
  '{
    "rateLimitMaxAttempts": 5,
    "lockoutDurationMinutes": 15,
    "constantTimeDelayMs": 200,
    "maintenanceMode": false,
    "autoSessionTimeoutMinutes": 30
  }',
  'تنظیمات امنیتی و نرخ محدودیت ورود و نشست‌ها'
) ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP(3);
