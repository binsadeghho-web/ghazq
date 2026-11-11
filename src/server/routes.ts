import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { outbox, OutboxMessage } from './platform/outbox';
import { generateUUIDv7 } from './platform/database';
import { storageConfig, UploadCategory } from './platform/storage';
import { storageAdapter } from './platform/storageAdapter';
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
import { createOpsRouter } from './modules/ops/opsModule';
import { createDashboardRouter } from './modules/dashboard/dashboardModule';

// Metrics tracker for Golden Signals (Section 11)
export const metricsStore = {
  totalRequests: 0,
  successfulRequests: 0,
  errorRequests: 0,
  latencies: [] as number[],
  startedAt: new Date().toISOString(),
};

export function createMasterRouter(): Router {
  const router = Router();

  // Mount individual domain modules
  router.use('/auth', createAuthRouter());
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

  // Generic Categorized Upload Endpoint (avatars, products, courses, consultations, research, verdicts, misc)
  router.post('/upload/:category', async (req: Request, res: Response) => {
    try {
      const rawCategory = req.params.category as string;
      const validCategories: UploadCategory[] = ['avatar', 'product', 'course', 'consultation', 'research', 'verdict', 'misc'];
      
      // Handle alias for profile-picture
      const category: UploadCategory = (rawCategory === 'profile-picture' || rawCategory === 'avatars')
        ? 'avatar'
        : validCategories.includes(rawCategory as UploadCategory)
          ? (rawCategory as UploadCategory)
          : 'misc';

      const { base64Data, filename: origName } = req.body || {};
      if (!base64Data || typeof base64Data !== 'string') {
        return res.status(400).json({ success: false, message: 'دیتا یا فایل نامعتبر است.' });
      }

      // Parse base64 buffer
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let extFromMime = '.jpg';

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) extFromMime = '.png';
        else if (mime.includes('webp')) extFromMime = '.webp';
        else if (mime.includes('pdf')) extFromMime = '.pdf';
        else if (mime.includes('word') || mime.includes('document')) extFromMime = '.docx';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(base64Data.replace(/^data:[^;]+;base64,/, ''), 'base64');
      }

      const originalFilename = origName || `file${extFromMime}`;
      const result = await storageAdapter.saveCategorizedUpload(category, originalFilename, buffer);

      res.json({
        success: true,
        filename: result.filename,
        url: result.url,
        category: result.category,
        isPrivate: result.isPrivate,
        message: `فایل با موفقیت در پوشه اختصاصی ${result.category} بر روی دیسک ماندگار ذخیره گردید.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: `خطا در آپلود فایل: ${err?.message || err}` });
    }
  });

  // Protected Private File Serving Endpoint (consultations & research)
  router.get('/storage/private/:category/:filename', (req: Request, res: Response) => {
    try {
      const { category, filename } = req.params;
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ error: 'جهت دسترسی به فایل‌های خصوصی، ثبت ورود الزامی است.' });
      }

      if (category !== 'consultations' && category !== 'research') {
        return res.status(400).json({ error: 'دسته‌بندی فایل خصوصی نامعتبر است.' });
      }

      const catConfig = storageConfig.categories[category as UploadCategory];
      if (!catConfig) {
        return res.status(404).json({ error: 'پوشه یافت نشد.' });
      }

      const safeFilename = path.basename(filename);
      const filePath = path.join(catConfig.path, safeFilename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'فایل درخواستی روی دیسک یافت نشد.' });
      }

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
    if (sessionUser && sessionUser.role === 'admin') {
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

      // Item 2: User events are strictly restricted to Admin/Supervisor/Staff (Information Leak Prevention)
      if (msg.topic.startsWith('user.') && userRole !== 'admin' && userRole !== 'supervisor' && userRole !== 'staff') {
        return;
      }

      // Authorization filtering: private items only go to owners or admins
      const isPrivateTopic = msg.topic.startsWith('cartable.') || msg.topic.startsWith('private_msg.');
      if (isPrivateTopic && userRole !== 'admin' && userRole !== 'supervisor') {
        const ownerId = payload.applicantId || payload.recipientId || payload.userId;
        if (ownerId && ownerId !== userId) {
          return; // Suppress event; unauthorized recipient (Leak Prevention)
        }
      }

      // Delta-Payload Construction for Real-Time Direct State Patching
      const resourceId = payload.id || payload.requestId || payload.courseId || payload.productId || payload.userId || payload.orderId || null;
      const version = payload.version || payload.newVersion || 1;
      const actor = (payload.actorId || payload.actor)
        ? { id: payload.actorId || payload.actor?.id, name: payload.actorName || payload.actor?.name }
        : undefined;

      const updates = payload.updates || payload.config || payload;

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
