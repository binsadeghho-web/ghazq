import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { adminSettingsRepo } from '../admin/adminSettingsRepository';
import { auditChain } from '../../platform/auditChain';
import { outbox } from '../../platform/outbox';
import { isOrganizationalUserRole } from '../../platform/authorization';
import { DEFAULT_WELFARE_PORTAL_CONFIG } from '../../../data/welfareData';
import {
  WelfarePortalConfig,
  WelfareFundMembership,
  WelfareFundPayment,
  WelfareInstallmentPartner,
  WelfareInstallmentRequest,
} from '../../../types/welfare';
import { diffDaysIso, formatIsoToJalali, getTehranTodayIso } from '../../../utils/jalaliDate';

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
      const { city, checkInIso, nights, description, phone } = req.body || {};

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
}
