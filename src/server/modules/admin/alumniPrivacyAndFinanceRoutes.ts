import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { normalizeDigits } from '../../platform/persianNormalizer';
import { outbox } from '../../platform/outbox';
import { userRepository } from '../user/userRepository';

export function registerAlumniPrivacyAndFinanceRoutes(router: Router): void {
  // 1. Get Alumni Privacy Settings per Software Section (Accessible to all authenticated users)
  router.get('/privacy-settings', async (_req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const rows = await selectWithTimeout<any>(`SELECT * FROM alumni_privacy_settings ORDER BY section_id ASC`, [], 3000);
      res.json((rows || []).map((r: any) => ({
        sectionId: r.section_id,
        sectionTitle: r.section_title,
        revealNameOnly: Boolean(r.reveal_name_only),
        version: Number(r.version || 1),
        updatedBy: r.updated_by || undefined,
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      })));
    } catch (err) {
      next(err);
    }
  });

  // 2. Update Privacy Policy for a Section (Admin Only, Strict OCC)
  router.put('/privacy-settings/:sectionId', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin']);

      const expVer = extractExpectedVersion(req, true);
      const sectionId = req.params.sectionId;
      const revealNameOnly = Boolean(req.body.revealNameOnly);
      const p = getPool();

      const [upd]: any = await p.query(
        `UPDATE alumni_privacy_settings
         SET reveal_name_only = ?, updated_by = ?, version = version + 1
         WHERE section_id = ? AND version = ?`,
        [revealNameOnly ? 1 : 0, user.fullName, sectionId, expVer]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('تنظیمات حریم خصوصی این بخش توسط مدیر دیگری تغییر یافته است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const rows = await selectWithTimeout<any>(`SELECT * FROM alumni_privacy_settings WHERE section_id = ? LIMIT 1`, [sectionId], 3000);
      const updated = rows[0] ? {
        sectionId: rows[0].section_id,
        sectionTitle: rows[0].section_title,
        revealNameOnly: Boolean(rows[0].reveal_name_only),
        version: Number(rows[0].version || 1),
        updatedBy: rows[0].updated_by || undefined,
      } : { sectionId, revealNameOnly, version: expVer + 1 };

      outbox.enqueue('privacy.updated', {
        sectionId,
        privacySetting: updated,
        version: updated.version,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // 3. Bulk User Import into MySQL `users` table (Admin Only)
  router.post('/users/bulk-import', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        throw AppError.badRequest('فهرست کاربران ورودی برای ثبت دسته‌ای خالی است.');
      }

      const createdUsers: any[] = [];
      const skipped: Array<{ nationalId: string; reason: string }> = [];

      for (const item of rows.slice(0, 200)) {
        const nationalId = normalizeDigits(String(item.nationalId || '')).trim();
        const fullName = String(item.fullName || '').trim();
        const phone = normalizeDigits(String(item.phone || '09120000000')).trim();
        const roleTitle = String(item.roleTitle || 'دانش‌آموخته نخبه').trim();
        const organization = String(item.organization || 'قوه قضائیه').trim();
        const graduationYear = normalizeDigits(String(item.graduationYear || '۱۴۰۲')).trim();
        const province = String(item.province || 'قم').trim();
        const judicialGrade = Number(item.judicialGrade || 7);

        if (!nationalId || nationalId.length < 3 || !fullName) {
          skipped.push({ nationalId: nationalId || 'نامشخص', reason: 'کد ملی یا نام نامعتبر' });
          continue;
        }

        const existing = await userRepository.findByNationalIdOrUsername(nationalId);
        if (existing) {
          skipped.push({ nationalId, reason: 'کد ملی تکراری در دیتابیس' });
          continue;
        }

        const id = generateUUIDv7();
        const passwordHash = bcrypt.hashSync(phone, 10);

        const created = await userRepository.createUser({
          id,
          nationalId,
          username: nationalId,
          passwordHash,
          fullName,
          phone,
          role: 'alumni',
          roleTitle,
          organization,
          graduationYear,
          province,
          judicialGrade,
          mustChangePassword: true,
        });

        createdUsers.push(created);
      }

      if (createdUsers.length > 0) {
        outbox.enqueue('user.bulk_imported', {
          importedCount: createdUsers.length,
          actorName: user.fullName,
        });
      }

      res.status(201).json({
        success: true,
        importedCount: createdUsers.length,
        skippedCount: skipped.length,
        skipped,
        createdUsers,
      });
    } catch (err) {
      next(err);
    }
  });

  // 4. Comprehensive Financial Balance & Ledger Report across Domain Tables (Admin Only)
  router.get('/financial-balance', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const [enrollRows, productOrderRows, consumableOrderRows, welfareLoanRows] = await Promise.all([
        selectWithTimeout<any>(`SELECT id, course_title, user_name, amount_paid, payment_status, tracking_code, enrolled_at FROM course_enrollments ORDER BY enrolled_at DESC LIMIT 300`, [], 4000),
        selectWithTimeout<any>(`SELECT id, product_title, user_name, amount_paid, payment_status, tracking_code, ordered_at FROM product_orders ORDER BY ordered_at DESC LIMIT 300`, [], 4000),
        selectWithTimeout<any>(`SELECT id, user_name, total_price, status, payment_status, tracking_code, created_at FROM consumable_orders ORDER BY created_at DESC LIMIT 300`, [], 4000),
        selectWithTimeout<any>(`SELECT id, applicant_name, title, requested_value, status, created_at FROM welfare_requests WHERE type = 'loan' ORDER BY created_at DESC LIMIT 300`, [], 4000),
      ]);

      const coursesConfirmedIncome = (enrollRows || [])
        .filter((r: any) => r.payment_status === 'confirmed')
        .reduce((sum: number, r: any) => sum + Number(r.amount_paid || 0), 0);

      const coursesPendingIncome = (enrollRows || [])
        .filter((r: any) => r.payment_status === 'pending_review')
        .reduce((sum: number, r: any) => sum + Number(r.amount_paid || 0), 0);

      const productsConfirmedIncome = (productOrderRows || [])
        .filter((r: any) => r.payment_status === 'confirmed')
        .reduce((sum: number, r: any) => sum + Number(r.amount_paid || 0), 0);

      const cooperativeTotal = (consumableOrderRows || [])
        .filter((r: any) => r.status !== 'cancelled' && r.status !== 'لغو شده')
        .reduce((sum: number, r: any) => sum + Number(r.total_price || 0), 0);

      const ledgerEntries = [
        ...(enrollRows || []).map((r: any) => ({
          id: fromIdBuffer(r.id),
          domain: 'دوره‌های آموزشی',
          title: r.course_title,
          partyName: r.user_name,
          amount: Number(r.amount_paid || 0),
          type: 'credit' as const,
          status: r.payment_status === 'confirmed' ? 'تایید نهایی' : r.payment_status === 'rejected' ? 'رد شده' : 'در انتظار بررسی',
          trackingCode: r.tracking_code,
          date: r.enrolled_at ? new Date(r.enrolled_at).toISOString() : new Date().toISOString(),
        })),
        ...(productOrderRows || []).map((r: any) => ({
          id: fromIdBuffer(r.id),
          domain: 'انتشارات و کتب',
          title: r.product_title,
          partyName: r.user_name,
          amount: Number(r.amount_paid || 0),
          type: 'credit' as const,
          status: r.payment_status === 'confirmed' ? 'تایید نهایی' : r.payment_status === 'rejected' ? 'رد شده' : 'در انتظار بررسی',
          trackingCode: r.tracking_code,
          date: r.ordered_at ? new Date(r.ordered_at).toISOString() : new Date().toISOString(),
        })),
        ...(consumableOrderRows || []).map((r: any) => ({
          id: fromIdBuffer(r.id),
          domain: 'تعاونی مصرف اعضا',
          title: 'سفارش سبد کالای تعاونی',
          partyName: r.user_name,
          amount: Number(r.total_price || 0),
          type: 'credit' as const,
          status: r.status || 'ثبت شده',
          trackingCode: r.tracking_code,
          date: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const netTreasuryInflow = coursesConfirmedIncome + productsConfirmedIncome + cooperativeTotal;

      res.json({
        summary: {
          coursesConfirmedIncome,
          coursesPendingIncome,
          productsConfirmedIncome,
          cooperativeTotal,
          totalConfirmedRevenue: netTreasuryInflow,
          activeLoanRequestsCount: (welfareLoanRows || []).filter((w: any) => w.status === 'approved' || w.status === 'disbursed').length,
        },
        courses: {
          confirmedEnrollmentsCount: (enrollRows || []).filter((r: any) => r.payment_status === 'confirmed').length,
          totalRevenue: coursesConfirmedIncome,
        },
        publications: {
          ordersCount: (productOrderRows || []).filter((r: any) => r.payment_status === 'confirmed').length,
          totalSales: productsConfirmedIncome,
        },
        cooperative: {
          ordersCount: (consumableOrderRows || []).filter((r: any) => r.status !== 'cancelled' && r.status !== 'لغو شده').length,
          totalSales: cooperativeTotal,
        },
        welfareLoans: {
          approvedCount: (welfareLoanRows || []).filter((w: any) => w.status === 'approved' || w.status === 'disbursed').length,
          pendingCount: (welfareLoanRows || []).filter((w: any) => w.status === 'pending').length,
        },
        netTreasuryInflow,
        ledgerEntries: ledgerEntries.slice(0, 150),
      });
    } catch (err) {
      next(err);
    }
  });
}
