import sharp from 'sharp';

const MAX_WIDTH = 1500; // Maximum width for web optimization
const WATERMARK_TEXT = 'PREVIEW';
const WATERMARK_OPACITY = 0.3;

/**
 * Add watermark to image buffer
 * @param buffer - Original image buffer
 * @returns Processed image buffer with watermark
 */
export async function addWatermark(buffer: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}> {
  try {
    // Get original image metadata
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata. height) {
      throw new Error('Unable to read image dimensions');
    }

    let width = metadata.width;
    let height = metadata.height;

    // Resize if image is too large
    let processedBuffer = buffer;
    if (width > MAX_WIDTH) {
      const aspectRatio = height / width;
      width = MAX_WIDTH;
      height = Math.round(MAX_WIDTH * aspectRatio);

      processedBuffer = await sharp(buffer)
        .resize(width, height, {
          fit:  'inside',
          withoutEnlargement: true,
        })
        .toBuffer();
    }

    // Create SVG watermark overlay with EXACT dimensions
    const watermarkSvg = createWatermarkSvg(width, height);
    const watermarkBuffer = Buffer.from(watermarkSvg);

    // Composite watermark onto image
    const finalBuffer = await sharp(processedBuffer)
      .composite([
        {
          input: watermarkBuffer,
          blend: 'over',
        },
      ])
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    return {
      buffer: finalBuffer,
      width,
      height,
      size: finalBuffer.length,
    };
  } catch (error:  any) {
    console.error('Error adding watermark:', error);
    throw new Error(error.message || 'Failed to process image');
  }
}

/**
 * Create thumbnail from image buffer
 * @param buffer - Original image buffer
 * @param size - Thumbnail size (default: 300)
 * @returns Thumbnail buffer
 */
export async function createThumbnail(
  buffer: Buffer,
  size: number = 300
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 80,
      })
      .toBuffer();
  } catch (error: any) {
    console.error('Error creating thumbnail:', error);
    throw new Error(error.message || 'Failed to create thumbnail');
  }
}

/**
 * Create SVG watermark pattern
 * @param width - Image width
 * @param height - Image height
 * @returns SVG string
 */
function createWatermarkSvg(width: number, height: number): string {
  const fontSize = Math.min(width, height) * 0.08; // 8% of smallest dimension
  const spacing = fontSize * 3;
  const rotationAngle = -30;

  // Calculate number of repetitions
  const cols = Math.ceil(width / spacing) + 2;
  const rows = Math. ceil(height / spacing) + 2;

  let textElements = '';

  // Create tiled pattern
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

/**
 * Extract image metadata
 * @param buffer - Image buffer
 * @returns Image metadata
 */
export async function getImageMetadata(buffer:  Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  try {
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
    };
  } catch (error: any) {
    console.error('Error extracting metadata:', error);
    throw new Error(error.message || 'Failed to extract image metadata');
  }
}