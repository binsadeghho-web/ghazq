export type ImageCompressionPreset = 'cover' | 'avatar' | 'banner' | 'receipt';

interface PresetConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

const PRESETS: Record<ImageCompressionPreset, PresetConfig> = {
  cover: { maxWidth: 1280, maxHeight: 800, quality: 0.82 },
  banner: { maxWidth: 1400, maxHeight: 700, quality: 0.82 },
  avatar: { maxWidth: 512, maxHeight: 512, quality: 0.84 },
  receipt: { maxWidth: 1400, maxHeight: 1400, quality: 0.82 },
};

export interface CompressedImageResult {
  file: File;
  previewUrl: string;
  originalBytes: number;
  compressedBytes: number;
  savedPercent: number;
}

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '۰ بایت';
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} مگابایت`;
}

export function formatFileSizeLabel(bytes: number): string {
  return formatSize(bytes);
}

/**
 * Compresses raster images client-side using hardware-accelerated createImageBitmap + Canvas WebP/JPEG encoding.
 * Also yields a local instant ObjectURL so the admin gets immediate visual feedback with zero UI lag.
 */
export async function compressImageFast(
  file: File,
  preset: ImageCompressionPreset = 'cover'
): Promise<CompressedImageResult> {
  const originalBytes = file.size;
  const fallbackUrl = URL.createObjectURL(file);

  // Skip non-image or SVG or already ultra-compact files (< 35 KB)
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif' ||
    originalBytes < 35 * 1024
  ) {
    return {
      file,
      previewUrl: fallbackUrl,
      originalBytes,
      compressedBytes: originalBytes,
      savedPercent: 0,
    };
  }

  const cfg = PRESETS[preset];

  try {
    let sourceWidth = 0;
    let sourceHeight = 0;
    let bitmap: ImageBitmap | null = null;
    let imgEl: HTMLImageElement | null = null;

    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(file);
      sourceWidth = bitmap.width;
      sourceHeight = bitmap.height;
    } else {
      imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image decode failed'));
        img.src = fallbackUrl;
      });
      sourceWidth = imgEl.naturalWidth;
      sourceHeight = imgEl.naturalHeight;
    }

    if (!sourceWidth || !sourceHeight) {
      bitmap?.close?.();
      return {
        file,
        previewUrl: fallbackUrl,
        originalBytes,
        compressedBytes: originalBytes,
        savedPercent: 0,
      };
    }

    const scale = Math.min(1, cfg.maxWidth / sourceWidth, cfg.maxHeight / sourceHeight);
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap?.close?.();
      return {
        file,
        previewUrl: fallbackUrl,
        originalBytes,
        compressedBytes: originalBytes,
        savedPercent: 0,
      };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (bitmap) {
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      bitmap.close();
    } else if (imgEl) {
      ctx.drawImage(imgEl, 0, 0, targetWidth, targetHeight);
    }

    const toBlobAsync = (mime: string, quality: number) =>
      new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), mime, quality));

    // Prefer WebP (fast, small, crisp); fallback to JPEG if browser lacks WebP encoder
    let compressedBlob = await toBlobAsync('image/webp', cfg.quality);
    let targetExt = '.webp';
    let targetMime = 'image/webp';

    if (!compressedBlob || compressedBlob.type !== 'image/webp') {
      compressedBlob = await toBlobAsync('image/jpeg', cfg.quality);
      targetExt = '.jpg';
      targetMime = 'image/jpeg';
    }

    // Keep original if compression did not shrink and size is modest
    if (!compressedBlob || (compressedBlob.size >= originalBytes && originalBytes < 2 * 1024 * 1024)) {
      return {
        file,
        previewUrl: fallbackUrl,
        originalBytes,
        compressedBytes: originalBytes,
        savedPercent: 0,
      };
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    const compressedFile = new File([compressedBlob], `${baseName}${targetExt}`, {
      type: targetMime,
      lastModified: Date.now(),
    });
    const previewUrl = URL.createObjectURL(compressedFile);
    URL.revokeObjectURL(fallbackUrl);

    const savedPercent = Math.max(0, Math.round(((originalBytes - compressedFile.size) / originalBytes) * 100));

    return {
      file: compressedFile,
      previewUrl,
      originalBytes,
      compressedBytes: compressedFile.size,
      savedPercent,
    };
  } catch {
    return {
      file,
      previewUrl: fallbackUrl,
      originalBytes,
      compressedBytes: originalBytes,
      savedPercent: 0,
    };
  }
}
