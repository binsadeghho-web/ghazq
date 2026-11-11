import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, withTx, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { AppError } from '../../platform/errors';
import { outbox } from '../../platform/outbox';
import { auditChain } from '../../platform/auditChain';
import { AuthorizationPolicy, AuthContext } from '../../platform/authorization';
import { CartableRequest, CartableMessage, RequestStatus, CartableCategory, RequestPriority } from '../../../types';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';

function mapCartableRequestRow(row: any, messages: CartableMessage[] = []): CartableRequest & { version: number } {
  return {
    id: fromIdBuffer(row.id),
    trackingNumber: row.tracking_number,
    category: row.category,
    categoryTitle: row.category_title,
    title: row.title,
    description: row.description,
    applicantId: fromIdBuffer(row.applicant_id),
    applicantName: row.applicant_name,
    applicantRoleTitle: row.applicant_role_title,
    priority: row.priority,
    status: row.status,
    hasUnreadSupervisor: Boolean(row.has_unread_supervisor),
    hasUnreadApplicant: Boolean(row.has_unread_applicant),
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    messages,
  };
}

function mapCartableMessageRow(row: any): CartableMessage {
  return {
    id: fromIdBuffer(row.id),
    senderId: fromIdBuffer(row.sender_id),
    senderName: row.sender_name,
    senderRole: row.sender_role,
    text: row.text,
    timestamp: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export interface ICartableRepository {
  findAll(filter?: { applicantId?: string; status?: string }): Promise<Array<CartableRequest & { version: number }>>;
  findById(id: string): Promise<(CartableRequest & { version: number }) | undefined>;
  create(request: CartableRequest & { version: number }): Promise<CartableRequest & { version: number }>;
}

export class CartableRepository implements ICartableRepository {
  async findAll(filter?: { applicantId?: string; status?: string }): Promise<Array<CartableRequest & { version: number }>> {
    ensureDatabaseConnection();
    const p = getPool();
    let sql = `SELECT * FROM cartable_requests WHERE 1=1`;
    const params: any[] = [];

    if (filter?.applicantId) {
      sql += ` AND (applicant_id = ? OR applicant_id = ?)`;
      params.push(toIdBuffer(filter.applicantId), filter.applicantId);
    }
    if (filter?.status) {
      sql += ` AND status = ?`;
      params.push(filter.status);
    }
    sql += ` ORDER BY created_at DESC LIMIT 200`;

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
      results.push(mapCartableRequestRow(row, messages));
    }
    return results;
  }

  async findById(id: string): Promise<(CartableRequest & { version: number }) | undefined> {
    ensureDatabaseConnection();
    const p = getPool();
    const idBuf = toIdBuffer(id);
    const rows = await selectWithTimeout<any>(
      `SELECT * FROM cartable_requests WHERE id = ? OR id = ? LIMIT 1`,
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
    return mapCartableRequestRow(row, messages);
  }

  async create(request: CartableRequest & { version: number }): Promise<CartableRequest & { version: number }> {
    ensureDatabaseConnection();
    const p = getPool();
    const idBuf = toIdBuffer(request.id);
    const applicantBuf = toIdBuffer(request.applicantId);

    await p.query(
      `INSERT INTO cartable_requests (
        id, tracking_number, category, category_title, title, description,
        applicant_id, applicant_name, applicant_role_title, priority, status,
        has_unread_supervisor, has_unread_applicant, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        request.version,
      ]
    );

    for (const msg of request.messages) {
      await p.query(
        `INSERT INTO cartable_messages (id, request_id, sender_id, sender_name, sender_role, text)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [toIdBuffer(msg.id), idBuf, toIdBuffer(msg.senderId), msg.senderName, msg.senderRole, msg.text]
      );
    }

    return request;
  }
}

export class CartableService {
  constructor(private repo: ICartableRepository) {}

  async getRequests(authCtx: AuthContext): Promise<Array<CartableRequest & { version: number }>> {
    if (authCtx.role === 'alumni') {
      return this.repo.findAll({ applicantId: authCtx.userId });
    }
    return this.repo.findAll();
  }

  async getRequestById(authCtx: AuthContext, id: string): Promise<CartableRequest & { version: number }> {
    const item = await this.repo.findById(id);
    if (!item) throw AppError.notFound(`درخواست کارتابل با شناسه ${id}`);
    AuthorizationPolicy.assertOwnership(authCtx, item.applicantId, 'درخواست کارتابل');
    return item;
  }

  async createRequest(
    authCtx: AuthContext,
    dto: {
      category: CartableCategory;
      categoryTitle: string;
      title: string;
      description: string;
      priority: RequestPriority;
      initialMessageText: string;
    }
  ): Promise<CartableRequest & { version: number }> {
    if (!dto.title || !dto.description) {
      throw AppError.badRequest('عنوان و شرح درخواست الزامی است.');
    }

    const id = generateUUIDv7();
    const trackingNumber = `TRK-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const initialMessage: CartableMessage = {
      id: generateUUIDv7(),
      senderId: authCtx.userId,
      senderName: authCtx.fullName,
      senderRole: authCtx.role,
      text: dto.initialMessageText || dto.description,
      timestamp: now,
    };

    const newRequest: CartableRequest & { version: number } = {
      id,
      trackingNumber,
      applicantId: authCtx.userId,
      applicantName: authCtx.fullName,
      applicantRoleTitle: authCtx.role === 'alumni' ? 'دانش‌آموخته' : authCtx.role === 'supervisor' ? 'مسئول آموزش' : 'مدیر سامانه',
      category: dto.category,
      categoryTitle: dto.categoryTitle,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      messages: [initialMessage],
      hasUnreadSupervisor: true,
      hasUnreadApplicant: false,
      version: 1,
    };

    await this.repo.create(newRequest);

    outbox.enqueue('cartable.request_created', {
      requestId: id,
      applicantId: authCtx.userId,
      title: dto.title,
      trackingNumber,
    });

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `درخواست کارتابل جدید [${dto.title}] با شماره پیگیری ${trackingNumber} ثبت گردید.`,
      severity: 'info',
    });

    return newRequest;
  }

  async addReply(
    authCtx: AuthContext,
    requestId: string,
    text: string
  ): Promise<CartableRequest & { version: number }> {
    if (!text || !text.trim()) {
      throw AppError.badRequest('متن پاسخ نمی‌تواند خالی باشد.');
    }

    const request = await this.repo.findById(requestId);
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
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const isAlumni = authCtx.role === 'alumni';
    const nextStatus: RequestStatus = isAlumni ? 'pending' : 'in_progress';

    return await withTx(async (conn) => {
      const idBuf = toIdBuffer(requestId);
      const msgIdBuf = toIdBuffer(newMessage.id);
      const senderBuf = toIdBuffer(newMessage.senderId);

      await conn.query(
        `INSERT INTO cartable_messages (id, request_id, sender_id, sender_name, sender_role, text)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [msgIdBuf, idBuf, senderBuf, newMessage.senderName, newMessage.senderRole, newMessage.text]
      );

      const [res] = await conn.query<any>(
        `UPDATE cartable_requests
         SET status = ?, has_unread_supervisor = ?, has_unread_applicant = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
         WHERE id = ? OR id = ?`,
        [
          request.status === 'completed' ? 'in_progress' : nextStatus,
          isAlumni ? 1 : 0,
          isAlumni ? 0 : 1,
          idBuf,
          requestId,
        ]
      );

      outbox.enqueue('cartable.message_added', {
        requestId,
        senderId: authCtx.userId,
        senderRole: authCtx.role,
        text: text.slice(0, 50),
      });

      const updated = await this.repo.findById(requestId);
      if (!updated) throw AppError.internal('خطا در بارگذاری مجدد درخواست');
      return updated;
    });
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

    const request = await this.repo.findById(requestId);
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
      throw AppError.conflict('اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
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

    outbox.enqueue('cartable.status_changed', {
      requestId,
      status,
      actorId: authCtx.userId,
    });

    const updated = await this.repo.findById(requestId);
    if (!updated) throw AppError.internal('خطا در دریافت وضعیت جدید درخواست');
    return updated;
  }

  async markAsRead(
    authCtx: AuthContext,
    requestId: string
  ): Promise<CartableRequest & { version: number }> {
    const request = await this.repo.findById(requestId);
    if (!request) throw AppError.notFound('درخواست کارتابل');

    const isStaff = authCtx.role === 'admin' || authCtx.role === 'supervisor';
    const p = getPool();
    const idBuf = toIdBuffer(requestId);

    if (isStaff) {
      await p.query(`UPDATE cartable_requests SET has_unread_supervisor = 0 WHERE id = ? OR id = ?`, [idBuf, requestId]);
    } else {
      await p.query(`UPDATE cartable_requests SET has_unread_applicant = 0 WHERE id = ? OR id = ?`, [idBuf, requestId]);
    }

    const updated = await this.repo.findById(requestId);
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

    const request = await this.repo.findById(requestId);
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
      throw AppError.conflict('اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
    }

    const updated = await this.repo.findById(requestId);
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
      const item = await service.addReply(authCtx, req.params.id, req.body.text);
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
