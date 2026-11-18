import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';
import { adminSettingsRepo } from '../admin/adminSettingsRepository';
import {
  SpecializedCounselingPortalConfig,
  GeneralCounselingPortalConfig,
  CounselingFieldItem,
  GeneralCounselingTariffItem,
} from '../../../types';

export const DEFAULT_SPECIALIZED_PORTAL_CONFIG: SpecializedCounselingPortalConfig = {
  sectionTitle: 'مشاوره تخصصی شغلی و تحصیلی',
  sectionSubtitle: 'هدایت گام‌به‌گام مسیر حرفه‌ای، پژوهشی و انتخاب گرایش تخصصی دانش‌آموختگان',
  landingIntroTitle: 'راهنمای جامع مشاوره تخصصی شغلی و تحصیلی مرکز',
  landingIntroBody: 'در این بخش می‌توانید با بهره‌گیری از تجربه مشاوران تخصصی مرکز، برای مسیر ارتقای شغلی، انتخاب گرایش علمی، ادامه تحصیل در مقاطع تکمیلی و برنامه‌ریزی حرفه‌ای نوبت مشاوره ثبت نمایید. تمامی درخواست‌ها با محرمانگی کامل بررسی و زمان‌بندی می‌شوند.',
  landingCalloutTitle: 'آماده برنامه‌ریزی دقیق برای مسیر شغلی یا تحصیلی خود هستید؟',
  landingCalloutSubtitle: 'با کلیک بر روی دکمه زیر وارد مراحل کوتاه و ساختاریافته ثبت درخواست مشاوره خواهید شد.',
  ctaButtonLabel: 'در خواست مشاوره تخصصی شغلی/تحصیلی دارم',
  fieldsSectionTitle: 'زمینه‌های مشاوره تخصصی',
  fieldsSectionSubtitle: 'حوزه‌هایی که مشاوران تخصصی مرکز در آن‌ها آماده راهنمایی شما هستند',
  descriptionButtonLabel: 'توضیحات',
  descriptionModalTitle: 'توضیحات و شیوه‌نامه مشاوره تخصصی شغلی / تحصیلی',
  descriptionModalBody: '۱. پس از ثبت درخواست، پرونده شما توسط دبیرخانه مشاوره تخصصی بررسی و متناسب‌ترین مشاور معرفی می‌گردد.\n۲. جلسات به صورت حضوری در مرکز، برخط تصویری یا تلفنی قابل برگزاری است.\n۳. زمان و محل دقیق برگزاری پس از تایید از طریق همین کارتابل به اطلاع شما خواهد رسید.',
  showAdvisorsToStudents: true,
  submissionSuccessMessage: 'درخواست مشاوره تخصصی شغلی/تحصیلی شما با موفقیت در سامانه ثبت شد. همکاران مرکز پس از بررسی، زمان و نحوه جلسه را در همین بخش اطلاع‌رسانی می‌نمایند.',
  wizardSteps: [
    {
      id: 'spec_step_1',
      title: 'نوع نیاز و اولویت جلسه',
      subtitle: 'مشخص فرمایید مشاوره شما بیشتر متمرکز بر کدام هدف است.',
      enabled: true,
      order: 1,
      fields: [
        {
          id: 'sf_goal',
          key: 'primaryGoal',
          label: 'هدف اصلی درخواست مشاوره تخصصی',
          type: 'radio',
          options: ['مشاوره ارتقا و مسیر شغلی', 'مشاوره ادامه تحصیل و مقطع دکتری/سطح ۴', 'راه‌اندازی دفتر تخصصی یا داوری', 'سایر موارد ترکیبی'],
          required: true,
          enabled: true,
          order: 1,
        },
        {
          id: 'sf_urgency',
          key: 'urgencyLevel',
          label: 'اولویت زمانی رسیدگی',
          type: 'select',
          options: ['عادی (برنامه‌ریزی هفتگی)', 'فوری (نیاز به تصمیم‌گیری در چند روز آینده)'],
          required: true,
          enabled: true,
          order: 2,
        },
      ],
    },
    {
      id: 'spec_step_2',
      title: 'شرح مسئله و سوابق مرتبط',
      subtitle: 'ارائه خلاصه وضعیت فعلی به مشاور کمک می‌کند جلسه پربارتری داشته باشید.',
      enabled: true,
      order: 2,
      fields: [
        {
          id: 'sf_background',
          key: 'currentStatus',
          label: 'وضعیت فعلی شغلی یا تحصیلی',
          type: 'text',
          placeholder: 'مثال: دانش‌آموخته پایه قضایی / دانشجوی سطح ۳ / وکیل پایه یک...',
          required: true,
          enabled: true,
          order: 1,
        },
        {
          id: 'sf_question',
          key: 'keyQuestions',
          label: 'سوالات کلیدی و چالش‌هایی که می‌خواهید بررسی شود',
          type: 'textarea',
          placeholder: 'لطفاً دغدغه اصلی، محدودیت‌ها یا گزینه‌های پیش رو را به صورت خلاصه بنویسید...',
          required: true,
          enabled: true,
          order: 2,
        },
      ],
    },
    {
      id: 'spec_step_3',
      title: 'شیوه و زمان پیشنهادی برگزاری',
      subtitle: 'شیوه مطلوب ارتباط با مشاور را مشخص نمایید.',
      enabled: true,
      order: 3,
      fields: [
        {
          id: 'sf_mode',
          key: 'meetingMode',
          label: 'نحوه برگزاری جلسه',
          type: 'radio',
          options: ['حضوری', 'برخط (تصویری امن)', 'تلفنی'],
          required: true,
          enabled: true,
          order: 1,
        },
        {
          id: 'sf_time_pref',
          key: 'preferredDays',
          label: 'روزها و بازه زمانی مناسب شما',
          type: 'checkbox',
          options: ['شنبه تا دوشنبه (صبح)', 'شنبه تا دوشنبه (عصر)', 'سه‌شنبه و چهارشنبه (صبح)', 'سه‌شنبه و چهارشنبه (عصر)'],
          required: false,
          enabled: true,
          order: 2,
        },
      ],
    },
  ],
  version: 1,
};

export const DEFAULT_GENERAL_PORTAL_CONFIG: GeneralCounselingPortalConfig = {
  sectionTitle: 'مشاوره عمومی و روان‌شناسان مرکز',
  sectionSubtitle: 'خدمات تخصصی روان‌شناسی، خانواده، تاب‌آوری شغلی و سنجش‌های روان‌شناختی با حفظ محرمانگی کامل',
  landingIntroTitle: 'آشنایی با مرکز مشاوره و خدمات روان‌شناختی',
  landingIntroBody: 'این بخش منحصراً توسط روان‌شناسان مجرب مرکز برای حمایت از سلامت روان، آرامش خانواده، پیشگیری از فرسودگی شغلی و تحلیل آزمون‌های استاندارد روان‌شناختی راه‌اندازی شده است. تمامی اطلاعات و گفتگوها کاملاً محرمانه می‌مانند.',
  landingCalloutTitle: 'نیاز به گفت‌وگوی تخصصی با روان‌شناسان مرکز دارید؟',
  landingCalloutSubtitle: 'برای ثبت نوبت جدید روی دکمه رزرو وقت مشاوره کلیک کرده و مراحل کوتاه را تکمیل فرمایید.',
  ctaButtonLabel: 'رزرو وقت مشاوره',
  fieldsSectionTitle: 'زمینه‌های مشاوره عمومی و روان‌شناختی',
  fieldsSectionSubtitle: 'محورهای تخصصی خدمات روان‌شناختی و خانواده در مرکز',
  descriptionButtonLabel: 'توضیحات',
  descriptionModalTitle: 'راهنما و منشور محرمانگی مشاوره روان‌شناختی',
  descriptionModalBody: '۱. پرونده‌های روان‌شناختی و نتایج تست‌ها تنها برای روان‌شناس متخصص پرونده قابل رویت است.\n۲. در صورت صلاح‌دید روان‌شناس، تست‌های تکمیلی در بخش «تست‌ها» برای شما فعال می‌گردد.\n۳. تعرفه‌ها با یارانه ویژه اعضای مرکز محاسبه می‌شوند.',
  showRatesInWizardEnd: true,
  ratesButtonLabel: 'اطلاع از نرخ نامه مشاوره مرکز',
  submissionSuccessMessage: 'درخواست رزرو وقت مشاوره شما با موفقیت ثبت شد. زمان دقیق جلسه توسط واحد پذیرش و روان‌شناسان مرکز هماهنگ و اعلام خواهد شد.',
  wizardSteps: [
    {
      id: 'gen_step_1',
      title: 'حوزه موضوعی و مخاطب جلسه',
      subtitle: 'حوزه اصلی مشاوره روان‌شناختی را مشخص فرمایید.',
      enabled: true,
      order: 1,
      fields: [
        {
          id: 'gf_audience',
          key: 'clientType',
          label: 'مشاوره برای چه کسی درخواست می‌شود؟',
          type: 'radio',
          options: ['شخص خود متقاضی', 'همراه با همسر / مشاوره خانواده', 'فرزند یا یکی از اعضای درجه یک خانواده'],
          required: true,
          enabled: true,
          order: 1,
        },
        {
          id: 'gf_topic',
          key: 'psychTopic',
          label: 'موضوع محوری جلسه',
          type: 'select',
          options: ['مدیریت استرس و فرسودگی شغلی', 'روابط زوجین و خانواده', 'مشاوره پیش از ازدواج', 'رشد فردی و تصمیم‌گیری', 'سایر مسائل روان‌شناختی'],
          required: true,
          enabled: true,
          order: 2,
        },
      ],
    },
    {
      id: 'gen_step_2',
      title: 'شرح حال اولیه و ترجیحات',
      subtitle: 'بیان کوتاه وضعیت فعلی کمک می‌کند جلسه با آمادگی کامل آغاز شود.',
      enabled: true,
      order: 2,
      fields: [
        {
          id: 'gf_summary',
          key: 'issueSummary',
          label: 'خلاصه موضوع یا هدف از جلسه مشاوره',
          type: 'textarea',
          placeholder: 'به‌اختصار بفرمایید در چه زمینه‌ای نیاز به همراهی روان‌شناس دارید...',
          required: true,
          enabled: true,
          order: 1,
        },
        {
          id: 'gf_history',
          key: 'priorCounseling',
          label: 'آیا پیش‌تر در این زمینه جلسه مشاوره‌ای داشته‌اید؟',
          type: 'radio',
          options: ['خیر، اولین نوبت است', 'بله، سابقه پیگیری قبلی دارم'],
          required: false,
          enabled: true,
          order: 2,
        },
      ],
    },
    {
      id: 'gen_step_3',
      title: 'شیوه برگزاری و زمان مناسب',
      subtitle: 'روش حضور و بازه‌های زمانی پیشنهادی خود را انتخاب نمایید.',
      enabled: true,
      order: 3,
      fields: [
        {
          id: 'gf_mode',
          key: 'meetingMode',
          label: 'نحوه برگزاری جلسه',
          type: 'radio',
          options: ['حضوری', 'برخط (تصویری امن)', 'تلفنی'],
          required: true,
          enabled: true,
          order: 1,
        },
        {
          id: 'gf_time',
          key: 'preferredSchedule',
          label: 'بازه زمانی مناسب برای شما',
          type: 'text',
          placeholder: 'مثال: دوشنبه‌ها ساعت ۱۶ به بعد',
          required: false,
          enabled: true,
          order: 2,
        },
      ],
    },
  ],
  version: 1,
};

function mapFieldRow(row: any): CounselingFieldItem {
  return {
    id: fromIdBuffer(row.id),
    counselingType: row.counseling_type === 'specialized_career' ? 'specialized_career' : 'general',
    title: row.title,
    subtitle: row.subtitle || '',
    description: row.description || '',
    iconName: row.icon_name || 'sparkles',
    accentColor: row.accent_color || 'emerald',
    isActive: Boolean(row.is_active),
    displayOrder: Number(row.display_order || 1),
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

function mapTariffRow(row: any): GeneralCounselingTariffItem {
  return {
    id: fromIdBuffer(row.id),
    serviceTitle: row.service_title,
    sessionDurationMinutes: Number(row.session_duration_minutes || 45),
    meetingMode: row.meeting_mode || 'همه روش‌ها',
    standardFee: Number(row.standard_fee || 0),
    alumniSubsidizedFee: Number(row.alumni_subsidized_fee || 0),
    notes: row.notes || '',
    isActive: Boolean(row.is_active),
    displayOrder: Number(row.display_order || 1),
    version: Number(row.version || 1),
  };
}

export function registerCounselingConfigRoutes(router: Router): void {
  // 1. Portal Config (Specialized & General)
  router.get('/config/:type', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const type = req.params.type === 'specialized_career' ? 'specialized_career' : 'general';
      const key =
        type === 'specialized_career'
          ? 'specialized_counseling_portal_config'
          : 'general_counseling_portal_config';
      const defaultCfg =
        type === 'specialized_career' ? DEFAULT_SPECIALIZED_PORTAL_CONFIG : DEFAULT_GENERAL_PORTAL_CONFIG;

      const record = await adminSettingsRepo.getRecord<any>(key);
      if (!record) {
        res.json({ ...defaultCfg, version: 1 });
        return;
      }

      res.json({
        ...defaultCfg,
        ...(record.value || {}),
        version: Number(record.version || 1),
      });
    } catch (err) {
      next(err);
    }
  });

  router.put('/config/:type', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer']
      );

      const type = req.params.type === 'specialized_career' ? 'specialized_career' : 'general';
      const key =
        type === 'specialized_career'
          ? 'specialized_counseling_portal_config'
          : 'general_counseling_portal_config';
      const defaultCfg =
        type === 'specialized_career' ? DEFAULT_SPECIALIZED_PORTAL_CONFIG : DEFAULT_GENERAL_PORTAL_CONFIG;

      const expectedVersion = extractExpectedVersion(req, false);
      const existing = await adminSettingsRepo.getRecord<any>(key);

      if (existing && expectedVersion !== undefined && Number(existing.version) !== Number(expectedVersion)) {
        throw AppError.conflict(
          'تنظیمات این بخش مشاوره هم‌زمان توسط مدیر دیگری تغییر یافته است.',
          'CONCURRENT_MODIFICATION_CONFLICT'
        );
      }

      const body = { ...(req.body || {}) };
      delete body.version;
      delete body._baseVersion;

      const nextConfig = {
        ...defaultCfg,
        ...(existing?.value || {}),
        ...body,
      };

      let finalVersion = 1;
      if (existing) {
        const baseVer = expectedVersion !== undefined ? Number(expectedVersion) : Number(existing.version);
        const upd = await adminSettingsRepo.updateOptimistic(key, nextConfig, baseVer, u.fullName);
        finalVersion = upd.newVersion;
      } else {
        await adminSettingsRepo.saveSetting(key, nextConfig, `Counseling portal config (${type})`, u.fullName);
        finalVersion = 1;
      }

      const payload = { ...nextConfig, version: finalVersion };

      outbox.enqueue('counseling.portal_config_updated', {
        id: key,
        resourceId: key,
        counselingType: type,
        version: finalVersion,
        config: payload,
        updates: { counselingType: type, config: payload },
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json(payload);
    } catch (err) {
      next(err);
    }
  });

  // 2. Counseling Fields (زمینه‌های مشاوره)
  router.get('/fields', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const typeFilter = req.query.type as string | undefined;
      const includeInactive = req.query.includeInactive === 'true';

      let sql = `SELECT * FROM counseling_fields WHERE deleted_at IS NULL`;
      const params: any[] = [];
      if (typeFilter === 'general' || typeFilter === 'specialized_career') {
        sql += ` AND counseling_type = ?`;
        params.push(typeFilter);
      }
      if (!includeInactive) {
        sql += ` AND is_active = 1`;
      }
      sql += ` ORDER BY display_order ASC, created_at ASC`;

      const rows = await selectWithTimeout<any>(sql, params, 3000);
      res.json((rows || []).map(mapFieldRow));
    } catch (err) {
      next(err);
    }
  });

  router.post('/fields', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer']
      );

      const { counselingType, title, subtitle, description, iconName, accentColor, isActive, displayOrder } = req.body || {};
      if (!title || !String(title).trim()) {
        throw AppError.badRequest('عنوان زمینه مشاوره الزامی است.');
      }

      const id = generateUUIDv7();
      const idBuf = toIdBuffer(id);
      const type = counselingType === 'specialized_career' ? 'specialized_career' : 'general';
      const p = getPool();

      await p.query(
        `INSERT INTO counseling_fields (id, counseling_type, title, subtitle, description, icon_name, accent_color, is_active, display_order, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          idBuf,
          type,
          String(title).trim(),
          subtitle ? String(subtitle).trim() : null,
          String(description || '').trim(),
          iconName || 'sparkles',
          accentColor || 'emerald',
          isActive !== false ? 1 : 0,
          Number(displayOrder || 1),
        ]
      );

      const rows = await selectWithTimeout<any>(`SELECT * FROM counseling_fields WHERE id = ? LIMIT 1`, [idBuf], 3000);
      const created = mapFieldRow(rows[0]);

      outbox.enqueue('counseling.field_created', {
        id,
        resourceId: id,
        version: 1,
        updates: created,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/fields/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer']
      );

      const expectedVersion = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();

      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM counseling_fields WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      if (!existingRows || existingRows.length === 0) {
        throw AppError.notFound('زمینه مشاوره');
      }
      const ex = existingRows[0];
      const b = req.body || {};

      const [upd]: any = await p.query(
        `UPDATE counseling_fields
         SET title = ?, subtitle = ?, description = ?, icon_name = ?, accent_color = ?, is_active = ?, display_order = ?, version = version + 1
         WHERE (id = ? OR id = ?) AND deleted_at IS NULL AND version = ?`,
        [
          b.title !== undefined ? String(b.title).trim() : ex.title,
          b.subtitle !== undefined ? (b.subtitle ? String(b.subtitle).trim() : null) : ex.subtitle,
          b.description !== undefined ? String(b.description).trim() : ex.description,
          b.iconName !== undefined ? b.iconName : ex.icon_name,
          b.accentColor !== undefined ? b.accentColor : ex.accent_color,
          b.isActive !== undefined ? (b.isActive ? 1 : 0) : ex.is_active,
          b.displayOrder !== undefined ? Number(b.displayOrder) : ex.display_order,
          idBuf,
          req.params.id,
          expectedVersion,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('زمینه مشاوره هم‌زمان ویرایش شده است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const refreshed = await selectWithTimeout<any>(
        `SELECT * FROM counseling_fields WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      const updated = mapFieldRow(refreshed[0]);

      outbox.enqueue('counseling.field_updated', {
        id: updated.id,
        resourceId: updated.id,
        version: updated.version,
        updates: updated,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/fields/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer']
      );

      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();
      const [upd]: any = await p.query(
        `UPDATE counseling_fields SET deleted_at = NOW(3), is_active = 0, version = version + 1 WHERE (id = ? OR id = ?) AND deleted_at IS NULL`,
        [idBuf, req.params.id]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.notFound('زمینه مشاوره');
      }

      outbox.enqueue('counseling.field_deleted', {
        id: req.params.id,
        resourceId: req.params.id,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // 3. Counseling Tariffs (نرخ‌نامه مشاوره عمومی)
  router.get('/tariffs', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const includeInactive = req.query.includeInactive === 'true';
      const sql = includeInactive
        ? `SELECT * FROM counseling_tariffs WHERE deleted_at IS NULL ORDER BY display_order ASC, created_at ASC`
        : `SELECT * FROM counseling_tariffs WHERE deleted_at IS NULL AND is_active = 1 ORDER BY display_order ASC, created_at ASC`;

      const rows = await selectWithTimeout<any>(sql, [], 3000);
      res.json((rows || []).map(mapTariffRow));
    } catch (err) {
      next(err);
    }
  });

  router.post('/tariffs', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'admin_finance_officer', 'alumni_manager']
      );

      const b = req.body || {};
      if (!b.serviceTitle || !String(b.serviceTitle).trim()) {
        throw AppError.badRequest('عنوان خدمت مشاوره برای درج در نرخ‌نامه الزامی است.');
      }

      const id = generateUUIDv7();
      const idBuf = toIdBuffer(id);
      const p = getPool();

      await p.query(
        `INSERT INTO counseling_tariffs (id, service_title, session_duration_minutes, meeting_mode, standard_fee, alumni_subsidized_fee, notes, is_active, display_order, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          idBuf,
          String(b.serviceTitle).trim(),
          Number(b.sessionDurationMinutes || 45),
          b.meetingMode || 'همه روش‌ها',
          Number(b.standardFee || 0),
          Number(b.alumniSubsidizedFee || 0),
          b.notes ? String(b.notes).trim() : null,
          b.isActive !== false ? 1 : 0,
          Number(b.displayOrder || 1),
        ]
      );

      const rows = await selectWithTimeout<any>(`SELECT * FROM counseling_tariffs WHERE id = ? LIMIT 1`, [idBuf], 3000);
      const created = mapTariffRow(rows[0]);

      outbox.enqueue('counseling.tariff_created', {
        id,
        resourceId: id,
        version: 1,
        updates: created,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/tariffs/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'admin_finance_officer', 'alumni_manager']
      );

      const expectedVersion = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();

      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM counseling_tariffs WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      if (!existingRows || existingRows.length === 0) {
        throw AppError.notFound('ردیف نرخ‌نامه');
      }
      const ex = existingRows[0];
      const b = req.body || {};

      const [upd]: any = await p.query(
        `UPDATE counseling_tariffs
         SET service_title = ?, session_duration_minutes = ?, meeting_mode = ?, standard_fee = ?, alumni_subsidized_fee = ?, notes = ?, is_active = ?, display_order = ?, version = version + 1
         WHERE (id = ? OR id = ?) AND deleted_at IS NULL AND version = ?`,
        [
          b.serviceTitle !== undefined ? String(b.serviceTitle).trim() : ex.service_title,
          b.sessionDurationMinutes !== undefined ? Number(b.sessionDurationMinutes) : ex.session_duration_minutes,
          b.meetingMode !== undefined ? b.meetingMode : ex.meeting_mode,
          b.standardFee !== undefined ? Number(b.standardFee) : ex.standard_fee,
          b.alumniSubsidizedFee !== undefined ? Number(b.alumniSubsidizedFee) : ex.alumni_subsidized_fee,
          b.notes !== undefined ? (b.notes ? String(b.notes).trim() : null) : ex.notes,
          b.isActive !== undefined ? (b.isActive ? 1 : 0) : ex.is_active,
          b.displayOrder !== undefined ? Number(b.displayOrder) : ex.display_order,
          idBuf,
          req.params.id,
          expectedVersion,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('این ردیف نرخ‌نامه هم‌زمان ویرایش شده است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const refreshed = await selectWithTimeout<any>(
        `SELECT * FROM counseling_tariffs WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      const updated = mapTariffRow(refreshed[0]);

      outbox.enqueue('counseling.tariff_updated', {
        id: updated.id,
        resourceId: updated.id,
        version: updated.version,
        updates: updated,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/tariffs/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'admin_finance_officer', 'alumni_manager']
      );

      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();
      const [upd]: any = await p.query(
        `UPDATE counseling_tariffs SET deleted_at = NOW(3), is_active = 0, version = version + 1 WHERE (id = ? OR id = ?) AND deleted_at IS NULL`,
        [idBuf, req.params.id]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.notFound('ردیف نرخ‌نامه');
      }

      outbox.enqueue('counseling.tariff_deleted', {
        id: req.params.id,
        resourceId: req.params.id,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });
}
