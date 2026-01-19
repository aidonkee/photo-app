import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const MAX_WIDTH = 1500;
const WATERMARK_FILE = path.join(process.cwd(), 'public', 'watermark.png');

// Фоллбэк: плиточный SVG с прозрачным текстом
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

export async function addWatermark(buffer: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}> {
  console.log('🎨 Starting watermark process...');
  console.log('cwd:', process.cwd());
  console.log('WATERMARK_FILE:', WATERMARK_FILE);

  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error('Unable to read image dimensions');
  }

  let width = meta.width;
  let height = meta.height;
  let processed = buffer;

  // Resize if needed
  if (width > MAX_WIDTH) {
    const ratio = height / width;
    width = MAX_WIDTH;
    height = Math.round(MAX_WIDTH * ratio);
    processed = await sharp(buffer)
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
  }

  let composited: Buffer;

  if (fs.existsSync(WATERMARK_FILE)) {
    const wmBuffer = fs.readFileSync(WATERMARK_FILE);
    console.log('✅ Watermark file found. size=', wmBuffer.length);

    // ВАЖНО: прозрачность должна быть в самом watermark.png (альфа-канал).
    // Здесь НЕ используем opacity, чтобы избежать TS ошибки.
    composited = await sharp(processed)
      .composite([{ input: wmBuffer, tile: true, blend: 'over' }])
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  } else {
    console.warn('⚠️ Watermark file missing. Using SVG fallback.');
    // Фоллбэк с RGBA-прозрачностью внутри SVG
    composited = await sharp(processed)
      .composite([{ input: svgOverlay, tile: true, blend: 'over' }])
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  }

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