import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const MAX_WIDTH = 1500;
const WATERMARK_FILE = path.join(process.cwd(), 'public', 'watermark.png');

export async function addWatermark(buffer: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}> {
  // Оставляем как есть, если позже захочешь вернуть наложение PNG
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error('Unable to read image dimensions');
  }

  let width = meta.width;
  let height = meta.height;
  let processed = buffer;

  if (width > MAX_WIDTH) {
    const ratio = height / width;
    width = MAX_WIDTH;
    height = Math.round(MAX_WIDTH * ratio);
    processed = await sharp(buffer)
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
  }

  if (!fs.existsSync(WATERMARK_FILE)) {
    throw new Error(`Watermark file not found at: ${WATERMARK_FILE}`);
  }
  const wmBuffer = fs.readFileSync(WATERMARK_FILE);

  const composited = await sharp(processed)
    .composite([{ input: wmBuffer, tile: true, blend: 'over' }]) // без opacity, чтобы не ругался TS
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  return { buffer: composited, width, height, size: composited.length };
}

// НОВОЕ: создаём низкокачественное превью (без watermark)
export async function createLowQualityPreview(
  buffer: Buffer,
  maxWidth: number = 1200,
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

export async function createThumbnail(buffer: Buffer, size: number = 300): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 80 })
    .toBuffer();
}