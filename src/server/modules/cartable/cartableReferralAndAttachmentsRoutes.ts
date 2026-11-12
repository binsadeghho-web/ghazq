import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';

export function registerCartableReferralRoutes(router: Router): void {
  // Internal Referral & SLA Note Update (Admin / Supervisor Only, Strict OCC)
  router.patch('/:id/referral', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

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
         SET referred_department = ?, internal_referral_note = ?, status = ?, version = version + 1
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
        throw AppError.conflict('این پرونده توسط مسئول دیگری تغییر یافته است. لطفاً بازخوانی نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const newVer = Number(existing.version || 1) + 1;
      const payload = {
        requestId: fromIdBuffer(existing.id),
        applicantId: fromIdBuffer(existing.applicant_id),
        referredDepartment: referredDepartment.trim(),
        internalReferralNote: internalReferralNote ? internalReferralNote.trim() : '',
        status: nextStatus,
        version: newVer,
      };

      outbox.enqueue('cartable.referred', {
        resourceId: payload.requestId,
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

  // Append Disk File Attachment to Cartable Request (Strict OCC)
  router.post('/:id/attachments', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const idBuf = toIdBuffer(req.params.id);
      const { fileUrl } = req.body;

      if (!fileUrl || typeof fileUrl !== 'string') {
        throw AppError.badRequest('آدرس فایل پیوست معتبر نیست.');
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
          currentAttachments = typeof existing.attachments === 'string'
            ? JSON.parse(existing.attachments)
            : existing.attachments;
        }
      } catch {
        currentAttachments = [];
      }
      if (!Array.isArray(currentAttachments)) currentAttachments = [];
      const nextAttachments = [...currentAttachments, fileUrl];

      await p.query(
        `UPDATE cartable_requests SET attachments = ?, version = version + 1 WHERE id = ? OR id = ?`,
        [JSON.stringify(nextAttachments), idBuf, req.params.id]
      );

      const newVer = Number(existing.version || 1) + 1;
      const resourceId = fromIdBuffer(existing.id);

      outbox.enqueue('cartable.attachment_added', {
        resourceId,
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

  // Get Cartable Configuration (Categories with default assigned official, Guide)
  router.get('/config', async (_req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const p = getPool();

      const [rows] = await p.query<any[]>(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'cartable_config' LIMIT 1`
      );

      const defaultCategories = [
        {
          id: 'administrative',
          title: 'خدمات اداری (صدور گواهی، ریزنمرات و احکام)',
          defaultDepartment: 'اداره خدمات آموزشی و اداری',
          assignedOfficialRole: 'admin_finance',
          assignedOfficialTitle: 'مسئول اداری و مالی',
          description: 'صدور انواع گواهی اشتغال، احکام گزینش و مدارک فراغت از تحصیل'
        },
        {
          id: 'educational',
          title: 'خدمات آموزشی (تطبیق واحدهای حوزوی و دانشگاهی)',
          defaultDepartment: 'معاونت آموزش و پژوهش',
          assignedOfficialRole: 'education_deputy',
          assignedOfficialTitle: 'معاونت آموزش',
          description: 'تطبیق دروس فقه و اصول، معرفی‌نامه دوره‌های دکتری و ارشد'
        },
        {
          id: 'career',
          title: 'خدمات شغلی (جابه‌جایی، ارتقای رتبه و تسریع پرونده)',
          defaultDepartment: 'امور دانش‌آموختگان و قضات',
          assignedOfficialRole: 'alumni_manager',
          assignedOfficialTitle: 'مدیر دانش‌آموختگان',
          description: 'پیگیری پرونده ارتقای پایه قضایی، انتقال به شعب استانی و کارگزینی'
        },
        {
          id: 'welfare',
          title: 'خدمات رفاهی، اقامتگاه‌ها و تسهیلات وام',
          defaultDepartment: 'معاونت فرهنگی و رفاهی',
          assignedOfficialRole: 'cultural_deputy',
          assignedOfficialTitle: 'معاونت فرهنگی و رفاهی',
          description: 'رزرو اقامتگاه‌های مشهد و قم، پیگیری وام قرض‌الحسنه حامی و بن مصرفی'
        },
        {
          id: 'research',
          title: 'امور پژوهشی، پایان‌نامه‌ها و نقد آراء',
          defaultDepartment: 'معاونت اجرایی و پژوهش',
          assignedOfficialRole: 'executive_deputy',
          assignedOfficialTitle: 'معاونت اجرایی و پژوهش',
          description: 'تصویب پروپوزال، استاد راهنما و نشر مقالات علمی در فصلنامه'
        }
      ];

      const defaultGuide = {
        id: 'guide_default',
        title: 'راهنمای ثبت درخواست در کارتابل خدمات',
        content: 'دانش‌آموختگان گرامی می‌توانند انواع درخواست‌های رسمی، گواهی‌ها، تسهیلات و پیگیری‌های شغلی خود را از این درگاه ثبت نمایند. بر اساس دسته‌بندی موضوعی، هر درخواست به صورت خودکار به مسئول مربوطه ارجاع داده شده و کد رهگیری یکتا دریافت می‌کند.',
        steps: [
          'انتخاب دقیق دسته‌بندی درخواست جهت ارجاع مستقیم به کارتابل مسئول مربوطه',
          'درج عنوان گویا و مستند برای درخواست',
          'تعیین اولویت رسیدگی (عادی یا فوری؛ درخواست‌های فوری شامل مواعد قانونی هستند)',
          'پیوست مدارک و فیش‌های مربوطه در صورت لزوم'
        ],
        tips: [
          'درخواست‌های عادی ظرف ۴۸ ساعت کاری توسط مسئول مربوطه بررسی و پاسخ داده می‌شوند.',
          'هرگونه پیام یا پاسخ جدید به صورت بلادرنگ در پرونده دیجیتال شما منعکس می‌گردد.',
          'امکان گفت‌وگوی دوطرفه با مسئول رسیدگی‌کننده در طول جریان پرونده فراهم است.'
        ],
        updatedAt: new Date().toISOString(),
      };

      const officials = [
        { role: 'admin', title: 'مدیر ارشد سامانه' },
        { role: 'general_observer', title: 'ناظر کل سامانه' },
        { role: 'alumni_manager', title: 'مدیر دانش‌آموختگان' },
        { role: 'admin_finance', title: 'مسئول اداری و مالی' },
        { role: 'education_deputy', title: 'معاونت آموزش' },
        { role: 'cultural_deputy', title: 'معاونت فرهنگی و رفاهی' },
        { role: 'executive_deputy', title: 'معاونت اجرایی و پژوهش' },
      ];

      if (rows && rows.length > 0) {
        let val = rows[0].setting_value;
        if (typeof val === 'string') {
          try { val = JSON.parse(val); } catch {}
        }
        return res.json({
          categories: val?.categories || defaultCategories,
          guide: val?.guide || defaultGuide,
          officials,
        });
      }

      res.json({
        categories: defaultCategories,
        guide: defaultGuide,
        officials,
      });
    } catch (err) {
      next(err);
    }
  });

  // Update Cartable Guide (Admin & Alumni Manager only)
  router.put('/config/guide', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

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
        currentConfig = typeof rows[0].setting_value === 'string'
          ? JSON.parse(rows[0].setting_value)
          : rows[0].setting_value;
      }

      const nextConfig = {
        ...currentConfig,
        guide: {
          ...guide,
          updatedAt: new Date().toISOString(),
          updatedBy: user.fullName,
        },
      };

      await p.query(
        `INSERT INTO system_settings (setting_key, setting_value, description, version, last_modified_by)
         VALUES ('cartable_config', ?, 'تنظیمات دسته‌بندی‌ها، راهنمای کارتابل و ماتریس ارجاع خودکار', 1, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), last_modified_by = VALUES(last_modified_by), version = version + 1`,
        [JSON.stringify(nextConfig), user.fullName]
      );

      outbox.enqueue('cartable.guide_updated', {
        guide: nextConfig.guide,
        updatedBy: user.fullName,
      });

      res.json({ success: true, guide: nextConfig.guide });
    } catch (err) {
      next(err);
    }
  });

  // Update Cartable Categories & Auto-Referral Routing Matrix (Admin & Alumni Manager only)
  router.put('/config/categories', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const { categories } = req.body;
      if (!Array.isArray(categories)) {
        throw AppError.badRequest('فهرست دسته‌بندی‌ها باید به صورت آرایه ارسال شود.');
      }

      const p = getPool();
      const [rows] = await p.query<any[]>(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'cartable_config' LIMIT 1`
      );

      let currentConfig: any = {};
      if (rows && rows.length > 0) {
        currentConfig = typeof rows[0].setting_value === 'string'
          ? JSON.parse(rows[0].setting_value)
          : rows[0].setting_value;
      }

      const nextConfig = {
        ...currentConfig,
        categories,
      };

      await p.query(
        `INSERT INTO system_settings (setting_key, setting_value, description, version, last_modified_by)
         VALUES ('cartable_config', ?, 'تنظیمات دسته‌بندی‌ها، راهنمای کارتابل و ماتریس ارجاع خودکار', 1, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), last_modified_by = VALUES(last_modified_by), version = version + 1`,
        [JSON.stringify(nextConfig), user.fullName]
      );

      outbox.enqueue('cartable.categories_updated', {
        categories,
        updatedBy: user.fullName,
      });

      res.json({ success: true, categories });
    } catch (err) {
      next(err);
    }
  });
}
