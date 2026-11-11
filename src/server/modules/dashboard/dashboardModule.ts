import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';
import { adminSettingsRepo } from '../admin/adminSettingsRepository';

export interface DashboardBannerItem {
  id: string;
  title: string;
  message: string;
  bannerType: 'info' | 'warning' | 'urgent' | 'celebration';
  actionLabel?: string;
  actionTab?: string;
  expiresAt?: string;
  isActive: boolean;
  priority: number;
  version: number;
  createdAt: string;
}

export interface DashboardCalendarEventItem {
  id: string;
  title: string;
  eventDate: string;
  eventTime?: string;
  category: string;
  categoryTitle: string;
  description?: string;
  isActive: boolean;
  version: number;
  createdAt: string;
}

export interface DashboardWidgetsConfig {
  showStatusSummaryWidget: boolean;
  showEventsCalendarWidget: boolean;
  version: number;
}

function mapBannerRow(row: any): DashboardBannerItem {
  return {
    id: fromIdBuffer(row.id),
    title: row.title,
    message: row.message,
    bannerType: row.banner_type || 'info',
    actionLabel: row.action_label || undefined,
    actionTab: row.action_tab || undefined,
    expiresAt: row.expires_at || undefined,
    isActive: Boolean(row.is_active),
    priority: Number(row.priority || 1),
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapEventRow(row: any): DashboardCalendarEventItem {
  return {
    id: fromIdBuffer(row.id),
    title: row.title,
    eventDate: row.event_date,
    eventTime: row.event_time || undefined,
    category: row.category || 'conference',
    categoryTitle: row.category_title || 'نشست علمی',
    description: row.description || undefined,
    isActive: Boolean(row.is_active),
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export function createDashboardRouter(): Router {
  const router = Router();

  router.get('/widgets-data', async (_req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();

      const [bannerRows, eventRows, widgetRecord] = await Promise.all([
        selectWithTimeout<any>(`SELECT * FROM dashboard_banners ORDER BY priority DESC, created_at DESC LIMIT 50`, [], 3000),
        selectWithTimeout<any>(`SELECT * FROM dashboard_events ORDER BY event_date ASC, created_at DESC LIMIT 100`, [], 3000),
        adminSettingsRepo.getRecord< { showStatusSummaryWidget: boolean; showEventsCalendarWidget: boolean }>('dashboard_widgets_config'),
      ]);

      const widgetConfig: DashboardWidgetsConfig = {
        showStatusSummaryWidget: widgetRecord?.value?.showStatusSummaryWidget ?? true,
        showEventsCalendarWidget: widgetRecord?.value?.showEventsCalendarWidget ?? true,
        version: widgetRecord?.version ?? 1,
      };

      res.json({
        banners: (bannerRows || []).map(mapBannerRow),
        events: (eventRows || []).map(mapEventRow),
        widgetConfig,
      });
    } catch (err) {
      next(err);
    }
  });

  router.put('/widget-toggles', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const expVer = extractExpectedVersion(req, true);
      const { showStatusSummaryWidget, showEventsCalendarWidget } = req.body;

      const newVal = {
        showStatusSummaryWidget: Boolean(showStatusSummaryWidget),
        showEventsCalendarWidget: Boolean(showEventsCalendarWidget),
      };

      const result = await adminSettingsRepo.updateOptimistic('dashboard_widgets_config', newVal, expVer, user.fullName);
      const updatedConfig: DashboardWidgetsConfig = {
        ...newVal,
        version: result.newVersion,
      };

      outbox.enqueue('dashboard.widgets_toggled', {
        widgetConfig: updatedConfig,
        version: result.newVersion,
        actorId: user.id,
        actorName: user.fullName,
      });

      res.json(updatedConfig);
    } catch (err) {
      next(err);
    }
  });

  // Banners CRUD
  router.post('/banners', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const { title, message, bannerType, actionLabel, actionTab, expiresAt, isActive, priority } = req.body;
      if (!title || !message) {
        throw AppError.badRequest('عنوان و متن بنر اطلاع‌رسانی الزامی است.');
      }

      const id = generateUUIDv7();
      const idBuf = toIdBuffer(id);
      const p = getPool();

      await p.query(
        `INSERT INTO dashboard_banners (id, title, message, banner_type, action_label, action_tab, expires_at, is_active, priority, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          idBuf,
          title.trim(),
          message.trim(),
          bannerType || 'info',
          actionLabel || null,
          actionTab || null,
          expiresAt || null,
          isActive !== undefined ? (isActive ? 1 : 0) : 1,
          Number(priority || 1),
        ]
      );

      const rows = await selectWithTimeout<any>(`SELECT * FROM dashboard_banners WHERE id = ? LIMIT 1`, [idBuf], 3000);
      const created = mapBannerRow(rows[0]);

      outbox.enqueue('dashboard.banner_created', {
        id: created.id,
        banner: created,
        version: created.version,
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/banners/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const expVer = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();

      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM dashboard_banners WHERE id = ? OR id = ? LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      if (!existingRows || existingRows.length === 0) throw AppError.notFound('بنر اطلاع‌رسانی');
      const existing = mapBannerRow(existingRows[0]);

      const { title, message, bannerType, actionLabel, actionTab, expiresAt, isActive, priority } = req.body;

      const [upd]: any = await p.query(
        `UPDATE dashboard_banners
         SET title = ?, message = ?, banner_type = ?, action_label = ?, action_tab = ?, expires_at = ?, is_active = ?, priority = ?, version = version + 1
         WHERE (id = ? OR id = ?) AND version = ?`,
        [
          title !== undefined ? title.trim() : existing.title,
          message !== undefined ? message.trim() : existing.message,
          bannerType !== undefined ? bannerType : existing.bannerType,
          actionLabel !== undefined ? actionLabel : (existing.actionLabel || null),
          actionTab !== undefined ? actionTab : (existing.actionTab || null),
          expiresAt !== undefined ? expiresAt : (existing.expiresAt || null),
          isActive !== undefined ? (isActive ? 1 : 0) : (existing.isActive ? 1 : 0),
          priority !== undefined ? Number(priority) : existing.priority,
          idBuf,
          req.params.id,
          expVer,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('این بنر توسط مدیر دیگری تغییر یافته است. لطفاً دوباره تلاش کنید.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const updatedRows = await selectWithTimeout<any>(`SELECT * FROM dashboard_banners WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id], 3000);
      const updated = mapBannerRow(updatedRows[0]);

      outbox.enqueue('dashboard.banner_updated', {
        id: updated.id,
        banner: updated,
        version: updated.version,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/banners/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();
      await p.query(`DELETE FROM dashboard_banners WHERE id = ? OR id = ?`, [idBuf, req.params.id]);

      outbox.enqueue('dashboard.banner_deleted', {
        id: req.params.id,
        bannerId: req.params.id,
      });

      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // Calendar Events CRUD
  router.post('/events', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const { title, eventDate, eventTime, category, categoryTitle, description } = req.body;
      if (!title || !eventDate) {
        throw AppError.badRequest('عنوان و تاریخ رویداد تقویم الزامی است.');
      }

      const id = generateUUIDv7();
      const idBuf = toIdBuffer(id);
      const p = getPool();

      await p.query(
        `INSERT INTO dashboard_events (id, title, event_date, event_time, category, category_title, description, is_active, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
        [
          idBuf,
          title.trim(),
          eventDate.trim(),
          eventTime || null,
          category || 'conference',
          categoryTitle || 'نشست علمی',
          description || null,
        ]
      );

      const rows = await selectWithTimeout<any>(`SELECT * FROM dashboard_events WHERE id = ? LIMIT 1`, [idBuf], 3000);
      const created = mapEventRow(rows[0]);

      outbox.enqueue('dashboard.event_created', {
        id: created.id,
        eventItem: created,
        version: created.version,
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/events/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();
      await p.query(`DELETE FROM dashboard_events WHERE id = ? OR id = ?`, [idBuf, req.params.id]);

      outbox.enqueue('dashboard.event_deleted', {
        id: req.params.id,
        eventId: req.params.id,
      });

      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
