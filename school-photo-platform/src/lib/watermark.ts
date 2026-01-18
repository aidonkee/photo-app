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
  try {
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height) {
      throw new Error('Unable to read image dimensions');
    }

    let width = meta.width;
    let height = meta.height;
    let processed = buffer;

    // resize if too wide
    if (width > MAX_WIDTH) {
      const ratio = height / width;
      width = MAX_WIDTH;
      height = Math.round(MAX_WIDTH * ratio);
      processed = await sharp(buffer)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }

    const watermarkExists = fs.existsSync(WATERMARK_FILE);

    // Если нет watermark.png — просто вернём отресайзенный JPEG
    const composited = watermarkExists
      ? await sharp(processed)
          .composite([{ input: WATERMARK_FILE, tile: true, blend: 'over' }])
          .jpeg({ quality: 85, progressive: true })
          .toBuffer()
      : await sharp(processed)
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();

    return {
      buffer: composited,
      width,
      height,
      size: composited.length,
    };
  } catch (err: any) {
    console.error('Sharp Watermark Error (fallback to original):', err);
    // Фолбэк: отдать оригинал, но с реальными метаданными
    const meta = await sharp(buffer).metadata();
    return {
      buffer,
      width: meta.width || 0,
      height: meta.height || 0,
      size: buffer.length,
    };
  }
}

export async function createThumbnail(buffer: Buffer, size: number = 300): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 80 })
    .toBuffer();
}