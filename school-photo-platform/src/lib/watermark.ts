import sharp from 'sharp';

const MAX_WIDTH = 1500;
const WATERMARK_TEXT = 'PREVIEW';
const WATERMARK_OPACITY = 0.3;

/**
 * Добавляет вотермарку на изображение
 */
export async function addWatermark(buffer: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to read image dimensions');
    }

    let width = metadata.width;
    let height = metadata.height;
    let processedBuffer = buffer;

    // Ресайз для оптимизации веба
    if (width > MAX_WIDTH) {
      const aspectRatio = height / width;
      width = MAX_WIDTH;
      height = Math.round(MAX_WIDTH * aspectRatio);
      processedBuffer = await sharp(buffer)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }

    // Создаем SVG вотермарку БЕЗ использования системных шрифтов (пути/фигуры)
    // Либо используем простую сетку
    const watermarkSvg = createWatermarkSvg(width, height);
    const watermarkBuffer = Buffer.from(watermarkSvg);

    const finalBuffer = await sharp(processedBuffer)
      .composite([{ 
        input: watermarkBuffer, 
        blend: 'over',
        gravity: 'centre' 
      }])
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    return {
      buffer: finalBuffer,
      width,
      height,
      size: finalBuffer.length,
    };
  } catch (error: any) {
    console.error('Sharp Watermark Error:', error);
    throw new Error(`Watermark process failed: ${error.message}`);
  }
}

/**
 * Создает превью (миниатюру)
 */
export async function createThumbnail(buffer: Buffer, size: number = 300): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(size, size, { 
        fit: 'cover', 
        position: 'center',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error: any) {
    console.error('Sharp Thumbnail Error:', error);
    return buffer; // Возвращаем оригинал если не удалось сжать
  }
}

/**
 * Генерирует SVG сетку. 
 * ВНИМАНИЕ: Чтобы избежать Fontconfig error, мы используем максимально простые стили.
 * Если ошибка сохранится, замени этот блок на наложение готового PNG файла.
 */
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
      
      // Используем системный шрифт 'serif' — он самый стабильный
      textElements += `
        <text
          x="${x}"
          y="${y}"
          font-family="serif"
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
      <style>
        text { filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5)); }
      </style>
      ${textElements}
    </svg>
  `;
}

/**
 * Получение метаданных
 */
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