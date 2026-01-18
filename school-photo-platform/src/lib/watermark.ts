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
  console.log('🎨 Starting watermark process...');
  
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error('Unable to read image dimensions');
  }

  let width = meta.width;
  let height = meta.height;
  let processed = buffer;

  // Resize if needed
  if (width > MAX_WIDTH) {
    console.log(`📏 Resizing from ${width}x${height} to ${MAX_WIDTH}x...`);
    const ratio = height / width;
    width = MAX_WIDTH;
    height = Math.round(MAX_WIDTH * ratio);
    processed = await sharp(buffer)
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    console.log(`✅ Resized to ${width}x${height}`);
  }

  // ✅ Проверяем наличие watermark файла
  if (!fs.existsSync(WATERMARK_FILE)) {
    throw new Error(`❌ Watermark file not found at: ${WATERMARK_FILE}`);
  }
  
  console.log('✅ Watermark file found:', WATERMARK_FILE);

  // ✅ Применяем watermark
  const composited = await sharp(processed)
    .composite([{ input: WATERMARK_FILE, tile: true, blend: 'over' }])
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  console.log(`✅ Watermark applied. Size: ${composited.length} bytes`);

  return {
    buffer: composited,
    width,
    height,
    size: composited.length,
  };
}

export async function createThumbnail(buffer: Buffer, size: number = 300): Promise<Buffer> {
  console.log('🖼️ Creating thumbnail...');
  const thumbnail = await sharp(buffer)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 80 })
    .toBuffer();
  console.log(`✅ Thumbnail created: ${thumbnail.length} bytes`);
  return thumbnail;
}