import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { outbox, OutboxMessage } from './platform/outbox';
import { generateUUIDv7 } from './platform/database';
import { storageConfig, UploadCategory } from './platform/storage';
import { storageAdapter } from './platform/storageAdapter';
import { validateSecureUploadBuffer } from './platform/uploadSecurity';
import { deleteCourseImageIfUnreferenced } from './platform/storageCleanup';
import { isOrganizationalUserRole } from './platform/authorization';
import { getPool, isDatabaseConnected } from './platform/mysqlDatabase';
import { toIdBuffer, fromIdBuffer } from './platform/uuidv7';
import { createAuthRouter } from './modules/auth/authModule';
import { createCartableRouter } from './modules/cartable/cartableModule';
import { createCoursesRouter } from './modules/courses/coursesModule';
import { createProductsRouter } from './modules/products/productsModule';
import { createCounselingRouter } from './modules/counseling/counselingModule';
import { researchRouter } from './modules/research/researchModule';
import { rulingsRouter } from './modules/rulings/rulingsModule';
import { welfareRouter } from './modules/welfare/welfareModule';
import { synergyRouter } from './modules/synergy/synergyModule';
import { createAdminRouter } from './modules/admin/adminModule';
import { createUserRouter } from './modules/user/userRoutes';
import { createOpsRouter } from './modules/ops/opsModule';
import { createDashboardRouter } from './modules/dashboard/dashboardModule';
import { createRbacRouter } from './modules/rbac/rbacModule';

// Metrics tracker for Golden Signals (Section 11)
export const metricsStore = {
  totalRequests: 0,
  successfulRequests: 0,
  errorRequests: 0,
  latencies: [] as number[],
  startedAt: new Date().toISOString(),
};

function resolveUploadCategory(rawCategoryInput: string): UploadCategory {
  const rawCategory = (rawCategoryInput || '').trim();
  const validCategories: UploadCategory[] = [
    'avatar',
    'product',
    'course',
    'consultation',
    'research',
    'verdict',
    'cartable_alumni',
    'cartable_officials',
    'product_receipt',
    'product_media',
    'course_receipt',
    'course_certificate',
    'course_file',
    'misc',
  ];

  if (rawCategory === 'profile-picture' || rawCategory === 'avatars') return 'avatar';
  if (rawCategory === 'cartable_official') return 'cartable_officials';
  if (rawCategory === 'product_receipts') return 'product_receipt';
  if (rawCategory === 'product_medias') return 'product_media';
  if (rawCategory === 'course_receipts') return 'course_receipt';
  if (rawCategory === 'course_certificates') return 'course_certificate';
  if (rawCategory === 'course_files') return 'course_file';
  if (validCategories.includes(rawCategory as UploadCategory)) return rawCategory as UploadCategory;
  return 'misc';
}

function resolveCourseSubFolder(category: UploadCategory, courseIdRaw?: string, draftKeyRaw?: string): string | undefined {
  if (category !== 'course_certificate' && category !== 'course_file') return undefined;
  const cleanCourseId = courseIdRaw ? String(courseIdRaw).replace(/[^a-zA-Z0-9_-]/g, '') : '';
  if (cleanCourseId) return `course_${cleanCourseId}`;
  const cleanDraftKey = draftKeyRaw ? String(draftKeyRaw).replace(/[^a-zA-Z0-9_-]/g, '') : '';
  if (category === 'course_file' && cleanDraftKey) return `draft_${cleanDraftKey}`;
  return undefined;
}

export function createMasterRouter(): Router {
  const router = Router();

  // Mount individual domain modules
  router.use('/auth', createAuthRouter());
  router.use('/users', createUserRouter());
  router.use('/rbac', createRbacRouter());
  router.use('/dashboard', createDashboardRouter());
  router.use('/cartable', createCartableRouter());
  router.use('/courses', createCoursesRouter());
  router.use('/products', createProductsRouter());
  router.use('/counseling', createCounselingRouter());
  router.use('/research', researchRouter);
  router.use('/rulings', rulingsRouter);
  router.use('/welfare', welfareRouter);
  router.use('/synergy', synergyRouter);
  router.use('/admin', createAdminRouter());
  router.use('/ops', createOpsRouter());

  // Ultra-Fast Raw Binary Upload Endpoint (zero base64 overhead, skips JSON & Persian normalizer parsing)
  router.post(
    '/upload-raw/:category',
    express.raw({ type: ['application/octet-stream', 'image/*', 'application/pdf', 'audio/*', 'video/*'], limit: '60mb' }),
    async (req: Request, res: Response, next) => {
      try {
        const category = resolveUploadCategory(req.params.category);
        const user = (req as any).user;
        const isPrivateCat =
          category === 'cartable_alumni' ||
          category === 'cartable_officials' ||
          category === 'consultation' ||
          category === 'research' ||
          category === 'verdict' ||
          category === 'product_receipt' ||
          category === 'product_media' ||
          category === 'course_receipt' ||
          category === 'course_certificate' ||
          category === 'course_file';

        if (isPrivateCat && !user) {
          return res.status(401).json({
            type: 'unauthorized',
            title: 'عدم احراز هویت',
            status: 401,
            detail: 'بارگذاری فایل در بخش خصوصی نیازمند ورود به سامانه است.',
            code: 'UNAUTHENTICATED',
          });
        }

        if (
          (category === 'product_media' ||
            category === 'course_certificate' ||
            category === 'course_file' ||
            category === 'cartable_officials') &&
          !isOrganizationalUserRole(user?.role)
        ) {
          return res.status(403).json({
            type: 'forbidden',
            title: 'عدم دسترسی',
            status: 403,
            detail: 'بارگذاری فایل در این بخش صرفاً برای مدیران و مسئولین مجاز است.',
            code: 'FORBIDDEN_UPLOAD_CATEGORY',
          });
        }

        const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
        const rawHeaderName = String(req.headers['x-upload-filename'] || 'upload');
        let origName = 'upload';
        try {
          origName = decodeURIComponent(rawHeaderName);
        } catch {
          origName = rawHeaderName;
        }
        const declaredMime = req.headers['x-upload-mime'] ? String(req.headers['x-upload-mime']) : undefined;
        const courseIdHeader = req.headers['x-course-id'] ? String(req.headers['x-course-id']) : undefined;
        const draftKeyHeader = req.headers['x-draft-key'] ? String(req.headers['x-draft-key']) : undefined;
        const previousUrlHeader = req.headers['x-previous-url'] ? String(req.headers['x-previous-url']) : undefined;

        const validated = validateSecureUploadBuffer(category, origName, buffer, declaredMime);
        const safeBaseOrig = path.basename(origName).replace(/\.[^.]+$/, '') || 'attachment';
        const subFolder = resolveCourseSubFolder(category, courseIdHeader, draftKeyHeader);

        const result = await storageAdapter.saveCategorizedUpload(
          category,
          `${safeBaseOrig}${validated.canonicalExt}`,
          buffer,
          validated.canonicalExt,
          subFolder
        );

        // Immediately clean up replaced unsaved temp image if admin is organizational user and old image isn't in DB
        if (previousUrlHeader && isOrganizationalUserRole(user?.role) && previousUrlHeader !== result.url) {
          deleteCourseImageIfUnreferenced(previousUrlHeader).catch(() => {});
        }

        res.json({
          success: true,
          filename: result.filename,
          originalName: origName,
          sizeBytes: buffer.length,
          url: result.url,
          category: result.category,
          isPrivate: result.isPrivate,
          mimeType: validated.mimeType,
          message: `فایل با موفقیت و سرعت بالا در پوشه ${result.category} ذخیره گردید.`,
        });
      } catch (err: any) {
        next(err);
      }
    }
  );

  // Generic Categorized Upload Endpoint with Magic-Byte Security & Private Disk Folders
  router.post('/upload/:category', async (req: Request, res: Response, next) => {
    try {
      const category = resolveUploadCategory(req.params.category);

      const user = (req as any).user;
      const isPrivateCat =
        category === 'cartable_alumni' ||
        category === 'cartable_officials' ||
        category === 'consultation' ||
        category === 'research' ||
        category === 'verdict' ||
        category === 'product_receipt' ||
        category === 'product_media' ||
        category === 'course_receipt' ||
        category === 'course_certificate' ||
        category === 'course_file';

      if (isPrivateCat && !user) {
        return res.status(401).json({
          type: 'unauthorized',
          title: 'عدم احراز هویت',
          status: 401,
          detail: 'بارگذاری فایل در بخش خصوصی نیازمند ورود به سامانه است.',
          code: 'UNAUTHENTICATED',
        });
      }

      if (category === 'product_media' && !isOrganizationalUserRole(user?.role)) {
        return res.status(403).json({
          type: 'forbidden',
          title: 'عدم دسترسی',
          status: 403,
          detail: 'بارگذاری فایل جلسات و محصولات صرفاً برای مدیران سامانه مجاز است.',
          code: 'FORBIDDEN_UPLOAD_CATEGORY',
        });
      }

      if (category === 'course_certificate' && !isOrganizationalUserRole(user?.role)) {
        return res.status(403).json({
          type: 'forbidden',
          title: 'عدم دسترسی',
          status: 403,
          detail: 'بارگذاری گواهی پایان دوره صرفاً برای مدیران و مسئولین آموزش مجاز است.',
          code: 'FORBIDDEN_UPLOAD_CATEGORY',
        });
      }

      if (category === 'course_file' && !isOrganizationalUserRole(user?.role)) {
        return res.status(403).json({
          type: 'forbidden',
          title: 'عدم دسترسی',
          status: 403,
          detail: 'بارگذاری فایل‌های دانلودی دوره صرفاً برای مدیران و مسئولین آموزش مجاز است.',
          code: 'FORBIDDEN_UPLOAD_CATEGORY',
        });
      }

      if (category === 'cartable_officials' && !isOrganizationalUserRole(user?.role)) {
        return res.status(403).json({
          type: 'forbidden',
          title: 'عدم دسترسی',
          status: 403,
          detail: 'ذخیره فایل در پوشه مسئولین صرفاً برای مدیران و مسئولین مجاز است.',
          code: 'FORBIDDEN_UPLOAD_CATEGORY',
        });
      }

      const body = req.body || {};
      const base64Input = body.base64Data || body.dataUrl;
      const origName = body.filename || body.fileName || 'upload';

      if (!base64Input || typeof base64Input !== 'string') {
        return res.status(400).json({
          type: 'bad_request',
          title: 'داده فایل نامعتبر است',
          status: 400,
          detail: 'محتوای باینری (base64) فایل ارسال نشده است.',
          code: 'EMPTY_UPLOAD',
        });
      }

      const matches = base64Input.match(/^data:([A-Za-z0-9.+\/-]+);base64,(.+)$/);
      let declaredMime: string | undefined;
      let buffer: Buffer;

      if (matches && matches.length === 3) {
        declaredMime = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(base64Input.replace(/^data:[^;]+;base64,/, ''), 'base64');
      }

      // Security Hardening: Validate Magic Bytes, block malicious executables/scripts, force canonical extension
      const validated = validateSecureUploadBuffer(category, origName, buffer, declaredMime);

      const safeBaseOrig = path.basename(origName).replace(/\.[^.]+$/, '') || 'attachment';
      const subFolder = resolveCourseSubFolder(category, body.courseId, body.draftFolderKey);
      const result = await storageAdapter.saveCategorizedUpload(
        category,
        `${safeBaseOrig}${validated.canonicalExt}`,
        buffer,
        validated.canonicalExt,
        subFolder
      );

      if (body.previousUrl && isOrganizationalUserRole(user?.role) && body.previousUrl !== result.url) {
        deleteCourseImageIfUnreferenced(String(body.previousUrl)).catch(() => {});
      }

      res.json({
        success: true,
        filename: result.filename,
        originalName: origName,
        sizeBytes: buffer.length,
        url: result.url,
        category: result.category,
        isPrivate: result.isPrivate,
        mimeType: validated.mimeType,
        message: `فایل با موفقیت پس از بررسی امنیتی در پوشه ${result.category} بر روی دیسک ذخیره گردید.`,
      });
    } catch (err: any) {
      next(err);
    }
  });

  // Protected Private File Serving Endpoint (including per-course certificate & course_files subfolders)
  router.get('/storage/private/:category/:subFolderOrFilename/:maybeFilename?', async (req: Request, res: Response) => {
    try {
      const { category, subFolderOrFilename, maybeFilename } = req.params;
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ error: 'جهت دسترسی به فایل‌های خصوصی، ثبت ورود الزامی است.' });
      }

      const catMap: Record<string, UploadCategory> = {
        consultations: 'consultation',
        consultation: 'consultation',
        research: 'research',
        verdict: 'verdict',
        verdicts: 'verdict',
        cartable_alumni: 'cartable_alumni',
        cartable_officials: 'cartable_officials',
        product_receipt: 'product_receipt',
        product_receipts: 'product_receipt',
        product_media: 'product_media',
        product_medias: 'product_media',
        course_receipt: 'course_receipt',
        course_receipts: 'course_receipt',
        course_certificate: 'course_certificate',
        course_certificates: 'course_certificate',
        course_file: 'course_file',
        course_files: 'course_file',
      };

      const storageKey = catMap[category];
      if (!storageKey) {
        return res.status(400).json({ error: 'دسته‌بندی فایل خصوصی نامعتبر است.' });
      }

      const catConfig = storageConfig.categories[storageKey];
      if (!catConfig) {
        return res.status(404).json({ error: 'پوشه یافت نشد.' });
      }

      const hasSubFolder = Boolean(maybeFilename);
      const safeSubFolder = hasSubFolder ? path.basename(subFolderOrFilename).replace(/[^a-zA-Z0-9_-]/g, '') : '';
      const rawFilename = hasSubFolder ? maybeFilename! : subFolderOrFilename;
      const safeFilename = path.basename(rawFilename);
      if (!safeFilename || safeFilename.includes('..') || safeFilename.includes('/') || safeFilename.includes('\\')) {
        return res.status(400).json({ error: 'نام فایل نامعتبر است.' });
      }

      const baseCatPath = path.resolve(catConfig.path);
      const filePath = safeSubFolder
        ? path.resolve(baseCatPath, safeSubFolder, safeFilename)
        : path.resolve(baseCatPath, safeFilename);
      if (!filePath.startsWith(baseCatPath + path.sep)) {
        return res.status(403).json({ error: 'مسیر دسترسی غیرمجاز است.' });
      }

      // Strict BOLA / Ownership guard for cartable attachments: non-officials can only access their own request attachments
      if (
        (storageKey === 'cartable_alumni' || storageKey === 'cartable_officials') &&
        !isOrganizationalUserRole(user.role)
      ) {
        if (!isDatabaseConnected()) {
          return res.status(503).json({ error: 'پایگاه داده در دسترس نیست.' });
        }
        const p = getPool();
        const fileUrlSuffix = `%/${catConfig.folderName}/${safeFilename}%`;
        const userIdBuf = toIdBuffer(user.id);
        const [rows]: any = await p.query(
          `SELECT r.id, r.applicant_id
           FROM cartable_requests r
           LEFT JOIN cartable_messages m ON m.request_id = r.id
           WHERE (CAST(r.attachments AS CHAR) LIKE ? OR CAST(m.attachments AS CHAR) LIKE ?)
           LIMIT 5`,
          [fileUrlSuffix, fileUrlSuffix]
        );
        const ownsFile = Array.isArray(rows) && rows.some((r: any) => {
          const ownerStr = Buffer.isBuffer(r.applicant_id) ? fromIdBuffer(r.applicant_id) : String(r.applicant_id);
          return ownerStr === user.id || Buffer.compare(toIdBuffer(ownerStr), userIdBuf) === 0;
        });
        if (!ownsFile) {
          return res.status(403).json({ error: 'عدم دسترسی: این فایل متعلق به درخواست‌های شما نیست.' });
        }
      }

      // Strict BOLA / Visibility guard for verdict attachments: non-officials can only view attachments
      // attached to rulings they submitted OR rulings explicitly marked visible & published to alumni
      if (storageKey === 'verdict' && !isOrganizationalUserRole(user.role)) {
        if (!isDatabaseConnected()) {
          return res.status(503).json({ error: 'پایگاه داده در دسترس نیست.' });
        }
        const p = getPool();
        const fileUrlSuffix = `%/${catConfig.folderName}/${safeFilename}%`;
        const userIdBuf = toIdBuffer(user.id);
        const [rows]: any = await p.query(
          `SELECT id, status, is_visible_to_alumni, submitted_by_id
           FROM judicial_rulings
           WHERE CAST(attachments AS CHAR) LIKE ?
           LIMIT 5`,
          [fileUrlSuffix]
        );
        const canAccessVerdictFile = Array.isArray(rows) && rows.some((r: any) => {
          const ownerStr = Buffer.isBuffer(r.submitted_by_id) ? fromIdBuffer(r.submitted_by_id) : String(r.submitted_by_id);
          const isOwner = ownerStr === user.id || Buffer.compare(toIdBuffer(ownerStr), userIdBuf) === 0;
          const isPublishedVisible = r.status === 'selected' && Boolean(r.is_visible_to_alumni);
          return isOwner || isPublishedVisible;
        });
        if (!canAccessVerdictFile) {
          return res.status(403).json({ error: 'عدم دسترسی: این پیوست مربوط به رأی منتشرنشده است.' });
        }
      }

      // Strict BOLA guard for product payment receipts: only order owner or officials
      if (storageKey === 'product_receipt' && !isOrganizationalUserRole(user.role)) {
        if (!isDatabaseConnected()) {
          return res.status(503).json({ error: 'پایگاه داده در دسترس نیست.' });
        }
        const p = getPool();
        const fileUrlSuffix = `%/${catConfig.folderName}/${safeFilename}%`;
        const userIdBuf = toIdBuffer(user.id);
        const [rows]: any = await p.query(
          `SELECT id, user_id
           FROM product_orders
           WHERE receipt_file_url LIKE ? AND deleted_at IS NULL
           LIMIT 5`,
          [fileUrlSuffix]
        );
        const ownsReceipt = Array.isArray(rows) && rows.some((r: any) => {
          const ownerStr = Buffer.isBuffer(r.user_id) ? fromIdBuffer(r.user_id) : String(r.user_id);
          return ownerStr === user.id || Buffer.compare(toIdBuffer(ownerStr), userIdBuf) === 0;
        });
        if (!ownsReceipt) {
          return res.status(403).json({ error: 'عدم دسترسی: این تصویر فیش متعلق به سفارش‌های شما نیست.' });
        }
      }

      // Strict BOLA guard for product session media downloads: only confirmed purchasers or officials
      if (storageKey === 'product_media' && !isOrganizationalUserRole(user.role)) {
        if (!isDatabaseConnected()) {
          return res.status(503).json({ error: 'پایگاه داده در دسترس نیست.' });
        }
        const p = getPool();
        const fileUrlSuffix = `%/${catConfig.folderName}/${safeFilename}%`;
        const userIdBuf = toIdBuffer(user.id);
        const [rows]: any = await p.query(
          `SELECT p.id
           FROM products p
           INNER JOIN product_orders po ON (po.product_id = p.id)
           WHERE (po.user_id = ? OR po.user_id = ?)
             AND po.payment_status = 'confirmed'
             AND po.deleted_at IS NULL
             AND (p.is_deleted = 0 OR p.is_deleted IS NULL)
             AND (p.download_link LIKE ? OR CAST(p.media_sessions AS CHAR) LIKE ?)
           LIMIT 1`,
          [userIdBuf, user.id, fileUrlSuffix, fileUrlSuffix]
        );
        if (!Array.isArray(rows) || rows.length === 0) {
          return res.status(403).json({ error: 'عدم دسترسی: دریافت فایل جلسات منوط به تکمیل و تایید ثبت‌نام/خرید است.' });
        }
      }

      // Strict BOLA guard for course payment/installment receipts: only payer or officials
      if (storageKey === 'course_receipt' && !isOrganizationalUserRole(user.role)) {
        if (!isDatabaseConnected()) {
          return res.status(503).json({ error: 'پایگاه داده در دسترس نیست.' });
        }
        const p = getPool();
        const fileUrlSuffix = `%/${catConfig.folderName}/${safeFilename}%`;
        const userIdBuf = toIdBuffer(user.id);
        const [enrRows]: any = await p.query(
          `SELECT user_id FROM course_enrollments WHERE receipt_file_url LIKE ? LIMIT 5`,
          [fileUrlSuffix]
        );
        const [instRows]: any = await p.query(
          `SELECT user_id FROM course_installments WHERE receipt_file_url LIKE ? AND deleted_at IS NULL LIMIT 5`,
          [fileUrlSuffix]
        );
        const allRows = [...(enrRows || []), ...(instRows || [])];
        const ownsCourseReceipt = allRows.some((r: any) => {
          const ownerStr = Buffer.isBuffer(r.user_id) ? fromIdBuffer(r.user_id) : String(r.user_id);
          return ownerStr === user.id || Buffer.compare(toIdBuffer(ownerStr), userIdBuf) === 0;
        });
        if (!ownsCourseReceipt) {
          return res.status(403).json({ error: 'عدم دسترسی: این فیش متعلق به ثبت‌نام یا اقساط شما نیست.' });
        }
      }

      // Strict BOLA guard for course certificates: only certificate owner or officials
      if (storageKey === 'course_certificate' && !isOrganizationalUserRole(user.role)) {
        if (!isDatabaseConnected()) {
          return res.status(503).json({ error: 'پایگاه داده در دسترس نیست.' });
        }
        const p = getPool();
        const fileUrlSuffix = safeSubFolder
          ? `%/${catConfig.folderName}/${safeSubFolder}/${safeFilename}%`
          : `%/${catConfig.folderName}/${safeFilename}%`;
        const userIdBuf = toIdBuffer(user.id);
        const [certRows]: any = await p.query(
          `SELECT user_id FROM course_certificates WHERE certificate_file_url LIKE ? AND (deleted_at IS NULL) LIMIT 5`,
          [fileUrlSuffix]
        );
        const ownsCert = Array.isArray(certRows) && certRows.some((r: any) => {
          const ownerStr = Buffer.isBuffer(r.user_id) ? fromIdBuffer(r.user_id) : String(r.user_id);
          return ownerStr === user.id || Buffer.compare(toIdBuffer(ownerStr), userIdBuf) === 0;
        });
        if (!ownsCert) {
          return res.status(403).json({ error: 'عدم دسترسی: این گواهی دوره متعلق به شما نیست.' });
        }
      }

      // Strict BOLA guard for course downloadable files: only officials OR active confirmed enrollees (not removed from class) OR courses with archive_access='all'
      if (storageKey === 'course_file' && !isOrganizationalUserRole(user.role)) {
        if (!isDatabaseConnected()) {
          return res.status(503).json({ error: 'پایگاه داده در دسترس نیست.' });
        }
        const p = getPool();
        const userIdBuf = toIdBuffer(user.id);
        const courseIdFromSubFolder = safeSubFolder.startsWith('course_')
          ? safeSubFolder.slice('course_'.length)
          : '';
        const fileUrlSuffix = safeSubFolder
          ? `%/${catConfig.folderName}/${safeSubFolder}/${safeFilename}%`
          : `%/${catConfig.folderName}/${safeFilename}%`;

        let authorized = false;
        if (courseIdFromSubFolder) {
          const cBuf = toIdBuffer(courseIdFromSubFolder);
          const [courseRows]: any = await p.query(
            `SELECT id, archive_access, is_deleted FROM courses WHERE (id = ? OR id = ?) AND is_deleted = 0 LIMIT 1`,
            [cBuf, courseIdFromSubFolder]
          );
          if (Array.isArray(courseRows) && courseRows.length > 0) {
            if (courseRows[0].archive_access === 'all') {
              authorized = true;
            } else {
              const [enrRows]: any = await p.query(
                `SELECT id FROM course_enrollments
                 WHERE (course_id = ? OR course_id = ?)
                   AND (user_id = ? OR user_id = ?)
                   AND payment_status = 'confirmed'
                   AND (class_status IS NULL OR class_status != 'removed')
                 LIMIT 1`,
                [cBuf, courseIdFromSubFolder, userIdBuf, user.id]
              );
              authorized = Array.isArray(enrRows) && enrRows.length > 0;
            }
          }
        } else {
          const [rows]: any = await p.query(
            `SELECT c.id
             FROM courses c
             LEFT JOIN course_enrollments ce
               ON ce.course_id = c.id
               AND (ce.user_id = ? OR ce.user_id = ?)
               AND ce.payment_status = 'confirmed'
               AND (ce.class_status IS NULL OR ce.class_status != 'removed')
             WHERE c.is_deleted = 0
               AND (CAST(c.offline_download_files AS CHAR) LIKE ? OR c.offline_download_url LIKE ?)
               AND (c.archive_access = 'all' OR ce.id IS NOT NULL)
             LIMIT 1`,
            [userIdBuf, user.id, fileUrlSuffix, fileUrlSuffix]
          );
          authorized = Array.isArray(rows) && rows.length > 0;
        }

        if (!authorized) {
          return res.status(403).json({
            error: 'عدم دسترسی: دریافت فایل‌های این دوره منوط به ثبت‌نام قطعی و عضویت فعال در کلاس است.',
          });
        }
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'فایل درخواستی روی دیسک یافت نشد.' });
      }

      // Harden response headers so uploaded content cannot execute scripts in browser context
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);

      res.sendFile(filePath);
    } catch (err: any) {
      res.status(500).json({ error: `خطا در دریافت فایل خصوصی: ${err?.message || err}` });
    }
  });

  // Golden Signals Observability Metrics (Section 11 & Item 1: Strict Admin Session or SHA-256 timingSafeEqual Token)
  router.get('/metrics', (req: Request, res: Response) => {
    let isAuthorized = false;

    // 1. Check real server-verified admin session
    const sessionUser = (req as any).user;
    if (sessionUser && (sessionUser.role === 'admin' || sessionUser.role === 'super_admin' || sessionUser.role === 'alumni_manager')) {
      isAuthorized = true;
    }

    // 2. Check METRICS_SECRET environment variable (disabled if env variable is unset)
    const metricsSecretEnv = process.env.METRICS_SECRET;
    if (!isAuthorized && metricsSecretEnv && metricsSecretEnv.trim().length > 0) {
      const authHeader = req.headers['authorization'] || '';
      const tokenHeader = (req.headers['x-metrics-token'] as string) ||
        (authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '');

      if (tokenHeader.length > 0) {
        const hashExpected = crypto.createHash('sha256').update(metricsSecretEnv.trim()).digest();
        const hashReceived = crypto.createHash('sha256').update(tokenHeader.trim()).digest();
        if (crypto.timingSafeEqual(hashExpected, hashReceived)) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        type: 'forbidden',
        title: 'دسترسی غیرمجاز',
        status: 403,
        detail: 'مشاهده متریک‌های عملکردی سامانه فقط با نشست ادمین یا توکن معتبر متغیر محیطی مجاز است.',
        code: 'ACCESS_DENIED'
      });
    }

    const sorted = [...metricsStore.latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 14;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 36;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 75;
    const total = metricsStore.totalRequests || 1;
    const successRate = total > 0 ? ((metricsStore.successfulRequests / total) * 100) : 100;
    const errorRate = 100 - successRate;

    res.json({
      traffic: metricsStore.totalRequests,
      successRate: Math.round(successRate * 10) / 10,
      errorRate: Math.round(errorRate * 10) / 10,
      p50Latency: Math.round(p50),
      p95Latency: Math.round(p95),
      p99Latency: Math.round(p99),
      latencyMs: {
        p50: Math.round(p50),
        p95: Math.round(p95),
        p99: Math.round(p99),
      },
      errors: {
        client4xx: metricsStore.errorRequests,
        server5xx: 0,
      },
      goldenSignals: {
        traffic: metricsStore.totalRequests,
        successCount: metricsStore.successfulRequests,
        errorCount: metricsStore.errorRequests,
        errorRatePercent: errorRate.toFixed(2),
        latencyMs: {
          p50: Math.round(p50),
          p95: Math.round(p95),
          p99: Math.round(p99),
        },
        uptimeSince: metricsStore.startedAt,
      },
      slos: {
        latencyTargetP95: '< 300ms',
        statusTarget: '99.9% success',
        isHealthy: p95 < 300 && (metricsStore.errorRequests / (metricsStore.totalRequests || 1)) < 0.05,
      },
    });
  });

  // Map tracking active SSE connections per user for concurrency capping and immediate revocation (Item 8)
  const userSseConnections = new Map<string, Set<Response>>();
  const MAX_SSE_PER_USER = 3;

  // Single-use 30-second SSE ticket store (Data Architecture Section 8.1)
  const sseTicketStore = new Map<string, { user: any; expiresAt: number }>();

  // Single-use 30-second Ticket Issuance Endpoint for SSE (Section 8.1)
  router.post('/events/ticket', (req: Request, res: Response) => {
    const currentUser = (req as any).user;
    if (!currentUser || !currentUser.id) {
      return res.status(401).json({
        type: 'unauthorized',
        title: 'عدم احراز هویت',
        status: 401,
        detail: 'دریافت بلیت اتصال بلادرنگ نیازمند نشست معتبر است.',
        code: 'UNAUTHENTICATED'
      });
    }

    const ticket = generateUUIDv7();
    const expiresAt = Date.now() + 30000; // 30 seconds TTL
    sseTicketStore.set(ticket, { user: currentUser, expiresAt });

    // Evict expired tickets
    const now = Date.now();
    for (const [key, val] of sseTicketStore.entries()) {
      if (val.expiresAt < now) sseTicketStore.delete(key);
    }

    res.status(200).json({
      ticket,
      expiresInSeconds: 30,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  });

  // Real-time Server-Sent Events (SSE) (Section 8 & Item 2, 8)
  router.get('/events', (req: Request, res: Response) => {
    // 1. Authenticate strictly: via Authorization Bearer header OR single-use 30-second ticket (No permanent token in URL)
    let currentUser = (req as any).user;

    const ticketParam = req.query.ticket as string | undefined;
    if (!currentUser && ticketParam) {
      const ticketRecord = sseTicketStore.get(ticketParam);
      if (ticketRecord && ticketRecord.expiresAt > Date.now()) {
        currentUser = ticketRecord.user;
        sseTicketStore.delete(ticketParam); // Single-use consumption
      }
    }

    if (!currentUser || !currentUser.id) {
      return res.status(401).json({
        type: 'unauthorized',
        title: 'عدم احراز هویت',
        status: 401,
        detail: 'برقراری اتصال بلادرنگ نیازمند نشست معتبر است.',
        code: 'UNAUTHENTICATED'
      });
    }

    const userId = currentUser.id;
    const userRole = currentUser.role;

    // 2. Concurrency Capping per User (Item 8: Max 3 concurrent SSE connections per user)
    const activeConns = userSseConnections.get(userId) || new Set<Response>();
    if (activeConns.size >= MAX_SSE_PER_USER) {
      // Close oldest connection to make room or return 429
      const oldest = activeConns.values().next().value;
      if (oldest) {
        oldest.write(`event: error\ndata: ${JSON.stringify({ message: 'اتصال قدیمی به دلیل باز شدن پنجره جدید بسته شد.' })}\n\n`);
        oldest.end();
        activeConns.delete(oldest);
      }
    }
    activeConns.add(res);
    userSseConnections.set(userId, activeConns);

    // SSE headers with compression disabled & proxy buffering off
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx / Cloud Run buffering off

    res.flushHeaders?.();

    // Initial connected message with Last-Event-ID support
    res.write(`id: ${Date.now()}\nevent: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);

    // Subscribe to outbox events with authorization filtering, LEAK PREVENTION and IMMEDIATE REVOCATION
    const unsubscribe = outbox.subscribe('*', (msg: OutboxMessage) => {
      const payload: any = msg.payload || {};

      // Item 8: Immediate Disconnect on Session Revocation, Token Version Bump, or User Suspension
      if (
        (msg.topic === 'auth.session_revoked' ||
         msg.topic === 'auth.token_version_bumped' ||
         msg.topic === 'user.suspended') &&
        payload.userId === userId
      ) {
        res.write(`event: session_terminated\ndata: ${JSON.stringify({ reason: 'نشست کاربری ابطال یا معلق گردید.' })}\n\n`);
        res.end();
        return;
      }

      // Item 2: User events are strictly restricted to Organizational Roles (Information Leak Prevention)
      if (msg.topic.startsWith('user.') && !isOrganizationalUserRole(userRole)) {
        return;
      }

      // Authorization filtering: private items only go to owners or organizational officials
      const isPrivateResearchTopic =
        msg.topic.startsWith('research.') && msg.topic !== 'research.config_updated';
      const isPrivateCounselingTopic =
        msg.topic === 'counseling.requested' ||
        msg.topic === 'counseling.updated' ||
        msg.topic === 'counseling.identity_toggled' ||
        msg.topic === 'counseling.dossier_created' ||
        msg.topic === 'counseling.test_assigned' ||
        msg.topic === 'counseling.test_submitted' ||
        msg.topic === 'counseling.test_reviewed';
      const isPrivateTopic =
        msg.topic.startsWith('cartable.') ||
        msg.topic.startsWith('private_msg.') ||
        isPrivateResearchTopic ||
        isPrivateCounselingTopic;
      if (isPrivateTopic && !isOrganizationalUserRole(userRole)) {
        const ownerId = payload.applicantId || payload.recipientId || payload.userId || payload.dossier?.applicantId;
        if (ownerId && ownerId !== userId) {
          return; // Suppress event; unauthorized recipient (Leak Prevention)
        }
      }

      // Privacy guard for Judicial Rulings SSE events (Reforms 14 & 17):
      // Never leak adminTags, internalReviewNote, internalTagDefinitions, or unpublished rulings to non-officials!
      let sanitizedUpdates = payload.updates || payload.config || payload;
      if (msg.topic.startsWith('rulings.') && !isOrganizationalUserRole(userRole)) {
        if (msg.topic === 'rulings.portal_config_updated' && sanitizedUpdates) {
          sanitizedUpdates = { ...sanitizedUpdates, internalTagDefinitions: [] };
        } else {
          const rulingCandidate = sanitizedUpdates?.ruling || (sanitizedUpdates?.id && sanitizedUpdates?.title ? sanitizedUpdates : null);
          if (rulingCandidate) {
            const isPublicVisible = rulingCandidate.status === 'selected' && Boolean(rulingCandidate.isVisibleToAlumni);
            if (!isPublicVisible) {
              // Emit lightweight removal signal if an existing published ruling was hidden; otherwise suppress unpublished creation
              if (msg.topic === 'rulings.updated') {
                sanitizedUpdates = { removedRulingId: rulingCandidate.id };
              } else {
                return;
              }
            } else {
              const { adminTags: _a, internalReviewNote: _n, ...safeRuling } = rulingCandidate;
              sanitizedUpdates = sanitizedUpdates?.ruling
                ? { ...sanitizedUpdates, ruling: safeRuling }
                : safeRuling;
            }
          }
        }
      }

      // Delta-Payload Construction for Real-Time Direct State Patching
      const resourceId = payload.id || payload.requestId || payload.courseId || payload.productId || payload.userId || payload.orderId || null;
      const version = payload.version || payload.newVersion || 1;
      const actor = (payload.actorId || payload.actor)
        ? { id: payload.actorId || payload.actor?.id, name: payload.actorName || payload.actor?.name }
        : undefined;

      const updates = sanitizedUpdates;

      const deltaPayload = {
        id: msg.id,
        type: msg.topic,
        data: {
          resourceId,
          version,
          updates,
          actor,
        },
        timestamp: Date.now(),
      };

      res.write(`id: ${msg.id}\nevent: ${msg.topic}\ndata: ${JSON.stringify(deltaPayload)}\n\n`);
    });

    // Heartbeat every 15 seconds (Section 8.5)
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      const currentConns = userSseConnections.get(userId);
      if (currentConns) {
        currentConns.delete(res);
        if (currentConns.size === 0) {
          userSseConnections.delete(userId);
        }
      }
    });
  });

  return router;
}
