import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, withTx, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { adminSettingsRepo } from '../admin/adminSettingsRepository';
import { auditChain } from '../../platform/auditChain';
import { outbox } from '../../platform/outbox';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { isOrganizationalUserRole } from '../../platform/authorization';
import { DEFAULT_WELFARE_PORTAL_CONFIG } from '../../../data/welfareData';
import {
  WelfarePortalConfig,
  WelfareAccommodationCityDetail,
  WelfareFundMembership,
  WelfareFundPayment,
  WelfareInstallmentPartner,
  WelfareInstallmentRequest,
  WelfareRecreationProgram,
  WelfareRecreationRegistration,
} from '../../../types/welfare';
import { diffDaysIso, formatIsoToJalali, getTehranTodayIso } from '../../../utils/jalaliDate';

function mergeAccommodationCityDetails(
  baseDetails?: Record<string, WelfareAccommodationCityDetail>,
  rawDetails?: any
): Record<string, WelfareAccommodationCityDetail> {
  const result: Record<string, WelfareAccommodationCityDetail> = {};
  if (baseDetails) {
    for (const [city, detail] of Object.entries(baseDetails)) {
      result[city] = {
        description: detail.description || '',
        imageUrl: detail.imageUrl,
        gallery: Array.isArray(detail.gallery) ? [...detail.gallery] : [],
      };
    }
  }
  if (rawDetails && typeof rawDetails === 'object') {
    for (const [city, detail] of Object.entries(rawDetails)) {
      const cleanCity = String(city).trim();
      if (!cleanCity || !detail || typeof detail !== 'object') continue;
      const d = detail as any;
      const prev = result[cleanCity] || { description: '', gallery: [] };
      const gallery = Array.isArray(d.gallery)
        ? d.gallery.map((u: any) => String(u).trim()).filter(Boolean)
        : prev.gallery || [];
      const imageUrl =
        d.imageUrl !== undefined
          ? (d.imageUrl ? String(d.imageUrl).trim() : undefined)
          : prev.imageUrl || gallery[0];
      result[cleanCity] = {
        description:
          typeof d.description === 'string' ? d.description : prev.description || '',
        imageUrl,
        gallery: gallery.length > 0 ? gallery : imageUrl ? [imageUrl] : [],
      };
    }
  }
  return result;
}

function mergePortalConfig(raw: any): WelfarePortalConfig {
  const base = DEFAULT_WELFARE_PORTAL_CONFIG;
  if (!raw || typeof raw !== 'object') return base;
  return {
    modulesConfig: {
      emergency_loan: { ...base.modulesConfig.emergency_loan, ...(raw.modulesConfig?.emergency_loan || {}) },
      qarzolhasaneh_fund: { ...base.modulesConfig.qarzolhasaneh_fund, ...(raw.modulesConfig?.qarzolhasaneh_fund || {}) },
      accommodation: { ...base.modulesConfig.accommodation, ...(raw.modulesConfig?.accommodation || {}) },
      consumables: { ...base.modulesConfig.consumables, ...(raw.modulesConfig?.consumables || {}) },
      installment_sales: { ...base.modulesConfig.installment_sales, ...(raw.modulesConfig?.installment_sales || {}) },
      recreation_tourism: { ...base.modulesConfig.recreation_tourism, ...(raw.modulesConfig?.recreation_tourism || {}) },
    },
    emergencyLoanDescription:
      typeof raw.emergencyLoanDescription === 'string' && raw.emergencyLoanDescription.trim()
        ? raw.emergencyLoanDescription
        : base.emergencyLoanDescription,
    emergencyLoanMaxAmountLabel:
      typeof raw.emergencyLoanMaxAmountLabel === 'string'
        ? raw.emergencyLoanMaxAmountLabel
        : base.emergencyLoanMaxAmountLabel,
    contactsConfig: {
      ...base.contactsConfig,
      ...(raw.contactsConfig || {}),
    },
    accommodationCities:
      Array.isArray(raw.accommodationCities) && raw.accommodationCities.length > 0
        ? raw.accommodationCities.map((c: any) => String(c).trim()).filter(Boolean)
        : base.accommodationCities,
    accommodationCityDetails: mergeAccommodationCityDetails(
      base.accommodationCityDetails,
      raw.accommodationCityDetails
    ),
    accommodationMaxNights: Math.max(1, Number(raw.accommodationMaxNights ?? base.accommodationMaxNights)),
    accommodationMinLeadDays: Math.max(1, Number(raw.accommodationMinLeadDays ?? base.accommodationMinLeadDays)),
    fundConfig: {
      ...base.fundConfig,
      ...(raw.fundConfig || {}),
      presetTiers:
        Array.isArray(raw.fundConfig?.presetTiers) && raw.fundConfig.presetTiers.length > 0
          ? raw.fundConfig.presetTiers.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n) && n > 0)
          : base.fundConfig.presetTiers,
    },
  };
}

function mapFundMembershipRow(row: any): WelfareFundMembership {
  return {
    id: fromIdBuffer(row.id),
    userId: fromIdBuffer(row.user_id),
    userName: row.user_name || '',
    userPhone: row.user_phone || undefined,
    userNationalId: row.user_national_id || undefined,
    monthlyFeeAmount: Number(row.monthly_fee_amount || 0),
    status: row.status || 'pending',
    adminNote: row.admin_note || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

function mapFundPaymentRow(row: any): WelfareFundPayment {
  return {
    id: fromIdBuffer(row.id),
    membershipId: fromIdBuffer(row.membership_id),
    userId: fromIdBuffer(row.user_id),
    userName: row.user_name || '',
    amount: Number(row.amount || 0),
    periodLabel: row.period_label || '',
    paymentMethod: row.payment_method || 'online_gateway',
    trackingCode: row.tracking_code || '',
    receiptUrl: row.receipt_url || undefined,
    status: row.status || 'pending',
    adminNote: row.admin_note || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapInstallmentPartnerRow(row: any): WelfareInstallmentPartner {
  return {
    id: fromIdBuffer(row.id),
    name: row.name || '',
    tagline: row.tagline || '',
    description: row.description || '',
    maxCreditLimit: Number(row.max_credit_limit || 0),
    creditLimitDisplay: row.credit_limit_display || '',
    installmentTerms: row.installment_terms || '',
    durationMonths: Number(row.duration_months || 12),
    logoUrl: row.logo_url || undefined,
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
    displayOrder: Number(row.display_order || 1),
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

function mapInstallmentRequestRow(row: any): WelfareInstallmentRequest {
  let attachments: Array<{ url: string; name: string; size?: number }> = [];
  if (row.attachments) {
    try {
      const parsed = typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments;
      if (Array.isArray(parsed)) {
        attachments = parsed.filter((a: any) => a && typeof a.url === 'string' && a.url.trim());
      }
    } catch {}
  }
  return {
    id: fromIdBuffer(row.id),
    partnerId: fromIdBuffer(row.partner_id),
    partnerName: row.partner_name || '',
    applicantId: fromIdBuffer(row.applicant_id),
    applicantName: row.applicant_name || '',
    applicantPhone: row.applicant_phone || undefined,
    requestedAmount: Number(row.requested_amount || 0),
    months: Number(row.months || 12),
    description: row.description || '',
    status: row.status || 'pending',
    adminNote: row.admin_note || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    attachments,
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export function registerWelfareExtendedRoutes(router: Router): void {
  // 1. Unified 5-Module Portal Configuration & Contacts
  router.get('/portal-config', async (_req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const rec = await adminSettingsRepo.getRecord<any>('welfare_portal_config');
      res.json(mergePortalConfig(rec?.value));
    } catch (err) {
      next(err);
    }
  });

  router.put('/portal-config', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('فقط مدیران مجاز به ویرایش تنظیمات بخش تسهیلات و رفاهیات هستند.');
      }
      const existingRec = await adminSettingsRepo.getRecord<any>('welfare_portal_config');
      const existingMerged = mergePortalConfig(existingRec?.value);
      const body = req.body || {};
      const merged = mergePortalConfig({
        ...existingMerged,
        ...body,
        modulesConfig: {
          ...existingMerged.modulesConfig,
          ...(body.modulesConfig || {}),
        },
        contactsConfig: {
          ...existingMerged.contactsConfig,
          ...(body.contactsConfig || {}),
        },
        accommodationCityDetails: mergeAccommodationCityDetails(
          existingMerged.accommodationCityDetails,
          body.accommodationCityDetails
        ),
        fundConfig: {
          ...existingMerged.fundConfig,
          ...(body.fundConfig || {}),
        },
      });

      await adminSettingsRepo.saveSetting('welfare_portal_config', merged, 'تنظیمات کامل بخش تسهیلات و رفاهیات');

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: 'به‌روزرسانی تنظیمات بخش تسهیلات و رفاهیات و شماره‌های تماس',
        severity: 'info',
      });

      outbox.enqueue('welfare.config_updated', { config: merged });
      res.json(merged);
    } catch (err) {
      next(err);
    }
  });

  // 2. Accommodation Request (Strict Tehran Jalali Calendar 3-day Lead Rule & Max Nights)
  router.post('/accommodation-requests', idempotencyMiddleware, async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const { city, checkInIso, nights, description, phone, attachments: rawAttachments } = req.body || {};

      const cleanCity = String(city || '').trim();
      const cleanIso = String(checkInIso || '').trim().slice(0, 10);
      const numNights = Math.floor(Number(nights || 0));

      if (!cleanCity) {
        throw AppError.badRequest('انتخاب شهر اقامت الزامی است.');
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanIso)) {
        throw AppError.badRequest('تاریخ ورود نامعتبر است. لطفاً از تقویم شمسی انتخاب نمایید.');
      }

      const configRec = await adminSettingsRepo.getRecord<any>('welfare_portal_config');
      const config = mergePortalConfig(configRec?.value);

      const todayIso = getTehranTodayIso();
      const leadDays = diffDaysIso(todayIso, cleanIso);
      if (leadDays < config.accommodationMinLeadDays) {
        throw AppError.badRequest(
          `تاریخ ورود باید حداقل ${config.accommodationMinLeadDays} روز بعد از امروز باشد.`
        );
      }
      if (!Number.isFinite(numNights) || numNights < 1 || numNights > config.accommodationMaxNights) {
        throw AppError.badRequest(
          `تعداد شب اقامت باید بین ۱ تا ${config.accommodationMaxNights} شب انتخاب شود.`
        );
      }

      const cleanAttachments = Array.isArray(rawAttachments)
        ? rawAttachments
            .filter((a: any) => a && typeof a.url === 'string' && a.url.trim())
            .map((a: any) => ({
              url: String(a.url).trim(),
              name: String(a.name || 'مدرک پیوست').trim().slice(0, 180),
              ...(typeof a.size === 'number' ? { size: a.size } : {}),
            }))
        : [];

      const checkInJalali = formatIsoToJalali(cleanIso, true);
      const id = generateUUIDv7();
      const idBuf = toIdBuffer(id);
      const uBuf = toIdBuffer(currentUser.id);
      const p = getPool();
      const title = `درخواست اسکان در ${cleanCity} (${numNights} شب)`;
      const requestedValue = `${checkInJalali} · ${numNights} شب`;
      const metadata = {
        city: cleanCity,
        checkInIso: cleanIso,
        checkInJalali,
        nights: numNights,
        phone: phone ? String(phone).trim() : (currentUser as any).phone || '',
        ...(cleanAttachments.length > 0 ? { attachments: cleanAttachments } : {}),
      };

      await p.query(
        `INSERT INTO welfare_requests (
          id, type, type_title, applicant_id, applicant_name, title, requested_value, description, metadata, rules_acknowledged, status, version
        ) VALUES (?, 'accommodation', 'اسکان در قم و سایر شهرها', ?, ?, ?, ?, ?, ?, 1, 'pending', 1)`,
        [
          idBuf,
          uBuf,
          currentUser.fullName,
          title,
          requestedValue,
          description ? String(description).trim() : '',
          JSON.stringify(metadata),
        ]
      );

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `ثبت درخواست اسکان: ${cleanCity} از ${checkInJalali} به مدت ${numNights} شب`,
        severity: 'info',
      });

      outbox.enqueue('welfare.requested', {
        requestId: id,
        applicantId: currentUser.id,
        type: 'accommodation',
      });

      res.status(201).json({
        message: 'درخواست شما ثبت شد با شما تماس گرفته می‌شود',
        request: {
          id,
          type: 'accommodation',
          typeTitle: 'اسکان در قم و سایر شهرها',
          applicantId: currentUser.id,
          applicantName: currentUser.fullName,
          title,
          requestedValue,
          description: description ? String(description).trim() : '',
          metadata,
          rulesAcknowledged: true,
          status: 'pending',
          version: 1,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // 3. Qarzolhasaneh Fund Membership & Fee Payments
  router.get('/fund/my', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const uBuf = toIdBuffer(currentUser.id);

      const mRows = await selectWithTimeout<any>(
        `SELECT * FROM welfare_fund_memberships WHERE user_id = ? LIMIT 1`,
        [uBuf],
        3000
      );
      const pRows = await selectWithTimeout<any>(
        `SELECT * FROM welfare_fund_payments WHERE user_id = ? ORDER BY created_at DESC`,
        [uBuf],
        3000
      );

      res.json({
        membership: mRows && mRows.length > 0 ? mapFundMembershipRow(mRows[0]) : null,
        payments: (pRows || []).map(mapFundPaymentRow),
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/fund/membership', idempotencyMiddleware, async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const monthlyFeeAmount = Math.round(Number(req.body?.monthlyFeeAmount || 0));

      const configRec = await adminSettingsRepo.getRecord<any>('welfare_portal_config');
      const config = mergePortalConfig(configRec?.value);
      const { minCustomAmount, maxCustomAmount, presetTiers } = config.fundConfig;

      const isPreset = presetTiers.includes(monthlyFeeAmount);
      if (!isPreset && (monthlyFeeAmount < minCustomAmount || monthlyFeeAmount > maxCustomAmount)) {
        throw AppError.badRequest(
          `مبلغ حق عضویت باید از مبالغ پیشنهادی یا بین ${minCustomAmount.toLocaleString('fa-IR')} تا ${maxCustomAmount.toLocaleString('fa-IR')} تومان باشد.`
        );
      }

      const uBuf = toIdBuffer(currentUser.id);
      const p = getPool();
      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM welfare_fund_memberships WHERE user_id = ? LIMIT 1`,
        [uBuf],
        3000
      );

      let targetId = '';
      if (existingRows && existingRows.length > 0) {
        const ex = existingRows[0];
        if (ex.status === 'pending' || ex.status === 'approved') {
          throw AppError.conflict('شما هم‌اکنون درخواست در حال بررسی یا عضویت فعال در صندوق دارید.');
        }
        targetId = fromIdBuffer(ex.id);
        await p.query(
          `UPDATE welfare_fund_memberships
           SET monthly_fee_amount = ?, status = 'pending', admin_note = NULL, reviewed_by = NULL, reviewed_at = NULL, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
           WHERE id = ?`,
          [monthlyFeeAmount, ex.id]
        );
      } else {
        targetId = generateUUIDv7();
        await p.query(
          `INSERT INTO welfare_fund_memberships (
            id, user_id, user_name, user_phone, user_national_id, monthly_fee_amount, status, version
          ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 1)`,
          [
            toIdBuffer(targetId),
            uBuf,
            currentUser.fullName,
            (currentUser as any).phone || null,
            currentUser.nationalId || null,
            monthlyFeeAmount,
          ]
        );
      }

      const freshRows = await selectWithTimeout<any>(
        `SELECT * FROM welfare_fund_memberships WHERE id = ? LIMIT 1`,
        [toIdBuffer(targetId)],
        3000
      );
      const membership = mapFundMembershipRow(freshRows[0]);

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `درخواست عضویت در صندوق قرض‌الحسنه با حق عضویت ماهیانه ${monthlyFeeAmount} تومان`,
        severity: 'info',
      });

      outbox.enqueue('welfare.fund_updated', { membership });
      res.status(201).json(membership);
    } catch (err) {
      next(err);
    }
  });

  router.put('/fund/membership/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const idBuf = toIdBuffer(req.params.id);
      const monthlyFeeAmount = Math.round(Number(req.body?.monthlyFeeAmount || 0));

      const rows = await selectWithTimeout<any>(
        `SELECT * FROM welfare_fund_memberships WHERE id = ? LIMIT 1`,
        [idBuf],
        3000
      );
      if (!rows || rows.length === 0) throw AppError.notFound('درخواست عضویت صندوق');
      const existing = mapFundMembershipRow(rows[0]);

      if (existing.userId !== currentUser.id) {
        throw AppError.forbidden('فقط متقاضی مالک این درخواست مجاز به ویرایش آن است.');
      }
      if (existing.status !== 'pending') {
        throw AppError.badRequest('فقط درخواست‌های در انتظار بررسی (Pending) قابل ویرایش هستند.');
      }

      const configRec = await adminSettingsRepo.getRecord<any>('welfare_portal_config');
      const config = mergePortalConfig(configRec?.value);
      const { minCustomAmount, maxCustomAmount, presetTiers } = config.fundConfig;
      if (!presetTiers.includes(monthlyFeeAmount) && (monthlyFeeAmount < minCustomAmount || monthlyFeeAmount > maxCustomAmount)) {
        throw AppError.badRequest('مبلغ انتخاب‌شده خارج از بازه مجاز صندوق است.');
      }

      const p = getPool();
      await p.query(
        `UPDATE welfare_fund_memberships SET monthly_fee_amount = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND status = 'pending'`,
        [monthlyFeeAmount, idBuf]
      );

      const updated = await selectWithTimeout<any>(`SELECT * FROM welfare_fund_memberships WHERE id = ? LIMIT 1`, [idBuf], 3000);
      const mapped = mapFundMembershipRow(updated[0]);
      outbox.enqueue('welfare.fund_updated', { membership: mapped });
      res.json(mapped);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/fund/membership/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const idBuf = toIdBuffer(req.params.id);

      const rows = await selectWithTimeout<any>(
        `SELECT * FROM welfare_fund_memberships WHERE id = ? LIMIT 1`,
        [idBuf],
        3000
      );
      if (!rows || rows.length === 0) throw AppError.notFound('درخواست عضویت صندوق');
      const existing = mapFundMembershipRow(rows[0]);

      if (existing.userId !== currentUser.id) {
        throw AppError.forbidden('فقط متقاضی مالک درخواست مجاز به لغو و حذف آن است.');
      }
      if (existing.status !== 'pending') {
        throw AppError.badRequest('فقط درخواست‌های در انتظار بررسی قابل حذف هستند.');
      }

      const p = getPool();
      await p.query(`DELETE FROM welfare_fund_memberships WHERE id = ? AND status = 'pending'`, [idBuf]);
      outbox.enqueue('welfare.fund_updated', { deletedMembershipId: existing.id });
      res.json({ success: true, id: existing.id });
    } catch (err) {
      next(err);
    }
  });

  router.get('/fund/admin/memberships', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('دسترسی مدیران برای مشاهده فهرست اعضای صندوق الزامی است.');
      }
      const rows = await selectWithTimeout<any>(
        `SELECT * FROM welfare_fund_memberships ORDER BY created_at DESC`,
        [],
        4000
      );
      res.json((rows || []).map(mapFundMembershipRow));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/fund/admin/memberships/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('فقط مدیر مجاز به تایید یا رد عضویت صندوق است.');
      }
      const idBuf = toIdBuffer(req.params.id);
      const { status, adminNote } = req.body || {};
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        throw AppError.badRequest('وضعیت درخواست نامعتبر است.');
      }

      const p = getPool();
      const [upd]: any = await p.query(
        `UPDATE welfare_fund_memberships
         SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP(3), version = version + 1
         WHERE id = ?`,
        [status, adminNote ? String(adminNote).trim() : null, currentUser.fullName, idBuf]
      );
      if (!upd || upd.affectedRows === 0) throw AppError.notFound('درخواست عضویت صندوق');

      const fresh = await selectWithTimeout<any>(`SELECT * FROM welfare_fund_memberships WHERE id = ? LIMIT 1`, [idBuf], 3000);
      const mapped = mapFundMembershipRow(fresh[0]);

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `تغییر وضعیت عضویت صندوق قرض‌الحسنه برای ${mapped.userName} به ${status}`,
        severity: 'info',
      });

      outbox.enqueue('welfare.fund_updated', { membership: mapped });
      res.json(mapped);
    } catch (err) {
      next(err);
    }
  });

  router.post('/fund/payments', idempotencyMiddleware, async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const uBuf = toIdBuffer(currentUser.id);

      const mRows = await selectWithTimeout<any>(
        `SELECT * FROM welfare_fund_memberships WHERE user_id = ? LIMIT 1`,
        [uBuf],
        3000
      );
      if (!mRows || mRows.length === 0 || mRows[0].status !== 'approved') {
        throw AppError.forbidden('برای واریز حق عضویت، ابتدا باید عضویت شما در صندوق قرض‌الحسنه تایید شده باشد.');
      }
      const membership = mapFundMembershipRow(mRows[0]);
      const amount = Math.round(Number(req.body?.amount || membership.monthlyFeeAmount));
      const periodLabel = String(req.body?.periodLabel || '').trim() || 'قسط ماهانه جاری';
      const paymentMethod = String(req.body?.paymentMethod || 'online_gateway').trim();
      const receiptUrl = req.body?.receiptUrl ? String(req.body.receiptUrl).trim() : null;

      if (!Number.isFinite(amount) || amount <= 0) {
        throw AppError.badRequest('مبلغ واریز نامعتبر است.');
      }

      const id = generateUUIDv7();
      const trackingCode = `FND-${Date.now().toString().slice(-7)}`;
      const p = getPool();

      await p.query(
        `INSERT INTO welfare_fund_payments (
          id, membership_id, user_id, user_name, amount, period_label, payment_method, tracking_code, receipt_url, status, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1)`,
        [
          toIdBuffer(id),
          toIdBuffer(membership.id),
          uBuf,
          currentUser.fullName,
          amount,
          periodLabel,
          paymentMethod,
          trackingCode,
          receiptUrl,
        ]
      );

      const fresh = await selectWithTimeout<any>(
        `SELECT * FROM welfare_fund_payments WHERE id = ? LIMIT 1`,
        [toIdBuffer(id)],
        3000
      );
      const mapped = mapFundPaymentRow(fresh[0]);

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `ثبت واریز حق عضویت صندوق قرض‌الحسنه به مبلغ ${amount} تومان (${periodLabel})`,
        severity: 'info',
      });

      outbox.enqueue('welfare.fund_payment', { payment: mapped });
      res.status(201).json(mapped);
    } catch (err) {
      next(err);
    }
  });

  router.get('/fund/admin/payments', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('دسترسی مدیران برای مشاهده سوابق واریز صندوق الزامی است.');
      }
      const rows = await selectWithTimeout<any>(
        `SELECT * FROM welfare_fund_payments ORDER BY created_at DESC`,
        [],
        4000
      );
      res.json((rows || []).map(mapFundPaymentRow));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/fund/admin/payments/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('فقط مدیر مجاز به تایید یا رد واریزی‌های صندوق است.');
      }
      const idBuf = toIdBuffer(req.params.id);
      const { status, adminNote } = req.body || {};
      if (!['verified', 'rejected', 'pending'].includes(status)) {
        throw AppError.badRequest('وضعیت واریز نامعتبر است.');
      }

      const p = getPool();
      const [upd]: any = await p.query(
        `UPDATE welfare_fund_payments
         SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP(3), version = version + 1
         WHERE id = ?`,
        [status, adminNote ? String(adminNote).trim() : null, currentUser.fullName, idBuf]
      );
      if (!upd || upd.affectedRows === 0) throw AppError.notFound('سند واریز حق عضویت');

      const fresh = await selectWithTimeout<any>(`SELECT * FROM welfare_fund_payments WHERE id = ? LIMIT 1`, [idBuf], 3000);
      const mapped = mapFundPaymentRow(fresh[0]);
      outbox.enqueue('welfare.fund_payment', { payment: mapped });
      res.json(mapped);
    } catch (err) {
      next(err);
    }
  });

  // 4. Installment Sales Partners & Requests
  router.get('/installments/partners', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const isAdmin = isOrganizationalUserRole(currentUser.role);
      const sql = isAdmin
        ? `SELECT * FROM welfare_installment_partners ORDER BY display_order ASC, created_at ASC`
        : `SELECT * FROM welfare_installment_partners WHERE is_active = 1 ORDER BY display_order ASC, created_at ASC`;
      const rows = await selectWithTimeout<any>(sql, [], 3000);
      res.json((rows || []).map(mapInstallmentPartnerRow));
    } catch (err) {
      next(err);
    }
  });

  router.post('/installments/partners', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('فقط مدیران مجاز به افزودن فروشگاه طرف قرارداد اقساطی هستند.');
      }
      const {
        name,
        tagline,
        description,
        maxCreditLimit,
        creditLimitDisplay,
        installmentTerms,
        durationMonths,
        logoUrl,
        isActive,
        displayOrder,
      } = req.body || {};

      if (!name || !String(name).trim()) {
        throw AppError.badRequest('نام فروشگاه طرف قرارداد الزامی است.');
      }

      const id = generateUUIDv7();
      const p = getPool();
      const numLimit = Math.max(0, Number(maxCreditLimit || 0));
      const limitLabel =
        String(creditLimitDisplay || '').trim() ||
        (numLimit > 0 ? `تا سقف ${numLimit.toLocaleString('fa-IR')} تومان` : 'بر اساس توافق‌نامه');

      await p.query(
        `INSERT INTO welfare_installment_partners (
          id, name, tagline, description, max_credit_limit, credit_limit_display, installment_terms, duration_months, logo_url, is_active, display_order, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          toIdBuffer(id),
          String(name).trim(),
          tagline ? String(tagline).trim() : '',
          description ? String(description).trim() : '',
          numLimit,
          limitLabel,
          installmentTerms ? String(installmentTerms).trim() : '',
          Math.max(1, Number(durationMonths || 12)),
          logoUrl ? String(logoUrl).trim() : null,
          isActive !== false ? 1 : 0,
          Number(displayOrder || 10),
        ]
      );

      const fresh = await selectWithTimeout<any>(
        `SELECT * FROM welfare_installment_partners WHERE id = ? LIMIT 1`,
        [toIdBuffer(id)],
        3000
      );
      const mapped = mapInstallmentPartnerRow(fresh[0]);
      outbox.enqueue('welfare.installment_updated', { partner: mapped });
      res.status(201).json(mapped);
    } catch (err) {
      next(err);
    }
  });

  router.put('/installments/partners/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('فقط مدیران مجاز به ویرایش فروشگاه طرف قرارداد هستند.');
      }
      const idBuf = toIdBuffer(req.params.id);
      const existing = await selectWithTimeout<any>(
        `SELECT * FROM welfare_installment_partners WHERE id = ? LIMIT 1`,
        [idBuf],
        3000
      );
      if (!existing || existing.length === 0) throw AppError.notFound('فروشگاه طرف قرارداد');
      const prev = mapInstallmentPartnerRow(existing[0]);

      const {
        name,
        tagline,
        description,
        maxCreditLimit,
        creditLimitDisplay,
        installmentTerms,
        durationMonths,
        logoUrl,
        isActive,
        displayOrder,
      } = req.body || {};

      const nextLimit = maxCreditLimit !== undefined ? Math.max(0, Number(maxCreditLimit)) : prev.maxCreditLimit;
      const p = getPool();
      await p.query(
        `UPDATE welfare_installment_partners
         SET name = ?, tagline = ?, description = ?, max_credit_limit = ?, credit_limit_display = ?, installment_terms = ?, duration_months = ?, logo_url = ?, is_active = ?, display_order = ?, version = version + 1
         WHERE id = ?`,
        [
          name !== undefined ? String(name).trim() : prev.name,
          tagline !== undefined ? String(tagline).trim() : prev.tagline,
          description !== undefined ? String(description).trim() : prev.description,
          nextLimit,
          creditLimitDisplay !== undefined ? String(creditLimitDisplay).trim() : prev.creditLimitDisplay,
          installmentTerms !== undefined ? String(installmentTerms).trim() : prev.installmentTerms,
          durationMonths !== undefined ? Math.max(1, Number(durationMonths)) : prev.durationMonths,
          logoUrl !== undefined ? (logoUrl ? String(logoUrl).trim() : null) : prev.logoUrl || null,
          isActive !== undefined ? (isActive ? 1 : 0) : prev.isActive ? 1 : 0,
          displayOrder !== undefined ? Number(displayOrder) : prev.displayOrder,
          idBuf,
        ]
      );

      const fresh = await selectWithTimeout<any>(
        `SELECT * FROM welfare_installment_partners WHERE id = ? LIMIT 1`,
        [idBuf],
        3000
      );
      const mapped = mapInstallmentPartnerRow(fresh[0]);
      outbox.enqueue('welfare.installment_updated', { partner: mapped });
      res.json(mapped);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/installments/partners/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('فقط مدیران مجاز به حذف فروشگاه طرف قرارداد هستند.');
      }
      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();
      await p.query(`DELETE FROM welfare_installment_partners WHERE id = ?`, [idBuf]);
      outbox.enqueue('welfare.installment_updated', { deletedPartnerId: req.params.id });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get('/installments/requests', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const isAdmin = isOrganizationalUserRole(currentUser.role);
      const rows = isAdmin
        ? await selectWithTimeout<any>(`SELECT * FROM welfare_installment_requests ORDER BY created_at DESC`, [], 4000)
        : await selectWithTimeout<any>(
            `SELECT * FROM welfare_installment_requests WHERE applicant_id = ? ORDER BY created_at DESC`,
            [toIdBuffer(currentUser.id)],
            4000
          );
      res.json((rows || []).map(mapInstallmentRequestRow));
    } catch (err) {
      next(err);
    }
  });

  router.post('/installments/requests', idempotencyMiddleware, async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const { partnerId, requestedAmount, months, description, phone, attachments: rawAttachments } = req.body || {};

      if (!partnerId) throw AppError.badRequest('انتخاب فروشگاه طرف قرارداد الزامی است.');
      const pRows = await selectWithTimeout<any>(
        `SELECT * FROM welfare_installment_partners WHERE id = ? AND is_active = 1 LIMIT 1`,
        [toIdBuffer(partnerId)],
        3000
      );
      if (!pRows || pRows.length === 0) throw AppError.notFound('فروشگاه طرف قرارداد فعال');
      const partner = mapInstallmentPartnerRow(pRows[0]);

      const amount = Math.round(Number(requestedAmount || 0));
      if (!Number.isFinite(amount) || amount <= 0) {
        throw AppError.badRequest('مبلغ اعتبار درخواستی باید بزرگ‌تر از صفر باشد.');
      }
      if (partner.maxCreditLimit > 0 && amount > partner.maxCreditLimit) {
        throw AppError.badRequest(
          `مبلغ درخواستی از سقف اعتبار مجاز این فروشگاه (${partner.maxCreditLimit.toLocaleString('fa-IR')} تومان) بیشتر است.`
        );
      }

      const cleanAttachments = Array.isArray(rawAttachments)
        ? rawAttachments
            .filter((a: any) => a && typeof a.url === 'string' && a.url.trim())
            .map((a: any) => ({
              url: String(a.url).trim(),
              name: String(a.name || 'مدرک پیوست').trim().slice(0, 180),
              ...(typeof a.size === 'number' ? { size: a.size } : {}),
            }))
        : [];

      const id = generateUUIDv7();
      const p = getPool();
      await p.query(
        `INSERT INTO welfare_installment_requests (
          id, partner_id, partner_name, applicant_id, applicant_name, applicant_phone, requested_amount, months, description, attachments, status, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1)`,
        [
          toIdBuffer(id),
          toIdBuffer(partner.id),
          partner.name,
          toIdBuffer(currentUser.id),
          currentUser.fullName,
          phone ? String(phone).trim() : (currentUser as any).phone || null,
          amount,
          Math.max(1, Math.min(partner.durationMonths || 36, Number(months || partner.durationMonths || 12))),
          description ? String(description).trim() : '',
          JSON.stringify(cleanAttachments),
        ]
      );

      const fresh = await selectWithTimeout<any>(
        `SELECT * FROM welfare_installment_requests WHERE id = ? LIMIT 1`,
        [toIdBuffer(id)],
        3000
      );
      const mapped = mapInstallmentRequestRow(fresh[0]);

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `ثبت درخواست خرید اقساطی از ${partner.name} به مبلغ ${amount} تومان`,
        severity: 'info',
      });

      outbox.enqueue('welfare.installment_updated', { request: mapped });
      res.status(201).json(mapped);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/installments/requests/:id/status', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('فقط مدیر مجاز به بررسی درخواست خرید اقساطی است.');
      }
      const idBuf = toIdBuffer(req.params.id);
      const { status, adminNote } = req.body || {};
      if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
        throw AppError.badRequest('وضعیت درخواست نامعتبر است.');
      }

      const p = getPool();
      const [upd]: any = await p.query(
        `UPDATE welfare_installment_requests
         SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP(3), version = version + 1
         WHERE id = ?`,
        [status, adminNote ? String(adminNote).trim() : null, currentUser.fullName, idBuf]
      );
      if (!upd || upd.affectedRows === 0) throw AppError.notFound('درخواست خرید اقساطی');

      const fresh = await selectWithTimeout<any>(
        `SELECT * FROM welfare_installment_requests WHERE id = ? LIMIT 1`,
        [idBuf],
        3000
      );
      const mapped = mapInstallmentRequestRow(fresh[0]);
      outbox.enqueue('welfare.installment_updated', { request: mapped });
      res.json(mapped);
    } catch (err) {
      next(err);
    }
  });

  // 5. Recreation & Tourism (تفریحی و گردشگری)
  function mapRecreationProgramRow(row: any): WelfareRecreationProgram {
    let gallery: string[] = [];
    if (row.gallery) {
      try {
        const parsed = typeof row.gallery === 'string' ? JSON.parse(row.gallery) : row.gallery;
        if (Array.isArray(parsed)) {
          gallery = parsed.map((u: any) => String(u).trim()).filter(Boolean);
        }
      } catch {}
    }
    const capacity = Math.max(0, Number(row.capacity || 0));
    const registeredCount = Math.max(0, Number(row.registered_count || 0));
    return {
      id: fromIdBuffer(row.id),
      title: row.title || '',
      programType: row.program_type || 'تور و اردو',
      destination: row.destination || '',
      summary: row.summary || '',
      description: row.description || '',
      scheduleText: row.schedule_text || '',
      startDate: row.start_date || undefined,
      endDate: row.end_date || undefined,
      registrationDeadline: row.registration_deadline || undefined,
      capacity,
      registeredCount,
      remainingCapacity: capacity > 0 ? Math.max(0, capacity - registeredCount) : null,
      isFree: Boolean(row.is_free),
      feeAmount: Math.max(0, Number(row.fee_amount || 0)),
      registrationMethod: row.registration_method || 'both',
      paymentInstructions: row.payment_instructions || undefined,
      cardNumber: row.card_number || undefined,
      coverImage: row.cover_image || gallery[0] || '/assets/recreation/default.jpg',
      gallery: gallery.length > 0 ? gallery : undefined,
      isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
      displayOrder: Number(row.display_order || 1),
      version: Number(row.version || 1),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    };
  }

  function mapRecreationRegistrationRow(row: any): WelfareRecreationRegistration {
    return {
      id: fromIdBuffer(row.id),
      programId: fromIdBuffer(row.program_id),
      programTitle: row.program_title || '',
      destination: row.destination || undefined,
      scheduleText: row.schedule_text || undefined,
      userId: fromIdBuffer(row.user_id),
      userName: row.user_name || '',
      userPhone: row.user_phone || undefined,
      userNationalId: row.user_national_id || undefined,
      companionsCount: Math.max(0, Number(row.companions_count || 0)),
      seatsReserved: Math.max(1, Number(row.seats_reserved || 1)),
      totalAmount: Math.max(0, Number(row.total_amount || 0)),
      paymentMethod: row.payment_method || 'free',
      trackingCode: row.tracking_code || '',
      receiptUrl: row.receipt_url || undefined,
      notes: row.notes || undefined,
      status: row.status || 'pending_review',
      adminNote: row.admin_note || undefined,
      reviewedBy: row.reviewed_by || undefined,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
      version: Number(row.version || 1),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    };
  }

  router.get('/recreation/programs', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const isAdmin = isOrganizationalUserRole(currentUser.role);
      const sql = isAdmin
        ? `SELECT * FROM welfare_recreation_programs WHERE deleted_at IS NULL ORDER BY display_order ASC, created_at DESC`
        : `SELECT * FROM welfare_recreation_programs WHERE deleted_at IS NULL AND is_active = 1 ORDER BY display_order ASC, created_at DESC`;
      const rows = await selectWithTimeout<any>(sql, [], 3000);
      res.json((rows || []).map(mapRecreationProgramRow));
    } catch (err) {
      next(err);
    }
  });

  router.post('/recreation/programs', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('فقط مدیران مجاز به ایجاد برنامه تفریحی و گردشگری هستند.');
      }

      const b = req.body || {};
      const title = String(b.title || '').trim();
      const destination = String(b.destination || '').trim();
      if (!title || !destination) {
        throw AppError.badRequest('عنوان برنامه و مقصد الزامی است.');
      }

      const id = generateUUIDv7();
      const idBuf = toIdBuffer(id);
      const isFree = Boolean(b.isFree);
      const feeAmount = isFree ? 0 : Math.max(0, Math.round(Number(b.feeAmount || 0)));
      const regMethod = isFree
        ? 'direct_free'
        : ['direct_free', 'online_gateway', 'bank_receipt', 'both'].includes(b.registrationMethod)
        ? b.registrationMethod
        : 'both';
      const coverImage = b.coverImage ? String(b.coverImage).trim() : '/assets/recreation/default.jpg';
      const gallery = Array.isArray(b.gallery)
        ? b.gallery.map((u: any) => String(u).trim()).filter(Boolean)
        : [coverImage];

      const p = getPool();
      await p.query(
        `INSERT INTO welfare_recreation_programs (
          id, title, program_type, destination, summary, description, schedule_text,
          start_date, end_date, registration_deadline, capacity, registered_count,
          is_free, fee_amount, registration_method, payment_instructions, card_number,
          cover_image, gallery, is_active, display_order, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          idBuf,
          title,
          String(b.programType || 'تور و اردو').trim(),
          destination,
          b.summary ? String(b.summary).trim() : '',
          b.description ? String(b.description).trim() : '',
          b.scheduleText ? String(b.scheduleText).trim() : '',
          b.startDate ? String(b.startDate).trim() : null,
          b.endDate ? String(b.endDate).trim() : null,
          b.registrationDeadline ? String(b.registrationDeadline).trim() : null,
          Math.max(0, Math.floor(Number(b.capacity || 0))),
          isFree ? 1 : 0,
          feeAmount,
          regMethod,
          b.paymentInstructions ? String(b.paymentInstructions).trim() : null,
          b.cardNumber ? String(b.cardNumber).trim() : null,
          coverImage,
          JSON.stringify(gallery),
          b.isActive !== false ? 1 : 0,
          Number(b.displayOrder || 1),
        ]
      );

      const fresh = await selectWithTimeout<any>(
        `SELECT * FROM welfare_recreation_programs WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
        [idBuf],
        3000
      );
      const mapped = mapRecreationProgramRow(fresh[0]);

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `ایجاد برنامه تفریحی و گردشگری: ${mapped.title}`,
        severity: 'info',
      });

      outbox.enqueue('welfare.recreation_updated', { resourceId: mapped.id, program: mapped });
      res.status(201).json(mapped);
    } catch (err) {
      next(err);
    }
  });

  router.put('/recreation/programs/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('فقط مدیران مجاز به ویرایش برنامه تفریحی و گردشگری هستند.');
      }

      const idBuf = toIdBuffer(req.params.id);
      const expectedVersion = extractExpectedVersion(req);
      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM welfare_recreation_programs WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
        [idBuf],
        3000
      );
      if (!existingRows || existingRows.length === 0) {
        throw AppError.notFound('برنامه تفریحی و گردشگری');
      }
      const prev = mapRecreationProgramRow(existingRows[0]);
      const b = req.body || {};

      const isFree = b.isFree !== undefined ? Boolean(b.isFree) : prev.isFree;
      const feeAmount = isFree
        ? 0
        : b.feeAmount !== undefined
        ? Math.max(0, Math.round(Number(b.feeAmount)))
        : prev.feeAmount;
      const regMethod = isFree
        ? 'direct_free'
        : ['direct_free', 'online_gateway', 'bank_receipt', 'both'].includes(b.registrationMethod)
        ? b.registrationMethod
        : prev.registrationMethod;
      const coverImage =
        b.coverImage !== undefined
          ? String(b.coverImage || '/assets/recreation/default.jpg').trim()
          : prev.coverImage || '/assets/recreation/default.jpg';
      const gallery =
        b.gallery !== undefined && Array.isArray(b.gallery)
          ? b.gallery.map((u: any) => String(u).trim()).filter(Boolean)
          : prev.gallery || [coverImage];

      const p = getPool();
      const [upd]: any = await p.query(
        `UPDATE welfare_recreation_programs
         SET title = ?, program_type = ?, destination = ?, summary = ?, description = ?, schedule_text = ?,
             start_date = ?, end_date = ?, registration_deadline = ?, capacity = ?,
             is_free = ?, fee_amount = ?, registration_method = ?, payment_instructions = ?, card_number = ?,
             cover_image = ?, gallery = ?, is_active = ?, display_order = ?,
             version = version + 1, updated_at = NOW(3)
         WHERE id = ? AND version = ? AND deleted_at IS NULL`,
        [
          b.title !== undefined ? String(b.title).trim() : prev.title,
          b.programType !== undefined ? String(b.programType).trim() : prev.programType,
          b.destination !== undefined ? String(b.destination).trim() : prev.destination,
          b.summary !== undefined ? String(b.summary).trim() : prev.summary,
          b.description !== undefined ? String(b.description).trim() : prev.description,
          b.scheduleText !== undefined ? String(b.scheduleText).trim() : prev.scheduleText,
          b.startDate !== undefined ? (b.startDate ? String(b.startDate).trim() : null) : prev.startDate || null,
          b.endDate !== undefined ? (b.endDate ? String(b.endDate).trim() : null) : prev.endDate || null,
          b.registrationDeadline !== undefined
            ? b.registrationDeadline
              ? String(b.registrationDeadline).trim()
              : null
            : prev.registrationDeadline || null,
          b.capacity !== undefined ? Math.max(0, Math.floor(Number(b.capacity))) : prev.capacity,
          isFree ? 1 : 0,
          feeAmount,
          regMethod,
          b.paymentInstructions !== undefined
            ? b.paymentInstructions
              ? String(b.paymentInstructions).trim()
              : null
            : prev.paymentInstructions || null,
          b.cardNumber !== undefined
            ? b.cardNumber
              ? String(b.cardNumber).trim()
              : null
            : prev.cardNumber || null,
          coverImage,
          JSON.stringify(gallery),
          b.isActive !== undefined ? (b.isActive ? 1 : 0) : prev.isActive ? 1 : 0,
          b.displayOrder !== undefined ? Number(b.displayOrder) : prev.displayOrder,
          idBuf,
          expectedVersion,
        ]
      );

      if (!upd || upd.affectedRows === 0) {
        throw AppError.conflict(
          'تداخل همزمانی در ویرایش برنامه تفریحی رخ داده است. لطفاً صفحه را به‌روزرسانی کنید.',
          'CONCURRENT_MODIFICATION_CONFLICT'
        );
      }

      const fresh = await selectWithTimeout<any>(
        `SELECT * FROM welfare_recreation_programs WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
        [idBuf],
        3000
      );
      const mapped = mapRecreationProgramRow(fresh[0]);

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `ویرایش برنامه تفریحی و گردشگری: ${mapped.title}`,
        severity: 'info',
      });

      outbox.enqueue('welfare.recreation_updated', { resourceId: mapped.id, program: mapped });
      res.json(mapped);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/recreation/programs/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('فقط مدیران مجاز به حذف برنامه تفریحی و گردشگری هستند.');
      }

      const idBuf = toIdBuffer(req.params.id);
      const expectedVersion = extractExpectedVersion(req);
      const p = getPool();
      const [upd]: any = await p.query(
        `UPDATE welfare_recreation_programs
         SET deleted_at = NOW(3), is_active = 0, version = version + 1, updated_at = NOW(3)
         WHERE id = ? AND version = ? AND deleted_at IS NULL`,
        [idBuf, expectedVersion]
      );
      if (!upd || upd.affectedRows === 0) {
        const check = await selectWithTimeout<any>(
          `SELECT id FROM welfare_recreation_programs WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
          [idBuf],
          3000
        );
        if (!check || check.length === 0) throw AppError.notFound('برنامه تفریحی و گردشگری');
        throw AppError.conflict(
          'تداخل همزمانی در حذف برنامه رخ داده است.',
          'CONCURRENT_MODIFICATION_CONFLICT'
        );
      }

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `حذف نرم برنامه تفریحی و گردشگری (${req.params.id})`,
        severity: 'warning',
      });

      outbox.enqueue('welfare.recreation_updated', { deletedProgramId: req.params.id });
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  router.get('/recreation/registrations', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const isAdmin = isOrganizationalUserRole(currentUser.role);
      const rows = isAdmin
        ? await selectWithTimeout<any>(
            `SELECT r.*, p.destination, p.schedule_text
             FROM welfare_recreation_registrations r
             LEFT JOIN welfare_recreation_programs p ON p.id = r.program_id
             WHERE r.deleted_at IS NULL
             ORDER BY r.created_at DESC`,
            [],
            4000
          )
        : await selectWithTimeout<any>(
            `SELECT r.*, p.destination, p.schedule_text
             FROM welfare_recreation_registrations r
             LEFT JOIN welfare_recreation_programs p ON p.id = r.program_id
             WHERE r.user_id = ? AND r.deleted_at IS NULL
             ORDER BY r.created_at DESC`,
            [toIdBuffer(currentUser.id)],
            4000
          );
      res.json((rows || []).map(mapRecreationRegistrationRow));
    } catch (err) {
      next(err);
    }
  });

  router.post('/recreation/registrations', idempotencyMiddleware, async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const { programId, companionsCount, paymentMethod, receiptUrl, notes, phone } = req.body || {};

      if (!programId) {
        throw AppError.badRequest('انتخاب برنامه تفریحی الزامی است.');
      }

      const cleanCompanions = Math.max(0, Math.min(10, Math.floor(Number(companionsCount || 0))));
      const seatsReserved = 1 + cleanCompanions;
      const programBuf = toIdBuffer(programId);
      const userBuf = toIdBuffer(currentUser.id);
      const regId = generateUUIDv7();
      const trackingCode = `REC-${Date.now().toString().slice(-7)}`;

      const created = await withTx(async (conn) => {
        const [progRows]: any = await conn.query(
          `SELECT * FROM welfare_recreation_programs WHERE id = ? AND deleted_at IS NULL FOR UPDATE`,
          [programBuf]
        );
        if (!progRows || progRows.length === 0) {
          throw AppError.notFound('برنامه تفریحی و گردشگری');
        }
        const prog = mapRecreationProgramRow(progRows[0]);
        if (!prog.isActive) {
          throw AppError.badRequest('ثبت‌نام این برنامه در حال حاضر غیرفعال است.');
        }

        const [dupRows]: any = await conn.query(
          `SELECT id FROM welfare_recreation_registrations
           WHERE program_id = ? AND user_id = ? AND deleted_at IS NULL AND status IN ('pending_review', 'confirmed')
           LIMIT 1`,
          [programBuf, userBuf]
        );
        if (dupRows && dupRows.length > 0) {
          throw AppError.conflict('شما قبلاً در این برنامه تفریحی ثبت‌نام کرده‌اید.');
        }

        const chosenMethod: 'free' | 'online_gateway' | 'bank_receipt' = prog.isFree
          ? 'free'
          : paymentMethod === 'bank_receipt'
          ? 'bank_receipt'
          : 'online_gateway';

        if (!prog.isFree && prog.registrationMethod === 'bank_receipt' && chosenMethod !== 'bank_receipt') {
          throw AppError.badRequest('روش ثبت‌نام این برنامه منحصراً از طریق آپلود فیش واریزی است.');
        }
        if (!prog.isFree && prog.registrationMethod === 'online_gateway' && chosenMethod !== 'online_gateway') {
          throw AppError.badRequest('روش ثبت‌نام این برنامه منحصراً پرداخت آنلاین است.');
        }
        if (chosenMethod === 'bank_receipt' && (!receiptUrl || !String(receiptUrl).trim())) {
          throw AppError.badRequest('بارگذاری تصویر فیش واریزی الزامی است.');
        }

        const [capUpd]: any = await conn.query(
          `UPDATE welfare_recreation_programs
           SET registered_count = registered_count + ?, version = version + 1, updated_at = NOW(3)
           WHERE id = ? AND deleted_at IS NULL AND is_active = 1 AND (capacity = 0 OR registered_count + ? <= capacity)`,
          [seatsReserved, programBuf, seatsReserved]
        );
        if (!capUpd || capUpd.affectedRows === 0) {
          throw AppError.conflict(
            'ظرفیت باقی‌مانده این برنامه برای تعداد نفرات درخواستی شما کافی نیست.'
          );
        }

        const totalAmount = prog.isFree ? 0 : prog.feeAmount * seatsReserved;
        const initialStatus = chosenMethod === 'bank_receipt' ? 'pending_review' : 'confirmed';

        await conn.query(
          `INSERT INTO welfare_recreation_registrations (
            id, program_id, program_title, user_id, user_name, user_phone, user_national_id,
            companions_count, seats_reserved, total_amount, payment_method, tracking_code,
            receipt_url, notes, status, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            toIdBuffer(regId),
            programBuf,
            prog.title,
            userBuf,
            currentUser.fullName,
            phone ? String(phone).trim() : (currentUser as any).phone || null,
            currentUser.nationalId || null,
            cleanCompanions,
            seatsReserved,
            totalAmount,
            chosenMethod,
            trackingCode,
            receiptUrl ? String(receiptUrl).trim() : null,
            notes ? String(notes).trim() : null,
            initialStatus,
          ]
        );

        const [freshReg]: any = await conn.query(
          `SELECT r.*, p.destination, p.schedule_text
           FROM welfare_recreation_registrations r
           LEFT JOIN welfare_recreation_programs p ON p.id = r.program_id
           WHERE r.id = ? LIMIT 1`,
          [toIdBuffer(regId)]
        );
        return mapRecreationRegistrationRow(freshReg[0]);
      });

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `ثبت‌نام در برنامه تفریحی «${created.programTitle}» (${seatsReserved} نفر)`,
        severity: 'info',
      });

      outbox.enqueue('welfare.recreation_registration_updated', { registration: created });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/recreation/registrations/:id/status', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      if (!isOrganizationalUserRole(currentUser.role)) {
        throw AppError.forbidden('فقط مدیر مجاز به بررسی ثبت‌نام برنامه‌های تفریحی است.');
      }

      const idBuf = toIdBuffer(req.params.id);
      const expectedVersion = extractExpectedVersion(req);
      const { status, adminNote } = req.body || {};
      if (!['pending_review', 'confirmed', 'rejected', 'cancelled'].includes(status)) {
        throw AppError.badRequest('وضعیت ثبت‌نام نامعتبر است.');
      }

      const updated = await withTx(async (conn) => {
        const [rows]: any = await conn.query(
          `SELECT * FROM welfare_recreation_registrations WHERE id = ? AND deleted_at IS NULL FOR UPDATE`,
          [idBuf]
        );
        if (!rows || rows.length === 0) {
          throw AppError.notFound('ثبت‌نام برنامه تفریحی');
        }
        const prev = mapRecreationRegistrationRow(rows[0]);
        if (prev.version !== expectedVersion) {
          throw AppError.conflict(
            'تداخل همزمانی در بررسی ثبت‌نام رخ داده است.',
            'CONCURRENT_MODIFICATION_CONFLICT'
          );
        }

        const wasOccupying = prev.status === 'pending_review' || prev.status === 'confirmed';
        const willOccupy = status === 'pending_review' || status === 'confirmed';
        const programBuf = toIdBuffer(prev.programId);

        if (wasOccupying && !willOccupy) {
          await conn.query(
            `UPDATE welfare_recreation_programs
             SET registered_count = GREATEST(0, registered_count - ?), version = version + 1, updated_at = NOW(3)
             WHERE id = ? AND deleted_at IS NULL`,
            [prev.seatsReserved, programBuf]
          );
        } else if (!wasOccupying && willOccupy) {
          const [capUpd]: any = await conn.query(
            `UPDATE welfare_recreation_programs
             SET registered_count = registered_count + ?, version = version + 1, updated_at = NOW(3)
             WHERE id = ? AND deleted_at IS NULL AND (capacity = 0 OR registered_count + ? <= capacity)`,
            [prev.seatsReserved, programBuf, prev.seatsReserved]
          );
          if (!capUpd || capUpd.affectedRows === 0) {
            throw AppError.conflict('ظرفیت برنامه برای تایید مجدد این ثبت‌نام کافی نیست.');
          }
        }

        const [upd]: any = await conn.query(
          `UPDATE welfare_recreation_registrations
           SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW(3), version = version + 1, updated_at = NOW(3)
           WHERE id = ? AND version = ? AND deleted_at IS NULL`,
          [status, adminNote ? String(adminNote).trim() : null, currentUser.fullName, idBuf, expectedVersion]
        );
        if (!upd || upd.affectedRows === 0) {
          throw AppError.conflict(
            'تداخل همزمانی در بررسی ثبت‌نام رخ داده است.',
            'CONCURRENT_MODIFICATION_CONFLICT'
          );
        }

        const [fresh]: any = await conn.query(
          `SELECT r.*, p.destination, p.schedule_text
           FROM welfare_recreation_registrations r
           LEFT JOIN welfare_recreation_programs p ON p.id = r.program_id
           WHERE r.id = ? LIMIT 1`,
          [idBuf]
        );
        return mapRecreationRegistrationRow(fresh[0]);
      });

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `تغییر وضعیت ثبت‌نام تفریحی ${updated.userName} به ${status}`,
        severity: 'info',
      });

      outbox.enqueue('welfare.recreation_registration_updated', { registration: updated });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });
}
