import { Router, Request, Response } from 'express';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { outbox } from '../../platform/outbox';
import { auditChain } from '../../platform/auditChain';
import { AuthorizationPolicy, AuthContext } from '../../platform/authorization';
import { CartableRequest, CartableMessage, RequestStatus, CartableCategory, RequestPriority } from '../../../types';

export interface ICartableRepository {
  findAll(filter?: { applicantId?: string; status?: string }): Promise<Array<CartableRequest & { version: number }>>;
  findById(id: string): Promise<(CartableRequest & { version: number }) | undefined>;
  create(request: CartableRequest & { version: number }): Promise<CartableRequest & { version: number }>;
}

export class CartableRepository implements ICartableRepository {
  async findAll(filter?: { applicantId?: string; status?: string }): Promise<Array<CartableRequest & { version: number }>> {
    let items = db.cartableRequests;
    if (filter?.applicantId) {
      items = items.filter(i => i.applicantId === filter.applicantId);
    }
    if (filter?.status) {
      items = items.filter(i => i.status === filter.status);
    }
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findById(id: string): Promise<(CartableRequest & { version: number }) | undefined> {
    return db.cartableRequests.find(i => i.id === id);
  }

  async create(request: CartableRequest & { version: number }): Promise<CartableRequest & { version: number }> {
    db.cartableRequests.unshift(request);
    return request;
  }
}

export class CartableService {
  constructor(private repo: ICartableRepository) {}

  async getRequests(authCtx: AuthContext): Promise<Array<CartableRequest & { version: number }>> {
    // If alumni, only return their own requests (BOLA protection)
    if (authCtx.role === 'alumni') {
      return this.repo.findAll({ applicantId: authCtx.userId });
    }
    // Supervisors and admins see all
    return this.repo.findAll();
  }

  async getRequestById(authCtx: AuthContext, id: string): Promise<CartableRequest & { version: number }> {
    const item = await this.repo.findById(id);
    if (!item) throw AppError.notFound(`درخواست کارتابل با شناسه ${id}`);

    // BOLA check
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

    return db.withTx(async tx => {
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

      tx.cartableRequests.unshift(newRequest);

      // Transactional Outbox (Section 6.2)
      tx.emitOutbox('cartable.request_created', {
        requestId: id,
        applicantId: authCtx.userId,
        title: dto.title,
        trackingNumber,
      });

      // Audit Trail (Section 10)
      tx.emitAudit({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `درخواست کارتابل جدید [${dto.title}] با شماره پیگیری ${trackingNumber} ثبت گردید.`,
        severity: 'info',
      });

      return newRequest;
    });
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

    // Atomic update with version increment
    const updated = db.updateWithOptimisticLock(
      db.cartableRequests,
      requestId,
      request.version,
      current => ({
        messages: [...current.messages, newMessage],
        status: (current.status === 'completed' ? 'in_progress' : nextStatus) as RequestStatus,
        hasUnreadSupervisor: isAlumni ? true : false,
        hasUnreadApplicant: isAlumni ? false : true,
        updatedAt: new Date().toISOString(),
      })
    );

    outbox.enqueue('cartable.message_added', {
      requestId,
      senderId: authCtx.userId,
      senderRole: authCtx.role,
      text: text.slice(0, 50),
    });

    return updated;
  }

  async updateStatus(
    authCtx: AuthContext,
    requestId: string,
    status: RequestStatus,
    expectedVersion: number
  ): Promise<CartableRequest & { version: number }> {
    // Only supervisors and admins can change status
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);

    const request = await this.repo.findById(requestId);
    if (!request) throw AppError.notFound('درخواست کارتابل');

    const updated = db.updateWithOptimisticLock(
      db.cartableRequests,
      requestId,
      expectedVersion,
      () => ({
        status,
        hasUnreadApplicant: true,
        hasUnreadSupervisor: false,
        updatedAt: new Date().toISOString(),
      })
    );

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

    return updated;
  }

  async markAsRead(
    authCtx: AuthContext,
    requestId: string
  ): Promise<CartableRequest & { version: number }> {
    const request = await this.repo.findById(requestId);
    if (!request) throw AppError.notFound('درخواست کارتابل');

    const isStaff = authCtx.role === 'admin' || authCtx.role === 'supervisor';
    const updated = db.updateWithOptimisticLock(
      db.cartableRequests,
      requestId,
      request.version,
      current => ({
        hasUnreadSupervisor: isStaff ? false : current.hasUnreadSupervisor,
        hasUnreadApplicant: !isStaff ? false : current.hasUnreadApplicant,
      })
    );

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
    expectedVersion = 1
  ): Promise<CartableRequest & { version: number }> {
    const request = await this.repo.findById(requestId);
    if (!request) throw AppError.notFound('درخواست کارتابل');

    AuthorizationPolicy.assertOwnership(authCtx, request.applicantId, 'درخواست کارتابل');

    const updated = db.updateWithOptimisticLock(
      db.cartableRequests,
      requestId,
      expectedVersion,
      current => ({
        ...current,
        title: updates.title !== undefined ? updates.title.trim() : current.title,
        description: updates.description !== undefined ? updates.description.trim() : current.description,
        priority: updates.priority !== undefined ? updates.priority : current.priority,
        categoryTitle: updates.categoryTitle !== undefined ? updates.categoryTitle.trim() : current.categoryTitle,
        updatedAt: new Date().toISOString(),
      })
    );

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
      const expectedVersion = Number(req.body.expectedVersion || 1);
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
      const expectedVersion = Number(req.body.expectedVersion || 1);
      const item = await service.updateRequestFields(authCtx, req.params.id, req.body, expectedVersion);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
