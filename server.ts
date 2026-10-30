import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { db, generateUUIDv7 } from './src/server/platform/database';
import { logger } from './src/server/platform/logger';
import { idempotencyMiddleware } from './src/server/platform/idempotency';
import { rateLimitMiddleware } from './src/server/platform/rateLimiter';
import { rfc9457ErrorHandler } from './src/server/platform/errors';
import { createMasterRouter, metricsStore } from './src/server/routes';

async function bootstrap() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  // Request body parsing with bounded size (Section 10)
  app.use(express.json({ limit: '5mb' }));

  // Security Headers (Section 10)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Request ID & Structured Logging & Golden Signals Metrics Middleware (Section 1, 10, 11)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || generateUUIDv7();
    res.setHeader('X-Request-Id', requestId);
    (req as any).requestId = requestId;

    const startTime = Date.now();
    metricsStore.totalRequests++;

    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      metricsStore.latencies.push(durationMs);
      if (metricsStore.latencies.length > 500) metricsStore.latencies.shift();

      if (res.statusCode >= 400) {
        metricsStore.errorRequests++;
      } else {
        metricsStore.successfulRequests++;
      }

      // Do not log static assets to prevent noise
      if (req.path.startsWith('/api') || req.path === '/livez' || req.path === '/readyz') {
        logger.info(`HTTP ${req.method} ${req.originalUrl} [${res.statusCode}] ${durationMs}ms`, {
          requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          durationMs,
        });
      }
    });

    next();
  });

  // Resilience & Health Probes (Section 9 & 18)
  // Liveness Probe: process is alive
  app.get('/livez', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
  });

  // Readiness Probe: database & components are initialized
  app.get('/readyz', (_req: Request, res: Response) => {
    if (db.checkReady()) {
      res.status(200).json({ status: 'ready', time: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'not_ready', detail: 'پایگاه داده در حال آماده‌سازی است.' });
    }
  });

  // Rate Limiting on API routes (Section 9 & 10)
  app.use('/api', rateLimitMiddleware());

  // Idempotency Key Middleware on API routes (Section 6.1)
  app.use('/api', idempotencyMiddleware());

  // Master API router
  app.use('/api', createMasterRouter());

  // RFC 9457 Error Handler for API routes
  app.use('/api', rfc9457ErrorHandler);

  // Mount Vite middleware in development
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  const server = app.listen(port, () => {
    logger.info(`Enterprise Data Architecture Server v3.0 running on port ${port}`, {
      context: { port, env: process.env.NODE_ENV || 'development' },
    });
  });

  // Graceful Shutdown (Section 9 & 18)
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}. Gracefully stopping server...`);
    server.close(() => {
      logger.info('HTTP server closed. Exiting process.');
      process.exit(0);
    });

    // Forced exit timeout after 10s
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch(err => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
