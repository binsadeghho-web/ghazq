import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';
import {
  CartableCategoryConfigItem,
  CartableFollowableTopicsConfig,
} from '../../../types';

export const OFFICIAL_CARTABLE_ROLES = [
  { role: 'admin', title: 'مدیر ارشد سامانه' },
  { role: 'general_observer', title: 'ناظر کل سامانه' },
  { role: 'alumni_manager', title: 'مدیر دانش‌آموختگان' },
  { role: 'admin_finance_officer', title: 'مسئول اداری و مالی' },
  { role: 'education_deputy', title: 'معاونت آموزش' },
  { role: 'cultural_educational_officer', title: 'معاونت فرهنگی و رفاهی' },
  { role: 'research_deputy', title: 'معاونت اجرایی و پژوهش' },
];

const ROLE_ALIAS_MAP: Record<string, string> = {
  admin_finance: 'admin_finance_officer',
  cultural_deputy: 'cultural_educational_officer',
  executive_deputy: 'research_deputy',
};

export function normalizeCategoryItem(raw: any, idx = 0): CartableCategoryConfigItem {
  const key = raw.key || raw.id || `cat_${idx + 1}`;
  const rawRole = raw.assignedRole || raw.assignedOfficialRole || 'alumni_manager';
  const assignedRole = ROLE_ALIAS_MAP[rawRole] || rawRole;
  const matchedOfficial = OFFICIAL_CARTABLE_ROLES.find(o => o.role === assignedRole);
  return {
    id: raw.id || `cat_${key}`,
    key,
    title: raw.title || 'دسته‌بندی خدمات',
    assignedRole,
    assignedOfficialTitle:
      raw.assignedOfficialTitle || matchedOfficial?.title || 'مدیر دانش‌آموختگان',
    description: raw.description || '',
    isActive: raw.isActive !== false,
  };
}

export const DEFAULT_CARTABLE_CATEGORIES: CartableCategoryConfigItem[] = [
  {
    id: 'cat_admin',
    key: 'administrative',
    title: 'خدمات اداری (صدور گواهی، ریزنمرات و احکام)',
    assignedRole: 'admin_finance_officer',
    assignedOfficialTitle: 'مسئول اداری و مالی',
    description: 'صدور انواع گواهی اشتغال، احکام گزینش، تسویه‌حساب و مدارک رسمی اداری',
    isActive: true,
  },
  {
    id: 'cat_edu',
    key: 'educational',
    title: 'خدمات آموزشی (تطبیق واحدهای حوزوی و دانشگاهی)',
    assignedRole: 'education_deputy',
    assignedOfficialTitle: 'معاونت آموزش',
    description: 'ارزیابی پرونده تحصیلی، صدور معرفی‌نامه امتحانات و تطبیق دروس',
    isActive: true,
  },
  {
    id: 'cat_career',
    key: 'career',
    title: 'خدمات شغلی (جابه‌جایی، ارتقای رتبه و تسریع پرونده)',
    assignedRole: 'alumni_manager',
    assignedOfficialTitle: 'مدیر دانش‌آموختگان',
    description: 'تسریع فرآیند استخدامی، معرفی‌نامه شغلی، ارتقای پایه و انتقال سازمانی',
    isActive: true,
  },
  {
    id: 'cat_welfare',
    key: 'welfare',
    title: 'خدمات رفاهی، اقامتگاه‌ها و تسهیلات',
    assignedRole: 'cultural_educational_officer',
    assignedOfficialTitle: 'معاونت فرهنگی و رفاهی',
    description: 'رزرو اقامتگاه‌های زیارتی، پیگیری وام قرض‌الحسنه و تعاونی مصرف',
    isActive: true,
  },
  {
    id: 'cat_research',
    key: 'research',
    title: 'امور پژوهشی، پایان‌نامه‌ها و نقد آراء',
    assignedRole: 'research_deputy',
    assignedOfficialTitle: 'معاونت اجرایی و پژوهش',
    description: 'تصویب طرح‌های پژوهشی، چاپ کتب، مقالات فصلنامه و نقد آراء قضایی',
    isActive: true,
  },
];

export const DEFAULT_CARTABLE_GUIDE = {
  id: 'guide_default',
  title: 'راهنمای جامع ثبت درخواست در کارتابل خدمات',
  content:
    'دانش‌آموختگان گرامی می‌توانند انواع درخواست‌های اداری، آموزشی، رفاهی و استعلامات رسمی خود را از این درگاه ثبت نمایند. بر اساس دسته‌بندی انتخابی (یا در صورت غیرفعال‌بودن دسته‌بندی‌ها مستقیماً نزد مدیر دانش‌آموختگان)، هر پرونده کد رهگیری یکتا دریافت می‌کند.',
  steps: [
    'انتخاب دقیق دسته‌بندی موضوعی جهت ارجاع مستقیم به کارتابل مسئول مربوطه',
    'درج عنوان گویا و مستند همراه با شرح تفصیلی در متن درخواست',
    'تعیین اولویت رسیدگی (عادی یا فوری؛ درخواست‌های فوری شامل مواعد اداری حساس هستند)',
    'پیوست امن مدارک (تصویر، PDF یا Word) جهت تسریع در صدور پاسخ یا گواهی',
  ],
  tips: [
    'پاسخ‌ها و گواهی‌های صادرشده از سوی مسئولین نیز به صورت فایل قابل دانلود در گفت‌وگوی پرونده ارائه می‌شوند.',
    'پس از ثبت، امکان گفت‌وگوی تعاملی و ارسال مدارک تکمیلی در طول رسیدگی پرونده فراهم است.',
    'تغییر وضعیت پرونده به صورت بلادرنگ در کارتابل شما منعکس و اطلاع‌رسانی می‌گردد.',
  ],
  enabled: true,
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_FOLLOWABLE_TOPICS: CartableFollowableTopicsConfig = {
  title: 'موارد قابل پیگیری از مرکز فقه و حقوق اسلامی',
  subtitle:
    'فهرست جامع خدمات، گواهی‌ها، استعلامات و درخواست‌هایی که دانش‌آموختگان گرامی می‌توانند از طریق این کارتابل پیگیری و دریافت نمایند:',
  items: [
    {
      id: 'topic_1',
      title: 'صدور گواهی اشتغال به تحصیل، فراغت از تحصیل و ریزنمرات حوزوی و مرکز',
      description: 'دریافت گواهی‌های رسمی، تاییدیه سوابق آموزشی و معرفی‌نامه برای مراکز قضایی و دانشگاهی',
      categoryKey: 'administrative',
      isActive: true,
      order: 1,
    },
    {
      id: 'topic_2',
      title: 'تطبیق واحدهای درسی و معادل‌سازی مدارک حوزوی و دانشگاهی',
      description: 'بررسی سرفصل دروس گذرانده‌شده و صدور نامه معادل‌سازی جهت ادامه تحصیل در مقاطع تکمیلی',
      categoryKey: 'educational',
      isActive: true,
      order: 2,
    },
    {
      id: 'topic_3',
      title: 'پیگیری پرونده‌های شغلی، نقل و انتقال، کارورزی و ارتقای پایه قضایی',
      description: 'صدور معرفی‌نامه کارگزینی، استعلام سوابق علمی جهت جذب، انتقال بین حوزه‌های قضایی و ترفیع',
      categoryKey: 'career',
      isActive: true,
      order: 3,
    },
    {
      id: 'topic_4',
      title: 'استعلامات پژوهشی، حمایت از پایان‌نامه‌ها، چاپ کتاب و داوری مقالات',
      description: 'تصویب موضوع رساله فقه القضاء، تخصیص استاد راهنما و دریافت کمک‌هزینه پژوهش و انتشار',
      categoryKey: 'research',
      isActive: true,
      order: 4,
    },
    {
      id: 'topic_5',
      title: 'درخواست‌های رفاهی، تسهیلات قرض‌الحسنه و رزرو اقامتگاه‌های زیارتی',
      description: 'پیگیری وضعیت درخواست وام حامی، اسکان مشهد و قم و خدمات تعاونی مصرف دانش‌آموختگان',
      categoryKey: 'welfare',
      isActive: true,
      order: 5,
    },
    {
      id: 'topic_6',
      title: 'اصلاح مشخصات پرونده جامع عضویت و صدور کارت دیجیتال دانش‌آموختگان',
      description: 'به‌روزرسانی ابلاغ شغلی، مدارج علمی، شماره تماس و دریافت نسخه‌های گواهی تاییدشده',
      categoryKey: 'career',
      isActive: true,
      order: 6,
    },
  ],
};

function sanitizeAttachmentUrl(fileUrl: string): boolean {
  return (
    fileUrl.startsWith('/api/storage/private/cartable_alumni/') ||
    fileUrl.startsWith('/api/storage/private/cartable_officials/') ||
    fileUrl.startsWith('/uploads/')
  );
}

export function registerCartableReferralRoutes(router: Router): void {
  // Internal Referral & SLA Note Update (Admin / Supervisor / Alumni Manager, Strict OCC)
  router.patch('/:id/referral', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: user.id, role: user.role, fullName: user.fullName },
        ['admin', 'supervisor']
      );

      const expVer = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const { referredDepartment, internalReferralNote, status } = req.body;

      if (!referredDepartment) {
        throw AppError.badRequest('واحد مقصد جهت ارجاع داخلی الزامی است.');
      }

      const p = getPool();
      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM cartable_requests WHERE id = ? OR id = ? LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      if (!existingRows || existingRows.length === 0) {
        throw AppError.notFound('درخواست کارتابل');
      }
      const existing = existingRows[0];
      const nextStatus = status || (existing.status === 'pending' ? 'in_progress' : existing.status);

      const [upd]: any = await p.query(
        `UPDATE cartable_requests
         SET referred_department = ?, internal_referral_note = ?, status = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
         WHERE (id = ? OR id = ?) AND version = ?`,
        [
          referredDepartment.trim(),
          internalReferralNote ? internalReferralNote.trim() : null,
          nextStatus,
          idBuf,
          req.params.id,
          expVer,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict(
          'این پرونده توسط مسئول دیگری تغییر یافته است. لطفاً بازخوانی نمایید.',
          'CONCURRENT_MODIFICATION_CONFLICT'
        );
      }

      const newVer = Number(existing.version || 1) + 1;
      const resourceId = fromIdBuffer(existing.id);
      const applicantId = fromIdBuffer(existing.applicant_id);
      const payload = {
        requestId: resourceId,
        applicantId,
        referredDepartment: referredDepartment.trim(),
        internalReferralNote: internalReferralNote ? internalReferralNote.trim() : '',
        status: nextStatus,
        version: newVer,
      };

      outbox.enqueue('cartable.referred', {
        resourceId,
        applicantId,
        updates: payload,
        version: newVer,
      });

      res.json({
        success: true,
        ...payload,
      });
    } catch (err) {
      next(err);
    }
  });

  // Append Disk File Attachment to Cartable Request (Strict OCC when expectedVersion supplied)
  router.post('/:id/attachments', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const idBuf = toIdBuffer(req.params.id);
      const { fileUrl, expectedVersion } = req.body || {};

      if (!fileUrl || typeof fileUrl !== 'string' || !sanitizeAttachmentUrl(fileUrl.trim())) {
        throw AppError.badRequest('آدرس فایل پیوست معتبر نیست یا از مسیر مجاز آپلود نشده است.');
      }

      const p = getPool();
      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM cartable_requests WHERE id = ? OR id = ? LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      if (!existingRows || existingRows.length === 0) {
        throw AppError.notFound('درخواست کارتابل');
      }
      const existing = existingRows[0];
      const ownerId = fromIdBuffer(existing.applicant_id);
      AuthorizationPolicy.assertOwnership(
        { userId: user.id, role: user.role, fullName: user.fullName },
        ownerId,
        'درخواست کارتابل',
        true
      );

      let currentAttachments: string[] = [];
      try {
        if (existing.attachments) {
          currentAttachments =
            typeof existing.attachments === 'string'
              ? JSON.parse(existing.attachments)
              : existing.attachments;
        }
      } catch {
        currentAttachments = [];
      }
      if (!Array.isArray(currentAttachments)) currentAttachments = [];
      const cleanUrl = fileUrl.trim();
      const nextAttachments = currentAttachments.includes(cleanUrl)
        ? currentAttachments
        : [...currentAttachments, cleanUrl];

      let sql = `UPDATE cartable_requests SET attachments = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3) WHERE (id = ? OR id = ?)`;
      const params: any[] = [JSON.stringify(nextAttachments), idBuf, req.params.id];
      if (expectedVersion !== undefined && expectedVersion !== null && !isNaN(Number(expectedVersion))) {
        sql += ` AND version = ?`;
        params.push(Number(expectedVersion));
      }

      const [upd]: any = await p.query(sql, params);
      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict(
          'اطلاعات این پرونده هم‌زمان توسط کاربر دیگری تغییر یافته است.',
          'CONCURRENT_MODIFICATION_CONFLICT'
        );
      }

      const newVer = Number(existing.version || 1) + 1;
      const resourceId = fromIdBuffer(existing.id);

      outbox.enqueue('cartable.attachment_added', {
        resourceId,
        applicantId: ownerId,
        updates: { attachments: nextAttachments },
        version: newVer,
      });

      res.json({
        id: resourceId,
        attachments: nextAttachments,
        version: newVer,
      });
    } catch (err) {
      next(err);
    }
  });

  // Get Cartable Configuration (Categories + categoriesDisabled + Guide + FollowableTopics + Officials)
  router.get('/config', async (_req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const p = getPool();

      const [rows] = await p.query<any[]>(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'cartable_config' LIMIT 1`
      );

      let val: any = null;
      if (rows && rows.length > 0) {
        val =
          typeof rows[0].setting_value === 'string'
            ? JSON.parse(rows[0].setting_value)
            : rows[0].setting_value;
      }

      const categories =
        Array.isArray(val?.categories) && val.categories.length > 0
          ? val.categories.map(normalizeCategoryItem)
          : DEFAULT_CARTABLE_CATEGORIES;

      const guide = val?.guide || DEFAULT_CARTABLE_GUIDE;
      const followableTopics = val?.followableTopics || DEFAULT_FOLLOWABLE_TOPICS;
      const categoriesDisabled = Boolean(val?.categoriesDisabled);

      res.json({
        categories,
        categoriesDisabled,
        guide,
        followableTopics,
        officials: OFFICIAL_CARTABLE_ROLES,
      });
    } catch (err) {
      next(err);
    }
  });

  // Update Cartable Guide (Admin, Super Admin, Alumni Manager & Authorized Supervisors)
  router.put('/config/guide', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: user.id, role: user.role, fullName: user.fullName },
        ['admin', 'supervisor']
      );

      const { guide } = req.body;
      if (!guide || !guide.title) {
        throw AppError.badRequest('اطلاعات راهنما نامعتبر است.');
      }

      const p = getPool();
      const [rows] = await p.query<any[]>(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'cartable_config' LIMIT 1`
      );

      let currentConfig: any = {};
      if (rows && rows.length > 0) {
        currentConfig =
          typeof rows[0].setting_value === 'string'
            ? JSON.parse(rows[0].setting_value)
            : rows[0].setting_value;
      }

      const savedGuide = {
        ...guide,
        updatedAt: new Date().toISOString(),
        updatedBy: user.fullName,
      };

      const nextConfig = {
        ...currentConfig,
        guide: savedGuide,
      };

      await p.query(
        `INSERT INTO system_settings (setting_key, setting_value, description, version, last_modified_by)
         VALUES ('cartable_config', ?, 'تنظیمات دسته‌بندی‌ها، راهنمای کارتابل، موارد قابل پیگیری و ماتریس ارجاع خودکار', 1, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), last_modified_by = VALUES(last_modified_by), version = version + 1`,
        [JSON.stringify(nextConfig), user.fullName]
      );

      outbox.enqueue('cartable.guide_updated', {
        guide: savedGuide,
        updatedBy: user.fullName,
      });
      outbox.enqueue('cartable.config_updated', {
        guide: savedGuide,
        updatedBy: user.fullName,
      });

      res.json({ success: true, guide: savedGuide });
    } catch (err) {
      next(err);
    }
  });

  // Update Cartable Categories & Auto-Referral Matrix + Disable Toggle (Admin & Alumni Manager)
  router.put('/config/categories', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: user.id, role: user.role, fullName: user.fullName },
        ['admin', 'supervisor']
      );

      const { categories, categoriesDisabled } = req.body || {};
      if (!Array.isArray(categories)) {
        throw AppError.badRequest('فهرست دسته‌بندی‌ها باید به صورت آرایه ارسال شود.');
      }

      const normalizedCategories = categories.map((c, idx) => normalizeCategoryItem(c, idx));

      const p = getPool();
      const [rows] = await p.query<any[]>(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'cartable_config' LIMIT 1`
      );

      let currentConfig: any = {};
      if (rows && rows.length > 0) {
        currentConfig =
          typeof rows[0].setting_value === 'string'
            ? JSON.parse(rows[0].setting_value)
            : rows[0].setting_value;
      }

      const nextCategoriesDisabled =
        typeof categoriesDisabled === 'boolean'
          ? categoriesDisabled
          : Boolean(currentConfig.categoriesDisabled);

      const nextConfig = {
        ...currentConfig,
        categories: normalizedCategories,
        categoriesDisabled: nextCategoriesDisabled,
      };

      await p.query(
        `INSERT INTO system_settings (setting_key, setting_value, description, version, last_modified_by)
         VALUES ('cartable_config', ?, 'تنظیمات دسته‌بندی‌ها، راهنمای کارتابل، موارد قابل پیگیری و ماتریس ارجاع خودکار', 1, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), last_modified_by = VALUES(last_modified_by), version = version + 1`,
        [JSON.stringify(nextConfig), user.fullName]
      );

      outbox.enqueue('cartable.categories_updated', {
        categories: normalizedCategories,
        categoriesDisabled: nextCategoriesDisabled,
        updatedBy: user.fullName,
      });
      outbox.enqueue('cartable.config_updated', {
        categories: normalizedCategories,
        categoriesDisabled: nextCategoriesDisabled,
        updatedBy: user.fullName,
      });

      res.json({
        success: true,
        categories: normalizedCategories,
        categoriesDisabled: nextCategoriesDisabled,
      });
    } catch (err) {
      next(err);
    }
  });

  // Update "موارد قابل پیگیری از مرکز فقه و حقوق اسلامی" (Editable by Admin & Alumni Manager)
  router.put('/config/followable-topics', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: user.id, role: user.role, fullName: user.fullName },
        ['admin', 'supervisor']
      );

      const { followableTopics } = req.body || {};
      const rawItems = followableTopics?.items || followableTopics?.topics;
      const rawTitle = followableTopics?.title || followableTopics?.modalTitle;
      if (!followableTopics || !rawTitle || !Array.isArray(rawItems)) {
        throw AppError.badRequest('اطلاعات فهرست موارد قابل پیگیری نامعتبر است.');
      }

      const sanitizedTopics: CartableFollowableTopicsConfig = {
        enabled: followableTopics.enabled !== false,
        buttonLabel: followableTopics.buttonLabel
          ? String(followableTopics.buttonLabel).trim()
          : 'موارد قابل پیگیری از مرکز فقه و حقوق اسلامی',
        title: String(rawTitle).trim(),
        subtitle: String(followableTopics.subtitle || followableTopics.modalSubtitle || '').trim(),
        items: rawItems.map((item: any, idx: number) => ({
          id: String(item.id || `topic_${Date.now()}_${idx}`),
          title: String(item.title || '').trim(),
          description: String(item.description || '').trim(),
          categoryKey: (item.categoryKey || item.suggestedCategoryKey)
            ? String(item.categoryKey || item.suggestedCategoryKey).trim()
            : undefined,
          departmentTitle: item.departmentTitle ? String(item.departmentTitle).trim() : undefined,
          estimatedDays: item.estimatedDays ? String(item.estimatedDays).trim() : undefined,
          isActive: item.isActive !== false,
          order: Number(item.order ?? idx + 1),
        })),
        updatedAt: new Date().toISOString(),
        updatedBy: user.fullName,
      };

      const p = getPool();
      const [rows] = await p.query<any[]>(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'cartable_config' LIMIT 1`
      );

      let currentConfig: any = {};
      if (rows && rows.length > 0) {
        currentConfig =
          typeof rows[0].setting_value === 'string'
            ? JSON.parse(rows[0].setting_value)
            : rows[0].setting_value;
      }

      const nextConfig = {
        ...currentConfig,
        followableTopics: sanitizedTopics,
      };

      await p.query(
        `INSERT INTO system_settings (setting_key, setting_value, description, version, last_modified_by)
         VALUES ('cartable_config', ?, 'تنظیمات دسته‌بندی‌ها، راهنمای کارتابل، موارد قابل پیگیری و ماتریس ارجاع خودکار', 1, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), last_modified_by = VALUES(last_modified_by), version = version + 1`,
        [JSON.stringify(nextConfig), user.fullName]
      );

      outbox.enqueue('cartable.config_updated', {
        followableTopics: sanitizedTopics,
        updatedBy: user.fullName,
      });

      res.json({ success: true, followableTopics: sanitizedTopics });
    } catch (err) {
      next(err);
    }
  });
}
