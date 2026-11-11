import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection, withTx } from '../../platform/mysqlDatabase';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { getCurrentUser } from '../../platform/sessionAuth';
import { wallOwnershipRepo } from './wallOwnershipRepository';
import { SynergyPost } from '../../../types';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { auditChain } from '../../platform/auditChain';
import { outbox } from '../../platform/outbox';
import { extractExpectedVersion } from '../../platform/httpUtils';

export const synergyRouter = Router();
export function createSynergyRouter(): Router {
  return synergyRouter;
}

function mapSynergyPostRow(row: any, responses: any[] = []): SynergyPost & { version: number } {
  return {
    id: fromIdBuffer(row.id),
    authorPseudonym: row.author_pseudonym || '',
    isAnonymous: Boolean(row.is_anonymous),
    title: row.title || '',
    content: row.content || '',
    provinceOrCity: row.province_or_city || 'سراسری',
    category: row.category || 'administrative_help',
    categoryTitle: row.category_title || 'همکاری و استعلام اداری-قضایی',
    isEmpathy: Boolean(row.is_empathy),
    urgency: row.urgency || 'عادی',
    status: row.status || 'open',
    responses,
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapSynergyResponseRow(row: any) {
  return {
    id: fromIdBuffer(row.id),
    responderPseudonym: row.responder_pseudonym || '',
    message: row.message || '',
    isPrivate: Boolean(row.is_private),
    contactShared: row.contact_shared || undefined,
    timestamp: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

// 1. Get public synergy wall posts
synergyRouter.get('/', async (_req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const p = getPool();
    const rows = await selectWithTimeout<any>(`SELECT * FROM synergy_posts ORDER BY created_at DESC`, [], 4000);
    const posts: Array<SynergyPost & { version: number }> = [];

    for (const row of rows || []) {
      const pIdBuf = toIdBuffer(row.id);
      const [respRows] = await p.query<any[]>(
        `SELECT * FROM synergy_responses WHERE post_id = ? OR post_id = ? ORDER BY created_at ASC`,
        [pIdBuf, fromIdBuffer(row.id)]
      );
      posts.push(mapSynergyPostRow(row, (respRows || []).map(mapSynergyResponseRow)));
    }
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

synergyRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const p = getPool();
    const idBuf = toIdBuffer(req.params.id);
    const rows = await selectWithTimeout<any>(
      `SELECT * FROM synergy_posts WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!rows || rows.length === 0) throw AppError.notFound('پست هم‌افزایی');

    const [respRows] = await p.query<any[]>(
      `SELECT * FROM synergy_responses WHERE post_id = ? OR post_id = ? ORDER BY created_at ASC`,
      [idBuf, req.params.id]
    );
    res.json(mapSynergyPostRow(rows[0], (respRows || []).map(mapSynergyResponseRow)));
  } catch (err) {
    next(err);
  }
});

synergyRouter.put('/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const { title, content, provinceOrCity, categoryTitle, status } = req.body;
    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();

    const existingRows = await selectWithTimeout<any>(
      `SELECT * FROM synergy_posts WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!existingRows || existingRows.length === 0) throw AppError.notFound('پست هم‌افزایی');
    const existing = mapSynergyPostRow(existingRows[0]);

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newContent = content !== undefined ? content.trim() : existing.content;
    const newProv = provinceOrCity !== undefined ? provinceOrCity.trim() : existing.provinceOrCity;
    const newCatTitle = categoryTitle !== undefined ? categoryTitle.trim() : existing.categoryTitle;
    const newStatus = status !== undefined ? status : existing.status;

    const expVer = extractExpectedVersion(req, true);

    const [updateRes]: any = await p.query(
      `UPDATE synergy_posts
       SET title = ?, content = ?, province_or_city = ?, category_title = ?, status = ?, version = version + 1
       WHERE (id = ? OR id = ?) AND version = ?`,
      [newTitle, newContent, newProv, newCatTitle, newStatus, idBuf, req.params.id, expVer]
    );

    if (updateRes && updateRes.affectedRows === 0) {
      throw AppError.conflict('اطلاعات این پست هم‌افزایی توسط کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
    }

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM synergy_posts WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const [respRows] = await p.query<any[]>(`SELECT * FROM synergy_responses WHERE post_id = ? OR post_id = ?`, [idBuf, req.params.id]);
    const finalPost = mapSynergyPostRow(updatedRows[0], (respRows || []).map(mapSynergyResponseRow));

    outbox.enqueue('synergy.updated', {
      id: finalPost.id,
      resourceId: finalPost.id,
      postId: finalPost.id,
      version: finalPost.version,
      updates: finalPost,
    });

    res.json(finalPost);
  } catch (err) {
    next(err);
  }
});

synergyRouter.patch('/:id/resolve', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();

    const existingRows = await selectWithTimeout<any>(
      `SELECT * FROM synergy_posts WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!existingRows || existingRows.length === 0) throw AppError.notFound('پست هم‌افزایی');

    const expVer = extractExpectedVersion(req, true);

    const [updateRes]: any = await p.query(
      `UPDATE synergy_posts
       SET status = 'resolved', version = version + 1
       WHERE (id = ? OR id = ?) AND version = ?`,
      [idBuf, req.params.id, expVer]
    );

    if (updateRes && updateRes.affectedRows === 0) {
      throw AppError.conflict('وضعیت این پست توسط کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
    }

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM synergy_posts WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const [respRows] = await p.query<any[]>(`SELECT * FROM synergy_responses WHERE post_id = ? OR post_id = ?`, [idBuf, req.params.id]);
    const finalPost = mapSynergyPostRow(updatedRows[0], (respRows || []).map(mapSynergyResponseRow));

    outbox.enqueue('synergy.updated', {
      id: finalPost.id,
      resourceId: finalPost.id,
      postId: finalPost.id,
      version: finalPost.version,
      updates: finalPost,
    });

    res.json(finalPost);
  } catch (err) {
    next(err);
  }
});

// 2. Get "My Posts" - queried strictly through WallOwnershipRepository without joining public tables
synergyRouter.get('/my-posts', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    const myPostIds = await wallOwnershipRepo.findPostIdsByUserId(currentUser.id);
    if (myPostIds.length === 0) {
      return res.json([]);
    }

    const p = getPool();
    const results: Array<SynergyPost & { version: number }> = [];

    for (const pId of myPostIds) {
      const pIdBuf = toIdBuffer(pId);
      const rows = await selectWithTimeout<any>(
        `SELECT * FROM synergy_posts WHERE id = ? OR id = ? LIMIT 1`,
        [pIdBuf, pId],
        3000
      );
      if (rows && rows.length > 0) {
        const [respRows] = await p.query<any[]>(
          `SELECT * FROM synergy_responses WHERE post_id = ? OR post_id = ? ORDER BY created_at ASC`,
          [pIdBuf, pId]
        );
        results.push(mapSynergyPostRow(rows[0], (respRows || []).map(mapSynergyResponseRow)));
      }
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// 3. Create Synergy Post (Records ownership in isolated wall_ownership table)
synergyRouter.post('/', idempotencyMiddleware, async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    const { title, content, provinceOrCity, category, categoryTitle, isEmpathy, urgency, isAnonymous } = req.body;

    if (!title || !content) {
      throw AppError.badRequest('عنوان و شرح درخواست هم‌افزایی الزامی است.');
    }

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const randCode = Math.floor(100 + Math.random() * 899);
    const pseudonym = isAnonymous ? `همکار قضایی (کد پیگیری: ${randCode})` : currentUser.fullName;
    const now = new Date().toISOString();

    await withTx(async (conn) => {
      await conn.query(
        `INSERT INTO synergy_posts (
          id, author_pseudonym, is_anonymous, title, content, province_or_city, category, category_title, is_empathy, urgency, status, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 1)`,
        [
          idBuf,
          pseudonym,
          isAnonymous ? 1 : 0,
          title,
          content,
          provinceOrCity || 'سراسری',
          category || 'administrative_help',
          categoryTitle || 'همکاری و استعلام اداری-قضایی',
          isEmpathy ? 1 : 0,
          urgency || 'عادی',
        ]
      );

      // Record ownership in isolated repository (Item 7)
      await wallOwnershipRepo.recordOwnership(id, currentUser.id);

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: isAnonymous ? pseudonym : currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `انتشار در دیوار هم‌افزایی/همدلی (${isAnonymous ? 'ناشناس' : 'علنی'}): ${title}`,
        severity: 'info',
      });

      outbox.enqueue('synergy.posted', {
        postId: id,
        isEmpathy: Boolean(isEmpathy),
        provinceOrCity: provinceOrCity || 'سراسری',
      });
    });

    const newPost: SynergyPost & { version: number } = {
      id,
      authorPseudonym: pseudonym,
      isAnonymous: Boolean(isAnonymous),
      title,
      content,
      provinceOrCity: provinceOrCity || 'سراسری',
      category: category || 'administrative_help',
      categoryTitle: categoryTitle || 'همکاری و استعلام اداری-قضایی',
      isEmpathy: Boolean(isEmpathy),
      urgency: urgency || 'عادی',
      status: 'open',
      responses: [],
      version: 1,
      createdAt: now,
    };

    res.status(201).json(newPost);
  } catch (err) {
    next(err);
  }
});

// 4. Respond to Post (Anonymized responses with pseudonym)
synergyRouter.post('/:id/respond', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    const { message, isPrivate, contactShared } = req.body;

    if (!message || !message.trim()) {
      throw AppError.badRequest('متن پیام الزامی است.');
    }

    const idBuf = toIdBuffer(req.params.id);
    const responseId = generateUUIDv7();
    const respIdBuf = toIdBuffer(responseId);
    const responseToken = generateUUIDv7().replace(/-/g, '');
    const randCode = Math.floor(100 + Math.random() * 899);
    const responderPseudonym = `همکار پاسخگو (${randCode})`;

    await withTx(async (conn) => {
      const [postRows] = await conn.query<any[]>(
        `SELECT * FROM synergy_posts WHERE id = ? OR id = ? LIMIT 1`,
        [idBuf, req.params.id]
      );
      if (!postRows || postRows.length === 0) throw AppError.notFound('درخواست هم‌افزایی');

      await conn.query(
        `INSERT INTO synergy_responses (id, post_id, response_token, responder_pseudonym, message, is_private, contact_shared)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [respIdBuf, idBuf, responseToken, responderPseudonym, message.trim(), isPrivate ? 1 : 0, contactShared || null]
      );

      await conn.query(
        `UPDATE synergy_posts SET version = version + 1 WHERE id = ? OR id = ?`,
        [idBuf, req.params.id]
      );

      outbox.enqueue('synergy.responded', {
        postId: req.params.id,
        responseId,
      });
    });

    const p = getPool();
    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM synergy_posts WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const [respRows] = await p.query<any[]>(`SELECT * FROM synergy_responses WHERE post_id = ? OR post_id = ? ORDER BY created_at ASC`, [idBuf, req.params.id]);

    res.json({ success: true, post: mapSynergyPostRow(updatedRows[0], (respRows || []).map(mapSynergyResponseRow)) });
  } catch (err) {
    next(err);
  }
});
