import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Агрессивно режем ширину для превью
const MAX_WATERMARK_WIDTH = 800;   // для addWatermark
const DEFAULT_PREVIEW_MAX_WIDTH = 1200; // для createLowQualityPreview
const WATERMARK_FILE = path.join(process.cwd(), 'public', 'watermark.png');

// Фоллбэк: плиточный SVG с прозрачным текстом (если watermark.png отсутствует)
const svgOverlay = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <defs>
      <pattern id="wm" patternUnits="userSpaceOnUse" width="400" height="400" patternTransform="rotate(-30)">
        <text x="20" y="200" font-size="48" font-family="Arial, sans-serif" fill="rgba(255,0,0,0.35)">
          sample
        </text>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#wm)" />
  </svg>
`);

/**
 * Наложение вотермарки + сильная деградация качества
 * Возвращает JPEG (quality ~40), ширина ограничена MAX_WATERMARK_WIDTH
 */
export async function addWatermark(buffer: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}> {
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) throw new Error('Unable to read image dimensions');

  let width = meta.width;
  let height = meta.height;
  let processed = buffer;

  // Жёстко уменьшаем ширину
  if (width > MAX_WATERMARK_WIDTH) {
    const ratio = height / width;
    width = MAX_WATERMARK_WIDTH;
    height = Math.round(MAX_WATERMARK_WIDTH * ratio);
    processed = await sharp(buffer)
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
  }

  let composited: Buffer;

  // Если есть watermark.png — накладываем плиткой (без opacity, чтобы не ругался TS)
  if (fs.existsSync(WATERMARK_FILE)) {
    const wmBuffer = fs.readFileSync(WATERMARK_FILE);
    composited = await sharp(processed)
      .composite([{ input: wmBuffer, tile: true, blend: 'over' }])
      .jpeg({ quality: 40, progressive: true })
      .toBuffer();
  } else {
    // Фоллбэк: SVG плитка
    composited = await sharp(processed)
      .composite([{ input: svgOverlay, tile: true, blend: 'over' }])
      .jpeg({ quality: 40, progressive: true })
      .toBuffer();
  }

  return {
    buffer: composited,
    width,
    height,
    size: composited.length,
  };
}

/**
 * Создание низкокачественного превью БЕЗ вотермарки
 * Возвращает JPEG (quality по умолчанию 60), ширина ограничена maxWidth
 */
export async function createLowQualityPreview(
  buffer: Buffer,
  maxWidth: number = DEFAULT_PREVIEW_MAX_WIDTH,
  quality: number = 60
): Promise<{ buffer: Buffer; width: number; height: number; size: number }> {
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error('Unable to read image dimensions');
  }
  let width = meta.width;
  let height = meta.height;

  if (width > maxWidth) {
    const ratio = height / width;
    width = maxWidth;
    height = Math.round(maxWidth * ratio);
  }

  const preview = await sharp(buffer)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, progressive: true })
    .toBuffer();

  return { buffer: preview, width, height, size: preview.length };
}

/**
 * Создание миниатюры (квадрат) из буфера
 */
export async function createThumbnail(buffer: Buffer, size: number = 300): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 70 })
    .toBuffer();
}