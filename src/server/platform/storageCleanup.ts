import fs from 'fs';
import path from 'path';
import { storageConfig } from './storage';
import { getPool, isDatabaseConnected } from './mysqlDatabase';
import { toIdBuffer } from './uuidv7';
import { logger } from './logger';

const CLEANABLE_IMAGE_PREFIXES = ['/uploads/courses/', '/uploads/avatars/'];

export function isCleanableLocalImageUrl(url?: string | null): url is string {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return CLEANABLE_IMAGE_PREFIXES.some(prefix => trimmed.startsWith(prefix));
}

function resolveSafeUploadDiskPath(url: string): string | null {
  const cleanUrl = url.split('?')[0].split('#')[0].trim();
  if (!cleanUrl.startsWith('/uploads/')) return null;
  const relative = cleanUrl.slice('/uploads/'.length);
  if (!relative || relative.includes('..') || relative.includes('\0')) return null;

  const baseDir = path.resolve(storageConfig.uploadsDir);
  const resolved = path.resolve(baseDir, relative);
  if (!resolved.startsWith(baseDir + path.sep)) {
    return null;
  }
  return resolved;
}

/**
 * Safely deletes an old course cover or instructor image from disk ONLY when:
 * 1) The path is strictly confined inside storageConfig.uploadsDir
 * 2) Zero active/archived course rows or course_instructors rows still reference that exact URL
 */
export async function deleteCourseImageIfUnreferenced(
  oldUrl?: string | null,
  excludeCourseId?: string
): Promise<boolean> {
  if (!isCleanableLocalImageUrl(oldUrl)) return false;

  const diskPath = resolveSafeUploadDiskPath(oldUrl);
  if (!diskPath) return false;

  try {
    if (isDatabaseConnected()) {
      const p = getPool();
      const params: any[] = [oldUrl, oldUrl, oldUrl, `%${oldUrl}%`];
      let excludeClause = '';
      if (excludeCourseId) {
        excludeClause = ` AND id != ? AND id != ?`;
        params.push(toIdBuffer(excludeCourseId), excludeCourseId);
      }

      const [rows]: any = await p.query(
        `SELECT COUNT(*) AS cnt
         FROM courses
         WHERE (cover_image = ? OR instructor_avatar_url = ? OR post_enrollment_banner = ? OR CAST(instructors AS CHAR) LIKE ?)${excludeClause}`,
        params
      );
      const count = Number(rows?.[0]?.cnt || 0);
      if (count > 0) {
        return false;
      }

      try {
        const instParams: any[] = [oldUrl];
        let instExclude = '';
        if (excludeCourseId) {
          instExclude = ` AND course_id != ? AND course_id != ?`;
          instParams.push(toIdBuffer(excludeCourseId), excludeCourseId);
        }
        const [instRows]: any = await p.query(
          `SELECT COUNT(*) AS cnt FROM course_instructors WHERE avatar_url = ?${instExclude}`,
          instParams
        );
        if (Number(instRows?.[0]?.cnt || 0) > 0) {
          return false;
        }
      } catch {
        // Ignore if table not created yet
      }
    }

    await fs.promises.unlink(diskPath);
    logger.info(`Cleaned up replaced course/instructor image from disk: ${oldUrl}`);
    return true;
  } catch (err: any) {
    if (err?.code !== 'ENOENT') {
      logger.warn(`Notice deleting replaced image (${oldUrl}): ${err?.message || err}`);
    }
    return false;
  }
}

/**
 * Promotes files uploaded during new-course creation from `course_files/draft_<key>`
 * to the permanent `course_files/course_<newCourseId>` directory and rewrites URLs.
 */
export async function promoteDraftCourseFilesFolder(
  draftFolderKey: string,
  newCourseId: string,
  offlineFiles: any[] = []
): Promise<any[]> {
  const safeDraftKey = String(draftFolderKey || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeDraftKey) return offlineFiles;

  const baseDir = path.resolve(storageConfig.categories.course_file.path);
  const srcDir = path.resolve(baseDir, `draft_${safeDraftKey}`);
  const dstDir = path.resolve(baseDir, `course_${newCourseId}`);

  if (!srcDir.startsWith(baseDir + path.sep) || !dstDir.startsWith(baseDir + path.sep)) {
    return offlineFiles;
  }

  try {
    await fs.promises.access(srcDir);
    await fs.promises.mkdir(dstDir, { recursive: true, mode: 0o755 });
    const entries = await fs.promises.readdir(srcDir);
    for (const file of entries) {
      const fromPath = path.join(srcDir, file);
      const toPath = path.join(dstDir, file);
      try {
        await fs.promises.rename(fromPath, toPath);
      } catch {
        const buf = await fs.promises.readFile(fromPath);
        await fs.promises.writeFile(toPath, buf);
        await fs.promises.unlink(fromPath);
      }
    }
    await fs.promises.rmdir(srcDir).catch(() => {});
  } catch {
    // Draft dir may not exist if admin didn't upload local files during draft creation
  }

  const draftUrlPrefix = `/api/storage/private/course_files/draft_${safeDraftKey}/`;
  const targetUrlPrefix = `/api/storage/private/course_files/course_${newCourseId}/`;

  return (offlineFiles || []).map(f => {
    const rawUrl = String(f.url || f.downloadUrl || '');
    if (rawUrl.includes(draftUrlPrefix)) {
      const nextUrl = rawUrl.replace(draftUrlPrefix, targetUrlPrefix);
      return { ...f, url: nextUrl, downloadUrl: nextUrl };
    }
    return f;
  });
}
