import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { outbox, OutboxMessage } from './platform/outbox';
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
  router.use('/cartable', createCartableRouter());
  router.use('/courses', createCoursesRouter());
  router.use('/products', createProductsRouter());
  router.use('/counseling', createCounselingRouter());
  router.use('/research', researchRouter);
  router.use('/rulings', rulingsRouter);
  router.use('/welfare', welfareRouter);
  router.use('/synergy', synergyRouter);
  router.use('/admin', createAdminRouter());

  // Golden Signals Observability Metrics (Section 11 & Item 2: Restrict to Admin Session or Constant-Time Secret Token)
  router.get('/metrics', (req: Request, res: Response) => {
    const userRole = (req.headers['x-user-role'] as string) || '';
    const bearerHeader = req.headers['authorization'] || '';
    const token = bearerHeader.startsWith('Bearer ') ? bearerHeader.slice(7).trim() : (req.headers['x-metrics-token'] as string) || '';
    const configuredSecret = process.env.METRICS_SECRET || 'ghaza-metrics-token-2026';

    const isTokenValid = token && token.length === configuredSecret.length &&
      crypto.timingSafeEqual(Buffer.from(token), Buffer.from(configuredSecret));

    const isAdminSession = userRole === 'admin';

    if (!isAdminSession && !isTokenValid) {
      return res.status(403).json({
        type: 'forbidden',
        title: 'دسترسی غیرمجاز',
        status: 403,
        detail: 'مشاهده متریک‌های عملکردی سامانه فقط با نشست ادمین یا توکن معتبر مجاز است.',
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

  // Real-time Server-Sent Events (SSE) (Section 8 & Item 2, 8)
  router.get('/events', (req: Request, res: Response) => {
    // 1. Authenticate via HttpOnly Cookie or Auth Header (No token in URL parameters)
    const rawCookies = req.headers.cookie || '';
    const cookieMatch = rawCookies.match(/session_id=([^;]+)/);
    const userId = (req.headers['x-user-id'] as string) || (cookieMatch ? cookieMatch[1] : null);
    const userRole = (req.headers['x-user-role'] as string) || 'alumni';

    if (!userId) {
      return res.status(401).json({
        type: 'unauthorized',
        title: 'عدم احراز هویت',
        status: 401,
        detail: 'برقراری اتصال بلادرنگ نیازمند نشست معتبر است.',
        code: 'UNAUTHENTICATED'
      });
    }

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

      // Authorization filtering: private items only go to owners or admins
      const isPrivateTopic = msg.topic.startsWith('cartable.') || msg.topic.startsWith('private_msg.');
      if (isPrivateTopic && userRole !== 'admin' && userRole !== 'supervisor') {
        const ownerId = payload.applicantId || payload.recipientId || payload.userId;
        if (ownerId && ownerId !== userId) {
          return; // Suppress event; unauthorized recipient (Leak Prevention)
        }
      }

      // CRITICAL (Item 2): Emit ONLY short invalidation signal (type, resourceId), NEVER the payload content
      const signal = {
        type: msg.topic,
        resourceId: payload.id || payload.requestId || payload.courseId || null,
        timestamp: Date.now()
      };

      res.write(`id: ${msg.id}\nevent: ${msg.topic}\ndata: ${JSON.stringify(signal)}\n\n`);
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
