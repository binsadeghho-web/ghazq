import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, withTx, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { outbox } from '../../platform/outbox';
import { auditChain } from '../../platform/auditChain';
import { AuthorizationPolicy, AuthContext, isOrganizationalUserRole } from '../../platform/authorization';
import {
  CartableRequest,
  CartableMessage,
  CartableApplicantProfile,
  RequestStatus,
  CartableCategory,
  RequestPriority,
} from '../../../types';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import {
  registerCartableReferralRoutes,
  DEFAULT_CARTABLE_CATEGORIES,
  normalizeCategoryItem,
} from './cartableReferralAndAttachmentsRoutes';

function parseAttachmentsArray(raw: any): string[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      return parsed.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
    }
  } catch {}
  return [];
}

function sanitizeAttachmentUrls(urls?: string[]): string[] {
  if (!Array.isArray(urls)) return [];
  return urls
    .filter((u): u is string => typeof u === 'string')
    .map(u => u.trim())
    .filter(u =>
      u.startsWith('/api/storage/private/cartable_alumni/') ||
      u.startsWith('/api/storage/private/cartable_officials/') ||
      u.startsWith('/uploads/')
    );
}

function mapCartableRequestRow(
  row: any,
  messages: CartableMessage[] = [],
  includeApplicantProfile = false
): CartableRequest & { version: number; trackingCode?: string } {
  const trackingNumber = row.tracking_number || row.tracking_code || '';
  const attachments = parseAttachmentsArray(row.attachments);

  const priority = row.priority || 'normal';
  const defaultSla = priority === 'instant' ? 4 : priority === 'urgent' ? 24 : 48;

  let applicantProfile: CartableApplicantProfile | undefined = undefined;
  if (includeApplicantProfile) {
    applicantProfile = {
      id: fromIdBuffer(row.applicant_id),
      fullName: row.user_full_name || row.applicant_name || '',
      phone: row.user_phone || '',
      nationalId: row.user_national_id || '',
      roleTitle: row.user_role_title || row.applicant_role_title || 'دانش‌آموخته',
      organization: row.user_organization || undefined,
      province: row.user_province || undefined,
      graduationYear: row.user_graduation_year || undefined,
      academicDegree: row.user_academic_degree || undefined,
      currentJudicialPost: row.user_current_judicial_post || undefined,
      email: row.user_email || undefined,
    };
  }

  return {
    id: fromIdBuffer(row.id),
    trackingNumber,
    trackingCode: trackingNumber,
    category: row.category,
    categoryTitle: row.category_title,
    title: row.title,
    description: row.description,
    applicantId: fromIdBuffer(row.applicant_id),
    applicantName: row.applicant_name,
    applicantRoleTitle: row.applicant_role_title,
    applicantProfile,
    priority,
    status: row.status,
    hasUnreadSupervisor: Boolean(row.has_unread_supervisor),
    hasUnreadApplicant: Boolean(row.has_unread_applicant),
    attachments,
    referredDepartment: row.referred_department || undefined,
    assignedOfficialRole: row.assigned_official_role || undefined,
    internalReferralNote: row.internal_referral_note || undefined,
    slaDeadlineHours: Number(row.sla_deadline_hours || defaultSla),
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    messages,
  } as CartableRequest & { version: number; trackingCode?: string };
}

function mapCartableMessageRow(row: any): CartableMessage {
  const attachments = parseAttachmentsArray(row.attachments);

  return {
    id: fromIdBuffer(row.id),
    senderId: fromIdBuffer(row.sender_id),
    senderName: row.sender_name,
    senderRole: row.sender_role,
    text: row.text,
    attachments: attachments.length > 0 ? attachments : undefined,
    timestamp: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export interface ICartableRepository {
  findAll(filter?: {
    applicantId?: string;
    status?: string;
    includeApplicantProfile?: boolean;
  }): Promise<Array<CartableRequest & { version: number }>>;
  findById(
    id: string,
    includeApplicantProfile?: boolean
  ): Promise<(CartableRequest & { version: number }) | undefined>;
  create(request: CartableRequest & { version: number }): Promise<CartableRequest & { version: number }>;
}

const REQUEST_SELECT_WITH_USER = `
  SELECT c.*,
         u.full_name AS user_full_name,
         u.phone AS user_phone,
         u.national_id AS user_national_id,
         u.role_title AS user_role_title,
         u.organization AS user_organization,
         u.province AS user_province,
         u.graduation_year AS user_graduation_year,
         u.academic_degree AS user_academic_degree,
         u.current_judicial_post AS user_current_judicial_post,
         u.email AS user_email
  FROM cartable_requests c
  LEFT JOIN users u ON c.applicant_id = u.id AND u.deleted_at IS NULL
`;

export class CartableRepository implements ICartableRepository {
  async findAll(filter?: {
    applicantId?: string;
    status?: string;
    includeApplicantProfile?: boolean;
  }): Promise<Array<CartableRequest & { version: number }>> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const p = getPool();
    let sql = `${REQUEST_SELECT_WITH_USER} WHERE 1=1`;
    const params: any[] = [];

    if (filter?.applicantId) {
      sql += ` AND (c.applicant_id = ? OR c.applicant_id = ?)`;
      params.push(toIdBuffer(filter.applicantId), filter.applicantId);
    }
    if (filter?.status) {
      sql += ` AND c.status = ?`;
      params.push(filter.status);
    }
    sql += ` ORDER BY c.created_at DESC LIMIT 200`;

    const rows = await selectWithTimeout<any>(sql, params, 4000);
    if (!rows || rows.length === 0) return [];

    const results: Array<CartableRequest & { version: number }> = [];
    for (const row of rows) {
      const reqIdBuf = toIdBuffer(row.id);
      const reqIdStr = fromIdBuffer(row.id);
      const [msgRows] = await p.query<any[]>(
        `SELECT * FROM cartable_messages WHERE request_id = ? OR request_id = ? ORDER BY created_at ASC`,
        [reqIdBuf, reqIdStr]
      );
      const messages = (msgRows || []).map(mapCartableMessageRow);
      results.push(mapCartableRequestRow(row, messages, Boolean(filter?.includeApplicantProfile)));
    }
    return results;
  }

  async findById(
    id: string,
    includeApplicantProfile = false
  ): Promise<(CartableRequest & { version: number }) | undefined> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const p = getPool();
    const idBuf = toIdBuffer(id);
    const rows = await selectWithTimeout<any>(
      `${REQUEST_SELECT_WITH_USER} WHERE c.id = ? OR c.id = ? LIMIT 1`,
      [idBuf, id],
      3000
    );
    if (!rows || rows.length === 0) return undefined;

    const row = rows[0];
    const [msgRows] = await p.query<any[]>(
      `SELECT * FROM cartable_messages WHERE request_id = ? OR request_id = ? ORDER BY created_at ASC`,
      [toIdBuffer(row.id), fromIdBuffer(row.id)]
    );
    const messages = (msgRows || []).map(mapCartableMessageRow);
    return mapCartableRequestRow(row, messages, includeApplicantProfile);
  }

  async create(request: CartableRequest & { version: number }): Promise<CartableRequest & { version: number }> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const p = getPool();
    const idBuf = toIdBuffer(request.id);
    const applicantBuf = toIdBuffer(request.applicantId);
    const reqAttachments = Array.isArray(request.attachments) && request.attachments.length > 0
      ? JSON.stringify(request.attachments)
      : null;

    await withTx(async (conn) => {
      await conn.query(
        `INSERT INTO cartable_requests (
          id, tracking_number, category, category_title, title, description,
          applicant_id, applicant_name, applicant_role_title, priority, status,
          has_unread_supervisor, has_unread_applicant, attachments, version,
          referred_department, assigned_official_role, internal_referral_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          idBuf,
          request.trackingNumber,
          request.category,
          request.categoryTitle,
          request.title,
          request.description,
          applicantBuf,
          request.applicantName,
          request.applicantRoleTitle,
          request.priority,
          request.status,
          request.hasUnreadSupervisor ? 1 : 0,
          request.hasUnreadApplicant ? 1 : 0,
          reqAttachments,
          request.version,
          request.referredDepartment || null,
          request.assignedOfficialRole || null,
          request.internalReferralNote || null,
        ]
      );

      for (const msg of request.messages) {
        await conn.query(
          `INSERT INTO cartable_messages (id, request_id, sender_id, sender_name, sender_role, text, attachments)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            toIdBuffer(msg.id),
            idBuf,
            toIdBuffer(msg.senderId),
            msg.senderName,
            msg.senderRole,
            msg.text,
            msg.attachments && msg.attachments.length > 0 ? JSON.stringify(msg.attachments) : null,
          ]
        );
      }
    });

    return request;
  }
}

export class CartableService {
  constructor(private repo: ICartableRepository) {}

  async getRequests(authCtx: AuthContext): Promise<Array<CartableRequest & { version: number }>> {
    const isOfficial = isOrganizationalUserRole(authCtx.role);
    if (!isOfficial) {
      return this.repo.findAll({ applicantId: authCtx.userId, includeApplicantProfile: false });
    }
    return this.repo.findAll({ includeApplicantProfile: true });
  }

  async getRequestById(authCtx: AuthContext, id: string): Promise<CartableRequest & { version: number }> {
    const isOfficial = isOrganizationalUserRole(authCtx.role);
    const item = await this.repo.findById(id, isOfficial);
    if (!item) throw AppError.notFound(`درخواست کارتابل با شناسه ${id}`);
    AuthorizationPolicy.assertOwnership(authCtx, item.applicantId, 'درخواست کارتابل');
    return item;
  }

  async createRequest(
    authCtx: AuthContext,
    dto: {
      category?: CartableCategory;
      categoryTitle?: string;
      title: string;
      description: string;
      priority: RequestPriority;
      initialMessageText?: string;
      attachments?: string[];
    }
  ): Promise<CartableRequest & { version: number }> {
    if (!dto.title || !dto.title.trim() || !dto.description || !dto.description.trim()) {
      throw AppError.badRequest('عنوان و شرح درخواست الزامی است.');
    }

    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const p = getPool();

    const id = generateUUIDv7();
    const trackingNumber = `TRK-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const sanitizedAttachments = sanitizeAttachmentUrls(dto.attachments);

    // Fetch applicant roleTitle cleanly from DB
    let resolvedRoleTitle = isOrganizationalUserRole(authCtx.role)
      ? 'مسئول / مدیر سامانه'
      : authCtx.role === 'customer'
      ? 'کاربر مشتری'
      : 'دانش‌آموخته';
    try {
      const [userRows] = await p.query<any[]>(
        `SELECT role_title FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
        [toIdBuffer(authCtx.userId)]
      );
      if (userRows?.[0]?.role_title) {
        resolvedRoleTitle = userRows[0].role_title;
      }
    } catch {}

    // Auto-referral routing based on Cartable Config (supports turning categories OFF -> routes all to alumni_manager)
    let resolvedCategory: string = (dto.category || 'general').trim() || 'general';
    let resolvedCategoryTitle: string = (dto.categoryTitle || '').trim();
    let autoReferredDepartment = 'مدیر دانش‌آموختگان';
    let assignedOfficialRole = 'alumni_manager';
    let autoInternalNote = 'ارجاع مستقیم به مدیر دانش‌آموختگان';

    try {
      const [rows] = await p.query<any[]>(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'cartable_config' LIMIT 1`
      );
      let val: any = null;
      if (rows && rows.length > 0) {
        val = typeof rows[0].setting_value === 'string'
          ? JSON.parse(rows[0].setting_value)
          : rows[0].setting_value;
      }

      const rawCategories = Array.isArray(val?.categories) && val.categories.length > 0
        ? val.categories.map(normalizeCategoryItem)
        : DEFAULT_CARTABLE_CATEGORIES;
      const activeCategories = rawCategories.filter((c: any) => c.isActive !== false);
      const allDisabled = Boolean(val?.categoriesDisabled) || activeCategories.length === 0;

      if (allDisabled) {
        // Categories are turned OFF: ALL requests route directly to Alumni Manager
        resolvedCategory = 'general';
        resolvedCategoryTitle = 'درخواست عمومی (ارجاع مستقیم به مدیر دانش‌آموختگان)';
        assignedOfficialRole = 'alumni_manager';
        autoReferredDepartment = 'مدیر دانش‌آموختگان';
        autoInternalNote = 'دسته‌بندی‌های کارتابل غیرفعال است؛ ارجاع متمرکز مستقیم به مدیر دانش‌آموختگان';
      } else {
        const found = activeCategories.find(
          (c: any) => c.key === resolvedCategory || c.id === resolvedCategory
        );
        if (found) {
          resolvedCategory = found.key || found.id;
          resolvedCategoryTitle = resolvedCategoryTitle || found.title;
          assignedOfficialRole = found.assignedRole || 'alumni_manager';
          autoReferredDepartment = found.assignedOfficialTitle || 'مدیر دانش‌آموختگان';
          autoInternalNote = `ارجاع خودکار بر اساس دسته‌بندی موضوعی (${found.title})`;
        } else {
          resolvedCategory = 'general';
          resolvedCategoryTitle = resolvedCategoryTitle || 'درخواست عمومی (ارجاع به مدیر دانش‌آموختگان)';
          assignedOfficialRole = 'alumni_manager';
          autoReferredDepartment = 'مدیر دانش‌آموختگان';
          autoInternalNote = 'ارجاع پیش‌فرض به مدیر دانش‌آموختگان';
        }
      }
    } catch {
      resolvedCategoryTitle = resolvedCategoryTitle || 'درخواست عمومی';
    }

    const initialMessage: CartableMessage = {
      id: generateUUIDv7(),
      senderId: authCtx.userId,
      senderName: authCtx.fullName,
      senderRole: authCtx.role,
      text: (dto.initialMessageText || dto.description).trim(),
      attachments: sanitizedAttachments.length > 0 ? sanitizedAttachments : undefined,
      timestamp: now,
    };

    const newRequest: CartableRequest & { version: number } = {
      id,
      trackingNumber,
      applicantId: authCtx.userId,
      applicantName: authCtx.fullName,
      applicantRoleTitle: resolvedRoleTitle,
      category: resolvedCategory,
      categoryTitle: resolvedCategoryTitle,
      title: dto.title.trim(),
      description: dto.description.trim(),
      priority: dto.priority || 'normal',
      status: 'in_progress',
      referredDepartment: autoReferredDepartment,
      assignedOfficialRole,
      internalReferralNote: autoInternalNote,
      attachments: sanitizedAttachments,
      createdAt: now,
      updatedAt: now,
      messages: [initialMessage],
      hasUnreadSupervisor: true,
      hasUnreadApplicant: false,
      version: 1,
    };

    await this.repo.create(newRequest);

    // Reload with applicantProfile for officials receiving real-time SSE
    const hydratedForStaff = (await this.repo.findById(id, true)) || newRequest;

    outbox.enqueue('cartable.request_created', {
      resourceId: id,
      requestId: id,
      applicantId: authCtx.userId,
      title: newRequest.title,
      trackingNumber,
      version: 1,
      updates: hydratedForStaff,
    });

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `درخواست کارتابل جدید [${newRequest.title}] با شماره پیگیری ${trackingNumber} ثبت و به ${autoReferredDepartment} ارجاع گردید.`,
      severity: 'info',
    });

    const isOfficial = isOrganizationalUserRole(authCtx.role);
    return isOfficial ? hydratedForStaff : ((await this.repo.findById(id, false)) || newRequest);
  }

  async addReply(
    authCtx: AuthContext,
    requestId: string,
    text: string,
    attachments?: string[]
  ): Promise<CartableRequest & { version: number }> {
    const cleanText = (text || '').trim();
    const sanitizedAttachments = sanitizeAttachmentUrls(attachments);

    if (!cleanText && sanitizedAttachments.length === 0) {
      throw AppError.badRequest('متن پاسخ یا فایل پیوست نمی‌تواند هر دو خالی باشند.');
    }

    const isOfficial = isOrganizationalUserRole(authCtx.role);
    const request = await this.repo.findById(requestId, isOfficial);
    if (!request) throw AppError.notFound('درخواست کارتابل');

    AuthorizationPolicy.assertOwnership(authCtx, request.applicantId, 'درخواست کارتابل');

    if (request.status === 'archived') {
      throw AppError.badRequest('این درخواست توسط مسئول مربوطه مختومه گردیده و امکان ارسال پیام جدید وجود ندارد.');
    }

    const newMessage: CartableMessage = {
      id: generateUUIDv7(),
      senderId: authCtx.userId,
      senderName: authCtx.fullName,
      senderRole: authCtx.role,
      text: cleanText || 'فایل پیوست ارسال شد.',
      attachments: sanitizedAttachments.length > 0 ? sanitizedAttachments : undefined,
      timestamp: new Date().toISOString(),
    };

    const isApplicantSender = !isOfficial;
    const nextStatus: RequestStatus = isApplicantSender ? 'pending' : 'in_progress';

    await withTx(async (conn) => {
      const idBuf = toIdBuffer(requestId);
      const msgIdBuf = toIdBuffer(newMessage.id);
      const senderBuf = toIdBuffer(newMessage.senderId);

      await conn.query(
        `INSERT INTO cartable_messages (id, request_id, sender_id, sender_name, sender_role, text, attachments)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          msgIdBuf,
          idBuf,
          senderBuf,
          newMessage.senderName,
          newMessage.senderRole,
          newMessage.text,
          newMessage.attachments ? JSON.stringify(newMessage.attachments) : null,
        ]
      );

      // Also merge newly uploaded attachments into the request attachments gallery for easy download
      let mergedAttachments = Array.isArray(request.attachments) ? [...request.attachments] : [];
      if (sanitizedAttachments.length > 0) {
        for (const u of sanitizedAttachments) {
          if (!mergedAttachments.includes(u)) mergedAttachments.push(u);
        }
      }

      await conn.query<any>(
        `UPDATE cartable_requests
         SET status = ?,
             has_unread_supervisor = ?,
             has_unread_applicant = ?,
             attachments = ?,
             version = version + 1,
             updated_at = CURRENT_TIMESTAMP(3)
         WHERE id = ? OR id = ?`,
        [
          request.status === 'completed' ? 'in_progress' : nextStatus,
          isApplicantSender ? 1 : 0,
          isApplicantSender ? 0 : 1,
          mergedAttachments.length > 0 ? JSON.stringify(mergedAttachments) : null,
          idBuf,
          requestId,
        ]
      );
    });

    const updatedForStaff = await this.repo.findById(requestId, true);
    const updatedForCaller = isOfficial
      ? updatedForStaff
      : await this.repo.findById(requestId, false);
    if (!updatedForCaller) throw AppError.internal('خطا در بارگذاری مجدد درخواست');

    outbox.enqueue('cartable.message_added', {
      resourceId: requestId,
      requestId,
      applicantId: request.applicantId,
      senderId: authCtx.userId,
      senderRole: authCtx.role,
      version: updatedForCaller.version,
      updates: updatedForStaff || updatedForCaller,
    });

    return updatedForCaller;
  }

  async updateStatus(
    authCtx: AuthContext,
    requestId: string,
    status: RequestStatus,
    expectedVersion: number
  ): Promise<CartableRequest & { version: number }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);

    if (expectedVersion === undefined || expectedVersion === null || isNaN(Number(expectedVersion))) {
      throw AppError.badRequest(
        'شناسه نسخه معتبر (expectedVersion یا هدر If-Match) جهت تغییر وضعیت کارتابل الزامی است.',
        'VERSION_REQUIRED'
      );
    }
    const expVer = Number(expectedVersion);

    const request = await this.repo.findById(requestId, true);
    if (!request) throw AppError.notFound('درخواست کارتابل');

    const idBuf = toIdBuffer(requestId);
    const p = getPool();

    const [res] = await p.query<any>(
      `UPDATE cartable_requests
       SET status = ?, has_unread_applicant = 1, has_unread_supervisor = 0, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
       WHERE (id = ? OR id = ?) AND version = ?`,
      [status, idBuf, requestId, expVer]
    );

    if (res.affectedRows === 0) {
      throw AppError.conflict(
        'اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `وضعیت درخواست [${request.title}] توسط مسئول به '${status}' تغییر یافت.`,
      severity: 'info',
    });

    const updated = await this.repo.findById(requestId, true);
    if (!updated) throw AppError.internal('خطا در دریافت وضعیت جدید درخواست');

    outbox.enqueue('cartable.status_changed', {
      resourceId: requestId,
      requestId,
      applicantId: request.applicantId,
      status,
      actorId: authCtx.userId,
      version: updated.version,
      updates: {
        status: updated.status,
        hasUnreadApplicant: updated.hasUnreadApplicant,
        hasUnreadSupervisor: updated.hasUnreadSupervisor,
        updatedAt: updated.updatedAt,
        version: updated.version,
      },
    });

    return updated;
  }

  async markAsRead(
    authCtx: AuthContext,
    requestId: string
  ): Promise<CartableRequest & { version: number }> {
    const isStaff = isOrganizationalUserRole(authCtx.role);
    const request = await this.repo.findById(requestId, isStaff);
    if (!request) throw AppError.notFound('درخواست کارتابل');
    AuthorizationPolicy.assertOwnership(authCtx, request.applicantId, 'درخواست کارتابل');

    const p = getPool();
    const idBuf = toIdBuffer(requestId);

    if (isStaff) {
      await p.query(`UPDATE cartable_requests SET has_unread_supervisor = 0 WHERE id = ? OR id = ?`, [idBuf, requestId]);
    } else {
      await p.query(`UPDATE cartable_requests SET has_unread_applicant = 0 WHERE id = ? OR id = ?`, [idBuf, requestId]);
    }

    const updated = await this.repo.findById(requestId, isStaff);
    if (!updated) throw AppError.internal('خطا در تغییر علامت خوانده شده');
    return updated;
  }

  async updateRequestFields(
    authCtx: AuthContext,
    requestId: string,
    updates: {
      title?: string;
      description?: string;
      priority?: RequestPriority;
      categoryTitle?: string;
    },
    expectedVersion: number
  ): Promise<CartableRequest & { version: number }> {
    if (expectedVersion === undefined || expectedVersion === null || isNaN(Number(expectedVersion))) {
      throw AppError.badRequest(
        'شناسه نسخه معتبر (expectedVersion یا هدر If-Match) جهت ویرایش اطلاعات درخواست کارتابل الزامی است.',
        'VERSION_REQUIRED'
      );
    }
    const expVer = Number(expectedVersion);

    const isOfficial = isOrganizationalUserRole(authCtx.role);
    const request = await this.repo.findById(requestId, isOfficial);
    if (!request) throw AppError.notFound('درخواست کارتابل');

    AuthorizationPolicy.assertOwnership(authCtx, request.applicantId, 'درخواست کارتابل');

    const p = getPool();
    const idBuf = toIdBuffer(requestId);

    const newTitle = updates.title !== undefined ? updates.title.trim() : request.title;
    const newDesc = updates.description !== undefined ? updates.description.trim() : request.description;
    const newPriority = updates.priority !== undefined ? updates.priority : request.priority;
    const newCatTitle = updates.categoryTitle !== undefined ? updates.categoryTitle.trim() : request.categoryTitle;

    const [res] = await p.query<any>(
      `UPDATE cartable_requests
       SET title = ?, description = ?, priority = ?, category_title = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
       WHERE (id = ? OR id = ?) AND version = ?`,
      [newTitle, newDesc, newPriority, newCatTitle, idBuf, requestId, expVer]
    );

    if (res.affectedRows === 0) {
      throw AppError.conflict(
        'اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    const updated = await this.repo.findById(requestId, isOfficial);
    if (!updated) throw AppError.internal('خطا در به‌روزرسانی اطلاعات درخواست');
    return updated;
  }
}

import { getCurrentUser } from '../../platform/sessionAuth';

export function createCartableRouter(): Router {
  const router = Router();
  const repo = new CartableRepository();
  const service = new CartableService(repo);

  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const items = await service.getRequests(authCtx);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  registerCartableReferralRoutes(router);

  router.get('/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const item = await service.getRequestById(authCtx, req.params.id);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const item = await service.createRequest(authCtx, req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/reply', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const item = await service.addReply(authCtx, req.params.id, req.body.text, req.body.attachments);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/read', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const item = await service.markAsRead(authCtx, req.params.id);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/status', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const expectedVersion = extractExpectedVersion(req, true);
      const item = await service.updateStatus(authCtx, req.params.id, req.body.status, expectedVersion);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const expectedVersion = extractExpectedVersion(req, true);
      const item = await service.updateRequestFields(authCtx, req.params.id, req.body, expectedVersion);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
