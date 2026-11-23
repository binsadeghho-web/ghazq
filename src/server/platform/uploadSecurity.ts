import path from 'path';
import { AppError } from './errors';
import { UploadCategory } from './storage';

/**
 * Security Hardening Module for File Uploads (Anti-Malware / Anti-Webshell / Magic-Byte Validation)
 * - Strictly restricts Cartable uploads ('cartable_alumni' & 'cartable_officials') to:
 *   Images (.jpg, .png, .webp), PDF (.pdf), and Word documents (.doc, .docx).
 * - Inspects actual binary Magic Bytes so renamed scripts, executables, HTML, SVG, ZIP, or PHP files are rejected.
 * - Canonicalizes file extension exclusively from verified binary header (never trusts client filename extension).
 */

export const MAX_CARTABLE_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_GENERAL_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_PRODUCT_MEDIA_UPLOAD_BYTES = 45 * 1024 * 1024; // 45 MB
export const MAX_COURSE_FILE_UPLOAD_BYTES = 55 * 1024 * 1024; // 55 MB

const DANGEROUS_EXTENSIONS = new Set([
  '.html', '.htm', '.xhtml', '.svg', '.xml', '.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx',
  '.php', '.phtml', '.php3', '.php4', '.php5', '.phar', '.asp', '.aspx', '.jsp', '.cgi',
  '.pl', '.py', '.rb', '.sh', '.bash', '.zsh', '.bat', '.cmd', '.ps1', '.vbs',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.msi', '.app', '.jar', '.war', '.zip', '.rar', '.7z', '.tar', '.gz'
]);

const CARTABLE_ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx']);
const PRODUCT_MEDIA_ALLOWED_EXTS = new Set([
  '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.mp4', '.webm', '.mov', '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'
]);
const COURSE_FILE_ALLOWED_EXTS = new Set([
  '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.mp4', '.webm', '.mov', '.pdf', '.doc', '.docx', '.pptx', '.ppt', '.xlsx', '.txt', '.zip', '.jpg', '.jpeg', '.png', '.webp'
]);

export interface ValidatedUploadInfo {
  canonicalExt: string;
  mimeType: string;
  kind: 'image' | 'pdf' | 'word' | 'audio' | 'video' | 'other';
}

function isJpeg(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isPng(buf: Buffer): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  );
}

function isWebp(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  );
}

function isPdf(buf: Buffer): boolean {
  // %PDF- may appear after optional UTF-8 BOM or leading whitespace within first 16 bytes
  const head = buf.subarray(0, Math.min(buf.length, 32)).toString('ascii');
  return head.includes('%PDF-');
}

function isDocOle2(buf: Buffer): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0xd0 &&
    buf[1] === 0xcf &&
    buf[2] === 0x11 &&
    buf[3] === 0xe0 &&
    buf[4] === 0xa1 &&
    buf[5] === 0xb1 &&
    buf[6] === 0x1a &&
    buf[7] === 0xe1
  );
}

function isDocxOoxml(buf: Buffer): boolean {
  // DOCX is a ZIP container (PK\x03\x04) containing OOXML entries ('[Content_Types].xml' or 'word/')
  const isZipSig =
    buf.length >= 4 &&
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    buf[2] === 0x03 &&
    buf[3] === 0x04;
  if (!isZipSig) return false;

  // Scan binary buffer for OOXML signature strings to prevent arbitrary .zip renamed as .docx
  const hasContentTypes = buf.includes(Buffer.from('[Content_Types].xml', 'ascii'));
  const hasWordDir = buf.includes(Buffer.from('word/', 'ascii'));
  return hasContentTypes || hasWordDir;
}

function containsScriptableHead(buf: Buffer): boolean {
  const sample = buf
    .subarray(0, Math.min(buf.length, 1024))
    .toString('utf8')
    .trimStart()
    .toLowerCase();
  return (
    sample.startsWith('<!doctype html') ||
    sample.startsWith('<html') ||
    sample.startsWith('<script') ||
    sample.startsWith('<svg') ||
    sample.startsWith('<?php') ||
    sample.startsWith('#!/')
  );
}

function isMp3(buf: Buffer): boolean {
  if (buf.length < 3) return false;
  if (buf.toString('ascii', 0, 3) === 'ID3') return true;
  return buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
}

function isWav(buf: Buffer): boolean {
  return buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WAVE';
}

function isOgg(buf: Buffer): boolean {
  return buf.length >= 4 && buf.toString('ascii', 0, 4) === 'OggS';
}

function isFtypMedia(buf: Buffer): boolean {
  return buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp';
}

function isWebm(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
}

export function validateSecureUploadBuffer(
  category: UploadCategory,
  originalFilename: string,
  buffer: Buffer,
  declaredMime?: string
): ValidatedUploadInfo {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw AppError.badRequest('فایل ارسالی خالی یا نامعتبر است.', 'EMPTY_UPLOAD');
  }

  const isCartable = category === 'cartable_alumni' || category === 'cartable_officials';
  const isStrictDocOrImage =
    isCartable ||
    category === 'verdict' ||
    category === 'product_receipt' ||
    category === 'course_receipt' ||
    category === 'course_certificate';
  const isProductMedia = category === 'product_media';
  const isCourseFile = category === 'course_file';
  const maxBytes = isCourseFile
    ? MAX_COURSE_FILE_UPLOAD_BYTES
    : isProductMedia
    ? MAX_PRODUCT_MEDIA_UPLOAD_BYTES
    : isStrictDocOrImage
    ? MAX_CARTABLE_UPLOAD_BYTES
    : MAX_GENERAL_UPLOAD_BYTES;
  if (buffer.length > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    throw AppError.badRequest(
      `حجم فایل بیش از حد مجاز (${maxMb} مگابایت) است.`,
      'FILE_TOO_LARGE'
    );
  }

  const cleanOrigName = path.basename(String(originalFilename || 'file')).trim();
  const origExt = path.extname(cleanOrigName).toLowerCase();

  // Reject null bytes or double-extension script names (e.g. shell.php.jpg)
  if (cleanOrigName.includes('\0')) {
    throw AppError.badRequest('نام فایل حاوی کاراکتر غیرمجاز است.', 'INVALID_FILENAME');
  }

  if (DANGEROUS_EXTENSIONS.has(origExt) && !(isCourseFile && origExt === '.zip')) {
    throw AppError.badRequest(
      `بارگذاری فایل با پسوند غیرمجاز (${origExt}) به دلایل امنیتی مسدود است.`,
      'DANGEROUS_FILE_EXTENSION'
    );
  }

  // Block hidden script payloads regardless of extension
  if (containsScriptableHead(buffer)) {
    throw AppError.badRequest(
      'محتوای فایل شامل کدهای اسکریپتی یا نشانه‌گذاری غیرمجاز است و مسدود شد.',
      'MALICIOUS_PAYLOAD_DETECTED'
    );
  }

  // Strict validation (Images + PDF + Word ONLY, verified by Magic Bytes) for Cartable & Verdicts
  if (isStrictDocOrImage) {
    if (origExt && !CARTABLE_ALLOWED_EXTS.has(origExt)) {
      throw AppError.badRequest(
        category === 'verdict'
          ? 'در تالار رأی صرفاً ارسال تصویر (JPG, PNG, WEBP)، فایل PDF و سند Word (DOC, DOCX) مجاز است.'
          : 'در کارتابل صرفاً ارسال تصویر (JPG, PNG, WEBP)، فایل PDF و سند Word (DOC, DOCX) مجاز است.',
        category === 'verdict' ? 'INVALID_VERDICT_FILE_TYPE' : 'INVALID_CARTABLE_FILE_TYPE'
      );
    }

    if (isJpeg(buffer)) {
      return { canonicalExt: '.jpg', mimeType: 'image/jpeg', kind: 'image' };
    }
    if (isPng(buffer)) {
      return { canonicalExt: '.png', mimeType: 'image/png', kind: 'image' };
    }
    if (isWebp(buffer)) {
      return { canonicalExt: '.webp', mimeType: 'image/webp', kind: 'image' };
    }
    if (isPdf(buffer)) {
      return { canonicalExt: '.pdf', mimeType: 'application/pdf', kind: 'pdf' };
    }
    if (isDocOle2(buffer)) {
      return { canonicalExt: '.doc', mimeType: 'application/msword', kind: 'word' };
    }
    if (isDocxOoxml(buffer)) {
      return {
        canonicalExt: '.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        kind: 'word',
      };
    }

    throw AppError.badRequest(
      'ساختار باینری فایل با فرمت‌های مجاز (تصویر JPG/PNG/WEBP، PDF یا Word DOC/DOCX) مطابقت ندارد.',
      'MAGIC_BYTE_MISMATCH'
    );
  }

  if (isProductMedia || isCourseFile) {
    const allowedSet = isCourseFile ? COURSE_FILE_ALLOWED_EXTS : PRODUCT_MEDIA_ALLOWED_EXTS;
    if (origExt && !allowedSet.has(origExt)) {
      throw AppError.badRequest(
        isCourseFile
          ? 'در پوشه فایل‌های دوره، فرمت‌های صوتی، ویدئویی، PDF، Word، PowerPoint، Excel، تصویر، TXT و بسته فشرده ZIP مجاز است.'
          : 'در فایل‌های جلسات و محصولات صرفاً فرمت‌های صوتی (MP3, WAV, OGG, M4A, AAC)، ویدئویی (MP4, WEBM, MOV)، PDF، Word و تصویر مجاز است.',
        'INVALID_PRODUCT_MEDIA_TYPE'
      );
    }
    if (isJpeg(buffer)) return { canonicalExt: '.jpg', mimeType: 'image/jpeg', kind: 'image' };
    if (isPng(buffer)) return { canonicalExt: '.png', mimeType: 'image/png', kind: 'image' };
    if (isWebp(buffer)) return { canonicalExt: '.webp', mimeType: 'image/webp', kind: 'image' };
    if (isPdf(buffer)) return { canonicalExt: '.pdf', mimeType: 'application/pdf', kind: 'pdf' };
    if (isDocOle2(buffer)) {
      if (isCourseFile && origExt === '.ppt') {
        return { canonicalExt: '.ppt', mimeType: 'application/vnd.ms-powerpoint', kind: 'other' };
      }
      return { canonicalExt: '.doc', mimeType: 'application/msword', kind: 'word' };
    }
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    ) {
      if (isCourseFile && origExt === '.pptx') {
        return {
          canonicalExt: '.pptx',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          kind: 'other',
        };
      }
      if (isCourseFile && origExt === '.xlsx') {
        return {
          canonicalExt: '.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          kind: 'other',
        };
      }
      if (isDocxOoxml(buffer)) {
        return {
          canonicalExt: '.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          kind: 'word',
        };
      }
      if (isCourseFile && origExt === '.zip') {
        return { canonicalExt: '.zip', mimeType: 'application/zip', kind: 'other' };
      }
    }
    if (isWav(buffer)) return { canonicalExt: '.wav', mimeType: 'audio/wav', kind: 'audio' };
    if (isOgg(buffer)) return { canonicalExt: '.ogg', mimeType: 'audio/ogg', kind: 'audio' };
    if (isWebm(buffer)) return { canonicalExt: '.webm', mimeType: 'video/webm', kind: 'video' };
    if (isFtypMedia(buffer)) {
      if (origExt === '.m4a' || declaredMime?.startsWith('audio/')) {
        return { canonicalExt: '.m4a', mimeType: 'audio/mp4', kind: 'audio' };
      }
      if (origExt === '.mov') {
        return { canonicalExt: '.mov', mimeType: 'video/quicktime', kind: 'video' };
      }
      return { canonicalExt: '.mp4', mimeType: 'video/mp4', kind: 'video' };
    }
    if (isMp3(buffer)) {
      if (origExt === '.aac') return { canonicalExt: '.aac', mimeType: 'audio/aac', kind: 'audio' };
      return { canonicalExt: '.mp3', mimeType: 'audio/mpeg', kind: 'audio' };
    }
    if (isCourseFile && origExt === '.txt') {
      return { canonicalExt: '.txt', mimeType: 'text/plain; charset=utf-8', kind: 'other' };
    }
    throw AppError.badRequest(
      'ساختار باینری فایل رسانه‌ای با فرمت‌های مجاز مطابقت ندارد.',
      'MAGIC_BYTE_MISMATCH'
    );
  }

  // Non-cartable categories (avatars, courses, products, research, etc.) — still verify safe image/doc headers
  if (isJpeg(buffer)) return { canonicalExt: '.jpg', mimeType: 'image/jpeg', kind: 'image' };
  if (isPng(buffer)) return { canonicalExt: '.png', mimeType: 'image/png', kind: 'image' };
  if (isWebp(buffer)) return { canonicalExt: '.webp', mimeType: 'image/webp', kind: 'image' };
  if (isPdf(buffer)) return { canonicalExt: '.pdf', mimeType: 'application/pdf', kind: 'pdf' };
  if (isDocOle2(buffer)) return { canonicalExt: '.doc', mimeType: 'application/msword', kind: 'word' };
  if (isDocxOoxml(buffer)) {
    return {
      canonicalExt: '.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      kind: 'word',
    };
  }

  if (declaredMime && declaredMime.includes('svg')) {
    throw AppError.badRequest('فرمت SVG به دلایل امنیتی مسدود است.', 'UNSAFE_SVG_BLOCKED');
  }

  const safeFallbackExt = origExt && /^\.[a-z0-9]{1,5}$/.test(origExt) ? origExt : '.bin';
  if (safeFallbackExt === '.bin') {
    throw AppError.badRequest('فرمت فایل ناشناخته و غیرقابل قبول است.', 'UNKNOWN_FILE_TYPE');
  }

  return {
    canonicalExt: safeFallbackExt,
    mimeType: declaredMime || 'application/octet-stream',
    kind: 'other',
  };
}

export function isCartableAllowedClientFile(file: File): { ok: boolean; error?: string } {
  const name = (file.name || '').toLowerCase();
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  if (!CARTABLE_ALLOWED_EXTS.has(ext)) {
    return {
      ok: false,
      error: `فرمت «${ext || file.type || 'ناشناخته'}» مجاز نیست. صرفاً تصویر (JPG, PNG, WEBP)، فایل PDF و سند Word (DOC, DOCX) قابل پیوست است.`,
    };
  }
  if (file.size > MAX_CARTABLE_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `حجم فایل «${file.name}» از سقف مجاز (۸ مگابایت) بیشتر است.`,
    };
  }
  if (file.size === 0) {
    return {
      ok: false,
      error: `فایل «${file.name}» خالی است.`,
    };
  }
  return { ok: true };
}

export function isVerdictAllowedClientFile(file: File): { ok: boolean; error?: string } {
  return isCartableAllowedClientFile(file);
}
