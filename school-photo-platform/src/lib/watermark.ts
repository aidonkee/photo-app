import sharp from 'sharp';

const MAX_WIDTH = 1500;
const WATERMARK_TEXT = 'PREVIEW';
const WATERMARK_OPACITY = 0.3;

export async function addWatermark(buffer: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}> {
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }

  let width = metadata.width;
  let height = metadata.height;
  let processedBuffer = buffer;

  if (width > MAX_WIDTH) {
    const aspectRatio = height / width;
    width = MAX_WIDTH;
    height = Math.round(MAX_WIDTH * aspectRatio);
    processedBuffer = await sharp(buffer)
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
  }

  const watermarkSvg = createWatermarkSvg(width, height);
  const watermarkBuffer = Buffer.from(watermarkSvg);

  const finalBuffer = await sharp(processedBuffer)
    .composite([{ input: watermarkBuffer, blend: 'over' }])
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  return {
    buffer: finalBuffer,
    width,
    height,
    size: finalBuffer.length,
  };
}

export async function createThumbnail(buffer: Buffer, size: number = 300): Promise<Buffer> {
  return await sharp(buffer)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 80 })
    .toBuffer();
}

function createWatermarkSvg(width: number, height: number): string {
  const fontSize = Math.min(width, height) * 0.08;
  const spacing = fontSize * 3;
  const rotationAngle = -30;
  const cols = Math.ceil(width / spacing) + 2;
  const rows = Math.ceil(height / spacing) + 2;

  let textElements = '';
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * spacing - spacing;
      const y = row * spacing - spacing;
      textElements += `
        <text
          x="${x}"
          y="${y}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          font-weight="bold"
          fill="white"
          fill-opacity="${WATERMARK_OPACITY}"
          transform="rotate(${rotationAngle} ${x} ${y})"
        >
          ${WATERMARK_TEXT}
        </text>
      `;
    }
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.5"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        ${textElements}
      </g>
    </svg>
  `;
}

export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: buffer.length,
  };
}