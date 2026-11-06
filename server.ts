console.log('----------------------------------------------------');
console.log('🚀 راه اندازی سرور سامانه فقه و قضا (Enterprise Production Server v3.0)');
console.log(`📡 محیط اجرا: ${process.env.NODE_ENV || 'development'} | پورت: ${process.env.PORT || 3000}`);
console.log('----------------------------------------------------');

process.on('uncaughtException', (err) => {
  console.error('❌ FATAL UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, generateUUIDv7 } from './src/server/platform/database';
import { checkDatabaseConnection, isDatabaseConnected } from './src/server/platform/mysqlDatabase';
import { logger } from './src/server/platform/logger';
import { idempotencyMiddleware } from './src/server/platform/idempotency';
import { rateLimitMiddleware } from './src/server/platform/rateLimiter';
import { rfc9457ErrorHandler } from './src/server/platform/errors';
import { createMasterRouter, metricsStore } from './src/server/routes';
import { persianNormalizerMiddleware } from './src/server/platform/persianNormalizer';
import { initStorageDirectories, storageConfig, getStorageHealth } from './src/server/platform/storage';
import { storageAdapter } from './src/server/platform/storageAdapter';
import { sessionAuthMiddleware } from './src/server/platform/sessionAuth';

async function bootstrap() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  // Item 1: Database DDL is executed ONLY via standalone 'npm run db:init', NOT on server startup.
  // Server only probes readiness for graceful health checks.
  checkDatabaseConnection().catch(err => {
    logger.warn('MySQL probe notice: ' + (err?.message || err));
  });

  // Request body parsing with bounded size (Section 10)
  app.use(express.json({ limit: '5mb' }));

  // Item 9 & 11: Persian / Arabic character & digit normalization (skipping sensitive keys)
  app.use(persianNormalizerMiddleware);

  // Cache-Busting headers for SPA entrypoints & APIs to ensure immediate updates without hard refresh
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.path === '/' ||
      req.path === '/index.html' ||
      req.path.endsWith('.html') ||
      req.path.startsWith('/api')
    ) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  // Item 5: HTTP Request Timeout Middleware (15s request budget)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/api/events') return next(); // SSE streams are long-lived
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          type: 'gateway_timeout',
          title: 'مهلت زمانی به پایان رسید',
          status: 504,
          detail: 'زمان پردازش درخواست بیش از بودجه مجاز (۱۵ ثانیه) به طول انجامید.',
          code: 'REQUEST_TIMEOUT'
        });
      }
    }, 15000);
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  });

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

  const PORT = Number(process.env.PORT) || 3000;
  const HOST = '0.0.0.0';

  // Liveness Probes for Runflare Reverse Proxy Healthchecks
  app.get(['/livez', '/health', '/healthz'], (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', server: 'Runflare Bound', time: new Date().toISOString() });
  });

  // Readiness Probe (Always 200 OK to prevent Runflare Container Restart Loops)
  app.get('/readyz', (_req: Request, res: Response) => {
    const storageHealth = getStorageHealth();
    res.status(200).json({
      status: 'ready',
      mysqlConnected: isDatabaseConnected(),
      storage: storageHealth,
      time: new Date().toISOString()
    });
  });

  // Persistent Uploads Static File Serving (Section 7: HTTP Cache headers)
  app.use('/uploads', express.static(storageConfig.uploadsDir, {
    maxAge: '7d',
    immutable: true,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }));

  // Rate Limiting on API routes (Section 9 & 10)
  app.use('/api', rateLimitMiddleware());

  // Idempotency Key Middleware on API routes (Section 6.1)
  app.use('/api', idempotencyMiddleware());

  // Strict Server Session Authentication (strips client x-user-* headers)
  app.use('/api', sessionAuthMiddleware);

  // Master API router
  app.use('/api', createMasterRouter());

  // RFC 9457 Error Handler for API routes
  app.use('/api', rfc9457ErrorHandler);

  // Mount Vite middleware in development or serve compiled static dist in production
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distFolder = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distFolder));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distFolder, 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`[Runflare] Server successfully bound to ${HOST}:${PORT}`);
    logger.info(`Enterprise Data Architecture Server v3.0 running on ${HOST}:${PORT}`, {
      context: { port: PORT, host: HOST, env: process.env.NODE_ENV || 'development' },
    });

    // STRICT RUNTIME ONLY: Initialize persistent storage after server is already listening
    // Guaranteed non-blocking with 5s timeout watchdog, never delays server startup or build
    initStorageDirectories(5000).catch(err => {
      logger.warn(`Storage async initialization notice: ${err?.message || err}`);
    });
    storageAdapter.initialize(5000).catch(err => {
      logger.warn(`StorageAdapter async initialization notice: ${err?.message || err}`);
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
